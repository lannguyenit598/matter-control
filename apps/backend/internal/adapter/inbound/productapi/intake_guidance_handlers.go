package productapi

// RLF-06 + RLF-07 HTTP surface: matter intake (record/triage/convert) and matter guidance
// (draft/publish). Conversion and publication are receipted commands; drafts are visible to
// OWNER/EDITOR only; intake records are visible to any ACTIVE member.

import (
	"encoding/json"
	"fmt"
	"net/http"
	"time"

	"github.com/labstack/echo/v5"

	"leonx.me/matter-control/internal/core/domain/matter"
	"leonx.me/matter-control/internal/core/port"
)

// ---------- intake ----------

type intakeBody struct {
	ID           string   `json:"id"`
	Title        string   `json:"title"`
	RequestText  string   `json:"requestText"`
	Requester    string   `json:"requester"`
	ReceivedAt   string   `json:"receivedAt"`
	Attachments  []string `json:"attachments"`
	Status       string   `json:"status"`
	TriageReason string   `json:"triageReason"`
	TriagedBy    *string  `json:"triagedBy"`
	TriagedAt    *string  `json:"triagedAt"`
	ItemID       *string  `json:"itemId"`
	Revision     int64    `json:"revision"`
	CreatedAt    string   `json:"createdAt"`
	ETag         string   `json:"etag"`
}

// intakeETag is the SHA-256 of the canonical revision-determined body (contract §4).
func intakeETag(r matter.IntakeRecord) string {
	b, _ := json.Marshal(struct {
		ID     string
		Status string
		ItemID *string
		Rev    int64
	}{r.ID.String(), string(r.Status), itemIDStringPtr(r.ItemID), r.Revision})
	return etagOf(b)
}

func itemIDStringPtr(id *matter.NodeID) *string {
	if id == nil {
		return nil
	}
	s := id.String()
	return &s
}

func intakeDTO(r matter.IntakeRecord) intakeBody {
	b := intakeBody{
		ID: r.ID.String(), Title: r.Title, RequestText: r.RequestText, Requester: r.Requester,
		ReceivedAt: ts(r.ReceivedAt), Attachments: r.Attachments, Status: string(r.Status),
		TriageReason: r.TriageReason, Revision: r.Revision, CreatedAt: ts(r.CreatedAt), ETag: intakeETag(r),
	}
	if r.TriagedBy != nil {
		s := r.TriagedBy.String()
		b.TriagedBy = &s
	}
	if r.TriagedAt != nil {
		s := ts(*r.TriagedAt)
		b.TriagedAt = &s
	}
	if r.ItemID != nil {
		s := r.ItemID.String()
		b.ItemID = &s
	}
	return b
}

type createIntakeRequest struct {
	Title       string   `json:"title"`
	RequestText string   `json:"requestText"`
	Requester   string   `json:"requester"`
	ReceivedAt  string   `json:"receivedAt"`
	Attachments []string `json:"attachments"`
}

func (s *server) listIntake(c *echo.Context) error {
	rs, err := s.Intakes.ListIntake(c.Request().Context(), port.ListIntakeQuery{ActorID: actorOf(c), MatterID: c.Param("id")})
	if err != nil {
		return err
	}
	out := make([]intakeBody, 0, len(rs))
	for _, r := range rs {
		out = append(out, intakeDTO(r))
	}
	n := len(out)
	_, err = respond(c, http.StatusOK, page[intakeBody]{Items: out, Page: pageMeta{Limit: n, MaxLimit: maxPageLimit, Total: &n}}, false)
	return err
}

func (s *server) getIntake(c *echo.Context) error {
	r, err := s.Intakes.GetIntake(c.Request().Context(), port.GetIntakeQuery{ActorID: actorOf(c), MatterID: c.Param("id"), IntakeID: c.Param("intakeId")})
	if err != nil {
		return err
	}
	_, err = respond(c, http.StatusOK, intakeDTO(r), true)
	return err
}

func (s *server) createIntake(c *echo.Context) error {
	var req createIntakeRequest
	raw, err := readJSON(c, &req)
	if err != nil {
		return err
	}
	key, err := idempotencyKey(c)
	if err != nil {
		return err
	}
	// The adapter supplies the observation instant when the caller did not record one.
	received := time.Now()
	if req.ReceivedAt != "" {
		parsed, perr := time.Parse(time.RFC3339, req.ReceivedAt)
		if perr != nil {
			return fmt.Errorf("%w: invalid receivedAt", errBadRequest)
		}
		received = parsed
	}
	res, err := s.Intakes.CreateIntake(c.Request().Context(), port.CreateIntakeCmd{
		ActorID: actorOf(c), MatterID: c.Param("id"), IdempotencyKey: key, RequestHash: s.fp(c, raw),
		Title: req.Title, RequestText: req.RequestText, Requester: req.Requester,
		ReceivedAt: received, Attachments: req.Attachments,
	})
	if err != nil {
		return err
	}
	markReplay(c, res.Replayed)
	c.Response().Header().Set("Location", apiPrefix+"/matters/"+c.Param("id")+"/intake/"+res.ID)
	_, err = respond(c, http.StatusCreated, createdBody{ID: res.ID, Kind: res.Kind, Seq: res.Seq}, false)
	return err
}

type triageIntakeRequest struct {
	Reason string `json:"reason"`
}

func (s *server) declineIntake(c *echo.Context) error {
	var req triageIntakeRequest
	if _, err := readJSON(c, &req); err != nil {
		return err
	}
	rev, err := s.intakeCAS(c)
	if err != nil {
		return err
	}
	r, err := s.Intakes.TriageIntake(c.Request().Context(), port.TriageIntakeCmd{
		ActorID: actorOf(c), MatterID: c.Param("id"), IntakeID: c.Param("intakeId"),
		ExpectedRevision: rev, Decline: true, Reason: req.Reason,
	})
	if err != nil {
		return err
	}
	_, err = respond(c, http.StatusOK, intakeDTO(r), true)
	return err
}

type convertIntakeRequest struct {
	Kind    string  `json:"kind"`
	Title   string  `json:"title"`
	Outcome string  `json:"outcome"`
	Owner   string  `json:"owner"`
	Due     *string `json:"due"`
}

func (s *server) convertIntake(c *echo.Context) error {
	var req convertIntakeRequest
	raw, err := readJSON(c, &req)
	if err != nil {
		return err
	}
	key, err := idempotencyKey(c)
	if err != nil {
		return err
	}
	var due *time.Time
	if req.Due != nil && *req.Due != "" {
		parsed, perr := time.Parse(time.RFC3339, *req.Due)
		if perr != nil {
			return fmt.Errorf("%w: invalid due", errBadRequest)
		}
		due = &parsed
	}
	record, _, replayed, err := s.Intakes.ConvertIntake(c.Request().Context(), port.ConvertIntakeCmd{
		ActorID: actorOf(c), MatterID: c.Param("id"), IntakeID: c.Param("intakeId"),
		IdempotencyKey: key, RequestHash: s.fp(c, raw),
		Kind: req.Kind, Title: req.Title, Outcome: req.Outcome, Owner: req.Owner, Due: due,
	})
	if err != nil {
		return err
	}
	markReplay(c, replayed)
	_, err = respond(c, http.StatusOK, intakeDTO(record), false)
	return err
}

// intakeCAS maps If-Match onto the caller-visible record revision.
func (s *server) intakeCAS(c *echo.Context) (int64, error) {
	return expectedRevision(c.Request().Header.Get("If-Match"), func() ([]byte, int64, error) {
		r, err := s.Intakes.GetIntake(c.Request().Context(), port.GetIntakeQuery{ActorID: actorOf(c), MatterID: c.Param("id"), IntakeID: c.Param("intakeId")})
		if err != nil {
			return nil, 0, err
		}
		b, _ := json.Marshal(intakeDTO(r))
		return b, r.Revision, nil
	})
}

// ---------- guidance ----------

type guidanceSourceRefBody struct {
	VersionID string `json:"versionId"`
	Reference string `json:"reference"`
	Note      string `json:"note"`
}

func sourceRefDomain(in []guidanceSourceRefBody) []matter.GuidanceSourceRef {
	out := make([]matter.GuidanceSourceRef, 0, len(in))
	for _, r := range in {
		out = append(out, matter.GuidanceSourceRef{VersionID: r.VersionID, Reference: r.Reference, Note: r.Note})
	}
	return out
}

type guidanceRevisionBody struct {
	ID         string                  `json:"id"`
	No         int64                   `json:"no"`
	Body       string                  `json:"body"`
	SourceRefs []guidanceSourceRefBody `json:"sourceRefs"`
	Status     string                  `json:"status"`
	CreatedAt  string                  `json:"createdAt"`
}

type guidanceDocBody struct {
	ID        string                 `json:"id"`
	Title     string                 `json:"title"`
	CreatedAt string                 `json:"createdAt"`
	Revisions []guidanceRevisionBody `json:"revisions"`
}

func guidanceRevDTO(r matter.GuidanceRevision) guidanceRevisionBody {
	refs := make([]guidanceSourceRefBody, 0, len(r.SourceRefs))
	for _, x := range r.SourceRefs {
		refs = append(refs, guidanceSourceRefBody{VersionID: x.VersionID, Reference: x.Reference, Note: x.Note})
	}
	return guidanceRevisionBody{ID: r.ID.String(), No: r.No, Body: r.Body, SourceRefs: refs, Status: r.Status, CreatedAt: ts(r.CreatedAt)}
}

func (s *server) listGuidance(c *echo.Context) error {
	docs, revs, err := s.Guidances.ListGuidance(c.Request().Context(), port.ListGuidanceQuery{ActorID: actorOf(c), MatterID: c.Param("id")})
	if err != nil {
		return err
	}
	out := make([]guidanceDocBody, 0, len(docs))
	for i, d := range docs {
		rows := make([]guidanceRevisionBody, 0, len(revs[i]))
		for _, r := range revs[i] {
			rows = append(rows, guidanceRevDTO(r))
		}
		out = append(out, guidanceDocBody{ID: d.ID.String(), Title: d.Title, CreatedAt: ts(d.CreatedAt), Revisions: rows})
	}
	n := len(out)
	_, err = respond(c, http.StatusOK, page[guidanceDocBody]{Items: out, Page: pageMeta{Limit: n, MaxLimit: maxPageLimit, Total: &n}}, false)
	return err
}

type createGuidanceRequest struct {
	Title      string                  `json:"title"`
	Body       string                  `json:"body"`
	SourceRefs []guidanceSourceRefBody `json:"sourceRefs"`
}

func (s *server) createGuidance(c *echo.Context) error {
	var req createGuidanceRequest
	raw, err := readJSON(c, &req)
	if err != nil {
		return err
	}
	key, err := idempotencyKey(c)
	if err != nil {
		return err
	}
	res, err := s.Guidances.CreateGuidance(c.Request().Context(), port.CreateGuidanceCmd{
		ActorID: actorOf(c), MatterID: c.Param("id"), IdempotencyKey: key, RequestHash: s.fp(c, raw),
		Title: req.Title, Body: req.Body, SourceRefs: sourceRefDomain(req.SourceRefs),
	})
	if err != nil {
		return err
	}
	markReplay(c, res.Replayed)
	c.Response().Header().Set("Location", apiPrefix+"/matters/"+c.Param("id")+"/guidance/"+res.ID)
	_, err = respond(c, http.StatusCreated, createdBody{ID: res.ID, Kind: res.Kind, Seq: res.Seq}, false)
	return err
}

type addGuidanceDraftRequest struct {
	Body       string                  `json:"body"`
	SourceRefs []guidanceSourceRefBody `json:"sourceRefs"`
}

func (s *server) addGuidanceDraft(c *echo.Context) error {
	var req addGuidanceDraftRequest
	raw, err := readJSON(c, &req)
	if err != nil {
		return err
	}
	key, err := idempotencyKey(c)
	if err != nil {
		return err
	}
	res, err := s.Guidances.AddGuidanceDraft(c.Request().Context(), port.AddGuidanceDraftCmd{
		ActorID: actorOf(c), MatterID: c.Param("id"), DocumentID: c.Param("docId"),
		IdempotencyKey: key, RequestHash: s.fp(c, raw),
		Body: req.Body, SourceRefs: sourceRefDomain(req.SourceRefs),
	})
	if err != nil {
		return err
	}
	markReplay(c, res.Replayed)
	_, err = respond(c, http.StatusCreated, createdBody{ID: res.ID, Kind: res.Kind, Seq: res.Seq}, false)
	return err
}

type publishGuidanceRequest struct {
	RevisionID string `json:"revisionId"`
}

func (s *server) publishGuidance(c *echo.Context) error {
	var req publishGuidanceRequest
	raw, err := readJSON(c, &req)
	if err != nil {
		return err
	}
	key, err := idempotencyKey(c)
	if err != nil {
		return err
	}
	res, err := s.Guidances.PublishGuidance(c.Request().Context(), port.PublishGuidanceCmd{
		ActorID: actorOf(c), MatterID: c.Param("id"), DocumentID: c.Param("docId"),
		RevisionID: req.RevisionID, IdempotencyKey: key, RequestHash: s.fp(c, raw),
	})
	if err != nil {
		return err
	}
	markReplay(c, res.Replayed)
	_, err = respond(c, http.StatusOK, createdBody{ID: res.ID, Kind: res.Kind, Seq: res.Seq}, false)
	return err
}
