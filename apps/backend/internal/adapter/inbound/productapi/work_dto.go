package productapi

import (
	"encoding/json"

	"github.com/example/userapi/internal/core/domain/matter"
)

// W2 wire DTOs. A work item's ETag is the hash of its canonical `item` member only: that member
// is revision-determined, while `derived` (timing, attention) moves with the clock and must never
// make a valid If-Match fail (contract revision 6, §4).

type gateReasonBody struct {
	EdgeID string `json:"edgeId"`
	Source string `json:"sourceId"`
	Gate   string `json:"gate"`
	Code   string `json:"code"`
}

func gateReasonBodies(rs []matter.GateReason) []gateReasonBody {
	out := make([]gateReasonBody, len(rs))
	for i, r := range rs {
		out[i] = gateReasonBody{EdgeID: r.EdgeID, Source: r.Source.String(), Gate: string(r.Gate), Code: string(r.Code)}
	}
	return out
}

type workItemBody struct {
	ImportedVerificationClaim *string          `json:"importedVerificationClaim,omitempty"`
	ID                        string           `json:"id"`
	Kind                      string           `json:"kind"`
	MatterID                  string           `json:"matterId"`
	Title                     string           `json:"title"`
	Outcome                   string           `json:"outcome"`
	Execution                 string           `json:"execution"`
	Dependency                string           `json:"dependency"`
	DependencyReasons         []gateReasonBody `json:"dependencyReasons"`
	ProofRequired             bool             `json:"proofRequired"`
	Verification              *string          `json:"verification"`
	VerificationApplicability *string          `json:"verificationApplicability"`
	ApplicabilityReason       *string          `json:"applicabilityReason"`
	ProofEpoch                int64            `json:"proofEpoch"`
	WorkstreamID              *string          `json:"workstreamId"`
	OwnerID                   *string          `json:"ownerId"`
	DueAt                     *string          `json:"dueAt"`
	CompletedAt               *string          `json:"completedAt"`
	CancelledAt               *string          `json:"cancelledAt"`
	WaitingPartyID            *string          `json:"waitingPartyId"`
	WaitingCondition          *string          `json:"waitingCondition"`
	Escalation                *string          `json:"escalation"`
	Revision                  int64            `json:"revision"`
}

func strPtrNonEmpty(s string) *string {
	if s == "" {
		return nil
	}
	return &s
}

func workItemDTO(w matter.WorkItem) workItemBody {
	b := workItemBody{
		ID: w.ID.String(), Kind: string(w.Kind), MatterID: w.MatterID.String(), Title: w.Title, Outcome: w.Outcome,
		Execution: string(w.Execution), Dependency: string(w.Dependency), DependencyReasons: gateReasonBodies(w.DependencyReasons),
		ImportedVerificationClaim: w.ImportedVerificationClaim, ProofRequired: w.ProofRequired, Verification: strPtrNonEmpty(string(w.Verification)),
		VerificationApplicability: strPtrNonEmpty(string(w.Applicability)), ApplicabilityReason: w.ApplicabilityReason,
		ProofEpoch: w.ProofEpoch, DueAt: tsPtr(w.DueAt), CompletedAt: tsPtr(w.CompletedAt), CancelledAt: tsPtr(w.CancelledAt),
		WaitingCondition: w.WaitingCondition, Escalation: w.EscalationReason, Revision: w.Revision,
	}
	if w.WorkstreamID != nil {
		s := w.WorkstreamID.String()
		b.WorkstreamID = &s
	}
	if w.OwnerActorID != nil {
		s := w.OwnerActorID.String()
		b.OwnerID = &s
	}
	if w.WaitingPartyID != nil {
		s := w.WaitingPartyID.String()
		b.WaitingPartyID = &s
	}
	return b
}

type derivedBody struct {
	Timing           string   `json:"timing"`
	NoDueDate        bool     `json:"noDueDate"`
	Attention        string   `json:"attention"`
	AttentionReasons []string `json:"attentionReasons"`
	CriticalChain    bool     `json:"criticalChain"`
}

func derivedDTO(v matter.WorkItemView) derivedBody {
	reasons := make([]string, len(v.Attention.Reasons))
	for i, r := range v.Attention.Reasons {
		reasons[i] = string(r)
	}
	return derivedBody{
		Timing: string(v.Timing.State), NoDueDate: v.Timing.NoDue, Attention: string(v.Attention.State),
		AttentionReasons: reasons, CriticalChain: v.CriticalChain,
	}
}

type workItemEnvelope struct {
	Item    workItemBody `json:"item"`
	Derived derivedBody  `json:"derived"`
	// ETag is the strong validator of Item, repeated in the body so a list can drive
	// If-Match without a re-read.
	ETag string `json:"etag"`
}

func envelopeDTO(v matter.WorkItemView) workItemEnvelope {
	_, tag := itemETag(v.Item)
	return workItemEnvelope{Item: workItemDTO(v.Item), Derived: derivedDTO(v), ETag: tag}
}

// itemETag is the strong validator of a work item: the hash of its canonical item member.
func itemETag(w matter.WorkItem) ([]byte, string) {
	b, _ := json.Marshal(workItemDTO(w)) // skip: a struct of primitives always marshals
	return b, etagOf(b)
}

type edgeOtherBody struct {
	ID         string `json:"id"`
	Kind       string `json:"kind"`
	Title      string `json:"title"`
	Execution  string `json:"execution"`
	Dependency string `json:"dependency"`
}

type edgeBody struct {
	ID        string        `json:"id"`
	Gate      string        `json:"gate"`
	Satisfied bool          `json:"satisfied"`
	Reason    *string       `json:"reason"`
	Other     edgeOtherBody `json:"other"`
}

func edgeDTO(e matter.EdgeView) edgeBody {
	return edgeBody{
		ID: e.Edge.ID, Gate: string(e.Edge.Gate), Satisfied: e.Satisfied, Reason: strPtrNonEmpty(string(e.Reason)),
		Other: edgeOtherBody{ID: e.Other.ID.String(), Kind: string(e.Other.Kind), Title: e.Other.Title, Execution: string(e.Other.Execution), Dependency: string(e.Other.Dependency)},
	}
}

type workItemDetailBody struct {
	Item       workItemBody `json:"item"`
	Derived    derivedBody  `json:"derived"`
	ETag       string       `json:"etag"`
	Upstream   []edgeBody   `json:"upstream"`
	Downstream []edgeBody   `json:"downstream"`
}

func detailDTO(d matter.WorkItemDetail) workItemDetailBody {
	_, tag := itemETag(d.View.Item)
	out := workItemDetailBody{Item: workItemDTO(d.View.Item), Derived: derivedDTO(d.View), ETag: tag, Upstream: []edgeBody{}, Downstream: []edgeBody{}}
	for _, e := range d.Upstream {
		out.Upstream = append(out.Upstream, edgeDTO(e))
	}
	for _, e := range d.Downstream {
		out.Downstream = append(out.Downstream, edgeDTO(e))
	}
	return out
}

type assignedBody struct {
	MatterID       string       `json:"matterId"`
	MatterRevision int64        `json:"matterRevision"`
	Class          string       `json:"class"`
	Reason         string       `json:"reason"`
	WaitingOn      *string      `json:"waitingOn"`
	Item           workItemBody `json:"item"`
	Derived        derivedBody  `json:"derived"`
	ETag           string       `json:"etag"`
}

type myActionsBody struct {
	Next       []assignedBody `json:"next"`
	Waiting    []assignedBody `json:"waiting"`
	Blocked    []assignedBody `json:"blocked"`
	Historical []assignedBody `json:"historical"`
}

func assignedDTOs(in []matter.AssignedView) []assignedBody {
	out := make([]assignedBody, 0, len(in))
	for _, a := range in {
		_, tag := itemETag(a.View.Item)
		out = append(out, assignedBody{
			MatterID: a.MatterID.String(), MatterRevision: a.Revision, Class: string(a.Class), Reason: a.Reason,
			WaitingOn: strPtrNonEmpty(a.WaitingOn), Item: workItemDTO(a.View.Item), Derived: derivedDTO(a.View), ETag: tag,
		})
	}
	return out
}

type workstreamBody struct {
	ID       string `json:"id"`
	Name     string `json:"name"`
	Revision int64  `json:"revision"`
}

type partyCore struct {
	ID       string `json:"id"`
	Name     string `json:"name"`
	Kind     string `json:"kind"`
	Contact  string `json:"contact"`
	Notes    string `json:"notes"`
	Revision int64  `json:"revision"`
}

// partyBody is the core plus its strong validator, which hashes the core only.
type partyBody struct {
	partyCore
	ETag string `json:"etag"`
}

func partyETag(p matter.Party) ([]byte, string) {
	b, _ := json.Marshal(partyCore{ID: p.ID.String(), Name: p.Name, Kind: p.Kind, Contact: p.Contact, Notes: p.Notes, Revision: p.Revision}) // skip: primitives only
	return b, etagOf(b)
}

func partyDTO(p matter.Party) partyBody {
	_, tag := partyETag(p)
	return partyBody{partyCore: partyCore{ID: p.ID.String(), Name: p.Name, Kind: p.Kind, Contact: p.Contact, Notes: p.Notes, Revision: p.Revision}, ETag: tag}
}

type milestoneBody struct {
	ID            string   `json:"id"`
	Name          string   `json:"name"`
	DueAt         *string  `json:"dueAt"`
	Critical      bool     `json:"critical"`
	Prerequisites []string `json:"prerequisites"`
	Revision      int64    `json:"revision"`
}

type unsatisfiedBody struct {
	ItemID  string   `json:"itemId"`
	Reasons []string `json:"reasons"`
}

type milestoneStatusBody struct {
	State       string            `json:"state"`
	Satisfied   int               `json:"satisfied"`
	Total       int               `json:"total"`
	Unsatisfied []unsatisfiedBody `json:"unsatisfied"`
}

type milestoneViewBody struct {
	Milestone milestoneBody       `json:"milestone"`
	Status    milestoneStatusBody `json:"status"`
	// ETag validates Milestone (the revision-determined part); Status moves with item states.
	ETag string `json:"etag"`
}

func milestoneDTO(m matter.Milestone) milestoneBody {
	b := milestoneBody{ID: m.ID.String(), Name: m.Name, DueAt: tsPtr(m.DueAt), Critical: m.Critical, Revision: m.Revision, Prerequisites: []string{}}
	for _, p := range m.Prerequisites {
		b.Prerequisites = append(b.Prerequisites, p.String())
	}
	return b
}

func milestoneViewDTO(v matter.MilestoneView) milestoneViewBody {
	st := milestoneStatusBody{State: string(v.Status.State), Satisfied: v.Status.Satisfied, Total: v.Status.Total, Unsatisfied: []unsatisfiedBody{}}
	for _, u := range v.Status.Unsatisfied {
		reasons := make([]string, len(u.Reasons))
		for i, r := range u.Reasons {
			reasons[i] = string(r)
		}
		st.Unsatisfied = append(st.Unsatisfied, unsatisfiedBody{ItemID: u.ItemID.String(), Reasons: reasons})
	}
	_, tag := milestoneETag(v.Milestone)
	return milestoneViewBody{Milestone: milestoneDTO(v.Milestone), Status: st, ETag: tag}
}
