package productapi

import (
	"context"
	"encoding/base64"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"log/slog"
	"mime"
	"net/http"
	"strconv"
	"strings"
	"time"
	"unicode/utf8"

	"github.com/labstack/echo/v5"
	"github.com/labstack/echo/v5/middleware"

	"leonx.me/matter-control/internal/core/port"
)

const (
	bodyLimit = 1 << 20
	// maxPageLimit is declared in every page envelope: no hidden cap (contract §2).
	maxPageLimit   = 200
	actorKey       = "mc.actor"
	apiPrefix      = "/api/v1"
	hdrIdempotency = "Idempotency-Key"
	uploadRoute    = "/matters/:id/documents/:docId/versions"
)

// Deps are the inbound ports and identity collaborators the adapter needs.
type Deps struct {
	Workspaces           port.WorkspaceService
	Matters              port.MatterService
	Work                 port.WorkService
	Evidence             port.EvidenceService
	Filings              port.FilingService
	Control              port.ControlService
	Review               port.ReviewService
	DataOps              port.DataOpsService
	DataOpsCodec         port.SheetCodec
	Verifier             port.TokenVerifier
	Identities           port.IdentityResolver
	LocalPeopleDirectory bool
	Logger               *slog.Logger
	// Ready returns an error when the pod must not receive traffic; nil = always ready.
	Ready           func(ctx context.Context) error
	RequestTimeout  time.Duration
	TransferTimeout time.Duration
	// MaxUploadBytes bounds one document upload (the JSON body limit does not apply to it).
	MaxUploadBytes int64
	// MaxInFlight caps concurrent /api/v1 requests; 0 = unlimited (see inFlightLimit).
	MaxInFlight int
}

type server struct{ Deps }

// NewServer builds the product API: probes are public, everything under /api/v1
// requires a verified, provisioned principal.
func NewServer(d Deps) *echo.Echo {
	if d.Logger == nil {
		d.Logger = slog.Default()
	}
	if d.RequestTimeout == 0 {
		d.RequestTimeout = 10 * time.Second
	}
	if d.TransferTimeout == 0 {
		d.TransferTimeout = 60 * time.Second
	}
	if d.MaxUploadBytes == 0 {
		d.MaxUploadBytes = 25 << 20
	}
	s := &server{d}
	e := echo.New()
	e.Logger = d.Logger
	e.HTTPErrorHandler = s.errorHandler
	e.Use(middleware.Recover())
	e.Use(middleware.BodyLimitWithConfig(middleware.BodyLimitConfig{
		LimitBytes: bodyLimit,
		// Uploads carry raw document bytes: the service enforces MaxUploadBytes while streaming.
		Skipper: func(c *echo.Context) bool {
			if c.Request().Method != http.MethodPost {
				return false
			}
			return c.Path() == apiPrefix+uploadRoute ||
				c.Path() == apiPrefix+"/matters/:id/import/preview" ||
				c.Path() == apiPrefix+"/matters/:id/import/commit"
		},
	}))
	e.Use(middleware.ContextTimeoutWithConfig(middleware.ContextTimeoutConfig{
		Timeout: d.RequestTimeout, Skipper: transferRequest,
	}))
	e.Use(middleware.ContextTimeoutWithConfig(middleware.ContextTimeoutConfig{
		Timeout: d.TransferTimeout, Skipper: func(c *echo.Context) bool { return !transferRequest(c) },
	}))

	e.GET("/healthz", func(c *echo.Context) error { return c.JSON(http.StatusOK, map[string]string{"status": "ok"}) })
	e.GET("/readyz", func(c *echo.Context) error {
		if d.Ready != nil {
			if err := d.Ready(c.Request().Context()); err != nil {
				return port.ErrUnavailable
			}
		}
		return c.JSON(http.StatusOK, map[string]string{"status": "ready"})
	})

	v1 := e.Group(apiPrefix, inFlightLimit(d.MaxInFlight), requestMeta, s.authenticate)
	v1.GET("/workspaces", s.listWorkspaces)
	v1.POST("/workspaces", s.createWorkspace)
	v1.GET("/workspaces/:id", s.getWorkspace)
	v1.GET("/workspaces/:id/matters", s.listMatters)
	v1.POST("/workspaces/:id/matters", s.createMatter)
	v1.GET("/workspaces/:id/members", s.listWorkspaceMembers)
	v1.GET("/workspaces/:id/member-candidates", s.listWorkspaceMemberCandidates)
	v1.POST("/workspaces/:id/members", s.grantWorkspaceMember)
	v1.POST("/workspaces/:id/members/:userId/revocation", s.revokeWorkspaceMember)
	v1.GET("/matters/:id", s.getMatter)
	v1.GET("/matters/:id/members", s.listMatterMembers)
	v1.GET("/matters/:id/member-candidates", s.listMatterMemberCandidates)
	v1.POST("/matters/:id/members", s.grantMatterMember)
	v1.POST("/matters/:id/members/:userId/revocation", s.revokeMatterMember)
	v1.GET("/matters/:id/events", s.history)
	v1.POST("/matters/:id/requirements", s.createRequirement)
	v1.GET("/requirements/:id", s.getRequirement)
	v1.GET("/operations/:key", s.ownReceipt)
	v1.GET("/me/actions", s.myActions)
	v1.GET("/matters/:id/work-items", s.listWorkItems)
	v1.POST("/matters/:id/actions", s.createAction)
	v1.GET("/matters/:id/work-items/:itemId", s.getWorkItem)
	v1.PATCH("/matters/:id/work-items/:itemId", s.patchWorkItem)
	v1.POST("/matters/:id/work-items/:itemId/execution", s.transitionExecution)
	v1.POST("/matters/:id/work-items/:itemId/escalation", s.escalate)
	v1.POST("/matters/:id/work-items/:itemId/dependencies", s.addDependency)
	v1.POST("/matters/:id/work-items/:itemId/dependencies/:edgeId/removal", s.removeDependency)
	v1.GET("/matters/:id/workstreams", s.listWorkstreams)
	v1.POST("/matters/:id/workstreams", s.createWorkstream)
	v1.GET("/matters/:id/parties", s.listParties)
	v1.POST("/matters/:id/parties", s.createParty)
	v1.PATCH("/matters/:id/parties/:partyId", s.patchParty)
	v1.GET("/matters/:id/milestones", s.listMilestones)
	v1.POST("/matters/:id/milestones", s.createMilestone)
	v1.PUT("/matters/:id/milestones/:milestoneId/prerequisites", s.setMilestonePrerequisites)
	v1.GET("/matters/:id/waiting-on", s.waitingOn)
	v1.POST("/matters/:id/operations/:key/reconciliation", s.reconcile)

	v1.GET("/matters/:id/documents", s.listDocuments)
	v1.POST("/matters/:id/documents", s.createDocument)
	v1.GET("/matters/:id/documents/:docId", s.getDocument)
	v1.POST(uploadRoute, s.uploadVersion)
	v1.GET("/matters/:id/documents/:docId/versions/:versionId/content", s.versionContent)
	v1.POST("/matters/:id/documents/:docId/promotion", s.promoteVersion)
	v1.POST("/matters/:id/versions/:versionId/signatures", s.recordSignature)
	v1.GET("/matters/:id/work-items/:itemId/proof", s.proofChecklist)
	v1.POST("/matters/:id/work-items/:itemId/criteria", s.createCriterion)
	v1.POST("/matters/:id/work-items/:itemId/criteria/:critId/revision", s.reviseCriterion)
	v1.POST("/matters/:id/work-items/:itemId/applicability", s.setApplicability)
	v1.GET("/matters/:id/evidence", s.listEvidence)
	v1.POST("/matters/:id/evidence", s.submitEvidence)
	v1.POST("/matters/:id/evidence/:evId/claims", s.addClaim)
	v1.POST("/matters/:id/evidence/:evId/withdrawal", s.withdrawEvidence)
	v1.POST("/matters/:id/claims/:claimId/assessments", s.assess)
	v1.POST("/matters/:id/assessments/:aId/revocation", s.revokeAssessment)
	v1.POST("/matters/:id/assessments/:aId/disputes", s.raiseDispute)
	v1.POST("/matters/:id/disputes/:dId/resolution", s.resolveDispute)
	v1.GET("/matters/:id/filings", s.listFilings)
	v1.POST("/matters/:id/filings", s.createFiling)
	v1.GET("/matters/:id/filings/:filingId", s.getFiling)
	v1.POST("/matters/:id/filings/:filingId/stage", s.advanceFiling)
	v1.POST("/matters/:id/filings/:filingId/negative-outcome", s.recordNegative)
	v1.POST("/matters/:id/filings/:filingId/closure", s.closeFiling)
	v1.POST("/matters/:id/filings/:filingId/reopening", s.reopenFiling)
	v1.POST("/matters/:id/filings/:filingId/signature-applicability", s.setSignatureApplicability)
	v1.POST("/matters/:id/filings/:filingId/observations/:obsId/correction", s.correctObservation)
	v1.GET("/matters/:id/review-grids", s.listReviewGrids)
	v1.POST("/matters/:id/review-grids", s.createReviewGrid)
	v1.GET("/matters/:id/review-grids/:gridId", s.getReviewGrid)
	v1.POST("/matters/:id/review-grids/:gridId/versions", s.addReviewVersion)
	v1.POST("/matters/:id/review-grids/:gridId/versions/:versionId/removal", s.removeReviewVersion)
	v1.POST("/matters/:id/review-grids/:gridId/questions", s.addReviewQuestion)
	v1.POST("/matters/:id/review-grids/:gridId/questions/:questionId/revision", s.reviseReviewQuestion)
	v1.POST("/matters/:id/review-grids/:gridId/answers", s.recordReviewAnswer)
	v1.GET("/matters/:id/review-grids/:gridId/cells/:versionId/:questionId/history", s.reviewHistory)
	v1.GET("/matters/:id/control-room", s.controlRoom)
	v1.GET("/matters/:id/context-records", s.listContext)
	v1.POST("/matters/:id/context-records", s.createContext)
	v1.PATCH("/matters/:id/context-records/:recordId", s.patchContext)
	v1.POST("/matters/:id/bulk/preview", s.bulkPreview)
	v1.POST("/matters/:id/bulk/commit", s.bulkCommit)
	v1.POST("/matters/:id/import/preview", s.importPreview)
	v1.POST("/matters/:id/import/commit", s.importCommit)
	v1.GET("/matters/:id/export", s.exportMatter)
	v1.GET("/matters/:id/brief", s.deltaBrief)
	v1.GET("/matters/:id/verifiers", s.listVerifiers)
	v1.POST("/matters/:id/verifiers", s.designateVerifier)
	v1.POST("/matters/:id/verifiers/:userId/revocation", s.revokeVerifier)
	return e
}

func transferRequest(c *echo.Context) bool {
	switch c.Request().Method {
	case http.MethodPost:
		switch c.Path() {
		case apiPrefix + uploadRoute, apiPrefix + "/matters/:id/import/preview",
			apiPrefix + "/matters/:id/import/commit", apiPrefix + "/matters/:id/bulk/commit":
			return true
		}
	case http.MethodGet:
		switch c.Path() {
		case apiPrefix + "/matters/:id/documents/:docId/versions/:versionId/content", apiPrefix + "/matters/:id/export":
			return true
		}
	}
	return false
}

func (s *server) errorHandler(c *echo.Context, err error) {
	if resp, _ := echo.UnwrapResponse(c.Response()); resp != nil && resp.Committed {
		return
	}
	// Background context on purpose: ContextTimeout has already cancelled the request
	// context by the time Echo calls this handler, so ctx.Err() would report a healthy
	// request as cancelled. Cancellation is detected through the error chain instead.
	p := toProblem(context.Background(), err)
	if p.Status >= 500 {
		s.Logger.ErrorContext(c.Request().Context(), "product api error", "status", p.Status, "type", p.Type, "error", err.Error())
	}
	if c.Request().Method == http.MethodHead {
		_ = c.NoContent(p.Status)
		return
	}
	_ = writeProblem(c, p)
}

// authenticate resolves Authorization: Bearer to the trusted product actor. Verifier
// outages are 503, never 401; an unprovisioned identity is the uniform 403.
func (s *server) authenticate(next echo.HandlerFunc) echo.HandlerFunc {
	return func(c *echo.Context) error {
		scheme, token, ok := strings.Cut(c.Request().Header.Get("Authorization"), " ")
		if !ok || !strings.EqualFold(scheme, "Bearer") || strings.TrimSpace(token) == "" {
			return port.ErrUnauthenticated
		}
		vt, err := s.Verifier.Verify(c.Request().Context(), token)
		if err != nil {
			return err
		}
		actor, err := s.Identities.Resolve(c.Request().Context(), vt.Issuer, vt.Subject)
		if err != nil {
			return err
		}
		c.Set(actorKey, actor)
		return next(c)
	}
}

func actorOf(c *echo.Context) string {
	a, _ := c.Get(actorKey).(string)
	return a
}

// ---------- request helpers ----------

func readJSON(c *echo.Context, dst any) ([]byte, error) {
	mt, _, err := mime.ParseMediaType(c.Request().Header.Get("Content-Type"))
	if err != nil || mt != "application/json" {
		return nil, errUnsupportedMedia
	}
	raw, err := io.ReadAll(c.Request().Body)
	if err != nil {
		return nil, err
	}
	if !utf8.Valid(raw) {
		return nil, fmt.Errorf("%w: not UTF-8", errMalformed)
	}
	return raw, decodeStrict(raw, dst)
}

func idempotencyKey(c *echo.Context) (string, error) {
	k := strings.TrimSpace(c.Request().Header.Get(hdrIdempotency))
	if k == "" {
		return "", fmt.Errorf("%w: %s header is required", errBadRequest, hdrIdempotency)
	}
	return k, nil
}

// requireNoIfMatch enforces CAS scope "none": a precondition header is refused.
func requireNoIfMatch(c *echo.Context) error {
	if c.Request().Header.Get("If-Match") != "" {
		return port.ErrPreconditionNotApplicable
	}
	return nil
}

// expectedRevision maps If-Match (a strong ETag) onto the revision the service
// validates inside its transaction. Absent -> 0 (the service answers 428). A tag that
// equals the current representation's tag maps to the current revision; any other tag
// maps to -1 (stale -> 412). The in-transaction revision check remains authoritative, so
// a change between this read and the command is still caught. A resource the caller
// cannot read maps to 1: the service refuses with the uniform denial before any CAS.
func expectedRevision(ifMatch string, current func() ([]byte, int64, error)) (int64, error) {
	if ifMatch == "" {
		return 0, nil
	}
	if strings.HasPrefix(ifMatch, "W/") || ifMatch == "*" || strings.Contains(ifMatch, ",") ||
		len(ifMatch) < 2 || ifMatch[0] != '"' || ifMatch[len(ifMatch)-1] != '"' {
		return 0, fmt.Errorf("%w: If-Match must be one strong entity tag", errBadRequest)
	}
	body, rev, err := current()
	if errors.Is(err, port.ErrNotFound) {
		return 1, nil
	}
	if err != nil {
		return 0, err
	}
	if etagOf(body) == ifMatch {
		return rev, nil
	}
	return -1, nil
}

func (s *server) workspaceCAS(c *echo.Context, id string) (int64, error) {
	return expectedRevision(c.Request().Header.Get("If-Match"), func() ([]byte, int64, error) {
		w, err := s.Workspaces.GetWorkspace(c.Request().Context(), port.GetWorkspaceQuery{ActorID: actorOf(c), WorkspaceID: id})
		if err != nil {
			return nil, 0, err
		}
		b, err := json.Marshal(workspaceDTO(w))
		return b, w.Revision, err
	})
}

func (s *server) matterCAS(c *echo.Context, id string) (int64, error) {
	return expectedRevision(c.Request().Header.Get("If-Match"), func() ([]byte, int64, error) {
		m, err := s.Workspaces.GetMatter(c.Request().Context(), port.GetMatterQuery{ActorID: actorOf(c), MatterID: id})
		if err != nil {
			return nil, 0, err
		}
		b, err := json.Marshal(matterDTO(m.Header, m.CallerRole))
		return b, m.Header.Revision, err
	})
}

func (s *server) fp(c *echo.Context, body []byte) string {
	return fingerprint(c.Request().Method, c.Path(), c.Request().URL.Path, body, c.Request().Header.Get("If-Match"))
}

// ---------- response helpers ----------

// respond writes the exact marshaled bytes and, for resources, their strong ETag.
func respond(c *echo.Context, status int, v any, etag bool) ([]byte, error) {
	b, err := json.Marshal(v)
	if err != nil {
		return nil, err
	}
	if etag {
		c.Response().Header().Set("ETag", etagOf(b))
	}
	return b, c.Blob(status, "application/json", append(b, '\n'))
}

func provenance(c *echo.Context, asOf time.Time, rev int64) {
	h := c.Response().Header()
	if !asOf.IsZero() {
		h.Set("MC-As-Of", ts(asOf))
	}
	h.Set("MC-Source-Revision", strconv.FormatInt(rev, 10))
}

func markReplay(c *echo.Context, replayed bool) {
	if replayed {
		c.Response().Header().Set("Idempotent-Replayed", "true")
	}
}

func parseLimit(c *echo.Context) (int, error) {
	raw := c.QueryParam("limit")
	if raw == "" {
		return maxPageLimit, nil
	}
	n, err := strconv.Atoi(raw)
	if err != nil || n < 1 || n > maxPageLimit {
		return 0, fmt.Errorf("%w: limit must be between 1 and %d", errBadRequest, maxPageLimit)
	}
	return n, nil
}

type eventCursorJSON struct {
	At  string `json:"at"`
	Seq int64  `json:"seq"`
}

func encodeCursor(v any) *string {
	b, _ := json.Marshal(v) // skip: cursor structs always marshal
	s := base64.RawURLEncoding.EncodeToString(b)
	return &s
}

func decodeCursor(raw string, dst any) error {
	b, err := base64.RawURLEncoding.DecodeString(raw)
	if err != nil || json.Unmarshal(b, dst) != nil {
		return fmt.Errorf("%w: invalid cursor", errBadRequest)
	}
	return nil
}
