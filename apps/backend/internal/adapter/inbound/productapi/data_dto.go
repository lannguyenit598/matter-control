package productapi

// Wire shapes of the W6 data operations. The domain values carry no JSON tags, so every response
// is mapped here to the camelCase contract the frontend validates.

import "leonx.me/matter-control/internal/core/domain/matter"

type bulkPreviewRowBody struct {
	RowKey   string  `json:"rowKey"`
	ItemID   string  `json:"itemId"`
	Found    bool    `json:"found"`
	Title    string  `json:"title,omitempty"`
	Outcome  string  `json:"outcome,omitempty"`
	Owner    *string `json:"owner"`
	Due      *string `json:"due"`
	Revision int64   `json:"revision"`
	Valid    bool    `json:"valid"`
	Code     string  `json:"code,omitempty"`
}

type bulkPreviewBody struct {
	PreviewID string               `json:"previewId"`
	Rows      []bulkPreviewRowBody `json:"rows"`
	AsOf      string               `json:"asOf"`
}

func bulkPreviewDTO(r matter.BulkPreviewResult) bulkPreviewBody {
	out := bulkPreviewBody{PreviewID: r.PreviewID, Rows: make([]bulkPreviewRowBody, len(r.Rows)), AsOf: ts(r.AsOf)}
	for i, x := range r.Rows {
		out.Rows[i] = bulkPreviewRowBody{
			RowKey: x.RowKey, ItemID: x.ItemID, Found: x.Found, Title: x.Title, Outcome: x.Outcome,
			Owner: x.Owner, Due: tsPtr(x.Due), Revision: x.Revision, Valid: x.Valid, Code: x.Code,
		}
	}
	return out
}

type rowResultBody struct {
	RowKey      string `json:"rowKey"`
	ItemID      string `json:"itemId,omitempty"`
	Status      string `json:"status"`
	Code        string `json:"code,omitempty"`
	Revision    *int64 `json:"revision,omitempty"`
	ContentHash string `json:"contentHash,omitempty"`
	Detail      string `json:"detail,omitempty"`
}

func bulkResultsDTO(rs []matter.BulkRowResult) []rowResultBody {
	out := make([]rowResultBody, len(rs))
	for i, r := range rs {
		out[i] = rowResultBody{RowKey: r.RowKey, ItemID: r.ItemID, Status: string(r.Status), Code: r.Code, Detail: r.Detail}
		if r.Revision > 0 {
			rev := r.Revision
			out[i].Revision = &rev
		}
	}
	return out
}

func importResultsDTO(rs []matter.ImportRowResult) []rowResultBody {
	out := make([]rowResultBody, len(rs))
	for i, r := range rs {
		out[i] = rowResultBody{RowKey: r.RowKey, ItemID: r.ItemID, Status: string(r.Status), Code: r.Code, ContentHash: r.ContentHash, Detail: r.Detail}
	}
	return out
}

type importRowPlanBody struct {
	ImportedVerificationClaim *string  `json:"importedVerificationClaim,omitempty"`
	RowKey                    string   `json:"rowKey"`
	Kind                      string   `json:"kind"`
	Title                     string   `json:"title"`
	Outcome                   string   `json:"outcome,omitempty"`
	Owner                     *string  `json:"owner"`
	Due                       *string  `json:"due"`
	Dependencies              []string `json:"dependencies"`
	ContentHash               string   `json:"contentHash"`
	Errors                    []string `json:"errors"`
}

type importGroupBody struct {
	ID     int   `json:"id"`
	RowIdx []int `json:"rowIdx"`
	Valid  bool  `json:"valid"`
}

type importPreviewBody struct {
	SourceName string              `json:"sourceName"`
	Rows       []importRowPlanBody `json:"rows"`
	Groups     []importGroupBody   `json:"groups"`
	AsOf       string              `json:"asOf"`
}

func importPreviewDTO(r matter.ImportPreviewResult) importPreviewBody {
	out := importPreviewBody{SourceName: r.SourceName, Rows: make([]importRowPlanBody, len(r.Rows)), Groups: make([]importGroupBody, len(r.Groups)), AsOf: ts(r.AsOf)}
	for i, x := range r.Rows {
		out.Rows[i] = importRowPlanBody{
			RowKey: x.RowKey, Kind: x.Kind, Title: x.Title, Outcome: x.Outcome, Owner: x.Owner, Due: tsPtr(x.Due),
			ImportedVerificationClaim: x.ImportedVerificationClaim, Dependencies: orEmpty(x.Dependencies), ContentHash: x.ContentHash, Errors: orEmpty(x.Errors),
		}
	}
	for i, g := range r.Groups {
		out.Groups[i] = importGroupBody{ID: g.ID, RowIdx: g.RowIdx, Valid: g.Valid}
	}
	return out
}

func orEmpty(s []string) []string {
	if s == nil {
		return []string{}
	}
	return s
}

type briefChangeBody struct {
	Seq          int64   `json:"seq"`
	ID           string  `json:"id"`
	Type         string  `json:"type"`
	TargetKind   string  `json:"targetKind"`
	TargetID     string  `json:"targetId"`
	ActorID      *string `json:"actorId"`
	Reason       *string `json:"reason"`
	RecordedAt   string  `json:"recordedAt"`
	EffectiveAt  string  `json:"effectiveAt"`
	LateRecorded bool    `json:"lateRecorded"`
}

type briefItemBody struct {
	ItemID       string  `json:"itemId"`
	Kind         string  `json:"kind"`
	Title        string  `json:"title"`
	Outcome      string  `json:"outcome,omitempty"`
	Owner        *string `json:"owner"`
	Due          *string `json:"due"`
	Execution    string  `json:"execution,omitempty"`
	Dependency   string  `json:"dependency,omitempty"`
	Verification string  `json:"verification,omitempty"`
	Revision     int64   `json:"revision"`
	ProofExpired bool    `json:"proofExpired"`
}

type briefBody struct {
	MatterID    string            `json:"matterId"`
	T1          string            `json:"t1"`
	T2          string            `json:"t2"`
	Changes     []briefChangeBody `json:"changes"`
	Outstanding []briefItemBody   `json:"outstanding"`
	AsOf        string            `json:"asOf"`
}

func briefDTO(r matter.BriefResult) briefBody {
	out := briefBody{
		MatterID: r.MatterID.String(), T1: ts(r.T1), T2: ts(r.T2), AsOf: ts(r.AsOf),
		Changes: make([]briefChangeBody, len(r.Changes)), Outstanding: make([]briefItemBody, len(r.Outstanding)),
	}
	for i, c := range r.Changes {
		out.Changes[i] = briefChangeBody{
			Seq: c.Seq, ID: c.ID, Type: c.Type, TargetKind: c.TargetKind, TargetID: c.TargetID, ActorID: c.ActorID, Reason: c.Reason,
			RecordedAt: ts(c.RecordedAt), EffectiveAt: ts(c.EffectiveAt), LateRecorded: c.LateRecorded,
		}
	}
	for i, o := range r.Outstanding {
		out.Outstanding[i] = briefItemBody{
			ItemID: o.ItemID, Kind: o.Kind, Title: o.Title, Outcome: o.Outcome, Owner: o.Owner, Due: tsPtr(o.Due),
			Execution: o.Execution, Dependency: o.Dependency, Verification: o.Verification, Revision: o.Revision, ProofExpired: o.ProofExpired,
		}
	}
	return out
}
