package productapi

import (
	"net/http"

	"github.com/labstack/echo/v5"

	"github.com/example/userapi/internal/core/domain/matter"
	"github.com/example/userapi/internal/core/port"
)

type createFilingRequest struct {
	Title            string `json:"title"`
	Outcome          string `json:"outcome"`
	RequirementID    string `json:"requirementId"`
	AuthorityPartyID string `json:"authorityPartyId"`
	OwnerID          string `json:"ownerId"`
	ProofRequired    bool   `json:"proofRequired"`
}

type advanceFilingRequest struct {
	To           string   `json:"to"`
	Reference    string   `json:"reference"`
	ObservedAt   string   `json:"observedAt"`
	EvidenceIDs  []string `json:"evidenceIds"`
	VersionIDs   []string `json:"versionIds"`
	ExternalRefs []string `json:"externalRefs"`
	RequestRef   string   `json:"requestRef"`
	CycleOwnerID string   `json:"cycleOwnerId"`
	CycleDue     string   `json:"cycleDue"`
	Reason       string   `json:"reason"`
}

type negativeFilingRequest struct {
	Outcome     string   `json:"outcome"`
	Reference   string   `json:"reference"`
	ObservedAt  string   `json:"observedAt"`
	EvidenceIDs []string `json:"evidenceIds"`
}

type signatureApplicabilityRequest struct {
	SignatureNotRequired bool   `json:"signatureNotRequired"`
	Reason               string `json:"reason"`
}

type correctionRequest struct {
	Reference  string `json:"reference"`
	ObservedAt string `json:"observedAt"`
	Reason     string `json:"reason"`
}

func (s *server) detailResponse(c *echo.Context, status int, d matter.FilingDetail) error {
	_, tag := itemETag(d.View.Item)
	c.Response().Header().Set("ETag", tag)
	provenance(c, d.AsOf, d.View.Item.Revision)
	_, err := respond(c, status, filingDetailDTO(d), false)
	return err
}

func (s *server) listFilings(c *echo.Context) error {
	fs, err := s.Filings.ListFilings(c.Request().Context(), port.MatterListQuery{ActorID: actorOf(c), MatterID: c.Param("id")})
	if err != nil {
		return err
	}
	out := make([]filingSummaryBody, 0, len(fs))
	for _, f := range fs {
		out = append(out, filingSummaryDTO(f))
	}
	n := len(out)
	_, err = respond(c, http.StatusOK, page[filingSummaryBody]{Items: out, Page: pageMeta{Limit: n, MaxLimit: maxPageLimit, Total: &n}}, false)
	return err
}

func (s *server) createFiling(c *echo.Context) error {
	var req createFilingRequest
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
	res, err := s.Filings.CreateFiling(c.Request().Context(), port.CreateFilingCmd{
		ActorID: actorOf(c), MatterID: c.Param("id"), IdempotencyKey: key, RequestHash: s.fp(c, raw), Title: req.Title, Outcome: req.Outcome,
		RequirementID: req.RequirementID, AuthorityPartyID: req.AuthorityPartyID, OwnerID: req.OwnerID, ProofRequired: req.ProofRequired,
	})
	if err != nil {
		return err
	}
	markReplay(c, res.Replayed)
	c.Response().Header().Set("Location", apiPrefix+"/matters/"+c.Param("id")+"/filings/"+res.ID)
	_, err = respond(c, http.StatusCreated, createdBody{ID: res.ID, Kind: res.Kind, Seq: res.Seq}, false)
	return err
}

func (s *server) getFiling(c *echo.Context) error {
	d, err := s.Filings.GetFiling(c.Request().Context(), port.FilingQuery{ActorID: actorOf(c), MatterID: c.Param("id"), FilingID: c.Param("filingId")})
	if err != nil {
		return err
	}
	return s.detailResponse(c, http.StatusOK, d)
}

func (s *server) advanceFiling(c *echo.Context) error {
	var req advanceFilingRequest
	if _, err := readJSON(c, &req); err != nil {
		return err
	}
	rev, err := s.itemCAS(c, c.Param("id"), c.Param("filingId"))
	if err != nil {
		return err
	}
	d, err := s.Filings.Advance(c.Request().Context(), port.AdvanceFilingCmd{
		ActorID: actorOf(c), MatterID: c.Param("id"), FilingID: c.Param("filingId"), ExpectedRevision: rev, To: req.To, Reference: req.Reference,
		ObservedAt: req.ObservedAt, EvidenceIDs: req.EvidenceIDs, VersionIDs: req.VersionIDs, ExternalRefs: req.ExternalRefs, RequestRef: req.RequestRef,
		CycleOwnerID: req.CycleOwnerID, CycleDue: req.CycleDue, Reason: req.Reason,
	})
	if err != nil {
		return err
	}
	return s.detailResponse(c, http.StatusOK, d)
}

func (s *server) recordNegative(c *echo.Context) error {
	var req negativeFilingRequest
	if _, err := readJSON(c, &req); err != nil {
		return err
	}
	rev, err := s.itemCAS(c, c.Param("id"), c.Param("filingId"))
	if err != nil {
		return err
	}
	d, err := s.Filings.RecordNegative(c.Request().Context(), port.RecordNegativeCmd{
		ActorID: actorOf(c), MatterID: c.Param("id"), FilingID: c.Param("filingId"), ExpectedRevision: rev, Outcome: req.Outcome,
		Reference: req.Reference, ObservedAt: req.ObservedAt, EvidenceIDs: req.EvidenceIDs,
	})
	if err != nil {
		return err
	}
	return s.detailResponse(c, http.StatusOK, d)
}

func (s *server) ownerFilingStep(c *echo.Context, run func(port.ReasonedFilingCmd) (matter.FilingDetail, error)) error {
	var req reasonRequest
	if _, err := readJSON(c, &req); err != nil {
		return err
	}
	rev, err := s.itemCAS(c, c.Param("id"), c.Param("filingId"))
	if err != nil {
		return err
	}
	d, err := run(port.ReasonedFilingCmd{ActorID: actorOf(c), MatterID: c.Param("id"), FilingID: c.Param("filingId"), ExpectedRevision: rev, Reason: req.Reason})
	if err != nil {
		return err
	}
	return s.detailResponse(c, http.StatusOK, d)
}

func (s *server) closeFiling(c *echo.Context) error {
	return s.ownerFilingStep(c, func(cmd port.ReasonedFilingCmd) (matter.FilingDetail, error) {
		d, err := s.Filings.CloseNegative(c.Request().Context(), cmd)
		return d, err
	})
}

func (s *server) reopenFiling(c *echo.Context) error {
	return s.ownerFilingStep(c, func(cmd port.ReasonedFilingCmd) (matter.FilingDetail, error) {
		d, err := s.Filings.Reopen(c.Request().Context(), cmd)
		return d, err
	})
}

func (s *server) setSignatureApplicability(c *echo.Context) error {
	var req signatureApplicabilityRequest
	if _, err := readJSON(c, &req); err != nil {
		return err
	}
	rev, err := s.itemCAS(c, c.Param("id"), c.Param("filingId"))
	if err != nil {
		return err
	}
	d, err := s.Filings.SetSignatureApplicability(c.Request().Context(), port.SetFilingSignatureApplicabilityCmd{
		ActorID: actorOf(c), MatterID: c.Param("id"), FilingID: c.Param("filingId"), ExpectedRevision: rev,
		SignatureNotRequired: req.SignatureNotRequired, Reason: req.Reason,
	})
	if err != nil {
		return err
	}
	return s.detailResponse(c, http.StatusOK, d)
}

func (s *server) correctObservation(c *echo.Context) error {
	var req correctionRequest
	if _, err := readJSON(c, &req); err != nil {
		return err
	}
	rev, err := s.itemCAS(c, c.Param("id"), c.Param("filingId"))
	if err != nil {
		return err
	}
	d, err := s.Filings.CorrectObservation(c.Request().Context(), port.CorrectObservationCmd{
		ActorID: actorOf(c), MatterID: c.Param("id"), FilingID: c.Param("filingId"), ExpectedRevision: rev,
		ObservationID: c.Param("obsId"), Reference: req.Reference, ObservedAt: req.ObservedAt, Reason: req.Reason,
	})
	if err != nil {
		return err
	}
	return s.detailResponse(c, http.StatusCreated, d)
}
