package postgres

// W4 PostgreSQL adapter: filing details, cycles, immutable submissions and append-only
// observations, written inside the locked matter transaction and read into the same snapshot as
// the work graph.

import (
	"context"
	"encoding/json"
	"fmt"
	"time"

	"github.com/jackc/pgx/v5/pgtype"

	"github.com/example/userapi/internal/adapter/outbound/postgres/mcsqlc"
	"github.com/example/userapi/internal/core/domain/matter"
	"github.com/example/userapi/internal/core/port"
)

var _ port.FilingTx = (*pgMatterTx)(nil)

func decodeStrings(b []byte) ([]string, error) {
	var out []string
	if len(b) > 0 {
		if err := json.Unmarshal(b, &out); err != nil {
			return nil, fmt.Errorf("matter store: decode string list: %w", err)
		}
	}
	return out, nil
}

func encodeStrings(in []string) []byte {
	if in == nil {
		in = []string{}
	}
	b, _ := json.Marshal(in) // skip: a list of strings always marshals
	return b
}

func actorPtr(u pgtype.UUID) *matter.ActorID {
	if s := uuidStr(u); s != nil {
		a := matter.ActorID(*s)
		return &a
	}
	return nil
}

func loadFilings(ctx context.Context, q *mcsqlc.Queries, m matter.MatterID) (matter.FilingSet, error) {
	var set matter.FilingSet
	details, err := q.ListFilingDetailsOfMatter(ctx, m.String())
	if err != nil {
		return set, mapMatterError(err)
	}
	for _, d := range details {
		f := matter.Filing{
			ItemID: matter.NodeID(d.ItemID), MatterID: m, RequirementID: matter.NodeID(d.RequirementID),
			AuthorityPartyID: matter.PartyID(d.AuthorityPartyID), Stage: matter.FilingStage(d.Stage),
			NegativeEpoch: int64(d.NegativeOutcomeEpoch), CurrentCycle: int(d.CurrentCycle),
		}
		if d.NegativeOutcome.Valid {
			f.NegativeOutcome = matter.NegativeOutcome(d.NegativeOutcome.String)
		}
		f.SignatureNotRequired = d.SignatureNotRequired
		if d.SignatureNotRequired {
			f.SignatureNotRequiredReason = d.SignatureNotRequiredReason.String
			if by := actorPtr(d.SignatureNotRequiredBy); by != nil {
				f.SignatureNotRequiredBy = *by
			}
			if at := timestamptzPtr(d.SignatureNotRequiredAt); at != nil {
				f.SignatureNotRequiredAt = *at
			}
		}
		set.Filings = append(set.Filings, f)
	}
	cycles, err := q.ListFilingCyclesOfMatter(ctx, m.String())
	if err != nil {
		return set, mapMatterError(err)
	}
	for _, c := range cycles {
		fc := matter.FilingCycle{
			ID: c.ID, MatterID: m, ItemID: matter.NodeID(c.ItemID), No: int(c.CycleNo), OpenedInEp: int64(c.OpenedInEpoch),
			RequestRef: c.RequestRef, Owner: actorPtr(c.OwnerID), DueAt: timestamptzPtr(c.DueAt), OpenedAt: c.OpenedAt.UTC(),
			SubmittedAt: timestamptzPtr(c.SubmittedAt),
		}
		if s := uuidStr(c.SubmissionID); s != nil {
			fc.SubmissionID = *s
		}
		set.Cycles = append(set.Cycles, fc)
	}
	subs, err := q.ListFilingSubmissionsOfMatter(ctx, m.String())
	if err != nil {
		return set, mapMatterError(err)
	}
	for _, s := range subs {
		vs, err := decodeStrings(s.VersionIds)
		if err != nil {
			return set, err
		}
		ext, err := decodeStrings(s.ExternalRefs)
		if err != nil {
			return set, err
		}
		fs := matter.FilingSubmission{
			ID: s.ID, MatterID: m, ItemID: matter.NodeID(s.ItemID), CycleNo: int(s.CycleNo), Reference: s.Reference,
			SubmittedAt: s.SubmittedAt.UTC(), ExternalRefs: ext, RecordedBy: matter.ActorID(s.RecordedBy), RecordedAt: s.RecordedAt.UTC(),
		}
		for _, v := range vs {
			fs.Versions = append(fs.Versions, matter.VersionID(v))
		}
		set.Submissions = append(set.Submissions, fs)
	}
	obs, err := q.ListFilingObservationsOfMatter(ctx, m.String())
	if err != nil {
		return set, mapMatterError(err)
	}
	for _, o := range obs {
		ev, err := decodeStrings(o.EvidenceIds)
		if err != nil {
			return set, err
		}
		fo := matter.FilingObservation{
			ID: o.ID, MatterID: m, ItemID: matter.NodeID(o.ItemID), Seq: int(o.Seq), Kind: matter.ObservationKind(o.Kind),
			From: matter.FilingStage(o.FromStage), To: matter.FilingStage(o.ToStage), Reference: o.Reference,
			ObservedAt: o.ObservedAt.UTC(), Actor: matter.ActorID(o.ActorID), Reason: o.Reason,
			Outcome: matter.NegativeOutcome(o.Outcome), RecordedAt: o.RecordedAt.UTC(), CycleNo: int(o.CycleNo), ProofEpoch: int64(o.ProofEpoch),
		}
		if s := uuidStr(o.CorrectsID); s != nil {
			fo.CorrectsID = *s
		}
		for _, e := range ev {
			fo.Evidence = append(fo.Evidence, matter.EvidenceID(e))
		}
		set.Observations = append(set.Observations, fo)
	}
	return set, nil
}

func negText(o matter.NegativeOutcome) pgtype.Text {
	if o == "" {
		return pgtype.Text{}
	}
	return pgtype.Text{String: string(o), Valid: true}
}

func (t *pgMatterTx) InsertFilingAction(ctx context.Context, it matter.WorkItem, f matter.Filing) error {
	if err := t.InsertNode(ctx, matter.Node{ID: it.ID, MatterID: it.MatterID, Kind: matter.NodeAction}); err != nil {
		return err
	}
	var owner pgtype.UUID
	if it.OwnerActorID != nil {
		owner = uuidString(it.OwnerActorID.String())
	}
	if err := t.q.InsertFilingAction(ctx, mcsqlc.InsertFilingActionParams{
		ID: it.ID.String(), MatterID: it.MatterID.String(), Title: it.Title, Outcome: it.Outcome, OwnerUserID: owner, ProofRequired: it.ProofRequired,
	}); err != nil {
		return mapMatterError(err)
	}
	cycle, err := int32Checked(int64(f.CurrentCycle))
	if err != nil {
		return err
	}
	return mapMatterError(t.q.InsertFilingDetails(ctx, mcsqlc.InsertFilingDetailsParams{
		ItemID: it.ID.String(), MatterID: it.MatterID.String(), RequirementID: f.RequirementID.String(), AuthorityPartyID: f.AuthorityPartyID.String(),
		Stage: string(f.Stage), NegativeOutcome: negText(f.NegativeOutcome), CurrentCycle: cycle,
	}))
}

func (t *pgMatterTx) SaveFiling(ctx context.Context, f matter.Filing) error {
	epoch, err := int32Checked(f.NegativeEpoch)
	if err != nil {
		return err
	}
	cycle, err := int32Checked(int64(f.CurrentCycle))
	if err != nil {
		return err
	}
	p := mcsqlc.UpdateFilingDetailsParams{
		ItemID: f.ItemID.String(), Stage: string(f.Stage), NegativeOutcome: negText(f.NegativeOutcome), NegativeOutcomeEpoch: epoch, CurrentCycle: cycle,
		SignatureNotRequired: f.SignatureNotRequired,
	}
	if f.SignatureNotRequired {
		p.SignatureNotRequiredReason = pgtype.Text{String: f.SignatureNotRequiredReason, Valid: true}
		p.SignatureNotRequiredBy = uuidString(f.SignatureNotRequiredBy.String())
		p.SignatureNotRequiredAt = pgtype.Timestamptz{Time: f.SignatureNotRequiredAt, Valid: true}
	}
	rows, err := t.q.UpdateFilingDetails(ctx, p)
	if err != nil {
		return mapMatterError(err)
	}
	if rows == 0 {
		return fmt.Errorf("filing update: %w", port.ErrNotFound)
	}
	return nil
}

func (t *pgMatterTx) InsertCycle(ctx context.Context, c matter.FilingCycle) error {
	no, err := int32Checked(int64(c.No))
	if err != nil {
		return err
	}
	epoch, err := int32Checked(c.OpenedInEp)
	if err != nil {
		return err
	}
	var owner pgtype.UUID
	if c.Owner != nil {
		owner = uuidString(c.Owner.String())
	}
	return mapMatterError(t.q.InsertFilingCycle(ctx, mcsqlc.InsertFilingCycleParams{
		ID: c.ID, MatterID: c.MatterID.String(), ItemID: c.ItemID.String(), CycleNo: no, OpenedInEpoch: epoch, RequestRef: c.RequestRef,
		OwnerID: owner, DueAt: timestamptzVal(c.DueAt), OpenedAt: c.OpenedAt,
	}))
}

func (t *pgMatterTx) MarkCycleSubmitted(ctx context.Context, item matter.NodeID, cycleNo int, submissionID string, at time.Time) error {
	no, err := int32Checked(int64(cycleNo))
	if err != nil {
		return err
	}
	rows, err := t.q.MarkFilingCycleSubmitted(ctx, mcsqlc.MarkFilingCycleSubmittedParams{
		ItemID: item.String(), CycleNo: no, SubmittedAt: timestamptzVal(&at), SubmissionID: uuidString(submissionID),
	})
	if err != nil {
		return mapMatterError(err)
	}
	if rows == 0 {
		return fmt.Errorf("filing cycle update: %w", port.ErrNotFound)
	}
	return nil
}

func (t *pgMatterTx) InsertSubmission(ctx context.Context, s matter.FilingSubmission) error {
	no, err := int32Checked(int64(s.CycleNo))
	if err != nil {
		return err
	}
	vs := make([]string, len(s.Versions))
	for i, v := range s.Versions {
		vs[i] = v.String()
	}
	return mapMatterError(t.q.InsertFilingSubmission(ctx, mcsqlc.InsertFilingSubmissionParams{
		ID: s.ID, MatterID: s.MatterID.String(), ItemID: s.ItemID.String(), CycleNo: no, Reference: s.Reference, SubmittedAt: s.SubmittedAt,
		VersionIds: encodeStrings(vs), ExternalRefs: encodeStrings(s.ExternalRefs), RecordedBy: s.RecordedBy.String(), RecordedAt: s.RecordedAt,
	}))
}

func (t *pgMatterTx) InsertObservation(ctx context.Context, o matter.FilingObservation) error {
	seq, err := int32Checked(int64(o.Seq))
	if err != nil {
		return err
	}
	cyc, err := int32Checked(int64(o.CycleNo))
	if err != nil {
		return err
	}
	epoch, err := int32Checked(o.ProofEpoch)
	if err != nil {
		return err
	}
	var corrects pgtype.UUID
	if o.CorrectsID != "" {
		corrects = uuidString(o.CorrectsID)
	}
	return mapMatterError(t.q.InsertFilingObservation(ctx, mcsqlc.InsertFilingObservationParams{
		ID: o.ID, MatterID: o.MatterID.String(), ItemID: o.ItemID.String(), Seq: seq, Kind: string(o.Kind),
		FromStage: string(o.From), ToStage: string(o.To), Reference: o.Reference, ObservedAt: o.ObservedAt,
		EvidenceIds: encodeStrings(strsOf(o.Evidence)), ActorID: o.Actor.String(), Reason: o.Reason, CorrectsID: corrects,
		Outcome: string(o.Outcome), RecordedAt: o.RecordedAt, CycleNo: cyc, ProofEpoch: epoch,
	}))
}

func strsOf(in []matter.EvidenceID) []string {
	out := make([]string, len(in))
	for i, v := range in {
		out[i] = v.String()
	}
	return out
}
