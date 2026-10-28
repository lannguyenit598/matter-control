package productapi

import "github.com/example/userapi/internal/core/domain/matter"

// W4 wire DTOs (contract revision 8). The filing's ETag is its work item's ETag: every stage
// command bumps the item revision, so a stale screen can never act on a moved filing.

type filingBody struct {
	RequirementID    string `json:"requirementId"`
	AuthorityPartyID string `json:"authorityPartyId"`
	Stage            string `json:"stage"`
	NegativeOutcome  string `json:"negativeOutcome,omitempty"`
	// NegativeOpen is true while a rejection/withdrawal is unresolved in the current proof epoch.
	NegativeOpen bool `json:"negativeOpen"`
	CurrentCycle int  `json:"currentCycle"`
	// SignatureNotRequired is the OWNER's explicit no-signature applicability decision (F03),
	// independent of the outcome-proof flag, with its retained reason, decider and instant.
	SignatureNotRequired       bool    `json:"signatureNotRequired"`
	SignatureNotRequiredReason string  `json:"signatureNotRequiredReason,omitempty"`
	SignatureNotRequiredBy     *string `json:"signatureNotRequiredBy"`
	SignatureNotRequiredAt     *string `json:"signatureNotRequiredAt"`
}

type cycleBody struct {
	ID           string  `json:"id"`
	No           int     `json:"no"`
	OpenedInEp   int64   `json:"openedInEpoch"`
	RequestRef   string  `json:"requestRef"`
	OwnerID      *string `json:"ownerId"`
	DueAt        *string `json:"dueAt"`
	OpenedAt     string  `json:"openedAt"`
	SubmittedAt  *string `json:"submittedAt"`
	SubmissionID *string `json:"submissionId"`
}

type submissionBody struct {
	ID           string   `json:"id"`
	CycleNo      int      `json:"cycleNo"`
	Reference    string   `json:"reference"`
	SubmittedAt  string   `json:"submittedAt"`
	Versions     []string `json:"versionIds"`
	ExternalRefs []string `json:"externalRefs"`
	RecordedBy   string   `json:"recordedBy"`
	RecordedAt   string   `json:"recordedAt"`
}

type observationBody struct {
	ID         string   `json:"id"`
	Seq        int      `json:"seq"`
	Kind       string   `json:"kind"`
	From       string   `json:"from"`
	To         string   `json:"to"`
	Reference  string   `json:"reference"`
	ObservedAt string   `json:"observedAt"`
	EvidenceID []string `json:"evidenceIds"`
	Actor      string   `json:"actor"`
	Reason     string   `json:"reason"`
	CorrectsID *string  `json:"correctsId"`
	Outcome    string   `json:"outcome,omitempty"`
	RecordedAt string   `json:"recordedAt"`
	CycleNo    int      `json:"cycleNo"`
	ProofEpoch int64    `json:"proofEpoch"`
}

type filingDetailBody struct {
	workItemEnvelope
	Filing       filingBody        `json:"filing"`
	Cycles       []cycleBody       `json:"cycles"`
	Submissions  []submissionBody  `json:"submissions"`
	Observations []observationBody `json:"observations"`
	Next         []string          `json:"next"`
	AsOf         string            `json:"asOf"`
}

type filingSummaryBody struct {
	workItemEnvelope
	Filing filingBody `json:"filing"`
}

func filingDTO(f matter.Filing, it matter.WorkItem) filingBody {
	b := filingBody{
		RequirementID: f.RequirementID.String(), AuthorityPartyID: f.AuthorityPartyID.String(), Stage: string(f.Stage),
		NegativeOutcome: string(f.NegativeOutcome), NegativeOpen: f.NegativeOpen(it), CurrentCycle: f.CurrentCycle,
		SignatureNotRequired: f.SignatureNotRequired, SignatureNotRequiredReason: f.SignatureNotRequiredReason,
	}
	if f.SignatureNotRequired {
		by, at := f.SignatureNotRequiredBy.String(), ts(f.SignatureNotRequiredAt)
		b.SignatureNotRequiredBy, b.SignatureNotRequiredAt = &by, &at
	}
	return b
}

func filingSummaryDTO(s matter.FilingSummary) filingSummaryBody {
	return filingSummaryBody{workItemEnvelope: envelopeDTO(s.View), Filing: filingDTO(s.Filing, s.View.Item)}
}

func filingDetailDTO(d matter.FilingDetail) filingDetailBody {
	out := filingDetailBody{
		workItemEnvelope: envelopeDTO(d.View), Filing: filingDTO(d.Filing, d.View.Item), AsOf: ts(d.AsOf),
		Cycles: make([]cycleBody, len(d.Cycles)), Submissions: make([]submissionBody, len(d.Submissions)),
		Observations: make([]observationBody, len(d.Observations)), Next: strs(d.Next),
	}
	for i, c := range d.Cycles {
		cb := cycleBody{ID: c.ID, No: c.No, OpenedInEp: c.OpenedInEp, RequestRef: c.RequestRef, DueAt: tsPtr(c.DueAt), OpenedAt: ts(c.OpenedAt), SubmittedAt: tsPtr(c.SubmittedAt)}
		if c.Owner != nil {
			s := c.Owner.String()
			cb.OwnerID = &s
		}
		if c.SubmissionID != "" {
			s := c.SubmissionID
			cb.SubmissionID = &s
		}
		out.Cycles[i] = cb
	}
	for i, s := range d.Submissions {
		ext := s.ExternalRefs
		if ext == nil {
			ext = []string{}
		}
		out.Submissions[i] = submissionBody{ID: s.ID, CycleNo: s.CycleNo, Reference: s.Reference, SubmittedAt: ts(s.SubmittedAt), Versions: strs(s.Versions),
			ExternalRefs: ext, RecordedBy: s.RecordedBy.String(), RecordedAt: ts(s.RecordedAt)}
	}
	for i, o := range d.Observations {
		ob := observationBody{ID: o.ID, Seq: o.Seq, Kind: string(o.Kind), From: string(o.From), To: string(o.To), Reference: o.Reference, ObservedAt: ts(o.ObservedAt),
			EvidenceID: strs(o.Evidence), Actor: o.Actor.String(), Reason: o.Reason, Outcome: string(o.Outcome), RecordedAt: ts(o.RecordedAt), CycleNo: o.CycleNo, ProofEpoch: o.ProofEpoch}
		if o.CorrectsID != "" {
			s := o.CorrectsID
			ob.CorrectsID = &s
		}
		out.Observations[i] = ob
	}
	return out
}
