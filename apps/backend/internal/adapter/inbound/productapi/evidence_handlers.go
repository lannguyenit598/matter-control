package productapi

import (
	"io"
	"mime"
	"net/http"
	"strings"

	"github.com/labstack/echo/v5"

	"leonx.me/matter-control/internal/core/port"
)

type createDocumentRequest struct {
	Name string `json:"name"`
}

type promotionRequest struct {
	TargetVersionID          string `json:"targetVersionId"`
	ExpectedCurrentVersionID string `json:"expectedCurrentVersionId"`
	Reason                   string `json:"reason"`
	ImpactToken              string `json:"impactToken"`
}

type signatureRequest struct {
	Signer   string `json:"signer"`
	SignedAt string `json:"signedAt"`
}

type criterionRequest struct {
	Title       string `json:"title"`
	Description string `json:"description"`
	Mandatory   bool   `json:"mandatory"`
	Rule        string `json:"versionRule"`
	DocumentID  string `json:"documentId"`
	FixedID     string `json:"fixedVersionId"`
	ValidDays   int    `json:"validDays"`
}

func (r criterionRequest) port() port.CriterionInput {
	return port.CriterionInput{Title: r.Title, Description: r.Description, Mandatory: r.Mandatory, Rule: r.Rule, DocumentID: r.DocumentID, FixedID: r.FixedID, ValidDays: r.ValidDays}
}

type reviseCriterionRequest struct {
	Reason    string           `json:"reason"`
	Retire    bool             `json:"retire"`
	Criterion criterionRequest `json:"criterion"`
}

type applicabilityRequest struct {
	NotRequired bool   `json:"notRequired"`
	Reason      string `json:"reason"`
}

type evidenceRequest struct {
	VersionID   string   `json:"versionId"`
	Reference   string   `json:"reference"`
	Description string   `json:"description"`
	ValidFrom   string   `json:"validFrom"`
	ValidUntil  string   `json:"validUntil"`
	Claims      []string `json:"claims"`
}

type claimRequest struct {
	CriterionID string `json:"criterionId"`
}

type reasonRequest struct {
	Reason string `json:"reason"`
}

type assessmentRequest struct {
	Verdict              string `json:"verdict"`
	Rationale            string `json:"rationale"`
	ExpectedSubjectEpoch int64  `json:"expectedSubjectEpoch"`
	AssessedVersionID    string `json:"assessedVersionId"`
	ValidDays            int    `json:"validDays"`
	// ExpectedAssessmentID is the id of the assessment the reviewer saw; "" explicitly
	// expects a first review and an absent field is a missing precondition (428).
	ExpectedAssessmentID *string `json:"expectedAssessmentId"`
}

type resolutionRequest struct {
	Resolution string `json:"resolution"`
}

type verifierRequest struct {
	UserID string `json:"userId"`
}

type createdBody struct {
	ID   string `json:"id"`
	Kind string `json:"kind"`
	Seq  int64  `json:"seq"`
}

func respondProof(c *echo.Context, status int, p checklistBody) error {
	p.CallerID = actorOf(c)
	_, err := respond(c, status, p, false)
	return err
}

// docCAS maps If-Match onto the document revision through the document's canonical member.
func (s *server) docCAS(c *echo.Context, matterID, docID string) (int64, error) {
	return expectedRevision(c.Request().Header.Get("If-Match"), func() ([]byte, int64, error) {
		d, err := s.Evidence.GetDocument(c.Request().Context(), port.DocumentQuery{ActorID: actorOf(c), MatterID: matterID, DocumentID: docID})
		if err != nil {
			return nil, 0, err
		}
		b, _ := documentETag(d.Document)
		return b, d.Document.Revision, nil
	})
}

func (s *server) criterionCAS(c *echo.Context, matterID, itemID, critID string) (int64, error) {
	return expectedRevision(c.Request().Header.Get("If-Match"), func() ([]byte, int64, error) {
		p, err := s.Evidence.ProofChecklist(c.Request().Context(), port.SubjectQuery{ActorID: actorOf(c), MatterID: matterID, SubjectID: itemID})
		if err != nil {
			return nil, 0, err
		}
		for _, k := range p.Result.Criteria {
			if k.Criterion.ID.String() == critID {
				b, _ := criterionETag(k.Criterion)
				return b, k.Criterion.Revision, nil
			}
		}
		return nil, 0, port.ErrNotFound
	})
}

func (s *server) listDocuments(c *echo.Context) error {
	ds, err := s.Evidence.ListDocuments(c.Request().Context(), port.MatterListQuery{ActorID: actorOf(c), MatterID: c.Param("id")})
	if err != nil {
		return err
	}
	out := make([]documentBody, 0, len(ds))
	for _, d := range ds {
		out = append(out, documentDTO(d))
	}
	n := len(out)
	_, err = respond(c, http.StatusOK, page[documentBody]{Items: out, Page: pageMeta{Limit: n, MaxLimit: maxPageLimit, Total: &n}}, false)
	return err
}

func (s *server) createDocument(c *echo.Context) error {
	var req createDocumentRequest
	raw, err := readJSON(c, &req)
	if err != nil {
		return err
	}
	if err := requireNoIfMatch(c); err != nil {
		return err
	}
	key, err := idempotencyKey(c)
	if err != nil {
		return err
	}
	res, err := s.Evidence.CreateDocument(c.Request().Context(), port.CreateDocumentCmd{
		ActorID: actorOf(c), MatterID: c.Param("id"), IdempotencyKey: key, RequestHash: s.fp(c, raw), Name: req.Name,
	})
	if err != nil {
		return err
	}
	markReplay(c, res.Replayed)
	c.Response().Header().Set("Location", apiPrefix+"/matters/"+c.Param("id")+"/documents/"+res.ID)
	_, err = respond(c, http.StatusCreated, createdBody{ID: res.ID, Kind: res.Kind, Seq: res.Seq}, false)
	return err
}

func (s *server) getDocument(c *echo.Context) error {
	d, err := s.Evidence.GetDocument(c.Request().Context(), port.DocumentQuery{
		ActorID: actorOf(c), MatterID: c.Param("id"), DocumentID: c.Param("docId"), PromoteTo: c.QueryParam("promoteTo"),
	})
	if err != nil {
		return err
	}
	_, tag := documentETag(d.Document)
	c.Response().Header().Set("ETag", tag)
	provenance(c, d.AsOf, d.Document.Revision)
	_, err = respond(c, http.StatusOK, documentDetailDTO(d), false)
	return err
}

// uploadVersion takes the bytes as the raw request body: Content-Type is the media type and the
// file name travels in X-Filename (percent-decoded by the client). The body limit is the
// configured upload limit, not the JSON limit.
func (s *server) uploadVersion(c *echo.Context) error {
	if err := requireNoIfMatch(c); err != nil {
		return err
	}
	key, err := idempotencyKey(c)
	if err != nil {
		return err
	}
	name := strings.TrimSpace(c.Request().Header.Get("X-Filename"))
	mt, _, err := mime.ParseMediaType(c.Request().Header.Get("Content-Type"))
	if err != nil {
		mt = "application/octet-stream"
	}
	res, err := s.Evidence.UploadVersion(c.Request().Context(), port.UploadVersionCmd{
		ActorID: actorOf(c), MatterID: c.Param("id"), DocumentID: c.Param("docId"), IdempotencyKey: key,
		RequestHash: s.fp(c, []byte(name+"|"+mt)), Filename: name, MediaType: mt, Body: c.Request().Body, MaxBytes: s.MaxUploadBytes,
	})
	if err != nil {
		return err
	}
	markReplay(c, res.Replayed)
	_, err = respond(c, http.StatusCreated, createdBody{ID: res.ID, Kind: res.Kind, Seq: res.Seq}, false)
	return err
}

// versionContent streams one version. It is always an attachment of opaque bytes, never rendered
// by the browser from this origin; the stored media type is reported in a header instead.
func (s *server) versionContent(c *echo.Context) error {
	ver, rc, err := s.Evidence.OpenVersion(c.Request().Context(), port.VersionContentQuery{ActorID: actorOf(c), MatterID: c.Param("id"), VersionID: c.Param("versionId")})
	if err != nil {
		return err
	}
	defer rc.Close()
	if ver.DocumentID.String() != c.Param("docId") {
		return port.ErrNotFound
	}
	h := c.Response().Header()
	h.Set("Content-Disposition", mime.FormatMediaType("attachment", map[string]string{"filename": ver.Filename}))
	h.Set("X-Content-Type-Options", "nosniff")
	h.Set("Cache-Control", "private, no-store")
	h.Set("MC-Media-Type", ver.MediaType)
	h.Set("MC-Content-SHA256", ver.SHA256)
	c.Response().WriteHeader(http.StatusOK)
	h.Set("Content-Type", "application/octet-stream")
	if _, err := io.Copy(c.Response(), rc); err != nil {
		// Bytes may already be on the wire: abort the connection so the client sees a broken
		// transfer, never a complete-looking corrupted file.
		panic(http.ErrAbortHandler)
	}
	return nil
}

func (s *server) promoteVersion(c *echo.Context) error {
	var req promotionRequest
	if _, err := readJSON(c, &req); err != nil {
		return err
	}
	rev, err := s.docCAS(c, c.Param("id"), c.Param("docId"))
	if err != nil {
		return err
	}
	d, err := s.Evidence.PromoteVersion(c.Request().Context(), port.PromoteVersionCmd{
		ActorID: actorOf(c), MatterID: c.Param("id"), DocumentID: c.Param("docId"), TargetVersionID: req.TargetVersionID,
		ExpectedCurrentVersionID: req.ExpectedCurrentVersionID, ExpectedRevision: rev, Reason: req.Reason, ImpactToken: req.ImpactToken,
	})
	if err != nil {
		return err
	}
	_, tag := documentETag(d.Document)
	c.Response().Header().Set("ETag", tag)
	_, err = respond(c, http.StatusOK, documentDetailDTO(d), false)
	return err
}

func (s *server) recordSignature(c *echo.Context) error {
	var req signatureRequest
	if _, err := readJSON(c, &req); err != nil {
		return err
	}
	if err := requireNoIfMatch(c); err != nil {
		return err
	}
	d, err := s.Evidence.RecordSignature(c.Request().Context(), port.RecordSignatureCmd{
		ActorID: actorOf(c), MatterID: c.Param("id"), Version: c.Param("versionId"), Signer: req.Signer, SignedAt: req.SignedAt,
	})
	if err != nil {
		return err
	}
	_, err = respond(c, http.StatusCreated, documentDetailDTO(d), false)
	return err
}

func (s *server) proofChecklist(c *echo.Context) error {
	p, err := s.Evidence.ProofChecklist(c.Request().Context(), port.SubjectQuery{ActorID: actorOf(c), MatterID: c.Param("id"), SubjectID: c.Param("itemId")})
	if err != nil {
		return err
	}
	provenance(c, p.AsOf, p.Subject.Revision)
	return respondProof(c, http.StatusOK, checklistDTO(p))
}

func (s *server) createCriterion(c *echo.Context) error {
	var req criterionRequest
	if _, err := readJSON(c, &req); err != nil {
		return err
	}
	if err := requireNoIfMatch(c); err != nil {
		return err
	}
	p, err := s.Evidence.CreateCriterion(c.Request().Context(), port.CreateCriterionCmd{
		ActorID: actorOf(c), MatterID: c.Param("id"), SubjectID: c.Param("itemId"), Criterion: req.port(),
	})
	if err != nil {
		return err
	}
	return respondProof(c, http.StatusCreated, checklistDTO(p))
}

func (s *server) reviseCriterion(c *echo.Context) error {
	var req reviseCriterionRequest
	if _, err := readJSON(c, &req); err != nil {
		return err
	}
	rev, err := s.criterionCAS(c, c.Param("id"), c.Param("itemId"), c.Param("critId"))
	if err != nil {
		return err
	}
	p, err := s.Evidence.ReviseCriterion(c.Request().Context(), port.ReviseCriterionCmd{
		ActorID: actorOf(c), MatterID: c.Param("id"), CriterionID: c.Param("critId"), ExpectedRevision: rev, Reason: req.Reason, Retire: req.Retire, Criterion: req.Criterion.port(),
	})
	if err != nil {
		return err
	}
	return respondProof(c, http.StatusOK, checklistDTO(p))
}

func (s *server) setApplicability(c *echo.Context) error {
	var req applicabilityRequest
	if _, err := readJSON(c, &req); err != nil {
		return err
	}
	rev, err := s.itemCAS(c, c.Param("id"), c.Param("itemId"))
	if err != nil {
		return err
	}
	p, err := s.Evidence.SetApplicability(c.Request().Context(), port.SetApplicabilityCmd{
		ActorID: actorOf(c), MatterID: c.Param("id"), SubjectID: c.Param("itemId"), ExpectedRevision: rev, NotRequired: req.NotRequired, Reason: req.Reason,
	})
	if err != nil {
		return err
	}
	_, tag := itemETag(p.Subject)
	c.Response().Header().Set("ETag", tag)
	return respondProof(c, http.StatusOK, checklistDTO(p))
}

func (s *server) submitEvidence(c *echo.Context) error {
	var req evidenceRequest
	raw, err := readJSON(c, &req)
	if err != nil {
		return err
	}
	if err := requireNoIfMatch(c); err != nil {
		return err
	}
	key, err := idempotencyKey(c)
	if err != nil {
		return err
	}
	res, err := s.Evidence.SubmitEvidence(c.Request().Context(), port.SubmitEvidenceCmd{
		ActorID: actorOf(c), MatterID: c.Param("id"), IdempotencyKey: key, RequestHash: s.fp(c, raw), VersionID: req.VersionID, Reference: req.Reference,
		Description: req.Description, ValidFrom: req.ValidFrom, ValidUntil: req.ValidUntil, Claims: req.Claims,
	})
	if err != nil {
		return err
	}
	markReplay(c, res.Replayed)
	_, err = respond(c, http.StatusCreated, createdBody{ID: res.ID, Kind: res.Kind, Seq: res.Seq}, false)
	return err
}

func (s *server) addClaim(c *echo.Context) error {
	var req claimRequest
	if _, err := readJSON(c, &req); err != nil {
		return err
	}
	if err := requireNoIfMatch(c); err != nil {
		return err
	}
	p, err := s.Evidence.AddClaim(c.Request().Context(), port.AddClaimCmd{ActorID: actorOf(c), MatterID: c.Param("id"), EvidenceID: c.Param("evId"), CriterionID: req.CriterionID})
	if err != nil {
		return err
	}
	return respondProof(c, http.StatusCreated, checklistDTO(p))
}

// reasonCommand is the shared shape of the reason-only commands.
func (s *server) reasonCommand(c *echo.Context, run func(reason string) (checklistBody, error)) error {
	var req reasonRequest
	if _, err := readJSON(c, &req); err != nil {
		return err
	}
	if err := requireNoIfMatch(c); err != nil {
		return err
	}
	p, err := run(req.Reason)
	if err != nil {
		return err
	}
	return respondProof(c, http.StatusOK, p)
}

func (s *server) withdrawEvidence(c *echo.Context) error {
	return s.reasonCommand(c, func(reason string) (checklistBody, error) {
		p, err := s.Evidence.WithdrawEvidence(c.Request().Context(), port.WithdrawEvidenceCmd{ActorID: actorOf(c), MatterID: c.Param("id"), EvidenceID: c.Param("evId"), Reason: reason})
		return checklistDTO(p), err
	})
}

func (s *server) revokeAssessment(c *echo.Context) error {
	return s.reasonCommand(c, func(reason string) (checklistBody, error) {
		p, err := s.Evidence.RevokeAssessment(c.Request().Context(), port.RevokeAssessmentCmd{ActorID: actorOf(c), MatterID: c.Param("id"), AssessmentID: c.Param("aId"), Reason: reason})
		return checklistDTO(p), err
	})
}

func (s *server) raiseDispute(c *echo.Context) error {
	return s.reasonCommand(c, func(reason string) (checklistBody, error) {
		p, err := s.Evidence.RaiseDispute(c.Request().Context(), port.RaiseDisputeCmd{ActorID: actorOf(c), MatterID: c.Param("id"), AssessmentID: c.Param("aId"), Reason: reason})
		return checklistDTO(p), err
	})
}

func (s *server) assess(c *echo.Context) error {
	var req assessmentRequest
	if _, err := readJSON(c, &req); err != nil {
		return err
	}
	if err := requireNoIfMatch(c); err != nil {
		return err
	}
	p, err := s.Evidence.Assess(c.Request().Context(), port.AssessCmd{
		ActorID: actorOf(c), MatterID: c.Param("id"), ClaimID: c.Param("claimId"), ExpectedSubjectEpoch: req.ExpectedSubjectEpoch,
		Verdict: req.Verdict, Rationale: req.Rationale, AssessedVersionID: req.AssessedVersionID, ValidDays: req.ValidDays,
		ExpectedAssessmentID: req.ExpectedAssessmentID,
	})
	if err != nil {
		return err
	}
	return respondProof(c, http.StatusCreated, checklistDTO(p))
}

func (s *server) resolveDispute(c *echo.Context) error {
	var req resolutionRequest
	if _, err := readJSON(c, &req); err != nil {
		return err
	}
	if err := requireNoIfMatch(c); err != nil {
		return err
	}
	p, err := s.Evidence.ResolveDispute(c.Request().Context(), port.ResolveDisputeCmd{ActorID: actorOf(c), MatterID: c.Param("id"), DisputeID: c.Param("dId"), Resolution: req.Resolution})
	if err != nil {
		return err
	}
	return respondProof(c, http.StatusOK, checklistDTO(p))
}

type verifiersBody struct {
	Verifiers []string `json:"verifiers"`
}

func (s *server) listVerifiers(c *echo.Context) error {
	vs, err := s.Evidence.Verifiers(c.Request().Context(), port.MatterListQuery{ActorID: actorOf(c), MatterID: c.Param("id")})
	if err != nil {
		return err
	}
	_, err = respond(c, http.StatusOK, verifiersBody{Verifiers: strs(vs)}, false)
	return err
}

func (s *server) designateVerifier(c *echo.Context) error {
	var req verifierRequest
	if _, err := readJSON(c, &req); err != nil {
		return err
	}
	return s.setVerifier(c, req.UserID, false)
}

func (s *server) revokeVerifier(c *echo.Context) error {
	if _, err := readJSON(c, &struct{}{}); err != nil {
		return err
	}
	return s.setVerifier(c, c.Param("userId"), true)
}

func (s *server) setVerifier(c *echo.Context, user string, revoke bool) error {
	if err := requireNoIfMatch(c); err != nil {
		return err
	}
	vs, err := s.Evidence.DesignateVerifier(c.Request().Context(), port.DesignateVerifierCmd{ActorID: actorOf(c), MatterID: c.Param("id"), UserID: user, Revoke: revoke})
	if err != nil {
		return err
	}
	_, err = respond(c, http.StatusOK, verifiersBody{Verifiers: strs(vs)}, false)
	return err
}

func (s *server) listEvidence(c *echo.Context) error {
	es, err := s.Evidence.ListEvidence(c.Request().Context(), port.MatterListQuery{ActorID: actorOf(c), MatterID: c.Param("id")})
	if err != nil {
		return err
	}
	out := make([]evidenceBody, len(es))
	for i, e := range es {
		out[i] = evidenceDTO(e)
	}
	n := len(out)
	_, err = respond(c, http.StatusOK, page[evidenceBody]{Items: out, Page: pageMeta{Limit: n, MaxLimit: maxPageLimit, Total: &n}}, false)
	return err
}
