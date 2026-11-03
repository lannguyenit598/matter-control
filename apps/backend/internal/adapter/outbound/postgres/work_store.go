package postgres

// W2 PostgreSQL adapter: the work graph (typed items, edges, workstreams, parties, milestones)
// inside the locked matter transaction and the read snapshot. SaveWorkItem and the milestone/party
// saves are compare-and-set on their revision; the matter row lock already serializes commands.

import (
	"context"
	"encoding/json"
	"fmt"

	"github.com/jackc/pgx/v5/pgtype"

	"leonx.me/matter-control/internal/adapter/outbound/postgres/mcsqlc"
	"leonx.me/matter-control/internal/core/domain/matter"
	"leonx.me/matter-control/internal/core/port"
)

var (
	_ port.WorkGraphTx       = (*pgMatterTx)(nil)
	_ port.WorkGraphSnapshot = (*pgSnapshot)(nil)
)

// ---------- graph load ----------

func loadWorkGraph(ctx context.Context, q *mcsqlc.Queries, m matter.MatterID) (matter.WorkGraph, error) {
	g := matter.WorkGraph{MatterID: m}
	reqs, err := q.ListRequirementsOfMatter(ctx, m.String())
	if err != nil {
		return g, mapMatterError(err)
	}
	for _, r := range reqs {
		it, err := requirementWorkItem(m, r)
		if err != nil {
			return g, err
		}
		g.Items = append(g.Items, it)
	}
	acts, err := q.ListActionsOfMatter(ctx, m.String())
	if err != nil {
		return g, mapMatterError(err)
	}
	for _, a := range acts {
		it, err := actionWorkItem(m, a)
		if err != nil {
			return g, err
		}
		g.Items = append(g.Items, it)
	}
	edges, err := q.ListEdgesOfMatter(ctx, m.String())
	if err != nil {
		return g, mapMatterError(err)
	}
	for _, e := range edges {
		g.Edges = append(g.Edges, matter.Edge{ID: e.ID, MatterID: m, Source: matter.NodeID(e.SourceID), Target: matter.NodeID(e.TargetID), Gate: matter.GateKind(e.Gate)})
	}
	wss, err := q.ListWorkstreamsOfMatter(ctx, m.String())
	if err != nil {
		return g, mapMatterError(err)
	}
	for _, w := range wss {
		g.Workstreams = append(g.Workstreams, matter.Workstream{ID: matter.WorkstreamID(w.ID), MatterID: m, Name: w.Name, Revision: w.Revision})
	}
	parties, err := q.ListPartiesOfMatter(ctx, m.String())
	if err != nil {
		return g, mapMatterError(err)
	}
	for _, p := range parties {
		g.Parties = append(g.Parties, matter.Party{ID: matter.PartyID(p.ID), MatterID: m, Name: p.Name, Kind: p.Kind, Contact: p.Contact, Notes: p.Notes, Revision: p.Revision})
	}
	mss, err := q.ListMilestonesOfMatter(ctx, m.String())
	if err != nil {
		return g, mapMatterError(err)
	}
	prereqs, err := q.ListMilestonePrerequisitesOfMatter(ctx, m.String())
	if err != nil {
		return g, mapMatterError(err)
	}
	for _, ms := range mss {
		mm := matter.Milestone{ID: matter.MilestoneID(ms.ID), MatterID: m, Name: ms.Name, DueAt: timestamptzPtr(ms.DueAt), Critical: ms.Critical, Revision: ms.Revision}
		for _, p := range prereqs {
			if p.MilestoneID == ms.ID {
				mm.Prerequisites = append(mm.Prerequisites, matter.NodeID(p.RequirementID))
			}
		}
		g.Milestones = append(g.Milestones, mm)
	}
	g.Evidence, err = loadEvidence(ctx, q, m)
	if err != nil {
		return g, err
	}
	g.Filing, err = loadFilings(ctx, q, m)
	if err != nil {
		return g, err
	}
	g.Context, err = loadContext(ctx, q, m)
	if err != nil {
		return g, err
	}
	return g, nil
}

type reasonDTO struct {
	Edge   string `json:"edge"`
	Source string `json:"source"`
	Gate   string `json:"gate"`
	Code   string `json:"code"`
}

func encodeReasons(rs []matter.GateReason) ([]byte, error) {
	out := make([]reasonDTO, len(rs))
	for i, r := range rs {
		out[i] = reasonDTO{Edge: r.EdgeID, Source: r.Source.String(), Gate: string(r.Gate), Code: string(r.Code)}
	}
	b, err := json.Marshal(out)
	if err != nil {
		return nil, fmt.Errorf("matter store: encode gate reasons: %w", err)
	}
	return b, nil
}

func decodeReasons(b []byte) ([]matter.GateReason, error) {
	var in []reasonDTO
	if len(b) > 0 {
		if err := json.Unmarshal(b, &in); err != nil {
			return nil, fmt.Errorf("matter store: decode gate reasons: %w", err)
		}
	}
	out := make([]matter.GateReason, len(in))
	for i, r := range in {
		out[i] = matter.GateReason{EdgeID: r.Edge, Source: matter.NodeID(r.Source), Gate: matter.GateKind(r.Gate), Code: matter.GateReasonCode(r.Code)}
	}
	return out, nil
}

func uuidStr(u pgtype.UUID) *string {
	if !u.Valid {
		return nil
	}
	s := uuidToString(u)
	return &s
}

func textPtr(t pgtype.Text) *string {
	if !t.Valid {
		return nil
	}
	s := t.String
	return &s
}

// workItemBase fills the columns both typed rows share.
func workItemBase(m matter.MatterID, kind matter.NodeKind, id, title, outcome string, owner pgtype.UUID, due pgtype.Timestamptz,
	ws pgtype.UUID, exec, dep string, reasons []byte, epoch int32, epochAt, completed, cancelled pgtype.Timestamptz,
	waitParty pgtype.UUID, waitCond, escalation pgtype.Text, revision int64,
) (matter.WorkItem, error) {
	rs, err := decodeReasons(reasons)
	if err != nil {
		return matter.WorkItem{}, err
	}
	it := matter.WorkItem{
		ID: matter.NodeID(id), Kind: kind, MatterID: m, Title: title, Outcome: outcome,
		Execution: matter.ExecutionState(exec), Dependency: matter.DependencyState(dep), DependencyReasons: rs,
		ProofEpoch: int64(epoch), ProofEpochOpenedAt: timestamptzPtr(epochAt),
		DueAt: timestamptzPtr(due), CompletedAt: timestamptzPtr(completed), CancelledAt: timestamptzPtr(cancelled),
		WaitingCondition: textPtr(waitCond), EscalationReason: textPtr(escalation), Revision: revision,
	}
	if s := uuidStr(owner); s != nil {
		a := matter.ActorID(*s)
		it.OwnerActorID = &a
	}
	if s := uuidStr(ws); s != nil {
		w := matter.WorkstreamID(*s)
		it.WorkstreamID = &w
	}
	if s := uuidStr(waitParty); s != nil {
		p := matter.PartyID(*s)
		it.WaitingPartyID = &p
	}
	return it, nil
}

func requirementWorkItem(m matter.MatterID, r mcsqlc.ListRequirementsOfMatterRow) (matter.WorkItem, error) {
	it, err := workItemBase(m, matter.NodeRequirement, r.ID, r.Title, r.Outcome, r.OwnerUserID, r.DueAt, r.WorkstreamID,
		r.ExecutionState, r.DependencyState, r.DependencyReasons, r.ProofEpoch, r.ProofEpochOpenedAt, r.CompletedAt,
		r.CancelledAt, r.WaitingPartyID, r.WaitingCondition, r.CriticalEscalationReason, r.Revision)
	if err != nil {
		return it, err
	}
	it.ImportedVerificationClaim = textPtr(r.ImportedVerificationClaim)
	it.ProofRequired = true
	it.Verification = matter.VerificationState(r.VerificationState)
	it.Applicability = matter.VerificationApplicability(r.VerificationApplicability)
	it.ApplicabilityReason = textPtr(r.ApplicabilityReason)
	return it, nil
}

func actionWorkItem(m matter.MatterID, a mcsqlc.ListActionsOfMatterRow) (matter.WorkItem, error) {
	it, err := workItemBase(m, matter.NodeAction, a.ID, a.Title, a.Outcome, a.OwnerUserID, a.DueAt, a.WorkstreamID,
		a.ExecutionState, a.DependencyState, a.DependencyReasons, a.ProofEpoch, a.ProofEpochOpenedAt, a.CompletedAt,
		a.CancelledAt, a.WaitingPartyID, a.WaitingCondition, a.CriticalEscalationReason, a.Revision)
	if err != nil {
		return it, err
	}
	it.ImportedVerificationClaim = textPtr(a.ImportedVerificationClaim)
	it.ProofRequired = a.ProofRequired
	it.Verification = matter.VerificationState(a.VerificationState.String)
	it.Applicability = matter.VerificationApplicability(a.VerificationApplicability.String)
	it.ApplicabilityReason = textPtr(a.ApplicabilityReason)
	return it, nil
}

// ---------- transaction writes ----------

func (t *pgMatterTx) LoadGraph(ctx context.Context) (matter.WorkGraph, error) {
	return loadWorkGraph(ctx, t.q, t.header.MatterID)
}

func (t *pgMatterTx) InsertAction(ctx context.Context, it matter.WorkItem) error {
	if err := t.InsertNode(ctx, matter.Node{ID: it.ID, MatterID: it.MatterID, Kind: matter.NodeAction}); err != nil {
		return err
	}
	return mapMatterError(t.q.InsertAction(ctx, mcsqlc.InsertActionParams{ID: it.ID.String(), MatterID: it.MatterID.String(), Title: it.Title, Outcome: it.Outcome}))
}

func optUUID(id *string) pgtype.UUID {
	if id == nil {
		return pgtype.UUID{}
	}
	return uuidString(*id)
}

func optString(p *string) pgtype.Text {
	if p == nil {
		return pgtype.Text{}
	}
	return pgtype.Text{String: *p, Valid: true}
}

func (t *pgMatterTx) SaveWorkItem(ctx context.Context, it matter.WorkItem, expectedRevision int64) error {
	reasons, err := encodeReasons(it.DependencyReasons)
	if err != nil {
		return err
	}
	epoch, err := int32Checked(it.ProofEpoch)
	if err != nil {
		return err
	}
	var owner, ws, party *string
	if it.OwnerActorID != nil {
		s := it.OwnerActorID.String()
		owner = &s
	}
	if it.WorkstreamID != nil {
		s := it.WorkstreamID.String()
		ws = &s
	}
	if it.WaitingPartyID != nil {
		s := it.WaitingPartyID.String()
		party = &s
	}
	var rows int64
	if it.Kind == matter.NodeAction {
		rows, err = t.q.UpdateActionWork(ctx, mcsqlc.UpdateActionWorkParams{
			ID: it.ID.String(), ExpectedRevision: expectedRevision, Title: it.Title, Outcome: it.Outcome,
			ImportedVerificationClaim: optString(it.ImportedVerificationClaim),
			OwnerUserID:               optUUID(owner), DueAt: timestamptzVal(it.DueAt), WorkstreamID: optUUID(ws),
			ExecutionState: string(it.Execution), DependencyState: string(it.Dependency), DependencyReasons: reasons,
			VerificationState: textOf(string(it.Verification)), VerificationApplicability: textOf(string(it.Applicability)),
			ApplicabilityReason: optString(it.ApplicabilityReason), ProofEpoch: epoch, ProofEpochOpenedAt: timestamptzVal(it.ProofEpochOpenedAt),
			CompletedAt: timestamptzVal(it.CompletedAt), CancelledAt: timestamptzVal(it.CancelledAt),
			WaitingPartyID: optUUID(party), WaitingCondition: optString(it.WaitingCondition), CriticalEscalationReason: optString(it.EscalationReason),
		})
	} else {
		rows, err = t.q.UpdateRequirementWork(ctx, mcsqlc.UpdateRequirementWorkParams{
			ID: it.ID.String(), ExpectedRevision: expectedRevision, Title: it.Title, Outcome: it.Outcome,
			ImportedVerificationClaim: optString(it.ImportedVerificationClaim),
			OwnerUserID:               optUUID(owner), DueAt: timestamptzVal(it.DueAt), WorkstreamID: optUUID(ws),
			ExecutionState: string(it.Execution), DependencyState: string(it.Dependency), DependencyReasons: reasons,
			VerificationState: string(it.Verification), VerificationApplicability: string(it.Applicability),
			ApplicabilityReason: optString(it.ApplicabilityReason), ProofEpoch: epoch, ProofEpochOpenedAt: timestamptzVal(it.ProofEpochOpenedAt),
			CompletedAt: timestamptzVal(it.CompletedAt), CancelledAt: timestamptzVal(it.CancelledAt),
			WaitingPartyID: optUUID(party), WaitingCondition: optString(it.WaitingCondition), CriticalEscalationReason: optString(it.EscalationReason),
		})
	}
	if err != nil {
		return mapMatterError(err)
	}
	if rows == 0 {
		return fmt.Errorf("work item update: %w", port.ErrVersionConflict)
	}
	return nil
}

func textOf(s string) pgtype.Text {
	if s == "" {
		return pgtype.Text{}
	}
	return pgtype.Text{String: s, Valid: true}
}

func (t *pgMatterTx) InsertEdge(ctx context.Context, e matter.Edge) error {
	return mapMatterError(t.q.InsertEdge(ctx, mcsqlc.InsertEdgeParams{
		ID: e.ID, MatterID: e.MatterID.String(), SourceID: e.Source.String(), TargetID: e.Target.String(), Gate: string(e.Gate),
	}))
}

func (t *pgMatterTx) DeleteEdge(ctx context.Context, id string) error {
	rows, err := t.q.DeleteEdge(ctx, id)
	if err != nil {
		return mapMatterError(err)
	}
	if rows == 0 {
		return port.ErrNotFound
	}
	return nil
}

func (t *pgMatterTx) InsertWorkstream(ctx context.Context, w matter.Workstream) error {
	return mapMatterError(t.q.InsertWorkstream(ctx, mcsqlc.InsertWorkstreamParams{ID: w.ID.String(), MatterID: w.MatterID.String(), Name: w.Name, Revision: w.Revision}))
}

func (t *pgMatterTx) InsertParty(ctx context.Context, p matter.Party) error {
	return mapMatterError(t.q.InsertParty(ctx, mcsqlc.InsertPartyParams{
		ID: p.ID.String(), MatterID: p.MatterID.String(), Name: p.Name, Kind: p.Kind, Contact: p.Contact, Notes: p.Notes, Revision: p.Revision,
	}))
}

func (t *pgMatterTx) SaveParty(ctx context.Context, p matter.Party, expectedRevision int64) error {
	rows, err := t.q.UpdateParty(ctx, mcsqlc.UpdatePartyParams{ID: p.ID.String(), Name: p.Name, Kind: p.Kind, Contact: p.Contact, Notes: p.Notes, ExpectedRevision: expectedRevision})
	if err != nil {
		return mapMatterError(err)
	}
	if rows == 0 {
		return fmt.Errorf("party update: %w", port.ErrVersionConflict)
	}
	return nil
}

func (t *pgMatterTx) InsertMilestone(ctx context.Context, m matter.Milestone) error {
	return mapMatterError(t.q.InsertMilestone(ctx, mcsqlc.InsertMilestoneParams{
		ID: m.ID.String(), MatterID: m.MatterID.String(), Name: m.Name, DueAt: timestamptzVal(m.DueAt), Critical: m.Critical, Revision: m.Revision,
	}))
}

func (t *pgMatterTx) SaveMilestone(ctx context.Context, m matter.Milestone, expectedRevision int64) error {
	rows, err := t.q.UpdateMilestone(ctx, mcsqlc.UpdateMilestoneParams{
		ID: m.ID.String(), Name: m.Name, DueAt: timestamptzVal(m.DueAt), Critical: m.Critical, ExpectedRevision: expectedRevision,
	})
	if err != nil {
		return mapMatterError(err)
	}
	if rows == 0 {
		return fmt.Errorf("milestone update: %w", port.ErrVersionConflict)
	}
	if err := t.q.DeleteMilestonePrerequisites(ctx, m.ID.String()); err != nil {
		return mapMatterError(err)
	}
	for _, id := range m.Prerequisites {
		if err := t.q.InsertMilestonePrerequisite(ctx, mcsqlc.InsertMilestonePrerequisiteParams{
			MilestoneID: m.ID.String(), MatterID: m.MatterID.String(), RequirementID: id.String(),
		}); err != nil {
			return mapMatterError(err)
		}
	}
	return nil
}

func (t *pgMatterTx) AppendWorkEvent(ctx context.Context, e matter.WorkEvent) error {
	var cause pgtype.Int8
	if e.CauseSeq != nil {
		cause = pgtype.Int8{Int64: *e.CauseSeq, Valid: true}
	}
	return mapMatterError(t.q.InsertWorkEvent(ctx, mcsqlc.InsertWorkEventParams{
		MatterID: e.MatterID.String(), Seq: e.Seq, ID: e.ID, Type: e.Type, ActorID: uuidString(e.Actor.String()),
		TargetKind: e.TargetKind, TargetID: e.TargetID, EffectiveAt: e.EffectiveAt, RecordedAt: e.RecordedAt,
		CauseSeq: cause, Reason: pgText(e.Reason), Before: jsonOrNull(e.Before), After: jsonOrNull(e.After),
	}))
}

// jsonOrNull maps an absent payload to SQL NULL (the columns are nullable JSONB).
func jsonOrNull(b []byte) []byte {
	if len(b) == 0 {
		return nil
	}
	return b
}

// ---------- snapshot reads ----------

func (s *pgSnapshot) LoadGraph(ctx context.Context, m matter.MatterID) (matter.WorkGraph, error) {
	if _, err := s.q.GetMatterHeader(ctx, m.String()); err != nil {
		return matter.WorkGraph{}, mapMatterError(err)
	}
	return loadWorkGraph(ctx, s.q, m)
}

func (s *pgSnapshot) MattersOf(ctx context.Context, actor matter.ActorID) ([]matter.MatterID, error) {
	ids, err := s.q.ListMattersOfActor(ctx, actor.String())
	if err != nil {
		return nil, mapMatterError(err)
	}
	out := make([]matter.MatterID, len(ids))
	for i, id := range ids {
		out[i] = matter.MatterID(id)
	}
	return out, nil
}
