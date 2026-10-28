package productapi

import (
	"encoding/json"

	"github.com/example/userapi/internal/core/domain/matter"
)

// W3 wire DTOs (contract revision 7). A document's ETag is the hash of its canonical `document`
// member; a criterion's is the hash of its canonical body. Both are revision-determined.

type documentCore struct {
	ID               string  `json:"id"`
	MatterID         string  `json:"matterId"`
	Name             string  `json:"name"`
	CurrentVersionID *string `json:"currentVersionId"`
	Revision         int64   `json:"revision"`
}

type documentBody struct {
	documentCore
	ETag string `json:"etag"`
}

func documentCoreOf(d matter.Document) documentCore {
	b := documentCore{ID: d.ID.String(), MatterID: d.MatterID.String(), Name: d.Name, Revision: d.Revision}
	if d.CurrentVersionID != nil {
		s := d.CurrentVersionID.String()
		b.CurrentVersionID = &s
	}
	return b
}

func documentDTO(d matter.Document) documentBody {
	_, tag := documentETag(d)
	return documentBody{documentCore: documentCoreOf(d), ETag: tag}
}

type versionBody struct {
	ID          string  `json:"id"`
	DocumentID  string  `json:"documentId"`
	No          int     `json:"no"`
	Predecessor *string `json:"predecessorId"`
	Filename    string  `json:"filename"`
	MediaType   string  `json:"mediaType"`
	SHA256      string  `json:"sha256"`
	SizeBytes   int64   `json:"sizeBytes"`
	UploadedBy  string  `json:"uploadedBy"`
	UploadedAt  string  `json:"uploadedAt"`
	// Current is true for the one version the document points at; never inferred from recency.
	Current bool `json:"current"`
}

type signatureBody struct {
	ID         string `json:"id"`
	VersionID  string `json:"versionId"`
	Signer     string `json:"signer"`
	SignedAt   string `json:"signedAt"`
	ObservedBy string `json:"observedBy"`
	RecordedAt string `json:"recordedAt"`
}

type impactBody struct {
	Invalidated []string `json:"invalidatedCriteria"`
	Unaffected  []string `json:"unaffectedCriteria"`
	Token       string   `json:"token"`
}

type documentDetailBody struct {
	Document   documentBody    `json:"document"`
	Versions   []versionBody   `json:"versions"`
	Signatures []signatureBody `json:"signatures"`
	Impact     *impactBody     `json:"promotionImpact"`
	AsOf       string          `json:"asOf"`
}

func strs[T ~string](in []T) []string {
	out := make([]string, len(in))
	for i, v := range in {
		out[i] = string(v)
	}
	return out
}

func documentDetailDTO(d matter.DocumentDetail) documentDetailBody {
	out := documentDetailBody{Document: documentDTO(d.Document), Versions: make([]versionBody, len(d.Versions)), Signatures: make([]signatureBody, len(d.Signatures)), AsOf: ts(d.AsOf)}
	for i, v := range d.Versions {
		vb := versionBody{ID: v.ID.String(), DocumentID: v.DocumentID.String(), No: v.No, Filename: v.Filename, MediaType: v.MediaType, SHA256: v.SHA256,
			SizeBytes: v.SizeBytes, UploadedBy: v.UploadedBy.String(), UploadedAt: ts(v.UploadedAt),
			Current: d.Document.CurrentVersionID != nil && *d.Document.CurrentVersionID == v.ID}
		if v.Predecessor != nil {
			s := v.Predecessor.String()
			vb.Predecessor = &s
		}
		out.Versions[i] = vb
	}
	for i, s := range d.Signatures {
		out.Signatures[i] = signatureBody{ID: s.ID, VersionID: s.VersionID.String(), Signer: s.Signer, SignedAt: ts(s.SignedAt), ObservedBy: s.ObservedBy.String(), RecordedAt: ts(s.RecordedAt)}
	}
	if d.Impact != nil {
		out.Impact = &impactBody{Invalidated: strs(d.Impact.Invalidated), Unaffected: strs(d.Impact.Unaffected), Token: d.ImpactToken}
	}
	return out
}

// documentETag hashes the revision-determined `document` member only.
func documentETag(d matter.Document) ([]byte, string) {
	b, _ := json.Marshal(documentCoreOf(d)) // skip: a struct of primitives always marshals
	return b, etagOf(b)
}

type criterionBody struct {
	ID          string      `json:"id"`
	SubjectID   string      `json:"subjectId"`
	Title       string      `json:"title"`
	Description string      `json:"description"`
	Mandatory   bool        `json:"mandatory"`
	Rule        string      `json:"versionRule"`
	DocumentID  *string     `json:"documentId"`
	FixedID     *string     `json:"fixedVersionId"`
	ValidDays   int         `json:"validDays"`
	Retired     bool        `json:"retired"`
	Revision    int64       `json:"revision"`
	Satisfied   bool        `json:"satisfied"`
	Reason      string      `json:"reason,omitempty"`
	Claims      []claimBody `json:"claims"`
	ETag        string      `json:"etag"`
}

type assessmentBody struct {
	ID            string  `json:"id"`
	Verdict       string  `json:"verdict"`
	Reviewer      string  `json:"reviewer"`
	Rationale     string  `json:"rationale"`
	SubjectEpoch  int64   `json:"subjectEpoch"`
	AssessedID    *string `json:"assessedVersionId"`
	EffectiveTill *string `json:"effectiveUntil"`
	RecordedAt    string  `json:"recordedAt"`
	RevokedAt     *string `json:"revokedAt"`
	RevokedReason string  `json:"revokedReason,omitempty"`
}

type claimBody struct {
	ID           string          `json:"id"`
	EvidenceID   string          `json:"evidenceId"`
	CriterionRev int64           `json:"criterionRevision"`
	ClaimedBy    string          `json:"claimedBy"`
	ClaimedAt    string          `json:"claimedAt"`
	Disputed     bool            `json:"disputed"`
	Satisfying   bool            `json:"satisfying"`
	Reason       string          `json:"reason,omitempty"`
	Assessment   *assessmentBody `json:"assessment"`
}

type disputeBody struct {
	ID           string `json:"id"`
	AssessmentID string `json:"assessmentId"`
	RaisedBy     string `json:"raisedBy"`
	Reason       string `json:"reason"`
	RaisedAt     string `json:"raisedAt"`
}

type evidenceBody struct {
	ID          string  `json:"id"`
	Kind        string  `json:"kind"`
	VersionID   *string `json:"versionId"`
	Reference   string  `json:"reference,omitempty"`
	Description string  `json:"description"`
	SubmittedBy string  `json:"submittedBy"`
	SubmittedAt string  `json:"submittedAt"`
	ValidFrom   string  `json:"validFrom"`
	ValidUntil  *string `json:"validUntil"`
	WithdrawnAt *string `json:"withdrawnAt"`
}

type checklistBody struct {
	Subject      workItemBody    `json:"subject"`
	Verification string          `json:"verification"`
	Criteria     []criterionBody `json:"criteria"`
	Evidence     []evidenceBody  `json:"evidence"`
	Verifiers    []string        `json:"verifiers"`
	// OpenDisputes are the unresolved challenges to accepted proof of this subject.
	OpenDisputes []disputeBody `json:"openDisputes"`
	// Dependents are the records whose dependency waits on this subject's proof.
	Dependents []string `json:"dependents"`
	// CallerID is the authenticated product actor, so a client can tell which rows are its own
	// (the identity provider's subject is not the product id).
	CallerID string `json:"callerId"`
	AsOf     string `json:"asOf"`
}

func assessmentDTO(a *matter.Assessment) *assessmentBody {
	if a == nil {
		return nil
	}
	b := &assessmentBody{ID: a.ID.String(), Verdict: string(a.Verdict), Reviewer: a.Reviewer.String(), Rationale: a.Rationale, SubjectEpoch: a.SubjectEpoch,
		EffectiveTill: tsPtr(a.EffectiveUntil), RecordedAt: ts(a.RecordedAt), RevokedAt: tsPtr(a.RevokedAt), RevokedReason: a.RevokedReason}
	if a.AssessedVersionID != nil {
		s := a.AssessedVersionID.String()
		b.AssessedID = &s
	}
	return b
}

func criterionDTO(c matter.CriterionStatus) criterionBody {
	cr := c.Criterion
	b := criterionBody{ID: cr.ID.String(), SubjectID: cr.SubjectID.String(), Title: cr.Title, Description: cr.Description, Mandatory: cr.Mandatory, Rule: string(cr.Rule),
		ValidDays: int(cr.ValidFor.Hours() / 24), Retired: cr.Retired, Revision: cr.Revision, Satisfied: c.Satisfied, Reason: string(c.Reason), Claims: make([]claimBody, len(c.Claims))}
	if cr.DocumentID != nil {
		s := cr.DocumentID.String()
		b.DocumentID = &s
	}
	if cr.FixedID != nil {
		s := cr.FixedID.String()
		b.FixedID = &s
	}
	_, b.ETag = criterionETag(cr)
	for i, k := range c.Claims {
		b.Claims[i] = claimBody{ID: k.Claim.ID.String(), EvidenceID: k.Claim.EvidenceID.String(), CriterionRev: k.Claim.CriterionRev, ClaimedBy: k.Claim.ClaimedBy.String(),
			ClaimedAt: ts(k.Claim.ClaimedAt), Disputed: k.Disputed, Satisfying: k.Satisfying, Reason: string(k.Reason), Assessment: assessmentDTO(k.Current)}
	}
	return b
}

// criterionETag hashes the revision-determined definition only (the claims move on their own).
func criterionETag(c matter.Criterion) ([]byte, string) {
	b, _ := json.Marshal(struct {
		ID, Title, Description, Rule string
		Mandatory, Retired           bool
		Revision                     int64
	}{c.ID.String(), c.Title, c.Description, string(c.Rule), c.Mandatory, c.Retired, c.Revision}) // skip: primitives only
	return b, etagOf(b)
}

func checklistDTO(p matter.ProofChecklist) checklistBody {
	out := checklistBody{Subject: workItemDTO(p.Subject), Verification: string(p.Result.State), Criteria: make([]criterionBody, len(p.Result.Criteria)),
		Evidence: make([]evidenceBody, len(p.Evidence)), Verifiers: strs(p.Verifiers), Dependents: make([]string, len(p.Dependencies)), AsOf: ts(p.AsOf)}
	for i, c := range p.Result.Criteria {
		out.Criteria[i] = criterionDTO(c)
	}
	out.OpenDisputes = make([]disputeBody, len(p.OpenDisputes))
	for i, d := range p.OpenDisputes {
		out.OpenDisputes[i] = disputeBody{ID: d.ID.String(), AssessmentID: d.AssessmentID.String(), RaisedBy: d.RaisedBy.String(), Reason: d.Reason, RaisedAt: ts(d.RaisedAt)}
	}
	for i, e := range p.Evidence {
		out.Evidence[i] = evidenceDTO(e)
	}
	for i, d := range p.Dependencies {
		out.Dependents[i] = d.String()
	}
	return out
}

func evidenceDTO(e matter.Evidence) evidenceBody {
	eb := evidenceBody{ID: e.ID.String(), Kind: string(e.Kind), Reference: e.Reference, Description: e.Description, SubmittedBy: e.SubmittedBy.String(),
		SubmittedAt: ts(e.SubmittedAt), ValidFrom: ts(e.ValidFrom), ValidUntil: tsPtr(e.ValidUntil), WithdrawnAt: tsPtr(e.WithdrawnAt)}
	if e.VersionID != nil {
		s := e.VersionID.String()
		eb.VersionID = &s
	}
	return eb
}
