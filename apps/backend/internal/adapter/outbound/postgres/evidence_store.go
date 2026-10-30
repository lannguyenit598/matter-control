package postgres

// W3 PostgreSQL adapter: documents/versions, criteria, evidence, claims, assessments, disputes and
// verifier designation, written inside the locked matter transaction and read into the same
// snapshot as the work graph (so verification is always evaluated on one consistent state).

import (
	"context"
	"fmt"
	"time"

	"github.com/jackc/pgx/v5/pgtype"

	"leonx.me/matter-control/internal/adapter/outbound/postgres/mcsqlc"
	"leonx.me/matter-control/internal/core/domain/matter"
	"leonx.me/matter-control/internal/core/port"
)

var _ port.EvidenceTx = (*pgMatterTx)(nil)

func loadEvidence(ctx context.Context, q *mcsqlc.Queries, m matter.MatterID) (matter.EvidenceSet, error) {
	var set matter.EvidenceSet
	docs, err := q.ListDocumentsOfMatter(ctx, m.String())
	if err != nil {
		return set, mapMatterError(err)
	}
	for _, d := range docs {
		doc := matter.Document{ID: matter.DocumentID(d.ID), MatterID: m, Name: d.Name, Revision: d.Revision}
		if s := uuidStr(d.CurrentVersionID); s != nil {
			v := matter.VersionID(*s)
			doc.CurrentVersionID = &v
		}
		set.Documents = append(set.Documents, doc)
	}
	vers, err := q.ListVersionsOfMatter(ctx, m.String())
	if err != nil {
		return set, mapMatterError(err)
	}
	for _, v := range vers {
		dv := matter.DocumentVersion{
			ID: matter.VersionID(v.ID), MatterID: m, DocumentID: matter.DocumentID(v.DocumentID), No: int(v.VersionNo),
			Filename: v.Filename, MediaType: v.MediaType, SHA256: v.Sha256, SizeBytes: v.SizeBytes,
			UploadedBy: matter.ActorID(v.UploadedBy), UploadedAt: v.UploadedAt.UTC(),
		}
		if s := uuidStr(v.PredecessorID); s != nil {
			p := matter.VersionID(*s)
			dv.Predecessor = &p
		}
		set.Versions = append(set.Versions, dv)
	}
	sigs, err := q.ListSignaturesOfMatter(ctx, m.String())
	if err != nil {
		return set, mapMatterError(err)
	}
	for _, s := range sigs {
		set.Signatures = append(set.Signatures, matter.SignatureObservation{
			ID: s.ID, MatterID: m, VersionID: matter.VersionID(s.VersionID), Signer: s.Signer,
			SignedAt: s.SignedAt.UTC(), ObservedBy: matter.ActorID(s.ObservedBy), RecordedAt: s.RecordedAt.UTC(),
		})
	}
	crits, err := q.ListCriteriaOfMatter(ctx, m.String())
	if err != nil {
		return set, mapMatterError(err)
	}
	for _, c := range crits {
		cr := matter.Criterion{
			ID: matter.CriterionID(c.ID), MatterID: m, SubjectID: matter.NodeID(c.SubjectID), Title: c.Title, Description: c.Description,
			Mandatory: c.Mandatory, Rule: matter.VersionRule(c.VersionRule), ValidFor: time.Duration(c.ValidForSeconds) * time.Second,
			Retired: c.Retired, Revision: c.Revision,
		}
		if s := uuidStr(c.DocumentID); s != nil {
			d := matter.DocumentID(*s)
			cr.DocumentID = &d
		}
		if s := uuidStr(c.FixedVersionID); s != nil {
			v := matter.VersionID(*s)
			cr.FixedID = &v
		}
		set.Criteria = append(set.Criteria, cr)
	}
	evs, err := q.ListEvidenceOfMatter(ctx, m.String())
	if err != nil {
		return set, mapMatterError(err)
	}
	for _, e := range evs {
		ev := matter.Evidence{
			ID: matter.EvidenceID(e.ID), MatterID: m, Kind: matter.EvidenceKind(e.Kind), Reference: e.Reference, Description: e.Description,
			SubmittedBy: matter.ActorID(e.SubmittedBy), SubmittedAt: e.SubmittedAt.UTC(), ValidFrom: e.ValidFrom.UTC(),
			ValidUntil: timestamptzPtr(e.ValidUntil), WithdrawnAt: timestamptzPtr(e.WithdrawnAt),
		}
		if s := uuidStr(e.VersionID); s != nil {
			v := matter.VersionID(*s)
			ev.VersionID = &v
		}
		set.Evidence = append(set.Evidence, ev)
	}
	claims, err := q.ListClaimsOfMatter(ctx, m.String())
	if err != nil {
		return set, mapMatterError(err)
	}
	for _, k := range claims {
		set.Claims = append(set.Claims, matter.Claim{
			ID: matter.ClaimID(k.ID), MatterID: m, EvidenceID: matter.EvidenceID(k.EvidenceID), CriterionID: matter.CriterionID(k.CriterionID),
			CriterionRev: k.CriterionRevision, ClaimedBy: matter.ActorID(k.ClaimedBy), ClaimedAt: k.ClaimedAt.UTC(),
			EvidenceSubmitter: matter.ActorID(k.EvidenceSubmitter),
		})
	}
	ass, err := q.ListAssessmentsOfMatter(ctx, m.String())
	if err != nil {
		return set, mapMatterError(err)
	}
	for _, a := range ass {
		as := matter.Assessment{
			ID: matter.AssessmentID(a.ID), MatterID: m, ClaimID: matter.ClaimID(a.ClaimID), SubjectID: matter.NodeID(a.SubjectID),
			SubjectEpoch: int64(a.SubjectEpoch), Verdict: matter.Verdict(a.Verdict), Reviewer: matter.ActorID(a.ReviewerID), Rationale: a.Rationale,
			EffectiveUntil: timestamptzPtr(a.EffectiveUntil), RecordedAt: a.RecordedAt.UTC(), RevokedAt: timestamptzPtr(a.RevokedAt),
			RevokedReason: a.RevokedReason.String, EvidenceSubmitter: matter.ActorID(a.EvidenceSubmitter), Claimant: matter.ActorID(a.Claimant),
		}
		if s := uuidStr(a.AssessedVersionID); s != nil {
			v := matter.VersionID(*s)
			as.AssessedVersionID = &v
		}
		if s := uuidStr(a.SupersededBy); s != nil {
			id := matter.AssessmentID(*s)
			as.SupersededBy = &id
		}
		if s := uuidStr(a.RevokedBy); s != nil {
			r := matter.ActorID(*s)
			as.RevokedBy = &r
		}
		set.Assessments = append(set.Assessments, as)
	}
	disputes, err := q.ListDisputesOfMatter(ctx, m.String())
	if err != nil {
		return set, mapMatterError(err)
	}
	for _, d := range disputes {
		dp := matter.Dispute{
			ID: matter.DisputeID(d.ID), MatterID: m, AssessmentID: matter.AssessmentID(d.AssessmentID), RaisedBy: matter.ActorID(d.RaisedBy),
			Reason: d.Reason, RaisedAt: d.RaisedAt.UTC(), ResolvedAt: timestamptzPtr(d.ResolvedAt), Resolution: d.Resolution.String,
		}
		if s := uuidStr(d.ResolvedBy); s != nil {
			r := matter.ActorID(*s)
			dp.ResolvedBy = &r
		}
		set.Disputes = append(set.Disputes, dp)
	}
	vs, err := q.ListActiveVerifiers(ctx, m.String())
	if err != nil {
		return set, mapMatterError(err)
	}
	for _, v := range vs {
		set.Verifiers = append(set.Verifiers, matter.ActorID(v))
	}
	return set, nil
}

// ---------- transaction writes ----------

func (t *pgMatterTx) InsertDocument(ctx context.Context, d matter.Document) error {
	return mapMatterError(t.q.InsertDocument(ctx, mcsqlc.InsertDocumentParams{
		ID: d.ID.String(), MatterID: d.MatterID.String(), Name: d.Name, CurrentVersionID: optVersion(d.CurrentVersionID), Revision: d.Revision,
	}))
}

func optVersion(v *matter.VersionID) pgtype.UUID {
	if v == nil {
		return pgtype.UUID{}
	}
	return uuidString(v.String())
}

func (t *pgMatterTx) SaveDocument(ctx context.Context, d matter.Document, expectedRevision int64) error {
	rows, err := t.q.UpdateDocument(ctx, mcsqlc.UpdateDocumentParams{
		ID: d.ID.String(), Name: d.Name, CurrentVersionID: optVersion(d.CurrentVersionID), ExpectedRevision: expectedRevision,
	})
	if err != nil {
		return mapMatterError(err)
	}
	if rows == 0 {
		return fmt.Errorf("document update: %w", port.ErrVersionConflict)
	}
	return nil
}

func (t *pgMatterTx) InsertVersion(ctx context.Context, v matter.DocumentVersion) error {
	return mapMatterError(t.q.InsertVersion(ctx, mcsqlc.InsertVersionParams{
		ID: v.ID.String(), MatterID: v.MatterID.String(), DocumentID: v.DocumentID.String(), VersionNo: int32(v.No), //nolint:gosec // version numbers are small counters
		PredecessorID: optVersion(v.Predecessor), Filename: v.Filename, MediaType: v.MediaType, Sha256: v.SHA256, SizeBytes: v.SizeBytes,
		UploadedBy: v.UploadedBy.String(), UploadedAt: v.UploadedAt,
	}))
}

func (t *pgMatterTx) InsertSignature(ctx context.Context, s matter.SignatureObservation) error {
	return mapMatterError(t.q.InsertSignature(ctx, mcsqlc.InsertSignatureParams{
		ID: s.ID, MatterID: s.MatterID.String(), VersionID: s.VersionID.String(), Signer: s.Signer, SignedAt: s.SignedAt,
		ObservedBy: s.ObservedBy.String(), RecordedAt: s.RecordedAt,
	}))
}

func criterionParams(c matter.Criterion) (doc, fixed pgtype.UUID) {
	if c.DocumentID != nil {
		doc = uuidString(c.DocumentID.String())
	}
	if c.FixedID != nil {
		fixed = uuidString(c.FixedID.String())
	}
	return doc, fixed
}

func (t *pgMatterTx) InsertCriterion(ctx context.Context, c matter.Criterion) error {
	doc, fixed := criterionParams(c)
	return mapMatterError(t.q.InsertCriterion(ctx, mcsqlc.InsertCriterionParams{
		ID: c.ID.String(), MatterID: c.MatterID.String(), SubjectID: c.SubjectID.String(), Title: c.Title, Description: c.Description,
		Mandatory: c.Mandatory, VersionRule: string(c.Rule), DocumentID: doc, FixedVersionID: fixed,
		ValidForSeconds: int64(c.ValidFor / time.Second), Retired: c.Retired, Revision: c.Revision,
	}))
}

func (t *pgMatterTx) SaveCriterion(ctx context.Context, c matter.Criterion, expectedRevision int64) error {
	doc, fixed := criterionParams(c)
	rows, err := t.q.UpdateCriterion(ctx, mcsqlc.UpdateCriterionParams{
		ID: c.ID.String(), Title: c.Title, Description: c.Description, Mandatory: c.Mandatory, VersionRule: string(c.Rule),
		DocumentID: doc, FixedVersionID: fixed, ValidForSeconds: int64(c.ValidFor / time.Second), Retired: c.Retired, ExpectedRevision: expectedRevision,
	})
	if err != nil {
		return mapMatterError(err)
	}
	if rows == 0 {
		return fmt.Errorf("criterion update: %w", port.ErrVersionConflict)
	}
	return nil
}

func (t *pgMatterTx) InsertEvidence(ctx context.Context, e matter.Evidence) error {
	return mapMatterError(t.q.InsertEvidence(ctx, mcsqlc.InsertEvidenceParams{
		ID: e.ID.String(), MatterID: e.MatterID.String(), Kind: string(e.Kind), VersionID: optVersion(e.VersionID), Reference: e.Reference,
		Description: e.Description, SubmittedBy: e.SubmittedBy.String(), SubmittedAt: e.SubmittedAt, ValidFrom: e.ValidFrom, ValidUntil: timestamptzVal(e.ValidUntil),
	}))
}

func (t *pgMatterTx) WithdrawEvidence(ctx context.Context, id matter.EvidenceID, at time.Time) error {
	rows, err := t.q.WithdrawEvidence(ctx, mcsqlc.WithdrawEvidenceParams{ID: id.String(), WithdrawnAt: timestamptzVal(&at)})
	if err != nil {
		return mapMatterError(err)
	}
	if rows == 0 {
		return fmt.Errorf("withdraw evidence: %w", port.ErrVersionConflict)
	}
	return nil
}

func (t *pgMatterTx) InsertClaim(ctx context.Context, k matter.Claim) error {
	return mapMatterError(t.q.InsertClaim(ctx, mcsqlc.InsertClaimParams{
		ID: k.ID.String(), MatterID: k.MatterID.String(), EvidenceID: k.EvidenceID.String(), EvidenceSubmitter: k.EvidenceSubmitter.String(),
		CriterionID: k.CriterionID.String(), CriterionRevision: k.CriterionRev, ClaimedBy: k.ClaimedBy.String(), ClaimedAt: k.ClaimedAt,
	}))
}

func (t *pgMatterTx) InsertAssessment(ctx context.Context, a matter.Assessment) error {
	// Same int32 discipline as every other epoch column: no silent truncation (F-08).
	epoch, err := int32Checked(a.SubjectEpoch)
	if err != nil {
		return err
	}
	return mapMatterError(t.q.InsertAssessment(ctx, mcsqlc.InsertAssessmentParams{
		ID: a.ID.String(), MatterID: a.MatterID.String(), ClaimID: a.ClaimID.String(), SubjectID: a.SubjectID.String(),
		SubjectEpoch: epoch, Verdict: string(a.Verdict), ReviewerID: a.Reviewer.String(), Rationale: a.Rationale,
		AssessedVersionID: optVersion(a.AssessedVersionID), EffectiveUntil: timestamptzVal(a.EffectiveUntil), RecordedAt: a.RecordedAt,
		EvidenceSubmitter: a.EvidenceSubmitter.String(), Claimant: a.Claimant.String(),
	}))
}

func (t *pgMatterTx) SupersedeAssessment(ctx context.Context, id, by matter.AssessmentID) error {
	rows, err := t.q.SupersedeAssessment(ctx, mcsqlc.SupersedeAssessmentParams{ID: id.String(), SupersededBy: uuidString(by.String())})
	if err != nil {
		return mapMatterError(err)
	}
	if rows == 0 {
		return fmt.Errorf("supersede assessment: %w", port.ErrVersionConflict)
	}
	return nil
}

func (t *pgMatterTx) RevokeAssessment(ctx context.Context, id matter.AssessmentID, at time.Time, by matter.ActorID, reason string) error {
	rows, err := t.q.RevokeAssessment(ctx, mcsqlc.RevokeAssessmentParams{
		ID: id.String(), RevokedAt: timestamptzVal(&at), RevokedBy: uuidString(by.String()), RevokedReason: pgText(reason),
	})
	if err != nil {
		return mapMatterError(err)
	}
	if rows == 0 {
		return fmt.Errorf("revoke assessment: %w", port.ErrVersionConflict)
	}
	return nil
}

func (t *pgMatterTx) InsertDispute(ctx context.Context, d matter.Dispute) error {
	return mapMatterError(t.q.InsertDispute(ctx, mcsqlc.InsertDisputeParams{
		ID: d.ID.String(), MatterID: d.MatterID.String(), AssessmentID: d.AssessmentID.String(), RaisedBy: d.RaisedBy.String(), Reason: d.Reason, RaisedAt: d.RaisedAt,
	}))
}

func (t *pgMatterTx) ResolveDispute(ctx context.Context, id matter.DisputeID, at time.Time, by matter.ActorID, resolution string) error {
	rows, err := t.q.ResolveDispute(ctx, mcsqlc.ResolveDisputeParams{
		ID: id.String(), ResolvedAt: timestamptzVal(&at), ResolvedBy: uuidString(by.String()), Resolution: pgText(resolution),
	})
	if err != nil {
		return mapMatterError(err)
	}
	if rows == 0 {
		return fmt.Errorf("resolve dispute: %w", port.ErrVersionConflict)
	}
	return nil
}

func (t *pgMatterTx) SetVerifier(ctx context.Context, user matter.ActorID, active bool, by matter.ActorID, at time.Time) error {
	return mapMatterError(t.q.UpsertVerifier(ctx, mcsqlc.UpsertVerifierParams{
		MatterID: t.header.MatterID.String(), UserID: user.String(), Active: active, DesignatedBy: by.String(), DesignatedAt: at,
	}))
}
