package service

// MC-ZCODE-TERMSHEET-01: contract term sheets. A term line is a typed FACT about one contract
// document version (design 2026-11-05 §2.2). The import replaces one version's lines atomically
// under content-hash idempotency; promotion creates the DRAFT record a fact operationalizes.
// Term lines are deliberately OUTSIDE the work-item import: facts are not obligations
// (Principle 4), so parseSheet never sees them (Erratum 1) — this service owns its own sheet
// shape and reuses only the codec and the hash conventions.

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"slices"
	"strings"
	"time"

	"leonx.me/matter-control/internal/core/domain/matter"
	"leonx.me/matter-control/internal/core/policy"
	"leonx.me/matter-control/internal/core/port"
)

// TermSheets is the term-sheet use cases (port.TermSheetService).
type TermSheets struct {
	w     *WorkService
	codec port.SheetCodec
}

func NewTermSheetService(w *WorkService, codec port.SheetCodec) *TermSheets {
	return &TermSheets{w: w, codec: codec}
}

func termLineSnap(snap port.MatterSnapshot) (port.TermLineSnapshot, error) {
	s, ok := snap.(port.TermLineSnapshot)
	if !ok {
		return nil, fmt.Errorf("snapshot does not support term lines")
	}
	return s, nil
}

func matterTermSheetTx(tx port.MatterTx) (port.MatterTermSheetTx, error) {
	t, ok := tx.(port.MatterTermSheetTx)
	if !ok {
		return nil, fmt.Errorf("matter transaction does not support term lines")
	}
	return t, nil
}

// termSheetHeader returns the exact sheet shape: one header row, then one row per term fact.
// Extra or missing columns are a rejected sheet, never a guessed mapping.
func termSheetHeader() []string {
	return []string{"row_key", "field", "value_text", "value_date"}
}

// termRow is one parsed sheet row before it becomes a stored line.
type termRow struct {
	RowNo     int // 1-based sheet position including the header row
	RowKey    string
	Field     matter.TermField
	ValueText string
	ValueDate *time.Time
}

// termRowHash is the canonical identity of one row's content (rowSetHash pattern): JSON with no
// idempotency key inside, so absent-versus-empty and delimiter ambiguity cannot occur.
func termRowHash(r termRow) string {
	b, _ := json.Marshal(struct {
		Field     string     `json:"field"`
		ValueText string     `json:"valueText"`
		ValueDate *time.Time `json:"valueDate"`
	}{Field: r.Field.String(), ValueText: r.ValueText, ValueDate: r.ValueDate})
	return sha256Hex(b)
}

// valueDateOf parses the value_date column: an ISO date or an RFC 3339 timestamp, UTC-normalized.
func valueDateOf(raw string) (*time.Time, error) {
	raw = strings.TrimSpace(raw)
	if raw == "" {
		return nil, fmt.Errorf("empty date")
	}
	for _, layout := range []string{"2006-01-02", time.RFC3339} {
		if t, err := time.Parse(layout, raw); err == nil {
			v := t.UTC()
			return &v, nil
		}
	}
	return nil, fmt.Errorf("not an ISO date or RFC 3339 timestamp")
}

// parseTermSheet validates the decoded table: exact header, closed field vocabulary, the
// per-field value carrier. Any bad row fails the WHOLE import (design edge case: name the row,
// never swallow) — the caller writes nothing when rejections exist.
func parseTermSheet(t port.Table) ([]termRow, []port.TermSheetRowError) {
	if len(t.Rows) == 0 {
		return nil, []port.TermSheetRowError{{RowKey: "header", Code: "validation", Detail: "empty sheet"}}
	}
	header := t.Rows[0]
	want := termSheetHeader()
	if len(header) != len(want) {
		return nil, []port.TermSheetRowError{{RowKey: "header", Code: "validation",
			Detail: fmt.Sprintf("header must be exactly %v", want)}}
	}
	for i, w := range want {
		if !strings.EqualFold(strings.TrimSpace(header[i]), w) {
			return nil, []port.TermSheetRowError{{RowKey: "header", Code: "validation",
				Detail: fmt.Sprintf("column %d must be %s", i+1, w)}}
		}
	}
	rows := make([]termRow, 0, len(t.Rows)-1)
	rejected := make([]port.TermSheetRowError, 0)
	seen := make(map[string]bool) // (field, rowKey) identity inside one sheet
	for i, r := range t.Rows[1:] {
		rowNo := i + 2 // 1-based sheet position including the header row
		bad := func(detail string) {
			rejected = append(rejected, port.TermSheetRowError{RowKey: fmt.Sprintf("row-%d", rowNo), Code: "validation", Detail: detail})
		}
		if len(r) != len(want) {
			bad(fmt.Sprintf("expected %d cells, got %d", len(want), len(r)))
			continue
		}
		rowKey := strings.TrimSpace(r[0])
		if rowKey == "" || len(rowKey) > 100 {
			bad("row_key must be 1..100 characters")
			continue
		}
		field, err := matter.ParseTermField(strings.TrimSpace(r[1]))
		if err != nil {
			bad(err.Error())
			continue
		}
		valueText := strings.TrimSpace(r[2])
		var valueDate *time.Time
		if raw := strings.TrimSpace(r[3]); raw != "" {
			if valueDate, err = valueDateOf(raw); err != nil {
				bad("value_date must be an ISO date or RFC 3339 timestamp")
				continue
			}
		}
		// (field, rowKey) is the stored identity: a sheet carrying it twice would hit the
		// database's unique constraint with an opaque storage error, so it is named here.
		identity := field.String() + "|" + rowKey
		if seen[identity] {
			bad("duplicate field+row_key in the same sheet")
			continue
		}
		if err := matter.ValidateTermValue(field, valueText, valueDate); err != nil { // per-field carrier rules
			bad(err.Error())
			continue
		}
		seen[identity] = true
		rows = append(rows, termRow{RowNo: rowNo, RowKey: rowKey, Field: field, ValueText: valueText, ValueDate: valueDate})
	}
	// An empty sheet would DELETE every line of the version while looking like a success; that
	// is never an acceptable reading of "replace per version" (safety over convenience).
	if len(rejected) == 0 && len(rows) == 0 {
		rejected = append(rejected, port.TermSheetRowError{RowKey: "sheet", Code: "validation",
			Detail: "the sheet carries no data rows; importing nothing would erase the version's lines"})
	}
	return rows, rejected
}

// ListTermLines reads every term line of one matter for an authorized member; a non-member gets
// the uniform 404.
func (s *TermSheets) ListTermLines(ctx context.Context, q port.ListTermLinesQuery) (port.TermSheetView, error) {
	var out port.TermSheetView
	err := s.w.readSnapshot(ctx, q.ActorID, q.MatterID, func(snap port.MatterSnapshot, _ matter.WorkGraph, _ time.Time, revision int64) error {
		ts, err := termLineSnap(snap)
		if err != nil {
			return err
		}
		out.MatterRevision = revision
		out.Lines, err = ts.ListTermLines(ctx, matter.MatterID(q.MatterID))
		return err
	})
	if err != nil {
		return port.TermSheetView{}, fmt.Errorf("list term lines: %w", err)
	}
	return out, nil
}

// ImportTermSheet replaces a version's facts under a Matter CAS and a same-key receipt.
func (s *TermSheets) ImportTermSheet(ctx context.Context, cmd port.ImportTermSheetCmd) (port.TermSheetImportResult, error) {
	actor, key, hash, err := parseReceiptInputs(cmd.ActorID, cmd.IdempotencyKey, cmd.RequestHash)
	if err != nil {
		return port.TermSheetImportResult{}, err
	}
	docV, err := matter.NewVersionID(cmd.DocumentVersionID)
	if err != nil {
		return port.TermSheetImportResult{}, err
	}
	if cmd.Sheet == nil {
		return port.TermSheetImportResult{}, fmt.Errorf("%w: term sheet body is required", port.ErrSheetInvalid)
	}
	res := port.TermSheetImportResult{DocumentVersionID: docV.String()}
	err = s.w.execute(ctx, cmd.ActorID, cmd.MatterID, "TERM_SHEET_IMPORT", policy.DecideCreateRequirement, func(env *workEnv) error {
		rcpt, err := env.tx.Receipt(ctx, actor, key)
		if err == nil {
			if err := authorizeReceiptScope(ctx, env.tx, actor, rcpt); err != nil {
				env.replayHidden = errors.Is(err, port.ErrNotFound)
				return err
			}
			if rcpt.ScopeKind != matter.ScopeMatter || rcpt.WorkspaceID != env.header.WorkspaceID ||
				rcpt.MatterID == nil || *rcpt.MatterID != env.header.MatterID || rcpt.RequestHash != hash {
				return port.ErrIdempotencyKeyReuse
			}
			if rcpt.Kind != matter.SnapshotTermSheetImported || rcpt.TermSheetSnapshot == nil {
				return matter.ErrSnapshotKind
			}
			stored := rcpt.TermSheetSnapshot
			res = port.TermSheetImportResult{
				DocumentVersionID: stored.VersionID.String(), Created: stored.Created,
				Replaced: stored.Replaced, Unchanged: stored.Unchanged, Replayed: true,
			}
			return nil
		}
		if !errors.Is(err, port.ErrNotFound) {
			return err
		}
		if err := s.w.keyAge.Check(key, env.tCmd); err != nil {
			return err
		}
		if err := matterHeaderRevisionCAS(env.header, cmd.ExpectedRevision); err != nil {
			return err
		}
		graph, err := env.g.LoadGraph(ctx)
		if err != nil {
			return err
		}
		if _, ok := findVersion(graph.Evidence, docV.String()); !ok {
			return port.ErrNotFound
		}
		// Decode only after authorization, so a caller without write access cannot spend the
		// decoder's CPU and memory (up to the codec's unzip limits). Costs lock time instead.
		table, err := s.codec.Decode(cmd.Format, cmd.Sheet, min(cmd.MaxBytes, port.MaxTermSheetBytes))
		if err != nil {
			return fmt.Errorf("%w: %w", port.ErrSheetInvalid, err)
		}
		rows, rejected := parseTermSheet(table)
		if len(rejected) > 0 {
			res.Rejected = rejected
			return nil
		}
		if err := replaceTermSheet(ctx, env, docV, rows, &res); err != nil {
			return err
		}
		if len(res.Rejected) > 0 { // a promoted fact would change or vanish: nothing written
			return nil
		}
		mID := env.header.MatterID
		return env.tx.StoreReceipt(ctx, matter.Receipt{
			ActorID: actor, IdempotencyKey: key, RequestHash: hash, ScopeKind: matter.ScopeMatter,
			WorkspaceID: env.header.WorkspaceID, MatterID: &mID, Matters: []matter.MatterID{mID},
			StatusCode: 200, CommittedAt: env.tCmd, Kind: matter.SnapshotTermSheetImported,
			TermSheetSnapshot: &matter.TermSheetImported{
				VersionID: docV, Created: res.Created, Replaced: res.Replaced, Unchanged: res.Unchanged,
			},
		})
	})
	if err != nil {
		return port.TermSheetImportResult{}, err
	}
	return res, nil
}

func replaceTermSheet(ctx context.Context, env *workEnv, version matter.VersionID, rows []termRow, res *port.TermSheetImportResult) error {
	tt, err := matterTermSheetTx(env.tx)
	if err != nil {
		return err
	}
	mID := env.header.MatterID
	existing, err := tt.ListTermLines(ctx, mID)
	if err != nil {
		return err
	}
	type rowIdentity struct {
		field  matter.TermField
		rowKey string
	}
	prevByKey := make(map[rowIdentity]matter.TermLine)
	for _, line := range existing {
		if line.DocumentVersionID == version {
			prevByKey[rowIdentity{line.Field, line.RowKey}] = line
		}
	}
	// A promoted fact is the provenance of a draft record: a re-import may neither change nor drop
	// it, or the draft would lose its source and the new line could be promoted a second time.
	inSheet := make(map[rowIdentity]bool, len(rows))
	for _, row := range rows {
		id := rowIdentity{row.Field, row.RowKey}
		inSheet[id] = true
		if prev, ok := prevByKey[id]; ok && prev.PromotedRef != "" && prev.SourceHash != termRowHash(row) {
			res.Rejected = append(res.Rejected, port.TermSheetRowError{RowKey: fmt.Sprintf("row-%d", row.RowNo), Code: "promoted",
				Detail: "this fact already promoted a draft record and cannot change"})
		}
	}
	for _, line := range existing { // stored order keeps the rejections deterministic
		if line.DocumentVersionID == version && line.PromotedRef != "" && !inSheet[rowIdentity{line.Field, line.RowKey}] {
			res.Rejected = append(res.Rejected, port.TermSheetRowError{RowKey: line.Field.String() + ":" + line.RowKey, Code: "promoted",
				Detail: "this fact already promoted a draft record and must stay in the sheet"})
		}
	}
	if len(res.Rejected) > 0 {
		return nil
	}
	lines := make([]matter.TermLine, 0, len(rows))
	for _, row := range rows {
		rowHash := termRowHash(row)
		prev, ok := prevByKey[rowIdentity{row.Field, row.RowKey}]
		if ok && prev.SourceHash == rowHash {
			res.Unchanged++
			lines = append(lines, prev)
			continue
		}
		line := matter.TermLine{
			ID: matter.TermLineID(env.ids.NewRecordID()), MatterID: mID, DocumentVersionID: version,
			Field: row.Field, ValueText: row.ValueText, ValueDate: row.ValueDate, RowKey: row.RowKey,
			SourceHash: rowHash, ImportedBy: env.actor, CreatedAt: env.tCmd, UpdatedAt: env.tCmd, Revision: 1,
		}
		if err := line.Validate(); err != nil {
			return err
		}
		lines = append(lines, line)
		res.Created++
	}
	res.Replaced = len(prevByKey) - res.Unchanged
	if res.Created == 0 && res.Replaced == 0 {
		return nil
	}
	if err := tt.ReplaceTermLinesOfDocumentVersion(ctx, mID, version, lines); err != nil {
		return err
	}
	_, err = env.emit(ctx, "term_sheet.imported", "DOCUMENT_VERSION", version.String(), "", nil,
		map[string]int{"created": res.Created, "replaced": res.Replaced, "unchanged": res.Unchanged}, nil)
	return err
}

// termPromotionTitle composes the deterministic draft title of a promotion: "FIELD: value" with
// the date fields rendered as ISO dates. There is deliberately no length cap — normalizeText
// caps nothing and the fact's full value belongs in the draft title.
func termPromotionTitle(line matter.TermLine) string {
	value := line.ValueText
	if line.ValueDate != nil {
		value = line.ValueDate.UTC().Format("2006-01-02")
	}
	return fmt.Sprintf("%s: %s", line.Field.String(), value)
}

// termPromotionOutcome is the constant draft outcome: promotion creates a draft record from a
// fact; saying more would invent semantics the term sheet does not carry.
const termPromotionOutcome = "Drafted from the contract term sheet"

// createPromotionTarget creates the record one term line operationalizes, following the exact
// creation paths of the canonical services (context record, milestone, action, requirement —
// requirements keep the W1 event path so history replay keeps working). Returns the created
// reference and the last event sequence.
func (s *TermSheets) createPromotionTarget(ctx context.Context, env *workEnv, line matter.TermLine, key matter.IdempotencyKey) (string, int64, error) {
	kind := matter.PromotionTargetOf(line.Field)
	title := termPromotionTitle(line)
	switch kind {
	case matter.TermPromotesContextRecord:
		tx, err := ctxTx(env)
		if err != nil {
			return "", 0, err
		}
		rec, err := matter.NewContextRecord(env.ids.NewRecordID(), env.header.MatterID, matter.ContextEntity, title, termPromotionOutcome, nil, env.actor, env.tCmd)
		if err != nil {
			return "", 0, err
		}
		if err := tx.InsertContextRecord(ctx, rec); err != nil {
			return "", 0, err
		}
		seq, err := env.emit(ctx, "context.created", "CONTEXT_RECORD", rec.ID, "", nil, contextSnapshot(rec), nil)
		if err != nil {
			return "", 0, err
		}
		return rec.ID, seq, nil
	case matter.TermPromotesMilestone:
		name, err := matter.NewDisplayName(title, "name")
		if err != nil {
			return "", 0, err
		}
		m := matter.Milestone{ID: matter.MilestoneID(env.ids.NewRecordID()), MatterID: env.header.MatterID, Name: name, DueAt: line.ValueDate, Revision: 1}
		if err := env.g.InsertMilestone(ctx, m); err != nil {
			return "", 0, err
		}
		seq, err := env.emit(ctx, "milestone.created", "MILESTONE", m.ID.String(), "", nil, map[string]any{"name": name, "critical": m.Critical}, nil)
		if err != nil {
			return "", 0, err
		}
		return m.ID.String(), seq, nil
	case matter.TermPromotesAction:
		nodeID, err := matter.NewNodeID(env.ids.NewRecordID())
		if err != nil {
			return "", 0, err
		}
		item, err := matter.NewAction(nodeID, env.header.MatterID, title, termPromotionOutcome)
		if err != nil {
			return "", 0, err
		}
		if err := env.g.InsertAction(ctx, item); err != nil {
			return "", 0, err
		}
		seq, err := env.emit(ctx, "action.created", "ACTION", item.ID.String(), "", nil, itemSnapshot(item), nil)
		if err != nil {
			return "", 0, err
		}
		return item.ID.String(), seq, nil
	default: // TermPromotesRequirement — the W1 event path (design §2.2; playbook-apply convention)
		nodeID, err := matter.NewNodeID(env.ids.NewRecordID())
		if err != nil {
			return "", 0, err
		}
		req, err := matter.NewRequirement(matter.RequirementID(nodeID), env.header.MatterID, title, termPromotionOutcome)
		if err != nil {
			return "", 0, err
		}
		if err := env.tx.InsertNode(ctx, matter.Node{ID: nodeID, MatterID: env.header.MatterID, Kind: matter.NodeRequirement}); err != nil {
			return "", 0, err
		}
		if err := env.tx.InsertRequirement(ctx, req); err != nil {
			return "", 0, err
		}
		env.seq++
		if err := env.tx.AppendRequirementCreated(ctx, matter.RequirementCreatedEvent{
			EventID: env.ids.NewRecordID(), MatterID: env.header.MatterID, TargetID: matter.RequirementID(nodeID),
			Actor: env.actor, IdempotencyKey: key, Seq: env.seq, EffectiveAt: env.tCmd, RecordedAt: env.tCmd, Requirement: req,
		}); err != nil {
			return "", 0, err
		}
		return nodeID.String(), env.seq, nil
	}
}

// PromoteTermLine creates the DRAFT record one term line operationalizes, under the fixed
// field→target mapping. Receipted and atomic: the created record and the line's promotion link
// commit together, the same key replays the stored outcome, and an already-promoted line is
// rejected. Promotion completes and verifies nothing.
func (s *TermSheets) PromoteTermLine(ctx context.Context, cmd port.PromoteTermLineCmd) (port.PromotedTermLine, error) {
	actor, key, hash, err := parseReceiptInputs(cmd.ActorID, cmd.IdempotencyKey, cmd.RequestHash)
	if err != nil {
		return port.PromotedTermLine{}, err
	}
	lineID, err := matter.NewTermLineID(cmd.TermLineID)
	if err != nil {
		return port.PromotedTermLine{}, err
	}
	var out port.PromotedTermLine
	err = s.w.execute(ctx, cmd.ActorID, cmd.MatterID, "PROMOTE_TERM_LINE", policy.DecideCreateRequirement, func(env *workEnv) error {
		tt, err := matterTermSheetTx(env.tx)
		if err != nil {
			return err
		}
		created, err := s.w.createdReceipt(ctx, env, actor, key, hash, func() (matter.CreatedResult, error) {
			if cmd.ExpectedRevision == 0 {
				return matter.CreatedResult{}, port.ErrPreconditionRequired
			}
			line, err := tt.LoadTermLine(ctx, env.header.MatterID, lineID)
			if err != nil {
				return matter.CreatedResult{}, err
			}
			if line.Revision != cmd.ExpectedRevision {
				return matter.CreatedResult{}, port.ErrVersionConflict
			}
			if line.PromotedRef != "" {
				return matter.CreatedResult{}, &matter.RejectedError{Code: "term-already-promoted",
					Message: "this term line already promoted its draft record"}
			}
			ref, seq, err := s.createPromotionTarget(ctx, env, line, key)
			if err != nil {
				return matter.CreatedResult{}, err
			}
			if err := tt.MarkTermLinePromoted(ctx, env.header.MatterID, lineID, ref, matter.PromotionTargetOf(line.Field), env.tCmd); err != nil {
				return matter.CreatedResult{}, err
			}
			return matter.CreatedResult{Kind: matter.PromotionTargetOf(line.Field).String(), ID: ref, Seq: seq}, nil
		})
		if err != nil {
			return err
		}
		out = port.PromotedTermLine{
			LineID: lineID, TargetID: created.ID, TargetKind: matter.TermPromotionKind(created.Kind), Replayed: created.Replayed,
		}
		if created.Replayed {
			graph, err := env.g.LoadGraph(ctx)
			if err != nil {
				return err
			}
			out.TargetMissing = !promotionTargetPresent(graph, out.TargetKind, created.ID)
		}
		return nil
	})
	if err != nil {
		return port.PromotedTermLine{}, err
	}
	return out, nil
}

// Only an authorized read of the Matter graph can confirm that a receipted draft is gone.
func promotionTargetPresent(graph matter.WorkGraph, kind matter.TermPromotionKind, id string) bool {
	switch kind {
	case matter.TermPromotesContextRecord:
		return slices.ContainsFunc(graph.Context.Records, func(record matter.ContextRecord) bool { return record.ID == id })
	case matter.TermPromotesMilestone:
		return slices.ContainsFunc(graph.Milestones, func(record matter.Milestone) bool { return record.ID.String() == id })
	default:
		_, found := graph.Item(matter.NodeID(id))
		return found
	}
}
