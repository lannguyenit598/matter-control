package service

// RLF-06 + RLF-07: matter-scoped human intake and matter-scoped versioned guidance. Both are
// ordinary matter-scoped records: they never verify or complete legal work, never escape their
// Matter, and never invent anchors or authorities.

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"strings"
	"time"

	"leonx.me/matter-control/internal/core/domain"
	"leonx.me/matter-control/internal/core/domain/matter"
	"leonx.me/matter-control/internal/core/policy"
	"leonx.me/matter-control/internal/core/port"
)

// ---------- Intake ----------

type Intakes struct{ w *WorkService }

func NewIntakeService(w *WorkService) *Intakes { return &Intakes{w: w} }

func intakeTx(env *workEnv) (port.IntakeTx, error) {
	t, ok := env.tx.(port.IntakeTx)
	if !ok {
		return nil, fmt.Errorf("matter transaction does not support intake")
	}
	return t, nil
}

func intakeSnap(snap port.MatterSnapshot) (port.IntakeSnapshot, error) {
	s, ok := snap.(port.IntakeSnapshot)
	if !ok {
		return nil, fmt.Errorf("snapshot does not support intake")
	}
	return s, nil
}

func intakeTitle(title string) (string, error) {
	n := strings.TrimSpace(title)
	if n == "" || len(n) > 300 {
		ve := &domain.ValidationError{}
		ve.Add("title", "an intake title must be 1..300 characters")
		return "", ve
	}
	return n, nil
}

// ListIntake lists the matter's intake records for any ACTIVE member.
func (s *Intakes) ListIntake(ctx context.Context, q port.ListIntakeQuery) ([]matter.IntakeRecord, error) {
	var out []matter.IntakeRecord
	err := s.w.readSnapshot(ctx, q.ActorID, q.MatterID, func(snap port.MatterSnapshot, _ matter.WorkGraph, _ time.Time, _ int64) error {
		is, err := intakeSnap(snap)
		if err != nil {
			return err
		}
		out, err = is.ListIntakeRecords(ctx, matter.MatterID(q.MatterID))
		return err
	})
	if err != nil {
		return nil, fmt.Errorf("list intake: %w", err)
	}
	return out, nil
}

// GetIntake reads one record; another matter's record and a nonexistent record are the same 404.
func (s *Intakes) GetIntake(ctx context.Context, q port.GetIntakeQuery) (matter.IntakeRecord, error) {
	id, err := matter.NewIntakeID(q.IntakeID)
	if err != nil {
		return matter.IntakeRecord{}, err
	}
	var out matter.IntakeRecord
	err = s.w.readSnapshot(ctx, q.ActorID, q.MatterID, func(snap port.MatterSnapshot, _ matter.WorkGraph, _ time.Time, _ int64) error {
		is, err := intakeSnap(snap)
		if err != nil {
			return err
		}
		records, err := is.ListIntakeRecords(ctx, matter.MatterID(q.MatterID))
		if err != nil {
			// A store failure is unavailable (503 class), never a fabricated not-found.
			return err
		}
		for _, r := range records {
			if r.ID == id {
				out = r
				return nil
			}
		}
		return port.ErrNotFound
	})
	if err != nil {
		if errors.Is(err, port.ErrNotFound) {
			return matter.IntakeRecord{}, port.ErrNotFound
		}
		return matter.IntakeRecord{}, fmt.Errorf("get intake: %w", err)
	}
	return out, nil
}

// CreateIntake records the original request. Receipted; attachments are validated as exact
// document versions of this matter before anything is stored.
func (s *Intakes) CreateIntake(ctx context.Context, cmd port.CreateIntakeCmd) (matter.CreatedResult, error) {
	actor, key, hash, err := parseReceiptInputs(cmd.ActorID, cmd.IdempotencyKey, cmd.RequestHash)
	if err != nil {
		return matter.CreatedResult{}, err
	}
	matterID, err := matter.NewMatterID(cmd.MatterID)
	if err != nil {
		return matter.CreatedResult{}, err
	}
	title, err := intakeTitle(cmd.Title)
	if err != nil {
		return matter.CreatedResult{}, err
	}
	if len(cmd.RequestText) > 10000 || len(cmd.Requester) > 200 {
		ve := &domain.ValidationError{}
		ve.Add("requestText", "the request text or requester is too long")
		return matter.CreatedResult{}, ve
	}
	var out matter.CreatedResult
	err = s.w.execute(ctx, cmd.ActorID, cmd.MatterID, "CREATE_INTAKE", policy.DecideCreateRequirement, func(env *workEnv) error {
		tx, err := intakeTx(env)
		if err != nil {
			return err
		}
		out, err = s.w.createdReceipt(ctx, env, actor, key, hash, func() (matter.CreatedResult, error) {
			if cmd.ReceivedAt.IsZero() || cmd.ReceivedAt.After(env.tCmd) {
				ve := &domain.ValidationError{}
				ve.Add("receivedAt", "a received time is required and cannot be in the future")
				return matter.CreatedResult{}, ve
			}
			// Attachments are references only: each must name an existing version of this matter.
			_, g, err := s.w.loadGraphs(ctx, env)
			if err != nil {
				return matter.CreatedResult{}, err
			}
			known := map[matter.VersionID]bool{}
			for _, v := range g.Evidence.Versions {
				known[v.ID] = true
			}
			for _, a := range cmd.Attachments {
				if !known[matter.VersionID(a)] {
					return matter.CreatedResult{}, rejected("unknown-version", "an attachment names a version that is not in this matter")
				}
			}
			r := matter.IntakeRecord{
				ID: matter.IntakeID(env.ids.NewRecordID()), MatterID: matterID, Title: title,
				RequestText: cmd.RequestText, Requester: cmd.Requester, ReceivedAt: cmd.ReceivedAt.UTC(),
				Attachments: cmd.Attachments, Status: matter.IntakePending, RecordedBy: env.actor,
				CreatedAt: env.tCmd, Revision: 1,
			}
			if err := tx.InsertIntakeRecord(ctx, r); err != nil {
				return matter.CreatedResult{}, err
			}
			seq, err := env.emit(ctx, "intake.recorded", "INTAKE", r.ID.String(), "", nil, intakeSnapshot(r), nil)
			return matter.CreatedResult{Kind: "INTAKE", ID: r.ID.String(), Seq: seq}, err
		})
		return err
	})
	return out, err
}

// TriageIntake declines a PENDING record with the accountable reason. Acceptance is not a
// separate state: the recorded decision that creates work is the conversion.
func (s *Intakes) TriageIntake(ctx context.Context, cmd port.TriageIntakeCmd) (matter.IntakeRecord, error) {
	if !cmd.Decline {
		return matter.IntakeRecord{}, rejected("triage-choice-required", "choose decline; conversion is the acceptance path")
	}
	reason := strings.TrimSpace(cmd.Reason)
	if reason == "" || len(reason) > 2000 {
		ve := &domain.ValidationError{}
		ve.Add("reason", "a decline needs a reason of 1..2000 characters")
		return matter.IntakeRecord{}, ve
	}
	var out matter.IntakeRecord
	err := s.w.execute(ctx, cmd.ActorID, cmd.MatterID, "TRIAGE_INTAKE", policy.DecideCreateRequirement, func(env *workEnv) error {
		tx, err := intakeTx(env)
		if err != nil {
			return err
		}
		current, err := loadIntake(ctx, tx, env, cmd.IntakeID)
		if err != nil {
			return err
		}
		if cmd.ExpectedRevision == 0 {
			return port.ErrPreconditionRequired
		}
		if current.Revision != cmd.ExpectedRevision {
			return port.ErrPreconditionFailed
		}
		if current.Status != matter.IntakePending {
			return rejected("intake-not-pending", "only a pending record can be declined")
		}
		updated := current
		updated.Status, updated.TriageReason = matter.IntakeDeclined, reason
		by, at := env.actor, env.tCmd
		updated.TriagedBy, updated.TriagedAt = &by, &at
		if err := tx.SaveIntakeRecord(ctx, updated, cmd.ExpectedRevision); err != nil {
			return err
		}
		if _, err := env.emit(ctx, "intake.triaged", "INTAKE", updated.ID.String(), reason, intakeSnapshot(current), intakeSnapshot(updated), nil); err != nil {
			return err
		}
		updated.Revision = cmd.ExpectedRevision + 1
		out = updated
		return nil
	})
	if err != nil {
		return matter.IntakeRecord{}, err
	}
	return out, nil
}

// ConvertIntake turns a PENDING record into one real Requirement or Action — receipted,
// atomic, idempotent. The record's request text and provenance stay; the created work is
// ordinary authorized work that still needs its own execution and verification.
func (s *Intakes) ConvertIntake(ctx context.Context, cmd port.ConvertIntakeCmd) (record matter.IntakeRecord, created matter.WorkItemCreatedResult, replayed bool, err error) {
	actor, key, hash, err := parseReceiptInputs(cmd.ActorID, cmd.IdempotencyKey, cmd.RequestHash)
	if err != nil {
		return matter.IntakeRecord{}, matter.WorkItemCreatedResult{}, false, err
	}
	title, err := intakeTitle(cmd.Title)
	if err != nil {
		return matter.IntakeRecord{}, matter.WorkItemCreatedResult{}, false, err
	}
	err = s.w.execute(ctx, cmd.ActorID, cmd.MatterID, "CONVERT_INTAKE", policy.DecideCreateRequirement, func(env *workEnv) error {
		tx, err := intakeTx(env)
		if err != nil {
			return err
		}
		// Replay first (§2.1).
		rcpt, rcptErr := env.tx.Receipt(ctx, actor, key)
		if rcptErr != nil && !errors.Is(rcptErr, port.ErrNotFound) {
			return rcptErr
		}
		if rcptErr == nil {
			if err := authorizeReceiptScope(ctx, env.tx, actor, rcpt); err != nil {
				env.replayHidden = errors.Is(err, port.ErrNotFound)
				return err
			}
			if rcpt.ScopeKind != matter.ScopeMatter || rcpt.WorkspaceID != env.header.WorkspaceID ||
				rcpt.MatterID == nil || *rcpt.MatterID != env.header.MatterID ||
				rcpt.Kind != matter.SnapshotCreated || rcpt.CreatedSnapshot == nil {
				return matter.ErrSnapshotKind
			}
			if rcpt.RequestHash != hash {
				return port.ErrIdempotencyKeyReuse
			}
			stored := *rcpt.CreatedSnapshot
			stored.Replayed = true
			// The stored id names the intake record; the caller re-reads both sides.
			intakeID, perr := matter.NewIntakeID(stored.ID)
			if perr != nil {
				return matter.ErrSnapshotKind
			}
			current, lerr := tx.LoadIntakeRecord(ctx, env.header.MatterID, intakeID)
			if lerr != nil {
				return lerr
			}
			record = current
			replayed = true
			return nil
		}
		if err := s.w.keyAge.Check(key, env.tCmd); err != nil {
			return err
		}
		current, err := loadIntake(ctx, tx, env, cmd.IntakeID)
		if err != nil {
			return err
		}
		if current.Status != matter.IntakePending {
			return rejected("intake-not-pending", "this record was already converted or declined")
		}
		owner := matter.ActorID("")
		if cmd.Owner != "" {
			owner, err = matter.NewActorID(cmd.Owner)
			if err != nil {
				return rejected("invalid-owner", "the assigned owner is not a valid user")
			}
			mm, merr := env.tx.MatterMembership(ctx, env.header.MatterID, owner)
			if merr != nil || mm.Status != matter.StatusActive {
				return rejected("invalid-owner", "the assigned owner is not an active member of this matter")
			}
		}
		nodeID, err := matter.NewNodeID(s.w.ids.NewRecordID())
		if err != nil {
			return err
		}
		var item matter.WorkItem
		switch cmd.Kind {
		case "REQUIREMENT":
			env.seq++
			req, rerr := matter.NewRequirement(matter.RequirementID(nodeID), env.header.MatterID, title, cmd.Outcome)
			if rerr != nil {
				return rerr
			}
			if owner != "" {
				req.OwnerActorID = &owner
			}
			req.DueAt = cmd.Due
			if err := env.tx.InsertNode(ctx, matter.Node{ID: nodeID, MatterID: env.header.MatterID, Kind: matter.NodeRequirement}); err != nil {
				return err
			}
			if err := env.tx.InsertRequirement(ctx, req); err != nil {
				return err
			}
			if err := env.tx.AppendRequirementCreated(ctx, matter.RequirementCreatedEvent{
				EventID: s.w.ids.NewRecordID(), MatterID: env.header.MatterID, TargetID: matter.RequirementID(nodeID),
				Actor: env.actor, IdempotencyKey: key, Seq: env.seq, EffectiveAt: env.tCmd, RecordedAt: env.tCmd, Requirement: req,
			}); err != nil {
				return err
			}
			item = req.AsWorkItem()
		case "ACTION":
			a, aerr := matter.NewAction(nodeID, env.header.MatterID, title, cmd.Outcome)
			if aerr != nil {
				return aerr
			}
			if owner != "" {
				a.OwnerActorID = &owner
			}
			a.DueAt = cmd.Due
			if err := env.g.InsertAction(ctx, a); err != nil {
				return err
			}
			if _, err := env.emit(ctx, "action.created", "ACTION", a.ID.String(), "", nil, itemSnapshot(a), nil); err != nil {
				return err
			}
			item = a
		default:
			ve := &domain.ValidationError{}
			ve.Add("kind", "convert into a REQUIREMENT or an ACTION")
			return ve
		}
		// The record flips to CONVERTED in the same transaction: failure creates nothing.
		updated := current
		updated.Status = matter.IntakeConverted
		itemID := item.ID
		updated.ItemID = &itemID
		if err := tx.SaveIntakeRecord(ctx, updated, current.Revision); err != nil {
			return err
		}
		if _, err := env.emit(ctx, "intake.converted", "INTAKE", updated.ID.String(),
			"converted to "+item.ID.String(), intakeSnapshot(current), intakeSnapshot(updated), nil); err != nil {
			return err
		}
		updated.Revision = current.Revision + 1
		record = updated
		created = matter.WorkItemCreatedResult{Item: item, Seq: env.seq, RecordedAt: env.tCmd}
		createdReceipt := matter.CreatedResult{Kind: "INTAKE_CONVERSION", ID: current.ID.String(), Seq: env.seq, RecordedAt: env.tCmd}
		return env.tx.StoreReceipt(ctx, matter.Receipt{
			ActorID: actor, IdempotencyKey: key, RequestHash: hash, ScopeKind: matter.ScopeMatter,
			WorkspaceID: env.header.WorkspaceID, MatterID: &env.header.MatterID, StatusCode: 201,
			CommittedAt: env.tCmd, Matters: []matter.MatterID{env.header.MatterID},
			Kind: matter.SnapshotCreated, CreatedSnapshot: &createdReceipt,
		})
	})
	if err != nil {
		return matter.IntakeRecord{}, matter.WorkItemCreatedResult{}, false, err
	}
	return record, created, replayed, nil
}

func loadIntake(ctx context.Context, tx port.IntakeTx, env *workEnv, intakeID string) (matter.IntakeRecord, error) {
	id, err := matter.NewIntakeID(intakeID)
	if err != nil {
		return matter.IntakeRecord{}, err
	}
	return tx.LoadIntakeRecord(ctx, env.header.MatterID, id)
}

func intakeSnapshot(r matter.IntakeRecord) map[string]any {
	return map[string]any{"title": r.Title, "status": string(r.Status), "item": itemIDString(r.ItemID), "revision": r.Revision}
}

func itemIDString(id *matter.NodeID) string {
	if id == nil {
		return ""
	}
	return id.String()
}

// ---------- Guidance ----------

type Guidances struct{ w *WorkService }

func NewGuidanceService(w *WorkService) *Guidances { return &Guidances{w: w} }

func guidanceTx(env *workEnv) (port.GuidanceTx, error) {
	t, ok := env.tx.(port.GuidanceTx)
	if !ok {
		return nil, fmt.Errorf("matter transaction does not support guidance")
	}
	return t, nil
}

func guidanceSnap(snap port.MatterSnapshot) (port.GuidanceSnapshot, error) {
	s, ok := snap.(port.GuidanceSnapshot)
	if !ok {
		return nil, fmt.Errorf("snapshot does not support guidance")
	}
	return s, nil
}

// ListGuidance returns the documents with their revisions. Drafts are visible to EDITOR/OWNER
// only; a VIEWER reads published guidance only.
func (s *Guidances) ListGuidance(ctx context.Context, q port.ListGuidanceQuery) ([]matter.GuidanceDocument, [][]matter.GuidanceRevision, error) {
	var docs []matter.GuidanceDocument
	var revs [][]matter.GuidanceRevision
	err := s.w.readSnapshot(ctx, q.ActorID, q.MatterID, func(snap port.MatterSnapshot, _ matter.WorkGraph, _ time.Time, _ int64) error {
		gs, err := guidanceSnap(snap)
		if err != nil {
			return err
		}
		docs, err = gs.ListGuidanceDocuments(ctx, matter.MatterID(q.MatterID))
		if err != nil {
			return err
		}
		all, err := gs.ListGuidanceRevisions(ctx, matter.MatterID(q.MatterID))
		if err != nil {
			return err
		}
		byDoc := map[matter.GuidanceDocumentID][]matter.GuidanceRevision{}
		for _, r := range all {
			byDoc[r.DocumentID] = append(byDoc[r.DocumentID], r)
		}
		revs = make([][]matter.GuidanceRevision, len(docs))
		for i, d := range docs {
			revs[i] = byDoc[d.ID]
		}
		return nil
	})
	if err != nil {
		return nil, nil, fmt.Errorf("list guidance: %w", err)
	}
	return docs, revs, nil
}

// GetGuidance reads one document with its revisions.
func (s *Guidances) GetGuidance(ctx context.Context, q port.GetGuidanceQuery) (matter.GuidanceDocument, []matter.GuidanceRevision, error) {
	id, err := matter.NewGuidanceDocumentID(q.DocumentID)
	if err != nil {
		return matter.GuidanceDocument{}, nil, err
	}
	var doc matter.GuidanceDocument
	var revs []matter.GuidanceRevision
	err = s.w.readSnapshot(ctx, q.ActorID, q.MatterID, func(snap port.MatterSnapshot, _ matter.WorkGraph, _ time.Time, _ int64) error {
		gs, err := guidanceSnap(snap)
		if err != nil {
			return err
		}
		all, err := gs.ListGuidanceDocuments(ctx, matter.MatterID(q.MatterID))
		if err != nil {
			return err
		}
		for _, d := range all {
			if d.ID == id {
				doc = d
			}
		}
		if doc.ID == "" {
			return port.ErrNotFound
		}
		revRows, err := gs.ListGuidanceRevisions(ctx, matter.MatterID(q.MatterID))
		if err != nil {
			return err
		}
		for _, r := range revRows {
			if r.DocumentID == id {
				revs = append(revs, r)
			}
		}
		return nil
	})
	if err != nil {
		if errors.Is(err, port.ErrNotFound) {
			return matter.GuidanceDocument{}, nil, port.ErrNotFound
		}
		return matter.GuidanceDocument{}, nil, fmt.Errorf("get guidance: %w", err)
	}
	return doc, revs, nil
}

func guidanceText(body string, field string) (string, error) {
	b := strings.TrimSpace(body)
	if b == "" || len(b) > 20000 {
		ve := &domain.ValidationError{}
		ve.Add(field, "guidance text must be 1..20000 characters")
		return "", ve
	}
	return b, nil
}

// CreateGuidance creates a document with its first DRAFT revision. Receipted.
func (s *Guidances) CreateGuidance(ctx context.Context, cmd port.CreateGuidanceCmd) (matter.CreatedResult, error) {
	actor, key, hash, err := parseReceiptInputs(cmd.ActorID, cmd.IdempotencyKey, cmd.RequestHash)
	if err != nil {
		return matter.CreatedResult{}, err
	}
	matterID, err := matter.NewMatterID(cmd.MatterID)
	if err != nil {
		return matter.CreatedResult{}, err
	}
	title, err := intakeTitle(cmd.Title)
	if err != nil {
		return matter.CreatedResult{}, err
	}
	body, err := guidanceText(cmd.Body, "body")
	if err != nil {
		return matter.CreatedResult{}, err
	}
	if err := matter.ValidateGuidanceSourceRefs(cmd.SourceRefs); err != nil {
		ve := &domain.ValidationError{}
		ve.Add("sourceRefs", err.Error())
		return matter.CreatedResult{}, ve
	}
	refs, err := json.Marshal(cmd.SourceRefs)
	if err != nil {
		return matter.CreatedResult{}, fmt.Errorf("guidance refs: %w", err)
	}
	var out matter.CreatedResult
	err = s.w.execute(ctx, cmd.ActorID, cmd.MatterID, "CREATE_GUIDANCE", policy.DecideCreateRequirement, func(env *workEnv) error {
		tx, err := guidanceTx(env)
		if err != nil {
			return err
		}
		out, err = s.w.createdReceipt(ctx, env, actor, key, hash, func() (matter.CreatedResult, error) {
			if err := refuseDuplicateGuidanceTitle(ctx, s.w, env, title); err != nil {
				return matter.CreatedResult{}, err
			}
			if err := validateGuidanceVersions(ctx, s.w, env, cmd.SourceRefs); err != nil {
				return matter.CreatedResult{}, err
			}
			d := matter.GuidanceDocument{
				ID: matter.GuidanceDocumentID(env.ids.NewRecordID()), MatterID: matterID, Title: title,
				CreatedBy: env.actor, CreatedAt: env.tCmd, Revision: 1,
			}
			if err := tx.InsertGuidanceDocument(ctx, d); err != nil {
				return matter.CreatedResult{}, err
			}
			rev := matter.GuidanceRevision{
				ID: matter.GuidanceRevisionID(env.ids.NewRecordID()), DocumentID: d.ID, MatterID: matterID,
				No: 1, Body: body, SourceRefs: cmd.SourceRefs, Status: "DRAFT", CreatedBy: env.actor, CreatedAt: env.tCmd,
			}
			if err := tx.InsertGuidanceRevision(ctx, rev, refs); err != nil {
				return matter.CreatedResult{}, err
			}
			seq, err := env.emit(ctx, "guidance.drafted", "GUIDANCE", d.ID.String(), "", nil, guidanceSnapshot(d, rev), nil)
			return matter.CreatedResult{Kind: "GUIDANCE", ID: d.ID.String(), Seq: seq}, err
		})
		return err
	})
	return out, err
}

// AddGuidanceDraft appends one DRAFT revision to a document. Receipted; published rows are
// never touched.
func (s *Guidances) AddGuidanceDraft(ctx context.Context, cmd port.AddGuidanceDraftCmd) (matter.CreatedResult, error) {
	actor, key, hash, err := parseReceiptInputs(cmd.ActorID, cmd.IdempotencyKey, cmd.RequestHash)
	if err != nil {
		return matter.CreatedResult{}, err
	}
	docID, err := matter.NewGuidanceDocumentID(cmd.DocumentID)
	if err != nil {
		return matter.CreatedResult{}, err
	}
	body, err := guidanceText(cmd.Body, "body")
	if err != nil {
		return matter.CreatedResult{}, err
	}
	if err := matter.ValidateGuidanceSourceRefs(cmd.SourceRefs); err != nil {
		ve := &domain.ValidationError{}
		ve.Add("sourceRefs", err.Error())
		return matter.CreatedResult{}, ve
	}
	refs, err := json.Marshal(cmd.SourceRefs)
	if err != nil {
		return matter.CreatedResult{}, fmt.Errorf("guidance refs: %w", err)
	}
	var out matter.CreatedResult
	err = s.w.execute(ctx, cmd.ActorID, cmd.MatterID, "ADD_GUIDANCE_DRAFT", policy.DecideCreateRequirement, func(env *workEnv) error {
		tx, err := guidanceTx(env)
		if err != nil {
			return err
		}
		out, err = s.w.createdReceipt(ctx, env, actor, key, hash, func() (matter.CreatedResult, error) {
			if err := validateGuidanceVersions(ctx, s.w, env, cmd.SourceRefs); err != nil {
				return matter.CreatedResult{}, err
			}
			no, err := tx.MaxGuidanceRevisionNo(ctx, docID)
			if err != nil {
				return matter.CreatedResult{}, err
			}
			rev := matter.GuidanceRevision{
				ID: matter.GuidanceRevisionID(env.ids.NewRecordID()), DocumentID: docID, MatterID: env.header.MatterID,
				No: no + 1, Body: body, SourceRefs: cmd.SourceRefs, Status: "DRAFT", CreatedBy: env.actor, CreatedAt: env.tCmd,
			}
			if err := tx.InsertGuidanceRevision(ctx, rev, refs); err != nil {
				return matter.CreatedResult{}, err
			}
			seq, err := env.emit(ctx, "guidance.drafted", "GUIDANCE", docID.String(), "", nil, guidanceSnapshot(matter.GuidanceDocument{ID: docID}, rev), nil)
			return matter.CreatedResult{Kind: "GUIDANCE_REVISION", ID: rev.ID.String(), Seq: seq}, err
		})
		return err
	})
	return out, err
}

// PublishGuidance publishes one exact DRAFT revision as immutable. Matter OWNER only;
// receipted; publishing satisfies no criterion and changes no legal state.
func (s *Guidances) PublishGuidance(ctx context.Context, cmd port.PublishGuidanceCmd) (matter.CreatedResult, error) {
	actor, key, hash, err := parseReceiptInputs(cmd.ActorID, cmd.IdempotencyKey, cmd.RequestHash)
	if err != nil {
		return matter.CreatedResult{}, err
	}
	docID, err := matter.NewGuidanceDocumentID(cmd.DocumentID)
	if err != nil {
		return matter.CreatedResult{}, err
	}
	revID, err := matter.NewGuidanceRevisionID(cmd.RevisionID)
	if err != nil {
		return matter.CreatedResult{}, err
	}
	var out matter.CreatedResult
	err = s.w.execute(ctx, cmd.ActorID, cmd.MatterID, "PUBLISH_GUIDANCE", policy.DecideMatterAdmin, func(env *workEnv) error {
		tx, err := guidanceTx(env)
		if err != nil {
			return err
		}
		out, err = s.w.createdReceipt(ctx, env, actor, key, hash, func() (matter.CreatedResult, error) {
			rev, err := tx.LoadGuidanceRevision(ctx, env.header.MatterID, revID)
			if err != nil {
				return matter.CreatedResult{}, err
			}
			if rev.DocumentID != docID {
				return matter.CreatedResult{}, port.ErrNotFound
			}
			if rev.Status != "DRAFT" {
				return matter.CreatedResult{}, rejected("guidance-not-draft", "only a draft can be published")
			}
			by := env.actor
			at := env.tCmd
			if err := tx.PublishGuidanceRevision(ctx, docID, revID, env.header.MatterID, by, at); err != nil {
				return matter.CreatedResult{}, err
			}
			published := rev
			published.Status = "PUBLISHED"
			published.PublishedBy, published.PublishedAt = &by, &at
			seq, err := env.emit(ctx, "guidance.published", "GUIDANCE", docID.String(), "", guidanceSnapshot(matter.GuidanceDocument{ID: docID}, rev), guidanceSnapshot(matter.GuidanceDocument{ID: docID}, published), nil)
			return matter.CreatedResult{Kind: "GUIDANCE_PUBLICATION", ID: revID.String(), Seq: seq}, err
		})
		return err
	})
	return out, err
}

// validateGuidanceVersion checks that every version reference names an existing version of this
// matter: attributable, exact, and authorized — never invented.
func validateGuidanceVersions(ctx context.Context, w *WorkService, env *workEnv, refs []matter.GuidanceSourceRef) error {
	need := false
	for _, r := range refs {
		if r.VersionID != "" {
			need = true
		}
	}
	if !need {
		return nil
	}
	_, g, err := w.loadGraphs(ctx, env)
	if err != nil {
		return err
	}
	known := map[matter.VersionID]bool{}
	for _, v := range g.Evidence.Versions {
		known[v.ID] = true
	}
	for _, r := range refs {
		if r.VersionID != "" && !known[matter.VersionID(r.VersionID)] {
			return rejected("unknown-version", "a reference names a version that is not in this matter")
		}
	}
	return nil
}

func guidanceSnapshot(d matter.GuidanceDocument, r matter.GuidanceRevision) map[string]any {
	return map[string]any{"title": d.Title, "no": r.No, "status": r.Status}
}

// refuseDuplicateGuidanceTitle keeps (matter, title) unique through a typed refusal on both
// stores: the memory double enforced it and migration 0016 now carries the same UNIQUE, so the
// service checks first and answers 409 instead of a storage constraint error.
func refuseDuplicateGuidanceTitle(ctx context.Context, w *WorkService, env *workEnv, title string) error {
	gs, ok := env.tx.(port.GuidanceSnapshot)
	if !ok {
		return fmt.Errorf("matter transaction does not support guidance")
	}
	docs, err := gs.ListGuidanceDocuments(ctx, env.header.MatterID)
	if err != nil {
		return err
	}
	for _, d := range docs {
		if d.Title == title {
			return rejected("duplicate-guidance-title", "this matter already has guidance with this title")
		}
	}
	return nil
}
