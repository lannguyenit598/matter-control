package service

import (
	"context"
	"fmt"
	"sort"
	"strings"
	"time"

	"leonx.me/matter-control/internal/core/domain/matter"
	"leonx.me/matter-control/internal/core/policy"
	"leonx.me/matter-control/internal/core/port"
)

// FilingService implements the W4 regulatory-filing use cases on the work spine: a filing is an
// ACTION work item whose stage, cycles, exact submissions and observations are recorded here. It
// records what happened; it files nothing (RULE-012).
type FilingService struct{ w *WorkService }

var _ port.FilingService = (*FilingService)(nil)

func NewFilingService(w *WorkService) *FilingService { return &FilingService{w: w} }

func ftx(env *workEnv) (port.FilingTx, error) {
	f, ok := env.g.(port.FilingTx)
	if !ok {
		return nil, fmt.Errorf("matter transaction does not support filings")
	}
	return f, nil
}

type filingCtx struct {
	stored, g matter.WorkGraph
	it        matter.WorkItem
	f         matter.Filing
	tx        port.FilingTx
}

// load reads the filing under the matter lock and applies the revision guard.
func (s *FilingService) load(ctx context.Context, env *workEnv, rawID string, expected int64) (filingCtx, error) {
	var c filingCtx
	var err error
	if c.tx, err = ftx(env); err != nil {
		return c, err
	}
	if c.stored, c.g, err = s.w.loadGraphs(ctx, env); err != nil {
		return c, err
	}
	if c.it, err = findItem(c.g, rawID); err != nil {
		return c, err
	}
	f, ok := c.g.Filing.Of(c.it.ID)
	if !ok {
		return c, port.ErrNotFound
	}
	c.f = f
	if err := casCheck(c.it, expected); err != nil {
		return c, err
	}
	return c, nil
}

// commit persists the changed item(s) with causal events and always bumps the filing item's
// revision, so a stale screen cannot act on a filing whose stage moved.
func (s *FilingService) commit(ctx context.Context, env *workEnv, c filingCtx, next matter.WorkItem, cause int64) (matter.WorkGraph, error) {
	updated := cloneGraph(c.g)
	setItem(&updated, next)
	applyDerived(&updated, env.tCmd)
	if err := s.w.persist(ctx, env, c.stored, updated, next.ID, cause); err != nil {
		return updated, err
	}
	prev, _ := c.stored.Item(next.ID)
	final, _ := updated.Item(next.ID)
	rev := prev.Revision
	if sameItem(prev, final) {
		if err := env.g.SaveWorkItem(ctx, final, prev.Revision); err != nil {
			return updated, err
		}
	}
	setRevision(&updated, next.ID, rev+1)
	final, _ = updated.Item(next.ID)
	if _, err := env.emit(ctx, "filing.work_changed", "FILING", next.ID.String(), "", itemSnapshot(prev), itemSnapshot(final), &cause); err != nil {
		return updated, err
	}
	return updated, nil
}

func setRevision(g *matter.WorkGraph, id matter.NodeID, rev int64) {
	for i := range g.Items {
		if g.Items[i].ID == id {
			g.Items[i].Revision = rev
		}
	}
}

func (s *FilingService) detail(g matter.WorkGraph, f matter.Filing, asOf time.Time) matter.FilingDetail {
	it, _ := g.Item(f.ItemID)
	cycles, subs, obs := g.Filing.For(f.ItemID)
	d := matter.FilingDetail{
		View: matter.ViewOf(it, asOf, matter.CriticalChain(g)), Filing: f, Cycles: cycles, Submissions: subs, Observations: obs, AsOf: asOf,
		OutcomeVerification: matter.OutcomeVerification(it, g.Evidence, asOf),
	}
	if !it.Terminal() {
		d.Next = matter.NextStages(f.Stage)
	}
	return d
}

func (s *FilingService) nextSeq(g matter.WorkGraph, id matter.NodeID) int {
	_, _, obs := g.Filing.For(id)
	return len(obs) + 1
}

func idsOf[T ~string](raw []string, mk func(string) (T, error)) ([]T, error) {
	out := make([]T, 0, len(raw))
	for _, r := range raw {
		v, err := mk(r)
		if err != nil {
			return nil, err
		}
		out = append(out, v)
	}
	return out, nil
}

func evidenceID(raw string) (matter.EvidenceID, error) {
	id, err := matter.NewNodeID(raw) // same UUID rules as every record id
	return matter.EvidenceID(id.String()), err
}

func versionID(raw string) (matter.VersionID, error) {
	id, err := matter.NewNodeID(raw)
	return matter.VersionID(id.String()), err
}

// ---------- commands ----------

func (s *FilingService) CreateFiling(ctx context.Context, cmd port.CreateFilingCmd) (matter.CreatedResult, error) {
	actor, key, hash, err := parseReceiptInputs(cmd.ActorID, cmd.IdempotencyKey, cmd.RequestHash)
	if err != nil {
		return matter.CreatedResult{}, err
	}
	matterID, err := matter.NewMatterID(cmd.MatterID)
	if err != nil {
		return matter.CreatedResult{}, err
	}
	nodeID, err := matter.NewNodeID(s.w.ids.NewRecordID())
	if err != nil {
		return matter.CreatedResult{}, fmt.Errorf("generate filing id: %w", err)
	}
	item, err := matter.NewAction(nodeID, matterID, cmd.Title, cmd.Outcome)
	if err != nil {
		return matter.CreatedResult{}, err
	}
	reqID, err := matter.NewNodeID(cmd.RequirementID)
	if err != nil {
		return matter.CreatedResult{}, err
	}
	var out matter.CreatedResult
	err = s.w.execute(ctx, cmd.ActorID, cmd.MatterID, "CREATE_FILING", policy.DecideCreateRequirement, func(env *workEnv) error {
		tx, err := ftx(env)
		if err != nil {
			return err
		}
		out, err = s.w.createdReceipt(ctx, env, actor, key, hash, func() (matter.CreatedResult, error) {
			g, err := env.g.LoadGraph(ctx)
			if err != nil {
				return matter.CreatedResult{}, err
			}
			if r, ok := g.Item(reqID); !ok || r.Kind != matter.NodeRequirement {
				return matter.CreatedResult{}, rejected("unknown-requirement", "a filing serves a Requirement of this matter")
			}
			party := matter.PartyID(cmd.AuthorityPartyID)
			known := false
			for _, p := range g.Parties {
				known = known || p.ID == party
			}
			if !known {
				return matter.CreatedResult{}, rejected("unknown-party", "the authority must be an external party of this matter")
			}
			if cmd.OwnerID != "" {
				owner, err := matter.NewActorID(cmd.OwnerID)
				if err != nil {
					return matter.CreatedResult{}, err
				}
				if err := ownerMustBeMember(ctx, env, owner); err != nil {
					return matter.CreatedResult{}, err
				}
				item.OwnerActorID = &owner
			}
			if cmd.ProofRequired {
				item.ProofRequired, item.Verification, item.Applicability = true, matter.VerificationUnverified, matter.VerificationRequired
			}
			f := matter.Filing{ItemID: item.ID, MatterID: matterID, RequirementID: reqID, AuthorityPartyID: party, Stage: matter.StageRequirement, CurrentCycle: 1}
			if err := tx.InsertFilingAction(ctx, item, f); err != nil {
				return matter.CreatedResult{}, err
			}
			c1 := matter.FilingCycle{
				ID: env.ids.NewRecordID(), MatterID: matterID, ItemID: item.ID, No: 1, OpenedInEp: 0, OpenedAt: env.tCmd, Owner: item.OwnerActorID,
			}
			if err := tx.InsertCycle(ctx, c1); err != nil {
				return matter.CreatedResult{}, err
			}
			initial := itemSnapshot(item)
			if item.OwnerActorID == nil {
				initial["owner"] = nil
			} // distinguish known unassigned from legacy omitted owner
			initial["requirement"], initial["authority"] = reqID.String(), party.String()
			seq, err := env.emit(ctx, "filing.created", "FILING", item.ID.String(), "", nil, initial, nil)
			return matter.CreatedResult{Kind: "FILING", ID: item.ID.String(), Seq: seq}, err
		})
		return err
	})
	return out, err
}

func obsPayload(o matter.FilingObservation) map[string]any {
	return map[string]any{
		"from": string(o.From), "to": string(o.To), "kind": string(o.Kind), "reference": o.Reference,
		"observedAt": o.ObservedAt.UTC().Format(time.RFC3339Nano), "cycle": o.CycleNo, "proofEpoch": o.ProofEpoch,
		"evidence": strs(o.Evidence),
	}
}

func strs[T ~string](in []T) []string {
	out := make([]string, len(in))
	for i, v := range in {
		out[i] = string(v)
	}
	return out
}

func (s *FilingService) Advance(ctx context.Context, cmd port.AdvanceFilingCmd) (matter.FilingDetail, error) {
	var out matter.FilingDetail
	to := matter.FilingStage(strings.TrimSpace(cmd.To))
	err := s.w.execute(ctx, cmd.ActorID, cmd.MatterID, "ADVANCE_FILING", policy.DecideCreateRequirement, func(env *workEnv) error {
		c, err := s.load(ctx, env, cmd.FilingID, cmd.ExpectedRevision)
		if err != nil {
			return err
		}
		if !to.Valid() {
			return rejected("invalid-stage", "unknown filing stage")
		}
		in := matter.AdvanceInput{
			To: to, Reference: cmd.Reference, RequestRef: cmd.RequestRef, ExternalRefs: cmd.ExternalRefs, Reason: cmd.Reason,
			Actor: env.actor, Role: env.role, AsOf: env.tCmd,
		}
		if in.EvidenceIDs, err = idsOf(cmd.EvidenceIDs, evidenceID); err != nil {
			return err
		}
		if in.VersionIDs, err = idsOf(cmd.VersionIDs, versionID); err != nil {
			return err
		}
		if cmd.ObservedAt != "" {
			if in.ObservedAt, err = parseInstant(cmd.ObservedAt, "observedAt"); err != nil {
				return err
			}
		}
		if cmd.CycleDue != "" {
			due, err := parseInstant(cmd.CycleDue, "cycleDue")
			if err != nil {
				return err
			}
			in.CycleDue = &due
		}
		if cmd.CycleOwnerID != "" {
			owner, err := matter.NewActorID(cmd.CycleOwnerID)
			if err != nil {
				return err
			}
			if err := ownerMustBeMember(ctx, env, owner); err != nil {
				return err
			}
			in.CycleOwner = &owner
		}
		dec, err := matter.DecideAdvance(c.f, c.it, c.g.Evidence, c.g.Filing, in)
		if err != nil {
			return err
		}
		dec.Observation.ID, dec.Observation.Seq = env.ids.NewRecordID(), s.nextSeq(c.g, c.it.ID)
		if err := c.tx.SaveFiling(ctx, dec.Filing); err != nil {
			return err
		}
		if dec.Submission != nil {
			dec.Submission.ID = env.ids.NewRecordID()
			if err := c.tx.InsertSubmission(ctx, *dec.Submission); err != nil {
				return err
			}
			if err := c.tx.MarkCycleSubmitted(ctx, c.it.ID, dec.CloseCycle, dec.Submission.ID, dec.Submission.SubmittedAt); err != nil {
				return err
			}
		}
		if dec.NewCycle != nil {
			dec.NewCycle.ID = env.ids.NewRecordID()
			if err := c.tx.InsertCycle(ctx, *dec.NewCycle); err != nil {
				return err
			}
		}
		if err := c.tx.InsertObservation(ctx, dec.Observation); err != nil {
			return err
		}
		seq, err := env.emit(ctx, "filing.stage_changed", "FILING", c.it.ID.String(), dec.Observation.Reason,
			map[string]any{"stage": string(c.f.Stage)}, obsPayload(dec.Observation), nil)
		if err != nil {
			return err
		}
		updated, err := s.commit(ctx, env, c, dec.Item, seq)
		if err != nil {
			return err
		}
		updated.Filing = reflect(updated.Filing, dec)
		out = s.detail(updated, dec.Filing, env.tCmd)
		return nil
	})
	return out, err
}

// reflect applies an accepted decision to the in-memory filing set so the response shows the
// state that was just committed without a second read.
func reflect(fs matter.FilingSet, dec matter.AdvanceDecision) matter.FilingSet {
	out := fs
	out.Filings = append([]matter.Filing(nil), fs.Filings...)
	for i := range out.Filings {
		if out.Filings[i].ItemID == dec.Filing.ItemID {
			out.Filings[i] = dec.Filing
		}
	}
	out.Observations = append(append([]matter.FilingObservation(nil), fs.Observations...), dec.Observation)
	if dec.NewCycle != nil {
		out.Cycles = append(append([]matter.FilingCycle(nil), fs.Cycles...), *dec.NewCycle)
	}
	if dec.Submission != nil {
		out.Submissions = append(append([]matter.FilingSubmission(nil), fs.Submissions...), *dec.Submission)
		out.Cycles = append([]matter.FilingCycle(nil), out.Cycles...)
		for i := range out.Cycles {
			if out.Cycles[i].ItemID == dec.Filing.ItemID && out.Cycles[i].No == dec.CloseCycle {
				t := dec.Submission.SubmittedAt
				out.Cycles[i].SubmittedAt, out.Cycles[i].SubmissionID = &t, dec.Submission.ID
			}
		}
	}
	return out
}

func (s *FilingService) RecordNegative(ctx context.Context, cmd port.RecordNegativeCmd) (matter.FilingDetail, error) {
	var out matter.FilingDetail
	err := s.w.execute(ctx, cmd.ActorID, cmd.MatterID, "RECORD_FILING_NEGATIVE", policy.DecideCreateRequirement, func(env *workEnv) error {
		c, err := s.load(ctx, env, cmd.FilingID, cmd.ExpectedRevision)
		if err != nil {
			return err
		}
		ev, err := idsOf(cmd.EvidenceIDs, evidenceID)
		if err != nil {
			return err
		}
		var at time.Time
		if cmd.ObservedAt != "" {
			if at, err = parseInstant(cmd.ObservedAt, "observedAt"); err != nil {
				return err
			}
		}
		f, obs, err := matter.DecideNegative(c.f, c.it, c.g.Evidence, matter.NegativeOutcome(strings.TrimSpace(cmd.Outcome)), ev, cmd.Reference, at, env.actor, env.tCmd)
		if err != nil {
			return err
		}
		obs.ID, obs.Seq = env.ids.NewRecordID(), s.nextSeq(c.g, c.it.ID)
		if err := c.tx.SaveFiling(ctx, f); err != nil {
			return err
		}
		if err := c.tx.InsertObservation(ctx, obs); err != nil {
			return err
		}
		seq, err := env.emit(ctx, "filing.negative_outcome", "FILING", c.it.ID.String(), "", nil, obsPayload(obs), nil)
		if err != nil {
			return err
		}
		updated, err := s.commit(ctx, env, c, c.it, seq)
		if err != nil {
			return err
		}
		updated.Filing = reflect(updated.Filing, matter.AdvanceDecision{Filing: f, Observation: obs})
		setItem(&updated, withNegative(mustItem(updated, c.it.ID), f, true))
		out = s.detail(updated, f, env.tCmd)
		return nil
	})
	return out, err
}

func mustItem(g matter.WorkGraph, id matter.NodeID) matter.WorkItem {
	it, _ := g.Item(id)
	return it
}

func withNegative(it matter.WorkItem, f matter.Filing, _ bool) matter.WorkItem {
	it.NegativeOpen = f.NegativeOpen(it)
	return it
}

// CloseNegative: an owner closes a rejected/withdrawn filing. The linked Requirement is untouched.
func (s *FilingService) CloseNegative(ctx context.Context, cmd port.ReasonedFilingCmd) (matter.FilingDetail, error) {
	return s.ownerStep(ctx, cmd, "CLOSE_FILING_NEGATIVE", func(c filingCtx, env *workEnv) (matter.WorkItem, matter.Filing, matter.FilingObservation, error) {
		if !c.f.NegativeOpen(c.it) {
			return c.it, c.f, matter.FilingObservation{}, rejected("no-negative-outcome", "there is no unresolved rejection or withdrawal to close")
		}
		res, err := matter.DecideTransition(matter.TransitionRequest{Item: c.it, To: matter.ExecutionCancelled, Role: env.role, Reason: cmd.Reason, AsOf: env.tCmd})
		if err != nil {
			return c.it, c.f, matter.FilingObservation{}, err
		}
		return res.Item, c.f, matter.FilingObservation{Kind: matter.ObsCloseNegative, From: c.f.Stage, To: c.f.Stage, Outcome: c.f.NegativeOutcome}, nil
	}, "filing.closed")
}

// Reopen: an owner reopens a closed filing. History stays; the proof epoch advances so earlier
// assessments stop counting and approval needs outcome evidence recorded after this point.
func (s *FilingService) Reopen(ctx context.Context, cmd port.ReasonedFilingCmd) (matter.FilingDetail, error) {
	return s.ownerStep(ctx, cmd, "REOPEN_FILING", func(c filingCtx, env *workEnv) (matter.WorkItem, matter.Filing, matter.FilingObservation, error) {
		if !c.it.Terminal() {
			return c.it, c.f, matter.FilingObservation{}, rejected("not-closed", "only a completed or cancelled filing can be reopened")
		}
		res, err := matter.DecideTransition(matter.TransitionRequest{Item: c.it, To: matter.ExecutionInProgress, Role: env.role, Reason: cmd.Reason, AsOf: env.tCmd})
		if err != nil {
			return c.it, c.f, matter.FilingObservation{}, err
		}
		// Reopening resolves a recorded rejection/withdrawal; it stays in the history.
		nf := c.f
		nf.NegativeOutcome, nf.NegativeEpoch = "", 0
		return res.Item, nf, matter.FilingObservation{Kind: matter.ObsReopen, From: c.f.Stage, To: c.f.Stage}, nil
	}, "filing.reopened")
}

func (s *FilingService) ownerStep(
	ctx context.Context, cmd port.ReasonedFilingCmd, op string,
	step func(c filingCtx, env *workEnv) (matter.WorkItem, matter.Filing, matter.FilingObservation, error), event string,
) (matter.FilingDetail, error) {
	var out matter.FilingDetail
	err := s.w.execute(ctx, cmd.ActorID, cmd.MatterID, op, policy.DecideMatterAdmin, func(env *workEnv) error {
		c, err := s.load(ctx, env, cmd.FilingID, cmd.ExpectedRevision)
		if err != nil {
			return err
		}
		if strings.TrimSpace(cmd.Reason) == "" {
			return rejected("reason-required", "a reason is required")
		}
		next, nf, obs, err := step(c, env)
		if err != nil {
			return err
		}
		if nf != c.f {
			if err := c.tx.SaveFiling(ctx, nf); err != nil {
				return err
			}
		}
		obs.MatterID, obs.ItemID, obs.Actor, obs.Reason = c.it.MatterID, c.it.ID, env.actor, strings.TrimSpace(cmd.Reason)
		obs.ObservedAt, obs.RecordedAt, obs.CycleNo, obs.ProofEpoch = env.tCmd, env.tCmd, c.f.CurrentCycle, next.ProofEpoch
		obs.ID, obs.Seq = env.ids.NewRecordID(), s.nextSeq(c.g, c.it.ID)
		if err := c.tx.InsertObservation(ctx, obs); err != nil {
			return err
		}
		seq, err := env.emit(ctx, event, "FILING", c.it.ID.String(), obs.Reason, nil, obsPayload(obs), nil)
		if err != nil {
			return err
		}
		if next.ProofEpoch != c.it.ProofEpoch {
			if _, err := env.emit(ctx, "subject.proof_epoch_advanced", "FILING", c.it.ID.String(), obs.Reason,
				map[string]any{"proofEpoch": c.it.ProofEpoch}, map[string]any{"proofEpoch": next.ProofEpoch}, &seq); err != nil {
				return err
			}
		}
		updated, err := s.commit(ctx, env, c, next, seq)
		if err != nil {
			return err
		}
		updated.Filing = reflect(updated.Filing, matter.AdvanceDecision{Filing: nf, Observation: obs})
		setItem(&updated, withNegative(mustItem(updated, c.it.ID), nf, true))
		out = s.detail(updated, nf, env.tCmd)
		return nil
	})
	return out, err
}

// SetSignatureApplicability records (or withdraws) the OWNER decision that signatures do not apply
// to this filing (F03). It is the only waiver of the signature guard and is independent of the
// outcome-verification flag; the reason, decider and instant are retained on the filing and in
// history. Only an open filing can change.
func (s *FilingService) SetSignatureApplicability(ctx context.Context, cmd port.SetFilingSignatureApplicabilityCmd) (matter.FilingDetail, error) {
	var out matter.FilingDetail
	err := s.w.execute(ctx, cmd.ActorID, cmd.MatterID, "SET_FILING_SIGNATURE_APPLICABILITY", policy.DecideMatterAdmin, func(env *workEnv) error {
		c, err := s.load(ctx, env, cmd.FilingID, cmd.ExpectedRevision)
		if err != nil {
			return err
		}
		reason := strings.TrimSpace(cmd.Reason)
		if reason == "" {
			return rejected("reason-required", "a reason is required")
		}
		if c.it.Terminal() {
			return rejected("filing-closed", "the applicability of a closed filing cannot change")
		}
		if c.f.SignatureNotRequired == cmd.SignatureNotRequired {
			return rejected("applicability-unchanged", "the filing already has this signature applicability")
		}
		nf := c.f
		nf.SignatureNotRequired = cmd.SignatureNotRequired
		nf.SignatureNotRequiredReason, nf.SignatureNotRequiredBy, nf.SignatureNotRequiredAt = "", "", time.Time{}
		if cmd.SignatureNotRequired {
			nf.SignatureNotRequiredReason, nf.SignatureNotRequiredBy, nf.SignatureNotRequiredAt = reason, env.actor, env.tCmd
		}
		if err := c.tx.SaveFiling(ctx, nf); err != nil {
			return err
		}
		seq, err := env.emit(ctx, "filing.signature_applicability_set", "FILING", c.it.ID.String(), reason,
			map[string]any{"signatureNotRequired": c.f.SignatureNotRequired},
			map[string]any{"signatureNotRequired": nf.SignatureNotRequired}, nil)
		if err != nil {
			return err
		}
		updated, err := s.commit(ctx, env, c, c.it, seq)
		if err != nil {
			return err
		}
		updated.Filing.Filings = append([]matter.Filing(nil), updated.Filing.Filings...)
		for i := range updated.Filing.Filings {
			if updated.Filing.Filings[i].ItemID == nf.ItemID {
				updated.Filing.Filings[i] = nf
			}
		}
		out = s.detail(updated, nf, env.tCmd)
		return nil
	})
	return out, err
}

// CorrectObservation appends a correction of an erroneous observation (owner, reason). The
// original stays; a correction cannot invent a missing intermediate stage.
func (s *FilingService) CorrectObservation(ctx context.Context, cmd port.CorrectObservationCmd) (matter.FilingDetail, error) {
	var out matter.FilingDetail
	err := s.w.execute(ctx, cmd.ActorID, cmd.MatterID, "CORRECT_FILING_OBSERVATION", policy.DecideMatterAdmin, func(env *workEnv) error {
		c, err := s.load(ctx, env, cmd.FilingID, cmd.ExpectedRevision)
		if err != nil {
			return err
		}
		if strings.TrimSpace(cmd.Reason) == "" {
			return rejected("reason-required", "a reason is required to correct an observation")
		}
		_, _, all := c.g.Filing.For(c.it.ID)
		var target *matter.FilingObservation
		for i := range all {
			if all[i].ID == cmd.ObservationID {
				target = &all[i]
			}
		}
		if target == nil {
			return port.ErrNotFound
		}
		if target.Kind == matter.ObsCorrection {
			return rejected("correct-the-original", "correct the original observation, not a correction")
		}
		if strings.TrimSpace(cmd.Reference) == "" && cmd.ObservedAt == "" {
			return rejected("nothing-to-correct", "give the corrected reference or time")
		}
		corr := matter.FilingObservation{
			MatterID: c.it.MatterID, ItemID: c.it.ID, Kind: matter.ObsCorrection, From: target.From, To: target.To, CorrectsID: target.ID,
			Reference: strings.TrimSpace(cmd.Reference), ObservedAt: target.ObservedAt, Actor: env.actor, Reason: strings.TrimSpace(cmd.Reason),
			RecordedAt: env.tCmd, CycleNo: target.CycleNo, ProofEpoch: c.it.ProofEpoch, ID: env.ids.NewRecordID(), Seq: s.nextSeq(c.g, c.it.ID),
		}
		if corr.Reference == "" {
			corr.Reference = target.Reference
		}
		if cmd.ObservedAt != "" {
			at, err := parseInstant(cmd.ObservedAt, "observedAt")
			if err != nil {
				return err
			}
			if at.After(env.tCmd) {
				return rejected("observed-in-future", "an observation cannot be dated after the recorded time")
			}
			corr.ObservedAt = at
		}
		if err := c.tx.InsertObservation(ctx, corr); err != nil {
			return err
		}
		seq, err := env.emit(ctx, "filing.observation_corrected", "FILING", c.it.ID.String(), corr.Reason, nil, obsPayload(corr), nil)
		if err != nil {
			return err
		}
		updated, err := s.commit(ctx, env, c, c.it, seq)
		if err != nil {
			return err
		}
		updated.Filing = reflect(updated.Filing, matter.AdvanceDecision{Filing: c.f, Observation: corr})
		out = s.detail(updated, c.f, env.tCmd)
		return nil
	})
	return out, err
}

// ---------- reads ----------

func (s *FilingService) ListFilings(ctx context.Context, q port.MatterListQuery) ([]matter.FilingSummary, error) {
	var out []matter.FilingSummary
	err := s.w.readGraph(ctx, q.ActorID, q.MatterID, func(g matter.WorkGraph, asOf time.Time, _ int64) error {
		chain := matter.CriticalChain(g)
		for _, f := range g.Filing.Filings {
			if it, ok := g.Item(f.ItemID); ok {
				out = append(out, matter.FilingSummary{View: matter.ViewOf(it, asOf, chain), Filing: f, OutcomeVerification: matter.OutcomeVerification(it, g.Evidence, asOf)})
			}
		}
		sort.Slice(out, func(i, j int) bool { return out[i].View.Item.ID < out[j].View.Item.ID })
		return nil
	})
	return out, err
}

func (s *FilingService) GetFiling(ctx context.Context, q port.FilingQuery) (matter.FilingDetail, error) {
	var out matter.FilingDetail
	err := s.w.readGraph(ctx, q.ActorID, q.MatterID, func(g matter.WorkGraph, asOf time.Time, _ int64) error {
		it, err := findItem(g, q.FilingID)
		if err != nil {
			return err
		}
		f, ok := g.Filing.Of(it.ID)
		if !ok {
			return port.ErrNotFound
		}
		out = s.detail(g, f, asOf)
		return nil
	})
	return out, err
}
