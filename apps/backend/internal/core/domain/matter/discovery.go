package matter

import (
	"sort"
	"strconv"
	"strings"
	"time"
)

// ---------- pending-assessment queue (BF-05) ----------

// PendingAssessment is one claim a designated verifier could assess right now, with the exact
// criterion, evidence and document version to open. It is derived from the same proof rules as the
// checklist, never stored, so an assessed, withdrawn or revoked claim cannot linger.
type PendingAssessment struct {
	MatterID          MatterID
	MatterTitle       string
	SubjectID         NodeID
	SubjectKind       NodeKind
	SubjectTitle      string
	SubjectEpoch      int64
	CriterionID       CriterionID
	CriterionTitle    string
	CriterionRevision int64
	CriterionPurpose  CriterionPurpose
	ClaimID           ClaimID
	ClaimedAt         time.Time
	ClaimedBy         ActorID
	ClaimedByName     string
	EvidenceID        EvidenceID
	EvidenceKind      EvidenceKind
	EvidenceReference string
	EvidenceSubmitter ActorID
	SubmittedByName   string
	VersionID         *VersionID
	// VersionLabel reads "<document> · v<n> · <filename>" for a document-version claim.
	VersionLabel string
	// Reason is PENDING_REVIEW (never assessed) or OLD_EPOCH (assessed before a reopen, so it must
	// be reviewed again in the current proof epoch).
	Reason CriterionReason
}

// ReviewQueue is one authorized page of the caller's pending assessments, oldest offer first.
type ReviewQueue struct {
	Items []PendingAssessment
	// Total is the exact number of pending assessments the caller may act on.
	Total int
	Next  *ReviewCursor
	AsOf  time.Time
}

// ReviewCursor is the keyset position after the last returned row.
type ReviewCursor struct {
	ClaimedAt time.Time
	ClaimID   ClaimID
}

// PendingAssessmentsIn lists the claims of one matter that the actor may assess now. Rows are
// returned only when DecideReview allows the actor (designated verifier holding EDITOR/OWNER who
// neither submitted nor offered the evidence): the queue is never a way to see work one may not
// do. Disputed, rejected, revoked, withdrawn and superseded-revision claims are not pending, and
// cancelled records are skipped. Matter and member names are filled by the caller.
func PendingAssessmentsIn(actor ActorID, role MatterRole, items []WorkItem, set EvidenceSet, asOf time.Time) []PendingAssessment {
	var out []PendingAssessment
	for _, it := range items {
		if it.Execution == ExecutionCancelled {
			continue
		}
		for _, c := range EvaluateVerification(it, set, asOf).Criteria {
			for _, k := range c.Claims {
				if k.Reason != CriterionPending && k.Reason != CriterionOldEpoch {
					continue
				}
				if k.Current != nil || k.Disputed || !DecideReview(actor, role, set, k.Claim).Allowed {
					continue
				}
				row := PendingAssessment{
					MatterID: it.MatterID, SubjectID: it.ID, SubjectKind: it.Kind, SubjectTitle: it.Title, SubjectEpoch: it.ProofEpoch,
					CriterionID: c.Criterion.ID, CriterionTitle: c.Criterion.Title, CriterionRevision: c.Criterion.Revision,
					CriterionPurpose: c.Criterion.EffectivePurpose(), ClaimID: k.Claim.ID, ClaimedAt: k.Claim.ClaimedAt,
					ClaimedBy: k.Claim.ClaimedBy, EvidenceID: k.Claim.EvidenceID, EvidenceSubmitter: k.Claim.EvidenceSubmitter, Reason: k.Reason,
				}
				ev, ok := set.evidence(k.Claim.EvidenceID)
				if !ok || ev.WithdrawnAt != nil {
					continue
				}
				row.EvidenceKind, row.EvidenceReference, row.VersionID = ev.Kind, ev.Reference, ev.VersionID
				if ev.VersionID != nil {
					row.VersionLabel = versionLabel(set, *ev.VersionID)
				}
				out = append(out, row)
			}
		}
	}
	return out
}

func versionLabel(set EvidenceSet, id VersionID) string {
	for _, v := range set.Versions {
		if v.ID != id {
			continue
		}
		name := ""
		if d, ok := set.document(v.DocumentID); ok {
			name = d.Name
		}
		return strings.TrimSpace(name + " · v" + strconv.Itoa(v.No) + " · " + v.Filename)
	}
	return ""
}

// PageReviewQueue orders rows oldest offer first (then claim id), applies the keyset cursor and
// the limit, and reports the exact total.
func PageReviewQueue(rows []PendingAssessment, after *ReviewCursor, limit int) ReviewQueue {
	sort.Slice(rows, func(i, j int) bool {
		if !rows[i].ClaimedAt.Equal(rows[j].ClaimedAt) {
			return rows[i].ClaimedAt.Before(rows[j].ClaimedAt)
		}
		return rows[i].ClaimID < rows[j].ClaimID
	})
	out := ReviewQueue{Total: len(rows)}
	for _, r := range rows {
		if after != nil && (r.ClaimedAt.Before(after.ClaimedAt) || (r.ClaimedAt.Equal(after.ClaimedAt) && r.ClaimID <= after.ClaimID)) {
			continue
		}
		if len(out.Items) == limit {
			last := out.Items[len(out.Items)-1]
			out.Next = &ReviewCursor{ClaimedAt: last.ClaimedAt, ClaimID: last.ClaimID}
			break
		}
		out.Items = append(out.Items, r)
	}
	return out
}

// ---------- cross-workspace matter discovery (BF-08) ----------

// DiscoveredMatter is one Matter the caller can open, with the workspace it lives in.
type DiscoveredMatter struct {
	Header        MatterHeader
	WorkspaceName string
	CallerRole    MatterRole
}

// DiscoveryCursor is the keyset position (case-folded title, then id) after the last row.
type DiscoveryCursor struct {
	SortKey  string
	MatterID MatterID
}

// MatterDiscoveryPage is one page of discovered matters. Total counts every match the caller may
// see, so it is exact; it is computed only from rows already authorized for the caller.
type MatterDiscoveryPage struct {
	Items []DiscoveredMatter
	Total int
	Next  *DiscoveryCursor
	AsOf  time.Time
}

// DiscoveryKey is the case-folded sort key of a title.
func DiscoveryKey(title string) string { return strings.ToLower(strings.TrimSpace(title)) }

// PageDiscovery filters by a case-insensitive title substring, orders by (folded title, id),
// applies the cursor and limit and reports the exact total of matches.
func PageDiscovery(rows []DiscoveredMatter, query string, after *DiscoveryCursor, limit int) MatterDiscoveryPage {
	needle := DiscoveryKey(query)
	var hits []DiscoveredMatter
	for _, r := range rows {
		if needle == "" || strings.Contains(DiscoveryKey(r.Header.Title), needle) {
			hits = append(hits, r)
		}
	}
	sort.Slice(hits, func(i, j int) bool {
		ki, kj := DiscoveryKey(hits[i].Header.Title), DiscoveryKey(hits[j].Header.Title)
		if ki != kj {
			return ki < kj
		}
		return hits[i].Header.MatterID < hits[j].Header.MatterID
	})
	out := MatterDiscoveryPage{Total: len(hits)}
	for _, h := range hits {
		if after != nil {
			k := DiscoveryKey(h.Header.Title)
			if k < after.SortKey || (k == after.SortKey && h.Header.MatterID <= after.MatterID) {
				continue
			}
		}
		if len(out.Items) == limit {
			last := out.Items[len(out.Items)-1]
			out.Next = &DiscoveryCursor{SortKey: DiscoveryKey(last.Header.Title), MatterID: last.Header.MatterID}
			break
		}
		out.Items = append(out.Items, h)
	}
	return out
}
