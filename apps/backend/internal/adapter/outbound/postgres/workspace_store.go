package postgres

// W1 PostgreSQL adapter: workspace-scoped and creation transactions, matter membership
// administration, and the W1 read model. Same transaction contract as MatterStore:
// every command runs in one READ COMMITTED transaction after its anchor row is locked,
// every read in one REPEATABLE READ READ ONLY snapshot.

import (
	"context"
	"errors"
	"fmt"
	"time"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgtype"

	"github.com/example/userapi/internal/adapter/outbound/postgres/mcsqlc"
	"github.com/example/userapi/internal/core/domain/matter"
	"github.com/example/userapi/internal/core/port"
)

var (
	_ port.WorkspaceStore          = (*MatterStore)(nil)
	_ port.MatterMembershipAdminTx = (*pgMatterTx)(nil)
	_ port.MatterReadSnapshot      = (*pgSnapshot)(nil)
)

// maxPageLimit is the declared upper bound of a history or matter-list page; the
// contract advertises it in response metadata instead of capping silently.
const maxPageLimit = 200

// clampLimit bounds a caller limit to [1, maxPageLimit]; int32 because the generated
// queries take int32 and the bound makes the narrowing safe.
func clampLimit(limit int) int32 {
	if limit <= 0 || limit > maxPageLimit {
		return maxPageLimit
	}
	return int32(limit) //nolint:gosec // bounded by maxPageLimit above
}

// ExecuteWorkspace locks the workspace row FOR UPDATE and runs fn atomically.
func (s *MatterStore) ExecuteWorkspace(ctx context.Context, workspace matter.WorkspaceID, fn func(tx port.WorkspaceTx) error) error {
	if err := ctx.Err(); err != nil {
		return fmt.Errorf("workspace store: %w: %w", port.ErrUnavailable, err)
	}
	tx, err := s.pool.Begin(ctx)
	if err != nil {
		return mapMatterError(err)
	}
	defer func() { _ = tx.Rollback(ctx) }()

	q := mcsqlc.New(tx)
	row, err := q.LockWorkspace(ctx, workspace.String())
	if err != nil {
		return mapMatterError(err)
	}
	wtx := &pgWorkspaceTx{
		q:      q,
		header: matter.Workspace{ID: matter.WorkspaceID(row.WorkspaceID), Name: row.Name, Revision: row.Revision},
		wCmd:   row.WCmd.UTC(),
	}
	if err := fn(wtx); err != nil {
		return mapMatterError(err)
	}
	return s.commit(ctx, tx)
}

// ExecuteCreation runs fn for a command that creates its own workspace row. There is no
// row to lock; the receipt primary key serializes same-key racing creations.
func (s *MatterStore) ExecuteCreation(ctx context.Context, fn func(tx port.WorkspaceCreationTx) error) error {
	if err := ctx.Err(); err != nil {
		return fmt.Errorf("workspace store: %w: %w", port.ErrUnavailable, err)
	}
	tx, err := s.pool.Begin(ctx)
	if err != nil {
		return mapMatterError(err)
	}
	defer func() { _ = tx.Rollback(ctx) }()

	q := mcsqlc.New(tx)
	asOf, err := q.GetSnapshotAsOf(ctx)
	if err != nil {
		return mapMatterError(err)
	}
	if err := fn(&pgCreationTx{q: q, wCmd: asOf.UTC()}); err != nil {
		return mapMatterError(err)
	}
	return s.commit(ctx, tx)
}

// ---------- workspace transaction ----------

type pgWorkspaceTx struct {
	q      *mcsqlc.Queries
	header matter.Workspace
	wCmd   time.Time
}

func (t *pgWorkspaceTx) Workspace() matter.Workspace { return t.header }
func (t *pgWorkspaceTx) WCmd() time.Time             { return t.wCmd }

func (t *pgWorkspaceTx) WorkspaceMembershipOf(ctx context.Context, user matter.ActorID) (matter.WorkspaceMembership, error) {
	return workspaceMembershipForShare(ctx, t.q, t.header.ID, user)
}

func (t *pgWorkspaceTx) MatterMembership(ctx context.Context, m matter.MatterID, actor matter.ActorID) (matter.MatterMembership, error) {
	return matterMembershipForShare(ctx, t.q, m, actor)
}

func (t *pgWorkspaceTx) CountActiveWorkspaceOwners(ctx context.Context) (int, error) {
	n, err := t.q.CountActiveWorkspaceOwners(ctx, t.header.ID.String())
	return int(n), mapMatterError(err)
}

func (t *pgWorkspaceTx) InsertWorkspaceMembership(ctx context.Context, m matter.WorkspaceMembership) error {
	return insertWorkspaceMembership(ctx, t.q, m)
}

func (t *pgWorkspaceTx) UpdateWorkspaceMembershipStatus(ctx context.Context, user matter.ActorID, status matter.MembershipStatus, expectedRevision int64) (int64, error) {
	if t.header.Revision != expectedRevision {
		return 0, fmt.Errorf("workspace membership update: %w", port.ErrVersionConflict)
	}
	rev, err := t.q.UpdateWorkspaceMembershipStatus(ctx, mcsqlc.UpdateWorkspaceMembershipStatusParams{
		WorkspaceID: t.header.ID.String(), UserID: user.String(), Status: string(status), Revision: expectedRevision + 1,
	})
	if errors.Is(err, pgx.ErrNoRows) {
		return 0, fmt.Errorf("workspace membership update: %w", port.ErrVersionConflict)
	}
	return rev, mapMatterError(err)
}

func (t *pgWorkspaceTx) BumpWorkspaceRevision(ctx context.Context, newRevision int64) error {
	if err := t.q.BumpWorkspaceRevision(ctx, mcsqlc.BumpWorkspaceRevisionParams{ID: t.header.ID.String(), Revision: newRevision}); err != nil {
		return mapMatterError(err)
	}
	t.header.Revision = newRevision
	return nil
}

func (t *pgWorkspaceTx) InsertMatter(ctx context.Context, h matter.MatterHeader) error {
	return mapMatterError(t.q.InsertMatter(ctx, mcsqlc.InsertMatterParams{
		ID: h.MatterID.String(), WorkspaceID: h.WorkspaceID.String(), Title: h.Title,
		Revision: h.Revision, EventSeq: h.EventSeq, LastRecordedAt: h.LastRecordedAt,
	}))
}

func (t *pgWorkspaceTx) InsertMatterMembership(ctx context.Context, m matter.MatterMembership) error {
	return insertMatterMembership(ctx, t.q, m)
}

func (t *pgWorkspaceTx) AppendMatterCreatedEvent(ctx context.Context, matterID matter.MatterID, seq int64, id string, actor matter.ActorID, target string, effectiveAt, recordedAt time.Time) error {
	return appendEvent(ctx, t.q, matterID, seq, id, "matter.created", "MATTER", target, actor, "", effectiveAt, recordedAt)
}

func (t *pgWorkspaceTx) Receipt(ctx context.Context, actor matter.ActorID, key matter.IdempotencyKey) (matter.Receipt, error) {
	return findReceipt(ctx, t.q, actor, key)
}

func (t *pgWorkspaceTx) StoreReceipt(ctx context.Context, rc matter.Receipt) error {
	return storeReceipt(ctx, t.q, rc)
}

func (t *pgWorkspaceTx) RecordSecurityAudit(ctx context.Context, e matter.SecurityAuditEntry) error {
	return recordSecurityAudit(ctx, t.q, e)
}

// ---------- creation transaction ----------

type pgCreationTx struct {
	q    *mcsqlc.Queries
	wCmd time.Time
}

func (t *pgCreationTx) WCmd() time.Time { return t.wCmd }

func (t *pgCreationTx) Receipt(ctx context.Context, actor matter.ActorID, key matter.IdempotencyKey) (matter.Receipt, error) {
	return findReceipt(ctx, t.q, actor, key)
}

func (t *pgCreationTx) InsertWorkspace(ctx context.Context, w matter.Workspace) error {
	return mapMatterError(t.q.InsertWorkspace(ctx, mcsqlc.InsertWorkspaceParams{ID: w.ID.String(), Name: w.Name, Revision: w.Revision}))
}

func (t *pgCreationTx) InsertWorkspaceMembership(ctx context.Context, m matter.WorkspaceMembership) error {
	return insertWorkspaceMembership(ctx, t.q, m)
}

func (t *pgCreationTx) StoreReceipt(ctx context.Context, rc matter.Receipt) error {
	return storeReceipt(ctx, t.q, rc)
}

func (t *pgCreationTx) RecordSecurityAudit(ctx context.Context, e matter.SecurityAuditEntry) error {
	return recordSecurityAudit(ctx, t.q, e)
}

// ---------- matter membership administration ----------

func (t *pgMatterTx) CountActiveMatterOwners(ctx context.Context) (int, error) {
	n, err := t.q.CountActiveMatterOwners(ctx, t.header.MatterID.String())
	return int(n), mapMatterError(err)
}

func (t *pgMatterTx) InsertMatterMembership(ctx context.Context, m matter.MatterMembership) error {
	return insertMatterMembership(ctx, t.q, m)
}

func (t *pgMatterTx) UpdateMatterMembershipStatus(ctx context.Context, user matter.ActorID, status matter.MembershipStatus, expectedRevision int64) (int64, error) {
	if t.header.Revision != expectedRevision {
		return 0, fmt.Errorf("matter membership update: %w", port.ErrVersionConflict)
	}
	rev, err := t.q.UpdateMatterMembershipStatus(ctx, mcsqlc.UpdateMatterMembershipStatusParams{
		MatterID: t.header.MatterID.String(), UserID: user.String(), Status: string(status), Revision: expectedRevision + 1,
	})
	if errors.Is(err, pgx.ErrNoRows) {
		return 0, fmt.Errorf("matter membership update: %w", port.ErrVersionConflict)
	}
	return rev, mapMatterError(err)
}

func (t *pgMatterTx) AppendMembershipEvent(ctx context.Context, matterID matter.MatterID, seq int64, id, eventType, targetKind string, targetID string, actor matter.ActorID, _ matter.ActorID, reason string, effectiveAt, recordedAt time.Time) error {
	return appendEvent(ctx, t.q, matterID, seq, id, eventType, targetKind, targetID, actor, reason, effectiveAt, recordedAt)
}

// ---------- W1 read model ----------

// EventsPage returns one (recorded_at, seq)-ordered history page. It reads limit+1 rows
// so a following page is detected without a count.
func (s *pgSnapshot) EventsPage(ctx context.Context, m matter.MatterID, cursor *matter.EventCursor, limit int) (matter.EventPage, error) {
	pageLimit := clampLimit(limit)
	after := mcsqlc.PageMatterEventsParams{MatterID: m.String(), PageLimit: pageLimit + 1}
	if cursor != nil {
		after.AfterRecordedAt, after.AfterSeq = cursor.RecordedAt, cursor.Seq
	}
	rows, err := s.q.PageMatterEvents(ctx, after)
	if err != nil {
		return matter.EventPage{}, mapMatterError(err)
	}
	more := len(rows) > int(pageLimit)
	if more {
		rows = rows[:pageLimit]
	}
	page := matter.EventPage{AsOf: s.asOf, Events: make([]matter.EventRecord, 0, len(rows))}
	for _, r := range rows {
		page.Events = append(page.Events, eventFromRow(r))
	}
	if more {
		last := page.Events[len(page.Events)-1]
		page.NextCursor = &matter.EventCursor{RecordedAt: last.RecordedAt, Seq: last.Seq}
	}
	return page, nil
}

// RecentEvents returns the newest history records, newest first, from this snapshot.
func (s *pgSnapshot) RecentEvents(ctx context.Context, m matter.MatterID, limit int) ([]matter.EventRecord, error) {
	rows, err := s.q.RecentMatterEvents(ctx, mcsqlc.RecentMatterEventsParams{MatterID: m.String(), PageLimit: clampLimit(limit)})
	if err != nil {
		return nil, mapMatterError(err)
	}
	out := make([]matter.EventRecord, 0, len(rows))
	for _, r := range rows {
		out = append(out, eventFromRow(r))
	}
	return out, nil
}

// ReceiptFor returns the stored receipt for (actor, key); ErrNotFound when absent.
func (s *pgSnapshot) ReceiptFor(ctx context.Context, actor matter.ActorID, key matter.IdempotencyKey) (matter.Receipt, error) {
	return findReceipt(ctx, s.q, actor, key)
}

// AccessibleMatters pages the caller's ACTIVE matter memberships in the workspace,
// ordered by matter id. Total counts the full result set, not just the page.
func (s *pgSnapshot) AccessibleMatters(ctx context.Context, workspace matter.WorkspaceID, actor matter.ActorID, cursor *matter.MatterCursor, limit int) (matter.AccessibleMatterPage, error) {
	pageLimit := clampLimit(limit)
	after := "00000000-0000-0000-0000-000000000000"
	if cursor != nil {
		after = cursor.MatterID.String()
	}
	rows, err := s.q.ListAccessibleMatters(ctx, mcsqlc.ListAccessibleMattersParams{
		WorkspaceID: workspace.String(), UserID: actor.String(), ID: after, Limit: pageLimit + 1,
	})
	if err != nil {
		return matter.AccessibleMatterPage{}, mapMatterError(err)
	}
	total, err := s.q.CountAccessibleMatters(ctx, mcsqlc.CountAccessibleMattersParams{WorkspaceID: workspace.String(), UserID: actor.String()})
	if err != nil {
		return matter.AccessibleMatterPage{}, mapMatterError(err)
	}
	page := matter.AccessibleMatterPage{AsOf: s.asOf, Total: int(total), Matters: make([]matter.AccessibleMatter, 0, len(rows))}
	more := len(rows) > int(pageLimit)
	if more {
		rows = rows[:pageLimit]
	}
	for _, r := range rows {
		page.Matters = append(page.Matters, matter.AccessibleMatter{
			Header: matter.MatterHeader{
				MatterID: matter.MatterID(r.MatterID), WorkspaceID: matter.WorkspaceID(r.WorkspaceID), Title: r.Title,
				EventSeq: r.EventSeq, Revision: r.Revision,
				LastRecordedAt: r.LastRecordedAt.UTC(), BoundariesAppliedUntil: r.BoundariesAppliedUntil.UTC(),
				NextBoundaryAt: timestamptzPtr(r.NextBoundaryAt),
			},
			CallerRole: matter.MatterRole(r.CallerRole),
		})
	}
	if more {
		page.NextCursor = &matter.MatterCursor{MatterID: page.Matters[len(page.Matters)-1].Header.MatterID}
	}
	return page, nil
}

// ---------- shared row helpers ----------

func workspaceMembershipForShare(ctx context.Context, q *mcsqlc.Queries, ws matter.WorkspaceID, actor matter.ActorID) (matter.WorkspaceMembership, error) {
	row, err := q.GetWorkspaceMembershipForShare(ctx, mcsqlc.GetWorkspaceMembershipForShareParams{WorkspaceID: ws.String(), UserID: actor.String()})
	if err != nil {
		return matter.WorkspaceMembership{}, mapMatterError(err)
	}
	return matter.WorkspaceMembership{
		WorkspaceID: matter.WorkspaceID(row.WorkspaceID), ActorID: matter.ActorID(row.UserID),
		Role: matter.WorkspaceRole(row.Role), Status: matter.MembershipStatus(row.Status), Revision: row.Revision,
	}, nil
}

func matterMembershipForShare(ctx context.Context, q *mcsqlc.Queries, m matter.MatterID, actor matter.ActorID) (matter.MatterMembership, error) {
	row, err := q.GetMatterMembershipForShare(ctx, mcsqlc.GetMatterMembershipForShareParams{MatterID: m.String(), UserID: actor.String()})
	if err != nil {
		return matter.MatterMembership{}, mapMatterError(err)
	}
	return matter.MatterMembership{
		MatterID: matter.MatterID(row.MatterID), ActorID: matter.ActorID(row.UserID),
		Role: matter.MatterRole(row.Role), Status: matter.MembershipStatus(row.Status), Revision: row.Revision,
	}, nil
}

func insertWorkspaceMembership(ctx context.Context, q *mcsqlc.Queries, m matter.WorkspaceMembership) error {
	return mapMatterError(q.InsertWorkspaceMembership(ctx, mcsqlc.InsertWorkspaceMembershipParams{
		WorkspaceID: m.WorkspaceID.String(), UserID: m.ActorID.String(),
		Role: string(m.Role), Status: string(m.Status), Revision: m.Revision,
	}))
}

func insertMatterMembership(ctx context.Context, q *mcsqlc.Queries, m matter.MatterMembership) error {
	return mapMatterError(q.InsertMatterMembership(ctx, mcsqlc.InsertMatterMembershipParams{
		MatterID: m.MatterID.String(), UserID: m.ActorID.String(),
		Role: string(m.Role), Status: string(m.Status), Revision: m.Revision,
	}))
}

func appendEvent(ctx context.Context, q *mcsqlc.Queries, matterID matter.MatterID, seq int64, id, eventType, targetKind, targetID string, actor matter.ActorID, reason string, effectiveAt, recordedAt time.Time) error {
	return mapMatterError(q.InsertDomainEvent(ctx, mcsqlc.InsertDomainEventParams{
		MatterID: matterID.String(), Seq: seq, ID: id, Type: eventType,
		ActorID: uuidString(actor.String()), TargetKind: targetKind, TargetID: targetID,
		EffectiveAt: effectiveAt, RecordedAt: recordedAt, Reason: pgText(reason),
	}))
}

func eventFromRow(r mcsqlc.DomainEvent) matter.EventRecord {
	e := matter.EventRecord{
		MatterID: matter.MatterID(r.MatterID), Seq: r.Seq, ID: r.ID, Type: r.Type,
		SchemaVersion: int(r.SchemaVersion), ActorKind: r.ActorKind, TargetKind: r.TargetKind, TargetID: r.TargetID,
		EffectiveAt: r.EffectiveAt.UTC(), RecordedAt: r.RecordedAt.UTC(),
		Before: r.Before, After: r.After,
	}
	if r.ActorID.Valid {
		s := uuidToString(r.ActorID)
		e.ActorID = &s
	}
	if r.CauseSeq.Valid {
		v := r.CauseSeq.Int64
		e.CauseSeq = &v
	}
	if r.CorrelationID.Valid {
		s := uuidToString(r.CorrelationID)
		e.CorrelationID = &s
	}
	if r.CommandKey.Valid {
		s := uuidToString(r.CommandKey)
		e.CommandKey = &s
	}
	if r.Reason.Valid {
		s := r.Reason.String
		e.Reason = &s
	}
	return e
}

func findReceipt(ctx context.Context, q *mcsqlc.Queries, actor matter.ActorID, key matter.IdempotencyKey) (matter.Receipt, error) {
	row, err := q.FindReceipt(ctx, mcsqlc.FindReceiptParams{ActorID: actor.String(), IdempotencyKey: key.String()})
	if err != nil {
		return matter.Receipt{}, mapMatterError(err)
	}
	matters, err := q.ListReceiptMatters(ctx, mcsqlc.ListReceiptMattersParams{ActorID: actor.String(), IdempotencyKey: key.String()})
	if err != nil {
		return matter.Receipt{}, mapMatterError(err)
	}
	represented := make([]matter.MatterID, len(matters))
	for i, m := range matters {
		represented[i] = matter.MatterID(m)
	}
	rc := matter.Receipt{
		ActorID:        matter.ActorID(row.ActorID),
		IdempotencyKey: matter.IdempotencyKey(row.IdempotencyKey),
		RequestHash:    matter.RequestHash(fmt.Sprintf("%x", row.RequestHash)),
		ScopeKind:      matter.ScopeKind(row.ScopeKind),
		WorkspaceID:    matter.WorkspaceID(row.WorkspaceID),
		MatterID:       uuidPtr(row.MatterID),
		StatusCode:     int(row.StatusCode),
		CommittedAt:    row.CommittedAt.UTC(),
		PurgeAfter:     timestamptzPtr(row.PurgeAfter),
		Matters:        represented,
	}
	if err := decodeReceiptResponse(&rc, row.Response); err != nil {
		return matter.Receipt{}, fmt.Errorf("matter store: decode receipt response: %w", err)
	}
	return rc, nil
}

func storeReceipt(ctx context.Context, q *mcsqlc.Queries, rc matter.Receipt) error {
	response, err := encodeReceiptResponse(rc)
	if err != nil {
		return fmt.Errorf("matter store: encode receipt response: %w", err)
	}
	hash, err := hexHash(rc.RequestHash)
	if err != nil {
		return err
	}
	status, err := int32Checked(rc.StatusCode)
	if err != nil {
		return err
	}
	if err := q.InsertCommandReceipt(ctx, mcsqlc.InsertCommandReceiptParams{
		ActorID: rc.ActorID.String(), IdempotencyKey: rc.IdempotencyKey.String(),
		RequestHash: hash, ScopeKind: string(rc.ScopeKind), WorkspaceID: rc.WorkspaceID.String(),
		MatterID: uuidVal(rc.MatterID), StatusCode: status, Response: response,
		CommittedAt: rc.CommittedAt, PurgeAfter: timestamptzVal(rc.PurgeAfter),
	}); err != nil {
		return mapMatterError(err)
	}
	for _, m := range rc.Matters {
		if err := q.InsertCommandReceiptMatter(ctx, mcsqlc.InsertCommandReceiptMatterParams{
			ActorID: rc.ActorID.String(), IdempotencyKey: rc.IdempotencyKey.String(), RepresentedMatterID: m.String(),
		}); err != nil {
			return mapMatterError(err)
		}
	}
	return nil
}

func recordSecurityAudit(ctx context.Context, q *mcsqlc.Queries, e matter.SecurityAuditEntry) error {
	return mapMatterError(q.InsertSecurityAuditEvent(ctx, mcsqlc.InsertSecurityAuditEventParams{
		ID: e.EventID, OccurredAt: e.OccurredAt, ActorID: uuidString(e.Actor.String()),
		Operation: e.Operation, Outcome: e.Outcome,
		RequestedResourceKind: pgText(e.RequestedResourceKind), RequestedIDHash: e.RequestedIDHash,
	}))
}

func uuidToString(u pgtype.UUID) string { return uuid.UUID(u.Bytes).String() }

// WorkspaceMembers returns the ACTIVE workspace members ordered by user id.
func (s *pgSnapshot) WorkspaceMembers(ctx context.Context, workspace matter.WorkspaceID) ([]matter.Member, error) {
	rows, err := s.q.ListWorkspaceMembers(ctx, workspace.String())
	if err != nil {
		return nil, mapMatterError(err)
	}
	out := make([]matter.Member, 0, len(rows))
	for _, r := range rows {
		out = append(out, matter.Member{UserID: matter.ActorID(r.UserID), DisplayName: r.DisplayName, Role: r.Role, Status: matter.MembershipStatus(r.Status), Revision: r.Revision})
	}
	return out, nil
}

// MatterMembers returns the ACTIVE matter members ordered by user id.
func (s *pgSnapshot) MatterMembers(ctx context.Context, id matter.MatterID) ([]matter.Member, error) {
	rows, err := s.q.ListMatterMembers(ctx, id.String())
	if err != nil {
		return nil, mapMatterError(err)
	}
	out := make([]matter.Member, 0, len(rows))
	for _, r := range rows {
		out = append(out, matter.Member{UserID: matter.ActorID(r.UserID), DisplayName: r.DisplayName, Role: r.Role, Status: matter.MembershipStatus(r.Status), Revision: r.Revision})
	}
	return out, nil
}

// MyWorkspaces pages the caller's ACTIVE workspace memberships ordered by workspace id.
func (s *pgSnapshot) MyWorkspaces(ctx context.Context, actor matter.ActorID, cursor *matter.WorkspaceCursor, limit int) (matter.AccessibleWorkspacePage, error) {
	pageLimit := clampLimit(limit)
	after := "00000000-0000-0000-0000-000000000000"
	if cursor != nil {
		after = cursor.WorkspaceID.String()
	}
	rows, err := s.q.ListMyWorkspaces(ctx, mcsqlc.ListMyWorkspacesParams{UserID: actor.String(), ID: after, Limit: pageLimit + 1})
	if err != nil {
		return matter.AccessibleWorkspacePage{}, mapMatterError(err)
	}
	total, err := s.q.CountMyWorkspaces(ctx, actor.String())
	if err != nil {
		return matter.AccessibleWorkspacePage{}, mapMatterError(err)
	}
	more := len(rows) > int(pageLimit)
	if more {
		rows = rows[:pageLimit]
	}
	page := matter.AccessibleWorkspacePage{AsOf: s.asOf, Total: int(total), Workspaces: make([]matter.AccessibleWorkspace, 0, len(rows))}
	for _, r := range rows {
		page.Workspaces = append(page.Workspaces, matter.AccessibleWorkspace{
			Workspace:  matter.Workspace{ID: matter.WorkspaceID(r.WorkspaceID), Name: r.Name, Revision: r.Revision},
			CallerRole: matter.WorkspaceRole(r.CallerRole),
		})
	}
	if more {
		page.NextCursor = &matter.WorkspaceCursor{WorkspaceID: page.Workspaces[len(page.Workspaces)-1].Workspace.ID}
	}
	return page, nil
}
