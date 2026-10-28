package productapi

import (
	"encoding/json"

	"github.com/example/userapi/internal/core/domain/matter"
)

// W5 wire DTOs (contract revision 9). The Control Room carries the boundary it describes (`asOf`,
// `sourceRevision`); a section the API cannot build is an error, never an empty list.

type contextRecordCore struct {
	ID           string   `json:"id"`
	Kind         string   `json:"kind"`
	Title        string   `json:"title"`
	Body         string   `json:"body"`
	Status       string   `json:"status"`
	ClosedReason string   `json:"closedReason,omitempty"`
	Links        []string `json:"links"`
	CreatedBy    string   `json:"createdBy"`
	CreatedAt    string   `json:"createdAt"`
	Revision     int64    `json:"revision"`
}

type contextRecordBody struct {
	contextRecordCore
	ETag string `json:"etag"`
}

func contextCore(r matter.ContextRecord) contextRecordCore {
	return contextRecordCore{
		ID: r.ID, Kind: string(r.Kind), Title: r.Title, Body: r.Body, Status: string(r.Status), ClosedReason: r.ClosedReason,
		Links: strs(r.Links), CreatedBy: r.CreatedBy.String(), CreatedAt: ts(r.CreatedAt), Revision: r.Revision,
	}
}

func contextETag(r matter.ContextRecord) ([]byte, string) {
	b, _ := json.Marshal(contextCore(r)) // skip: a struct of primitives always marshals
	return b, etagOf(b)
}

func contextDTO(r matter.ContextRecord) contextRecordBody {
	_, tag := contextETag(r)
	return contextRecordBody{contextRecordCore: contextCore(r), ETag: tag}
}

func contextDTOs(in []matter.ContextRecord) []contextRecordBody {
	out := make([]contextRecordBody, len(in))
	for i, r := range in {
		out[i] = contextDTO(r)
	}
	return out
}

type controlStateBody struct {
	Total           int            `json:"total"`
	ByExecution     map[string]int `json:"byExecution"`
	Blocked         int            `json:"blocked"`
	Overdue         int            `json:"overdue"`
	Critical        int            `json:"critical"`
	AwaitingProof   int            `json:"awaitingProof"`
	OpenFilings     int            `json:"openFilings"`
	NegativeFilings int            `json:"negativeFilings"`
}

type blockerBody struct {
	workItemEnvelope
	Reasons  []gateReasonBody `json:"reasons"`
	Upstream []upstreamBody   `json:"upstream"`
}

type upstreamBody struct {
	ID           string  `json:"id"`
	Title        string  `json:"title"`
	Execution    string  `json:"execution"`
	Verification *string `json:"verification"`
}

type nextActionBody struct {
	workItemEnvelope
	Unblocks  []string            `json:"unblocks"`
	Decisions []contextRecordBody `json:"decisions"`
}

type gapBody struct {
	ItemID string `json:"itemId"`
	Kind   string `json:"kind"`
}

type controlRoomBody struct {
	AsOf           string              `json:"asOf"`
	SourceRevision int64               `json:"sourceRevision"`
	State          controlStateBody    `json:"state"`
	Blockers       []blockerBody       `json:"blockers"`
	NextActions    []nextActionBody    `json:"nextActions"`
	Waiting        []workItemEnvelope  `json:"waiting"`
	Milestones     []milestoneViewBody `json:"milestones"`
	Gaps           []gapBody           `json:"gaps"`
	Decisions      []contextRecordBody `json:"decisions"`
	Risks          []contextRecordBody `json:"risks"`
	Findings       []contextRecordBody `json:"findings"`
	// Records and Titles are read in the same snapshot as every figure above (F04).
	Records []contextRecordBody `json:"records"`
	Titles  map[string]string   `json:"titles"`
	Changes []eventBody         `json:"changes"`
}

func controlRoomDTO(r matter.ControlRoom) controlRoomBody {
	by := map[string]int{}
	for k, v := range r.State.ByExecution {
		by[string(k)] = v
	}
	out := controlRoomBody{
		AsOf: ts(r.AsOf), SourceRevision: r.Revision,
		State: controlStateBody{Total: r.State.Total, ByExecution: by, Blocked: r.State.Blocked, Overdue: r.State.Overdue, Critical: r.State.Critical,
			AwaitingProof: r.State.AwaitingProof, OpenFilings: r.State.OpenFilings, NegativeFilings: r.State.NegativeFilings},
		Blockers: []blockerBody{}, NextActions: []nextActionBody{}, Waiting: []workItemEnvelope{}, Milestones: []milestoneViewBody{},
		Gaps: []gapBody{}, Decisions: contextDTOs(r.Decisions), Risks: contextDTOs(r.Risks), Findings: contextDTOs(r.Findings), Changes: []eventBody{},
		Records: contextDTOs(r.Records), Titles: map[string]string{},
	}
	for id, title := range r.Titles {
		out.Titles[id.String()] = title
	}
	for _, b := range r.Blockers {
		bb := blockerBody{workItemEnvelope: envelopeDTO(b.View), Reasons: gateReasonBodies(b.Reasons), Upstream: []upstreamBody{}}
		for _, u := range b.Upstream {
			ub := upstreamBody{ID: u.ID.String(), Title: u.Title, Execution: string(u.Execution)}
			if u.Verification != "" {
				v := string(u.Verification)
				ub.Verification = &v
			}
			bb.Upstream = append(bb.Upstream, ub)
		}
		out.Blockers = append(out.Blockers, bb)
	}
	for _, n := range r.NextActions {
		out.NextActions = append(out.NextActions, nextActionBody{workItemEnvelope: envelopeDTO(n.View), Unblocks: strs(n.Unblocks), Decisions: contextDTOs(n.Decisions)})
	}
	for _, w := range r.Waiting {
		out.Waiting = append(out.Waiting, envelopeDTO(w))
	}
	for _, m := range r.Milestones {
		out.Milestones = append(out.Milestones, milestoneViewDTO(m))
	}
	for _, g := range r.Gaps {
		out.Gaps = append(out.Gaps, gapBody{ItemID: g.ItemID.String(), Kind: string(g.Kind)})
	}
	for _, e := range r.Changes {
		out.Changes = append(out.Changes, eventDTO(e))
	}
	return out
}
