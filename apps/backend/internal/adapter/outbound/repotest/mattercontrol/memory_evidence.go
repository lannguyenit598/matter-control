package mattercontrol

// W3 memory-store extension: documents, versions, criteria, evidence, claims, assessments,
// disputes and verifier designation, with the same constraints the PostgreSQL schema enforces.

import (
	"context"
	"fmt"
	"sort"
	"time"

	"leonx.me/matter-control/internal/core/domain/matter"
	"leonx.me/matter-control/internal/core/port"
)

var _ port.EvidenceTx = (*memTx)(nil)

func sortedValues[K ~string, V any](m map[K]V, in func(V) matter.MatterID, want matter.MatterID) []V {
	keys := make([]K, 0, len(m))
	for k, v := range m {
		if in(v) == want {
			keys = append(keys, k)
		}
	}
	sort.Slice(keys, func(i, j int) bool { return keys[i] < keys[j] })
	out := make([]V, 0, len(keys))
	for _, k := range keys {
		out = append(out, m[k])
	}
	return out
}

func loadEvidenceSet(s *Store, m matter.MatterID) matter.EvidenceSet {
	set := matter.EvidenceSet{
		Documents:   sortedValues(s.documents, func(d matter.Document) matter.MatterID { return d.MatterID }, m),
		Versions:    sortedValues(s.versions, func(v matter.DocumentVersion) matter.MatterID { return v.MatterID }, m),
		Criteria:    sortedValues(s.criteria, func(c matter.Criterion) matter.MatterID { return c.MatterID }, m),
		Evidence:    sortedValues(s.evidence, func(e matter.Evidence) matter.MatterID { return e.MatterID }, m),
		Claims:      sortedValues(s.claims, func(c matter.Claim) matter.MatterID { return c.MatterID }, m),
		Assessments: sortedValues(s.assessments, func(a matter.Assessment) matter.MatterID { return a.MatterID }, m),
		Disputes:    sortedValues(s.disputes, func(d matter.Dispute) matter.MatterID { return d.MatterID }, m),
	}
	for _, sg := range s.signatures {
		if sg.MatterID == m {
			set.Signatures = append(set.Signatures, sg)
		}
	}
	for k, on := range s.verifiers {
		if on && k.m == m {
			set.Verifiers = append(set.Verifiers, k.actor)
		}
	}
	sort.Slice(set.Verifiers, func(i, j int) bool { return set.Verifiers[i] < set.Verifiers[j] })
	return set
}

func (t *memTx) InsertDocument(_ context.Context, d matter.Document) error {
	if err := t.fail("insert_document"); err != nil {
		return err
	}
	t.store.documents[d.ID] = d
	return nil
}

func (t *memTx) SaveDocument(_ context.Context, d matter.Document, expectedRevision int64) error {
	cur, ok := t.store.documents[d.ID]
	if !ok || cur.Revision != expectedRevision {
		return fmt.Errorf("document update: %w", port.ErrVersionConflict)
	}
	d.Revision = expectedRevision + 1
	t.store.documents[d.ID] = d
	return nil
}

func (t *memTx) InsertVersion(_ context.Context, v matter.DocumentVersion) error {
	if err := t.fail("insert_version"); err != nil {
		return err
	}
	if _, ok := t.store.documents[v.DocumentID]; !ok {
		return fmt.Errorf("memory: version %s references an unknown document", v.ID)
	}
	for _, x := range t.store.versions {
		if x.DocumentID == v.DocumentID && x.No == v.No {
			return fmt.Errorf("memory: duplicate version number %d", v.No)
		}
	}
	t.store.versions[v.ID] = v
	return nil
}

func (t *memTx) InsertSignature(_ context.Context, s matter.SignatureObservation) error {
	if _, ok := t.store.versions[s.VersionID]; !ok {
		return fmt.Errorf("memory: signature on an unknown version")
	}
	t.store.signatures = append(t.store.signatures, s)
	return nil
}

func (t *memTx) InsertCriterion(_ context.Context, c matter.Criterion) error {
	if err := t.fail("insert_criterion"); err != nil {
		return err
	}
	t.store.criteria[c.ID] = c
	return nil
}

func (t *memTx) SaveCriterion(_ context.Context, c matter.Criterion, expectedRevision int64) error {
	cur, ok := t.store.criteria[c.ID]
	if !ok || cur.Revision != expectedRevision {
		return fmt.Errorf("criterion update: %w", port.ErrVersionConflict)
	}
	c.Revision = expectedRevision + 1
	t.store.criteria[c.ID] = c
	return nil
}

func (t *memTx) InsertEvidence(_ context.Context, e matter.Evidence) error {
	if err := t.fail("insert_evidence"); err != nil {
		return err
	}
	t.store.evidence[e.ID] = e
	return nil
}

func (t *memTx) WithdrawEvidence(_ context.Context, id matter.EvidenceID, at time.Time) error {
	e, ok := t.store.evidence[id]
	if !ok || e.WithdrawnAt != nil {
		return fmt.Errorf("withdraw evidence: %w", port.ErrVersionConflict)
	}
	e.WithdrawnAt = &at
	t.store.evidence[id] = e
	return nil
}

func (t *memTx) InsertClaim(_ context.Context, k matter.Claim) error {
	if err := t.fail("insert_claim"); err != nil {
		return err
	}
	for _, x := range t.store.claims {
		if x.EvidenceID == k.EvidenceID && x.CriterionID == k.CriterionID && x.CriterionRev == k.CriterionRev {
			return fmt.Errorf("memory: duplicate claim")
		}
	}
	t.store.claims[k.ID] = k
	return nil
}

func (t *memTx) InsertAssessment(_ context.Context, a matter.Assessment) error {
	if err := t.fail("insert_assessment"); err != nil {
		return err
	}
	// The database CHECK: nobody reviews proof they supplied or offered.
	if a.Reviewer == a.EvidenceSubmitter || a.Reviewer == a.Claimant {
		return fmt.Errorf("memory: assessment violates reviewer independence")
	}
	k, ok := t.store.claims[a.ClaimID]
	if !ok || k.EvidenceSubmitter != a.EvidenceSubmitter || k.ClaimedBy != a.Claimant {
		return fmt.Errorf("memory: assessment does not match its claim")
	}
	t.store.assessments[a.ID] = a
	return nil
}

func (t *memTx) SupersedeAssessment(_ context.Context, id, by matter.AssessmentID) error {
	a, ok := t.store.assessments[id]
	if !ok || a.SupersededBy != nil {
		return fmt.Errorf("supersede assessment: %w", port.ErrVersionConflict)
	}
	a.SupersededBy = &by
	t.store.assessments[id] = a
	return nil
}

func (t *memTx) RevokeAssessment(_ context.Context, id matter.AssessmentID, at time.Time, by matter.ActorID, reason string) error {
	a, ok := t.store.assessments[id]
	if !ok || a.RevokedAt != nil {
		return fmt.Errorf("revoke assessment: %w", port.ErrVersionConflict)
	}
	a.RevokedAt, a.RevokedBy, a.RevokedReason = &at, &by, reason
	t.store.assessments[id] = a
	return nil
}

func (t *memTx) InsertDispute(_ context.Context, d matter.Dispute) error {
	if _, ok := t.store.assessments[d.AssessmentID]; !ok {
		return fmt.Errorf("memory: dispute on an unknown assessment")
	}
	t.store.disputes[d.ID] = d
	return nil
}

func (t *memTx) ResolveDispute(_ context.Context, id matter.DisputeID, at time.Time, by matter.ActorID, resolution string) error {
	d, ok := t.store.disputes[id]
	if !ok || d.ResolvedAt != nil {
		return fmt.Errorf("resolve dispute: %w", port.ErrVersionConflict)
	}
	d.ResolvedAt, d.ResolvedBy, d.Resolution = &at, &by, resolution
	t.store.disputes[id] = d
	return nil
}

func (t *memTx) SetVerifier(_ context.Context, user matter.ActorID, active bool, _ matter.ActorID, _ time.Time) error {
	if _, ok := t.store.mMemberships[mmKey{t.header.MatterID, user}]; !ok {
		return fmt.Errorf("memory: verifier must hold a matter membership")
	}
	t.store.verifiers[mmKey{t.header.MatterID, user}] = active
	return nil
}
