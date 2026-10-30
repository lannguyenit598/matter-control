package service

import (
	"context"
	"crypto/sha256"
	"encoding/hex"
	"encoding/json"
	"errors"
	"fmt"
	"sort"
	"strings"
	"time"

	"github.com/example/userapi/internal/core/domain/matter"
	"github.com/example/userapi/internal/core/policy"
	"github.com/example/userapi/internal/core/port"
)

// DataOpsService implements the W6 data operations (contract §2.7): scoped bulk edit
// with per-row receipts, RULE-014 import via the import_sources registry, scoped
// export and the (t1,t2] delta brief with event-replay outstanding-at-t2.
type DataOpsService struct {
	store     port.WorkspaceStore
	ids       port.RecordIDGenerator
	codec     port.SheetCodec
	maxRows   int
	maxCells  int
	maxBytes  int64
	expandCap int64
}

func NewDataOpsService(store port.WorkspaceStore, ids port.RecordIDGenerator, codec port.SheetCodec, logger any) *DataOpsService {
	return &DataOpsService{store: store, ids: ids, codec: codec, maxRows: 5000, maxCells: 10000, maxBytes: 8 << 20, expandCap: 3}
}

// ---------- helpers ----------

func rowSetHash(r port.BulkRowChange) string {
	r.IdempotencyKey = ""
	b, _ := json.Marshal(r)
	return sha256Hex(b)
}

func applyRowToItem(it matter.WorkItem, r port.BulkRowChange, memberExists func(matter.ActorID) (bool, error)) (matter.WorkItem, error) {
	if r.Title != nil {
		if strings.TrimSpace(*r.Title) == "" {
			return it, fmt.Errorf("title must not be blank")
		}
		it.Title = *r.Title
	}
	if r.Description != nil {
		// The approved bulk allowlist field "description" maps to the work item's
		// outcome text (its description/outcome statement).
		if strings.TrimSpace(*r.Description) == "" {
			return it, fmt.Errorf("description must not be blank")
		}
		it.Outcome = *r.Description
	}
	if r.InternalOwner != nil {
		if *r.InternalOwner == "" {
			it.OwnerActorID = nil
		} else {
			id := matter.ActorID(*r.InternalOwner)
			ok, err := memberExists(id)
			if err != nil {
				return it, err
			}
			if !ok {
				return it, fmt.Errorf("internal owner is not an ACTIVE matter member")
			}
			cp := id
			it.OwnerActorID = &cp
		}
	}
	if r.Due != nil {
		if *r.Due == "" {
			it.DueAt = nil
		} else {
			t, err := time.Parse(time.RFC3339, *r.Due)
			if err != nil {
				return it, fmt.Errorf("due must be RFC 3339 with offset")
			}
			it.DueAt = &t
		}
	}
	return it, nil
}

// ---------- bulk ----------

// BulkPreview validates requested changes against the current authorized snapshot
// without any mutation.
func (s *DataOpsService) BulkPreview(ctx context.Context, cmd port.BulkPreviewCmd) (matter.BulkPreviewResult, error) {
	actor, err := matter.NewActorID(cmd.ActorID)
	if err != nil {
		return matter.BulkPreviewResult{}, err
	}
	matterID, err := matter.NewMatterID(cmd.MatterID)
	if err != nil {
		return matter.BulkPreviewResult{}, err
	}
	var out matter.BulkPreviewResult
	err = s.store.View(ctx, func(snap port.MatterSnapshot) error {
		header, herr := snap.MatterHeader(ctx, matterID)
		if herr != nil {
			return herr
		}
		ws, wsErr := snap.WorkspaceMembership(ctx, header.WorkspaceID, actor)
		mm, mmErr := snap.MatterMembership(ctx, matterID, actor)
		access, aerr := accessFrom(ws, wsErr, mm, mmErr)
		if aerr != nil {
			return aerr
		}
		if d := policy.DecideCreateRequirement(access); !d.Allowed {
			if d.Hidden {
				return port.ErrNotFound
			}
			return port.ErrForbidden
		}
		gtx, ok := snap.(port.WorkGraphSnapshot)
		if !ok {
			return fmt.Errorf("snapshot does not support the work graph")
		}
		g, err := gtx.LoadGraph(ctx, matterID)
		if err != nil {
			return err
		}
		out.AsOf = snap.AsOf()
		for _, r := range cmd.Rows {
			row := matter.BulkPreviewRow{RowKey: r.RowKey, ItemID: r.ItemID}
			it, ferr := findItem(g, r.ItemID)
			if ferr != nil {
				row.Code = "unknown-item"
				out.Rows = append(out.Rows, row)
				continue
			}
			row.Found = true
			row.Title = it.Title
			row.Outcome = it.Outcome
			row.Revision = it.Revision
			if it.OwnerActorID != nil {
				o := it.OwnerActorID.String()
				row.Owner = &o
			}
			row.Due = it.DueAt
			// Authorization for this row: any EDITOR+ may bulk-edit.
			if d := policy.DecideCreateRequirement(access); !d.Allowed {
				row.Code = "role"
			} else if _, aerr := applyRowToItem(it, r, func(a matter.ActorID) (bool, error) {
				mm, merr := snap.MatterMembership(ctx, matterID, a)
				if merr != nil {
					if errors.Is(merr, port.ErrNotFound) {
						return false, nil
					}
					return false, merr
				}
				return mm.Status == matter.StatusActive, nil
			}); aerr != nil {
				row.Code = "validation"
				row.Code = "validation: " + aerr.Error()
			} else if r.ExpectedRevision != it.Revision {
				row.Code = "stale"
			} else {
				row.Valid = true
			}
			out.Rows = append(out.Rows, row)
		}
		return nil
	})
	if err != nil {
		return matter.BulkPreviewResult{}, err
	}
	b, _ := json.Marshal(out)
	out.PreviewID = sha256Hex(b)
	return out, nil
}

func sha256Hex(b []byte) string {
	h := sha256.Sum256(b)
	return hex.EncodeToString(h[:])
}

// BulkCommit applies each row atomically in its own matter transaction with a per-row
// receipt (attempt grouping is a client label). Rows fail independently; a lost
// commit acknowledgement yields UNKNOWN for that row only.
func (s *DataOpsService) BulkCommit(ctx context.Context, cmd port.BulkCommitCmd) ([]matter.BulkRowResult, error) {
	actor, err := matter.NewActorID(cmd.ActorID)
	if err != nil {
		return nil, err
	}
	matterID, err := matter.NewMatterID(cmd.MatterID)
	if err != nil {
		return nil, err
	}
	attempt := strings.TrimSpace(cmd.AttemptKey)
	if attempt == "" {
		return nil, fmt.Errorf("attemptKey must not be empty")
	}
	results := make([]matter.BulkRowResult, 0, len(cmd.Rows))
	for _, r := range cmd.Rows {
		row := matter.BulkRowResult{RowKey: r.RowKey, ItemID: r.ItemID}
		key, kerr := matter.NewIdempotencyKey(r.IdempotencyKey)
		if kerr != nil {
			row.Status = matter.BulkRowFailure
			row.Code = "validation"
			row.Detail = "row idempotency key must be a UUIDv7"
			results = append(results, row)
			continue
		}
		sethash := rowSetHash(r)
		err = s.store.Execute(ctx, matterID, func(tx port.MatterTx) error {
			header := tx.Matter()
			tCmd := tx.TCmd()
			// Receipt first: replay skips CAS and authorization re-checks only after
			// the saved scope is still readable (BE01-F01 rule).
			rcpt, rcptErr := tx.Receipt(ctx, actor, key)
			if rcptErr != nil && !errors.Is(rcptErr, port.ErrNotFound) {
				return rcptErr
			}
			if rcptErr == nil {
				if err := authorizeReceiptScope(ctx, tx, actor, rcpt); err != nil {
					if !errors.Is(err, port.ErrNotFound) {
						return err
					}
					row.Status, row.Code, row.ItemID = matter.BulkRowFailure, "hidden", ""
					return nil
				}
				if rcpt.ScopeKind != matter.ScopeMatter || rcpt.MatterID == nil || *rcpt.MatterID != matterID || rcpt.WorkspaceID != header.WorkspaceID ||
					len(rcpt.Matters) != 1 || rcpt.Matters[0] != matterID || rcpt.Kind != matter.SnapshotBulkRowApplied || rcpt.BulkSnapshot == nil || rcpt.RequestHash.String() != sethash {
					row.Status = matter.BulkRowFailure
					row.Code = "key-reuse"
					row.Detail = "the row idempotency key was used for a different change"
					return nil
				}
				row.Status = matter.BulkRowReplayed
				row.ItemID = rcpt.BulkSnapshot.ItemID
				row.Revision = rcpt.BulkSnapshot.Revision
				return nil
			}

			gtx, ok := tx.(port.WorkGraphTx)
			if !ok {
				return fmt.Errorf("matter transaction does not support the work graph")
			}
			g, err := gtx.LoadGraph(ctx)
			if err != nil {
				return err
			}
			ws, wsErr := tx.WorkspaceMembership(ctx, header.WorkspaceID, actor)
			mm, mmErr := tx.MatterMembership(ctx, matterID, actor)
			access, aerr := accessFrom(ws, wsErr, mm, mmErr)
			if aerr != nil {
				return aerr
			}
			if d := policy.DecideCreateRequirement(access); !d.Allowed {
				row.Status = matter.BulkRowFailure
				if d.Hidden {
					row.Code = "unknown-item"
				} else {
					row.Code = "role"
				}
				return nil
			}
			it, ferr := findItem(g, r.ItemID)
			if ferr != nil {
				row.Status = matter.BulkRowFailure
				row.Code = "unknown-item"
				return nil
			}
			if it.Revision != r.ExpectedRevision {
				row.Status = matter.BulkRowFailure
				row.Code = "stale"
				row.Detail = fmt.Sprintf("item revision %d, expected %d", it.Revision, r.ExpectedRevision)
				return nil
			}
			updated, aerr := applyRowToItem(it, r, func(a matter.ActorID) (bool, error) {
				mm, merr := tx.MatterMembership(ctx, matterID, a)
				if merr != nil {
					if errors.Is(merr, port.ErrNotFound) {
						return false, nil
					}
					return false, merr
				}
				return mm.Status == matter.StatusActive, nil
			})
			if aerr != nil {
				row.Status = matter.BulkRowFailure
				row.Code = "validation"
				row.Detail = aerr.Error()
				return nil
			}
			if err := gtx.SaveWorkItem(ctx, updated, r.ExpectedRevision); err != nil {
				return err
			}
			updated.Revision = r.ExpectedRevision + 1
			seq := header.EventSeq + 1
			b, _ := json.Marshal(itemSnapshot(it))
			a, _ := json.Marshal(itemSnapshot(updated))
			if err := gtx.AppendWorkEvent(ctx, matter.WorkEvent{
				MatterID: matterID, Seq: seq, ID: s.ids.NewRecordID(), Type: "bulk.updated",
				TargetKind: string(updated.Kind), TargetID: updated.ID.String(), Actor: actor,
				Before: b, After: a, EffectiveAt: tCmd, RecordedAt: tCmd,
			}); err != nil {
				return err
			}
			if err := tx.CompleteMatter(ctx, seq, tCmd); err != nil {
				return err
			}
			snap := matter.BulkRowApplied{ItemID: updated.ID.String(), Kind: string(updated.Kind), Revision: updated.Revision, ContentHash: sethash}
			if err := tx.StoreReceipt(ctx, matter.Receipt{
				ActorID: actor, IdempotencyKey: key, RequestHash: matter.RequestHash(sethash),
				ScopeKind: matter.ScopeMatter, WorkspaceID: header.WorkspaceID, MatterID: &matterID,
				StatusCode: 200, CommittedAt: tCmd,
				Matters: []matter.MatterID{matterID}, Kind: matter.SnapshotBulkRowApplied,
				BulkSnapshot: &snap,
			}); err != nil {
				return err
			}
			row.Status = matter.BulkRowSuccess
			row.Revision = updated.Revision
			return tx.RecordSecurityAudit(ctx, matter.SecurityAuditEntry{
				EventID: s.ids.NewRecordID(), OccurredAt: tCmd, Actor: actor,
				Operation: "BULK_ROW", Outcome: "OK",
				RequestedResourceKind: string(updated.Kind), RequestedIDHash: matter.HashID(updated.ID.String()),
			})
		})
		if err != nil {
			if errors.Is(err, port.ErrOutcomeUnknown) {
				row.Status = matter.BulkRowUnknown
				row.Detail = "commit acknowledgement lost; resolve via the row receipt key"
			} else {
				row.Status = matter.BulkRowFailure
				row.Code = "storage"
				row.Detail = err.Error()
			}
		}
		results = append(results, row)
	}
	return results, nil
}

// ---------- import ----------

func (s *DataOpsService) ImportPreview(ctx context.Context, cmd port.ImportPreviewCmd) (matter.ImportPreviewResult, error) {
	actor, err := matter.NewActorID(cmd.ActorID)
	if err != nil {
		return matter.ImportPreviewResult{}, err
	}
	matterID, err := matter.NewMatterID(cmd.MatterID)
	if err != nil {
		return matter.ImportPreviewResult{}, err
	}
	var out matter.ImportPreviewResult
	err = s.store.View(ctx, func(snap port.MatterSnapshot) error {
		header, herr := snap.MatterHeader(ctx, matterID)
		if herr != nil {
			return herr
		}
		ws, wsErr := snap.WorkspaceMembership(ctx, header.WorkspaceID, actor)
		mm, mmErr := snap.MatterMembership(ctx, matterID, actor)
		access, aerr := accessFrom(ws, wsErr, mm, mmErr)
		if aerr != nil {
			return aerr
		}
		if d := policy.DecideCreateRequirement(access); !d.Allowed {
			if d.Hidden {
				return port.ErrNotFound
			}
			return port.ErrForbidden
		}
		gtx, ok := snap.(port.WorkGraphSnapshot)
		if !ok {
			return fmt.Errorf("snapshot does not support the work graph")
		}
		g, err := gtx.LoadGraph(ctx, matterID)
		if err != nil {
			return err
		}
		rows, perr := s.parseSheet(cmd, matterID, snap, g)
		out.SourceName = cmd.SourceName
		out.AsOf = snap.AsOf()
		out.Rows = rows
		if perr != nil {
			return perr
		}
		out.Groups = importGroups(rows)
		return nil
	})
	if err != nil {
		return matter.ImportPreviewResult{}, err
	}
	return out, nil
}

// parseSheet decodes and validates the uploaded sheet against the current graph.
func (s *DataOpsService) parseSheet(cmd port.ImportPreviewCmd, matterID matter.MatterID, snap port.MatterSnapshot, g matter.WorkGraph) ([]matter.ImportRowPlan, error) {
	if cmd.Format != "csv" && cmd.Format != "xlsx" {
		return nil, fmt.Errorf("%w: format must be csv or xlsx", port.ErrSheetInvalid)
	}
	if int64(len(cmd.Content)) > s.maxBytes {
		return nil, fmt.Errorf("%w: file exceeds the %d-byte local limit", port.ErrSheetInvalid, s.maxBytes)
	}
	table, err := s.codec.Decode(cmd.Format, strings.NewReader(string(cmd.Content)), s.maxBytes)
	if err != nil {
		return nil, fmt.Errorf("%w: %w", port.ErrSheetInvalid, err)
	}
	if len(table.Rows) < 1 {
		return nil, fmt.Errorf("%w: empty sheet", port.ErrSheetInvalid)
	}
	header := table.Rows[0]
	idx := map[string]int{}
	for i, h := range header {
		idx[strings.ToLower(strings.TrimSpace(h))] = i
	}
	for _, req := range []string{"rowkey", "kind", "title"} {
		if _, ok := idx[req]; !ok {
			return nil, fmt.Errorf("%w: missing required column %q", port.ErrSheetInvalid, req)
		}
	}
	if len(table.Rows)-1 > s.maxRows {
		return nil, fmt.Errorf("%w: sheet exceeds the %d-row local limit", port.ErrSheetInvalid, s.maxRows)
	}
	fileKeys := map[string]bool{}
	for _, raw := range table.Rows[1:] {
		if j := idx["rowkey"]; j < len(raw) {
			fileKeys[strings.TrimSpace(raw[j])] = true
		}
	}
	seenKeys := map[string]bool{}
	var rows []matter.ImportRowPlan
	for _, raw := range table.Rows[1:] {
		cell := func(name string) string {
			j, ok := idx[name]
			if !ok || j >= len(raw) {
				return ""
			}
			return strings.TrimSpace(raw[j])
		}
		plan := matter.ImportRowPlan{RowKey: cell("rowkey"), Kind: strings.ToUpper(cell("kind"))}
		plan.Title = cell("title")
		plan.Outcome = cell("description")
		if plan.Outcome == "" {
			plan.Outcome = cell("outcome")
		}
		if o := cell("internalowner"); o != "" {
			plan.Owner = &o
		}
		if d := cell("due"); d != "" {
			t, terr := time.Parse(time.RFC3339, d)
			if terr != nil {
				plan.Errors = append(plan.Errors, "due must be RFC 3339 with offset")
			} else {
				plan.Due = &t
			}
		}
		if plan.RowKey == "" {
			plan.Errors = append(plan.Errors, "rowkey must not be blank")
		} else if seenKeys[plan.RowKey] {
			plan.Errors = append(plan.Errors, "duplicate rowkey in file")
		}
		seenKeys[plan.RowKey] = true
		if plan.Kind != "REQUIREMENT" && plan.Kind != "ACTION" {
			plan.Errors = append(plan.Errors, "kind must be REQUIREMENT or ACTION")
		}
		if plan.Title == "" {
			plan.Errors = append(plan.Errors, "title must not be blank")
		}
		if plan.Owner != nil {
			mm, mmErr := snapMatterMember(snap, matterID, matter.ActorID(*plan.Owner))
			if mmErr != nil {
				if !errors.Is(mmErr, port.ErrNotFound) {
					return nil, mmErr
				}
				plan.Errors = append(plan.Errors, "internalowner is not an ACTIVE matter member")
			} else if mm.Status != matter.StatusActive {
				plan.Errors = append(plan.Errors, "internalowner is not an ACTIVE matter member")
			}
		}
		if deps := cell("dependencies"); deps != "" {
			for _, d := range strings.Split(deps, ";") {
				d = strings.TrimSpace(d)
				if d == "" {
					continue
				}
				// A reference names a row key of this file (resolved to the imported item
				// at commit) or an existing item of the matter; a row key wins.
				switch _, ferr := findItem(g, d); {
				case d == plan.RowKey:
					plan.Errors = append(plan.Errors, "a row cannot depend on itself")
				case fileKeys[d]:
				case ferr != nil:
					plan.Errors = append(plan.Errors, "dependency "+d+" is neither a row key of this file nor an existing item")
				}
				plan.Dependencies = append(plan.Dependencies, d)
			}
		}
		b, _ := json.Marshal(struct {
			Kind, Title, Outcome string
			Owner                *string
			Due                  *time.Time
			Dependencies         []string
		}{plan.Kind, plan.Title, plan.Outcome, plan.Owner, plan.Due, plan.Dependencies})
		plan.ContentHash = sha256Hex(b)
		rows = append(rows, plan)
	}
	markImportCycles(rows)
	return rows, nil
}

// markImportCycles flags every row that lies on a dependency cycle among the file's own rows, so
// the connected group is rejected whole before any mutation.
func markImportCycles(rows []matter.ImportRowPlan) {
	at := map[string]int{}
	for i, r := range rows {
		if _, dup := at[r.RowKey]; !dup {
			at[r.RowKey] = i
		}
	}
	const (
		visiting = 1
		done     = 2
	)
	state := map[int]int{}
	var stack []int
	var visit func(i int)
	visit = func(i int) {
		state[i] = visiting
		stack = append(stack, i)
		for _, d := range rows[i].Dependencies {
			j, ok := at[d]
			if !ok || j == i {
				continue
			}
			switch state[j] {
			case visiting:
				for k := len(stack) - 1; k >= 0; k-- {
					rows[stack[k]].Errors = append(rows[stack[k]].Errors, "dependency cycle through row "+rows[j].RowKey)
					if stack[k] == j {
						break
					}
				}
			case 0:
				visit(j)
			}
		}
		stack = stack[:len(stack)-1]
		state[i] = done
	}
	for i := range rows {
		if state[i] == 0 {
			visit(i)
		}
	}
}

// importGroups computes connected components over dependency references between rows
// of the file (references to existing items are not group-forming).
func importGroups(rows []matter.ImportRowPlan) []matter.ImportGroup {
	// union-find over row indexes
	parent := map[int]int{}
	idx := map[string]int{}
	for i, r := range rows {
		parent[i] = i
		idx[r.RowKey] = i
	}
	findRoot := func(x int) int {
		for parent[x] != x {
			parent[x] = parent[parent[x]]
			x = parent[x]
		}
		return x
	}
	union := func(a, b int) {
		ra, rb := findRoot(a), findRoot(b)
		if ra != rb {
			parent[ra] = rb
		}
	}
	for i, r := range rows {
		for _, d := range r.Dependencies {
			if j, ok := idx[d]; ok {
				union(i, j)
			}
		}
	}
	byRoot := map[int][]int{}
	var order []int
	for i := range rows {
		r := findRoot(i)
		if _, ok := byRoot[r]; !ok {
			order = append(order, r)
		}
		byRoot[r] = append(byRoot[r], i)
	}
	var groups []matter.ImportGroup
	for n, root := range order {
		members := byRoot[root]
		valid := true
		for _, i := range members {
			if len(rows[i].Errors) > 0 {
				valid = false
			}
		}
		groups = append(groups, matter.ImportGroup{ID: n + 1, RowIdx: members, Valid: valid})
	}
	return groups
}

// ImportCommit re-parses server-side and commits each connected group in ONE transaction: the
// group's rows, their dependency edges (row keys resolved to the persisted item ids) and the
// derived dependency state land together or not at all. An invalid group is rejected whole while
// independent valid groups still succeed. Per-row receipts carry lost-response recovery; the
// import_sources registry carries RULE-014 dedupe.
func (s *DataOpsService) ImportCommit(ctx context.Context, cmd port.ImportCommitCmd) ([]matter.ImportRowResult, error) {
	actor, err := matter.NewActorID(cmd.ActorID)
	if err != nil {
		return nil, err
	}
	matterID, err := matter.NewMatterID(cmd.MatterID)
	if err != nil {
		return nil, err
	}
	if _, err := matter.NewIdempotencyKey(cmd.RunKey); err != nil {
		return nil, fmt.Errorf("runKey must be a UUIDv7: %w", err)
	}
	// Server-authoritative re-parse.
	preview, err := s.ImportPreview(ctx, port.ImportPreviewCmd{ActorID: cmd.ActorID, MatterID: cmd.MatterID, SourceName: cmd.SourceName, Format: cmd.Format, Content: cmd.Content})
	if err != nil {
		return nil, err
	}
	results := make([]matter.ImportRowResult, len(preview.Rows))
	for i := range preview.Rows {
		results[i] = matter.ImportRowResult{RowKey: preview.Rows[i].RowKey}
	}
	for _, grp := range preview.Groups {
		if !grp.Valid {
			for _, i := range grp.RowIdx {
				results[i].Status, results[i].Code = matter.ImportRowFailure, "group-rejected"
				results[i].Detail = strings.Join(preview.Rows[i].Errors, "; ")
			}
			continue
		}
		s.commitImportGroup(ctx, actor, matterID, cmd, preview, s.orderRows(preview, grp), results)
	}
	return results, nil
}

// orderRows returns group row indexes in dependency order (referenced rows first).
func (s *DataOpsService) orderRows(preview matter.ImportPreviewResult, grp matter.ImportGroup) []int {
	byKey := map[string]int{}
	for _, i := range grp.RowIdx {
		byKey[preview.Rows[i].RowKey] = i
	}
	visited := map[int]bool{}
	var ordered []int
	var visit func(int)
	visit = func(i int) {
		if visited[i] {
			return
		}
		visited[i] = true
		for _, d := range preview.Rows[i].Dependencies {
			if j, ok := byKey[d]; ok && !visited[j] {
				visit(j)
			}
		}
		ordered = append(ordered, i)
	}
	for _, i := range grp.RowIdx {
		visit(i)
	}
	return ordered
}

func (s *DataOpsService) lookupImportSource(ctx context.Context, tx port.MatterTx, matterID matter.MatterID, sourceName, rowKey string) (*matter.ImportSource, error) {
	reg, ok := tx.(port.ImportRegistry)
	if !ok {
		return nil, fmt.Errorf("matter transaction does not support the import registry")
	}
	res, err := reg.FindImportSource(ctx, matterID, sourceName, rowKey)
	if err != nil {
		if errors.Is(err, port.ErrNotFound) {
			return nil, nil // absent: first import of this source identity + row key
		}
		return nil, err
	}
	return res, nil
}

func (s *DataOpsService) registerImportSource(ctx context.Context, tx port.MatterTx, matterID matter.MatterID, sourceName, rowKey, itemID, contentHash string, at time.Time) error {
	reg, ok := tx.(port.ImportRegistry)
	if !ok {
		return fmt.Errorf("matter transaction does not support the import registry")
	}
	return reg.RegisterImportSource(ctx, matter.ImportSource{
		MatterID: matterID, SourceName: sourceName, RowKey: rowKey,
		ItemID: itemID, ContentHash: contentHash, FirstImportedAt: at,
	})
}

// importAbort rolls the whole group transaction back and names the row that caused it.
type importAbort struct{ row, code, detail string }

func (e *importAbort) Error() string { return e.row + ": " + e.code + ": " + e.detail }

// importRowKeyOf parses the caller's per-row idempotency key for a row.
func importRowKeyOf(cmd port.ImportCommitCmd, rowKey string) (matter.IdempotencyKey, *importAbort) {
	raw, ok := cmd.RowKeys[rowKey]
	if !ok {
		return "", &importAbort{rowKey, "validation", "missing per-row idempotency key"}
	}
	key, err := matter.NewIdempotencyKey(raw)
	if err != nil {
		return "", &importAbort{rowKey, "validation", "row idempotency key must be a UUIDv7"}
	}
	return key, nil
}

// commitImportGroup applies one connected group (rows already in dependency order) in a single
// matter transaction and records each row's outcome in results.
func (s *DataOpsService) commitImportGroup(ctx context.Context, actor matter.ActorID, matterID matter.MatterID, cmd port.ImportCommitCmd, preview matter.ImportPreviewResult, order []int, results []matter.ImportRowResult) {
	setAll := func(status matter.ImportRowStatus, code, detail string) {
		for _, i := range order {
			results[i].Status, results[i].Code, results[i].Detail = status, code, detail
		}
	}
	xerr := s.store.Execute(ctx, matterID, func(tx port.MatterTx) error {
		header, tCmd := tx.Matter(), tx.TCmd()
		// Rights are re-checked at the mutation boundary: access may have changed since the preview.
		ws, wsErr := tx.WorkspaceMembership(ctx, header.WorkspaceID, actor)
		mm, mmErr := tx.MatterMembership(ctx, matterID, actor)
		access, err := accessFrom(ws, wsErr, mm, mmErr)
		if err != nil {
			return err
		}
		if d := policy.DecideCreateRequirement(access); !d.Allowed {
			code := "forbidden"
			if d.Hidden {
				code = "not-found"
			}
			setAll(matter.ImportRowFailure, code, "access to import into this matter was withdrawn")
			return tx.RecordSecurityAudit(ctx, matter.SecurityAuditEntry{
				EventID: s.ids.NewRecordID(), OccurredAt: tCmd, Actor: actor,
				Operation: "IMPORT_GROUP", Outcome: "DENIED", RequestedResourceKind: "MATTER", RequestedIDHash: matter.HashID(matterID.String()),
			})
		}
		if header.BoundaryDueAt(tCmd) {
			return matter.ErrBoundaryDue
		}
		gtx, ok := tx.(port.WorkGraphTx)
		if !ok {
			return fmt.Errorf("matter transaction does not support the work graph")
		}
		g, err := gtx.LoadGraph(ctx)
		if err != nil {
			return err
		}

		// Classify every row before any mutation: replay (RULE-014 registry or row receipt),
		// conflict (same identity, changed content) or fresh.
		itemOf := map[string]matter.NodeID{}
		keys := map[string]matter.IdempotencyKey{}
		replayed := map[string]bool{}
		for _, i := range order {
			plan := preview.Rows[i]
			key, abort := importRowKeyOf(cmd, plan.RowKey)
			if abort != nil {
				return abort
			}
			keys[plan.RowKey] = key
			rcpt, rerr := tx.Receipt(ctx, actor, key)
			if rerr != nil && !errors.Is(rerr, port.ErrNotFound) {
				return rerr
			}
			if rerr == nil {
				if err := authorizeReceiptScope(ctx, tx, actor, rcpt); err != nil {
					if errors.Is(err, port.ErrNotFound) {
						return &importAbort{plan.RowKey, "not-found", "resource not found"}
					}
					return err
				}
				if rcpt.ScopeKind != matter.ScopeMatter || rcpt.MatterID == nil || *rcpt.MatterID != matterID || rcpt.WorkspaceID != header.WorkspaceID ||
					len(rcpt.Matters) != 1 || rcpt.Matters[0] != matterID || rcpt.Kind != matter.SnapshotImportRowApplied || rcpt.ImportSnapshot == nil ||
					rcpt.ImportSnapshot.SourceName != cmd.SourceName || rcpt.ImportSnapshot.RowKey != plan.RowKey || rcpt.ImportSnapshot.ContentHash != plan.ContentHash {
					return &importAbort{plan.RowKey, "key-reuse", "the row idempotency key was used for a different import"}
				}
				itemOf[plan.RowKey], replayed[plan.RowKey] = matter.NodeID(rcpt.ImportSnapshot.ItemID), true
				results[i].ItemID, results[i].ContentHash = rcpt.ImportSnapshot.ItemID, rcpt.ImportSnapshot.ContentHash
				continue
			}
			existing, gerr := s.lookupImportSource(ctx, tx, matterID, cmd.SourceName, plan.RowKey)
			if gerr != nil {
				return gerr
			}
			if existing != nil {
				if existing.ContentHash != plan.ContentHash {
					return &importAbort{plan.RowKey, "content-conflict", "source identity and row key already imported with different content"}
				}
				itemOf[plan.RowKey], replayed[plan.RowKey] = matter.NodeID(existing.ItemID), true
				results[i].ItemID, results[i].ContentHash = existing.ItemID, existing.ContentHash
			}
		}

		env := &workEnv{tx: tx, g: gtx, header: header, tCmd: tCmd, actor: actor, role: mm.Role, seq: header.EventSeq, ids: s.ids}
		stored := cloneGraph(g)
		fresh := false
		for _, i := range order {
			plan := preview.Rows[i]
			if replayed[plan.RowKey] {
				continue
			}
			fresh = true
			if plan.Owner != nil {
				if omm, oerr := tx.MatterMembership(ctx, matterID, matter.ActorID(*plan.Owner)); oerr != nil || omm.Status != matter.StatusActive {
					return &importAbort{plan.RowKey, "validation", "internalowner is not an ACTIVE matter member"}
				}
			}
			itemID := matter.NodeID(s.ids.NewRecordID())
			item, ierr := s.insertImportItem(ctx, tx, gtx, matterID, itemID, plan)
			if ierr != nil {
				return ierr
			}
			stored.Items = append(stored.Items, item)
			itemOf[plan.RowKey] = itemID
			// Resolve each reference to a persisted item id (a row key of this file, else an existing item).
			for _, d := range plan.Dependencies {
				src, found := itemOf[d]
				if !found {
					ex, ferr := findItem(g, d)
					if ferr != nil {
						return &importAbort{plan.RowKey, "validation", "dependency " + d + " does not exist"}
					}
					src = ex.ID
				}
				if verr := matter.ValidateNewEdge(stored.Items, stored.Edges, src, itemID, matter.GateCompletion); verr != nil {
					return &importAbort{plan.RowKey, "validation", verr.Error()}
				}
				edge := matter.Edge{ID: s.ids.NewRecordID(), MatterID: matterID, Source: src, Target: itemID, Gate: matter.GateCompletion}
				if err := gtx.InsertEdge(ctx, edge); err != nil {
					return err
				}
				stored.Edges = append(stored.Edges, edge)
			}
			if _, err := env.emit(ctx, "import."+strings.ToLower(plan.Kind)+".created", string(item.Kind), itemID.String(), "", nil, itemSnapshot(item), nil); err != nil {
				return err
			}
		}
		if fresh {
			// Derived dependency state of the imported items (and anything they now gate).
			updated := cloneGraph(stored)
			applyDerived(&updated, tCmd)
			if err := persistGraph(ctx, env, stored, updated, "", env.seq); err != nil {
				return err
			}
			if err := tx.CompleteMatter(ctx, env.seq, tCmd); err != nil {
				return err
			}
		}
		for _, i := range order {
			plan := preview.Rows[i]
			if replayed[plan.RowKey] {
				continue
			}
			itemID := itemOf[plan.RowKey]
			if err := s.registerImportSource(ctx, tx, matterID, cmd.SourceName, plan.RowKey, itemID.String(), plan.ContentHash, tCmd); err != nil {
				return err
			}
			snap := matter.ImportRowApplied{ItemID: itemID.String(), Kind: plan.Kind, RowKey: plan.RowKey, SourceName: cmd.SourceName, ContentHash: plan.ContentHash, Revision: 1, RecordedAt: tCmd}
			if err := tx.StoreReceipt(ctx, matter.Receipt{
				ActorID: actor, IdempotencyKey: keys[plan.RowKey], RequestHash: matter.RequestHash(sha256Hex([]byte(plan.ContentHash + "|" + plan.RowKey))),
				ScopeKind: matter.ScopeMatter, WorkspaceID: header.WorkspaceID, MatterID: &matterID,
				StatusCode: 201, CommittedAt: tCmd,
				Matters: []matter.MatterID{matterID}, Kind: matter.SnapshotImportRowApplied,
				ImportSnapshot: &snap,
			}); err != nil {
				return err
			}
			if err := tx.RecordSecurityAudit(ctx, matter.SecurityAuditEntry{
				EventID: s.ids.NewRecordID(), OccurredAt: tCmd, Actor: actor,
				Operation: "IMPORT_ROW", Outcome: "OK",
				RequestedResourceKind: plan.Kind, RequestedIDHash: matter.HashID(itemID.String()),
			}); err != nil {
				return err
			}
			results[i].Status, results[i].ItemID, results[i].ContentHash = matter.ImportRowSuccess, itemID.String(), plan.ContentHash
		}
		for _, i := range order {
			if replayed[preview.Rows[i].RowKey] {
				results[i].Status = matter.ImportRowReplayed
			}
		}
		return nil
	})
	var abort *importAbort
	switch {
	case xerr == nil:
	case errors.As(xerr, &abort):
		for _, i := range order {
			r := &results[i]
			r.Status, r.ItemID, r.ContentHash = matter.ImportRowFailure, "", ""
			if preview.Rows[i].RowKey == abort.row {
				r.Code, r.Detail = abort.code, abort.detail
			} else {
				r.Code, r.Detail = "group-rejected", "rolled back with row "+abort.row+": "+abort.detail
			}
		}
	case errors.Is(xerr, port.ErrOutcomeUnknown):
		// The commit boundary is the whole group: resolve every row through its receipt key.
		setAll(matter.ImportRowUnknown, "", "commit acknowledgement lost; retry the same row keys to resolve the group")
		for _, i := range order {
			results[i].ItemID, results[i].ContentHash = "", ""
		}
	default:
		setAll(matter.ImportRowFailure, "storage", "the group was rolled back by a storage error")
		for _, i := range order {
			results[i].ItemID, results[i].ContentHash = "", ""
		}
	}
}

// insertImportItem inserts one imported Requirement/Action, with its owner and due date, and
// returns it as stored.
func (s *DataOpsService) insertImportItem(ctx context.Context, tx port.MatterTx, gtx port.WorkGraphTx, matterID matter.MatterID, itemID matter.NodeID, plan matter.ImportRowPlan) (matter.WorkItem, error) {
	var item matter.WorkItem
	if plan.Kind == "REQUIREMENT" {
		req, rerr := matter.NewRequirement(matter.RequirementID(itemID), matterID, plan.Title, plan.Outcome)
		if rerr != nil {
			return item, &importAbort{plan.RowKey, "validation", rerr.Error()}
		}
		item = matter.WorkItem{
			ID: itemID, Kind: matter.NodeRequirement, MatterID: matterID,
			Title: req.Title, Outcome: req.Outcome,
			Execution: req.ExecutionState, Dependency: req.DependencyState,
			Verification: req.VerificationState, Applicability: req.VerificationApplicability,
			ProofRequired: true, ProofEpoch: req.ProofEpoch, Revision: req.Revision,
		}
		if err := tx.InsertNode(ctx, matter.Node{ID: itemID, MatterID: matterID, Kind: matter.NodeRequirement}); err != nil {
			return item, err
		}
		if err := tx.InsertRequirement(ctx, req); err != nil {
			return item, err
		}
	} else {
		item = matter.WorkItem{ID: itemID, Kind: matter.NodeAction, MatterID: matterID, Title: plan.Title, Outcome: plan.Outcome, Execution: matter.ExecutionNotStarted, Dependency: matter.DependencyReady, ProofRequired: false, Revision: 1}
		if err := gtx.InsertAction(ctx, item); err != nil {
			return item, err
		}
	}
	if plan.Owner != nil || plan.Due != nil {
		if plan.Owner != nil {
			id := matter.ActorID(*plan.Owner)
			item.OwnerActorID = &id
		}
		if plan.Due != nil {
			d := *plan.Due
			item.DueAt = &d
		}
		if err := gtx.SaveWorkItem(ctx, item, item.Revision); err != nil {
			return item, err
		}
		item.Revision++ // the store bumps the revision on every save
	}
	return item, nil
}

// ---------- export ----------

func (s *DataOpsService) Export(ctx context.Context, q port.ExportQuery) (matter.ExportResult, error) {
	actor, err := matter.NewActorID(q.ActorID)
	if err != nil {
		return matter.ExportResult{}, err
	}
	matterID, err := matter.NewMatterID(q.MatterID)
	if err != nil {
		return matter.ExportResult{}, err
	}
	if q.Format != "xlsx" && q.Format != "csv" {
		return matter.ExportResult{}, fmt.Errorf("format must be xlsx or csv")
	}
	var rows [][]string
	var asOf time.Time
	var rev int64
	err = s.store.View(ctx, func(snap port.MatterSnapshot) error {
		header, herr := snap.MatterHeader(ctx, matterID)
		if herr != nil {
			return herr
		}
		ws, wsErr := snap.WorkspaceMembership(ctx, header.WorkspaceID, actor)
		mm, mmErr := snap.MatterMembership(ctx, matterID, actor)
		access, aerr := accessFrom(ws, wsErr, mm, mmErr)
		if aerr != nil {
			return aerr
		}
		if d := policy.DecideReadRequirement(access); !d.Allowed {
			return port.ErrNotFound
		}
		gtx, ok := snap.(port.WorkGraphSnapshot)
		if !ok {
			return fmt.Errorf("snapshot does not support the work graph")
		}
		g, err := gtx.LoadGraph(ctx, matterID)
		if err != nil {
			return err
		}
		asOf, rev = snap.AsOf(), header.Revision
		rows = [][]string{{"id", "kind", "title", "description", "owner", "due", "execution", "dependency", "verification", "revision"}}
		items := append([]matter.WorkItem(nil), g.Items...)
		sort.Slice(items, func(i, j int) bool { return items[i].ID < items[j].ID })
		for _, it := range items {
			owner := ""
			if it.OwnerActorID != nil {
				owner = it.OwnerActorID.String()
			}
			due := ""
			if it.DueAt != nil {
				due = it.DueAt.Format(time.RFC3339)
			}
			rows = append(rows, []string{it.ID.String(), string(it.Kind), it.Title, it.Outcome, owner, due,
				string(it.Execution), string(it.Dependency), string(it.Verification), fmt.Sprint(it.Revision)})
		}
		return nil
	})
	if err != nil {
		return matter.ExportResult{}, err
	}
	return matter.ExportResult{Rows: rows, AsOf: asOf, Revision: rev}, nil
}

// ---------- brief ----------

func (s *DataOpsService) Brief(ctx context.Context, q port.BriefQuery) (matter.BriefResult, error) {
	actor, err := matter.NewActorID(q.ActorID)
	if err != nil {
		return matter.BriefResult{}, err
	}
	matterID, err := matter.NewMatterID(q.MatterID)
	if err != nil {
		return matter.BriefResult{}, err
	}
	if q.T2.Before(q.T1) {
		return matter.BriefResult{}, fmt.Errorf("%w: t2 must not precede t1", port.ErrInvalidBriefWindow)
	}
	var out matter.BriefResult
	err = s.store.View(ctx, func(snap port.MatterSnapshot) error {
		header, herr := snap.MatterHeader(ctx, matterID)
		if herr != nil {
			return herr
		}
		ws, wsErr := snap.WorkspaceMembership(ctx, header.WorkspaceID, actor)
		mm, mmErr := snap.MatterMembership(ctx, matterID, actor)
		access, aerr := accessFrom(ws, wsErr, mm, mmErr)
		if aerr != nil {
			return aerr
		}
		if d := policy.DecideReadRequirement(access); !d.Allowed {
			return port.ErrNotFound
		}
		if q.T2.After(snap.AsOf()) {
			// t2 beyond the read boundary would fabricate facts that no event carries yet.
			return fmt.Errorf("%w: t2 is after the read boundary", port.ErrInvalidBriefWindow)
		}
		dtx, ok := snap.(port.DataOpsSnapshot)
		if !ok {
			return fmt.Errorf("snapshot does not support W6 reads")
		}
		out = matter.BriefResult{MatterID: matterID, T1: q.T1, T2: q.T2, AsOf: snap.AsOf()}
		recs, err := dtx.EventsWindow(ctx, matterID, q.T1, q.T2)
		if err != nil {
			return err
		}
		for _, r := range recs {
			out.Changes = append(out.Changes, matter.BriefChange{
				Seq: r.Seq, ID: r.ID, Type: r.Type, TargetKind: r.TargetKind, TargetID: r.TargetID,
				ActorID: r.ActorID, Reason: r.Reason, RecordedAt: r.RecordedAt,
				EffectiveAt: r.EffectiveAt, LateRecorded: !r.EffectiveAt.After(q.T1),
			})
		}
		// Outstanding at t2: deterministic replay of the recorded history up to t2.
		all, err := dtx.EventsUpTo(ctx, matterID, q.T2)
		if err != nil {
			return err
		}
		out.Outstanding, err = replayBrief(all, q.T2)
		if err != nil {
			return err
		}
		return nil
	})
	if err != nil {
		return matter.BriefResult{}, err
	}
	return out, nil
}

// snapMatterMember reads one membership from a snapshot (import preview).
func snapMatterMember(snap port.MatterSnapshot, matterID matter.MatterID, actor matter.ActorID) (matter.MatterMembership, error) {
	return snap.MatterMembership(context.Background(), matterID, actor)
}
