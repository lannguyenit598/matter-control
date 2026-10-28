package mattercontrol

// W1 memory-store extension: workspace-scoped transactions, creation transactions,
// membership administration and the W1 read model over the same in-memory double.

import (
	"context"
	"fmt"
	"sort"
	"time"

	"github.com/example/userapi/internal/core/domain/matter"
	"github.com/example/userapi/internal/core/port"
)

// ExecuteWorkspace implements port.WorkspaceStore with the same atomic semantics as
// Execute, scoped to the locked workspace header.
func (s *Store) ExecuteWorkspace(ctx context.Context, workspace matter.WorkspaceID, fn func(tx port.WorkspaceTx) error) error {
	if err := ctx.Err(); err != nil {
		return fmt.Errorf("workspace store: %w: %w", port.ErrUnavailable, err)
	}
	s.mu.Lock()
	defer s.mu.Unlock()

	header, ok := s.wsHeaders[workspace]
	if !ok {
		return port.ErrNotFound
	}
	_ = header
	wCmd := s.clock()

	work := s.snapshot()
	workHeader := work.wsHeaders[workspace]
	tx := &memWorkspaceTx{store: work, header: workHeader, wCmd: wCmd, failAt: s.FailAt}
	if err := fn(tx); err != nil {
		return err
	}
	if s.CommitRollback != nil {
		return fmt.Errorf("workspace store commit: %w: %w", port.ErrUnavailable, s.CommitRollback)
	}
	s.adopt(work)
	if s.CommitUnknown != nil {
		return fmt.Errorf("workspace store commit: %w: %w", port.ErrOutcomeUnknown, s.CommitUnknown)
	}
	return nil
}

// ExecuteCreation implements port.WorkspaceStore for commands that create their own
// workspace row.
func (s *Store) ExecuteCreation(ctx context.Context, fn func(tx port.WorkspaceCreationTx) error) error {
	if err := ctx.Err(); err != nil {
		return fmt.Errorf("workspace store: %w: %w", port.ErrUnavailable, err)
	}
	s.mu.Lock()
	defer s.mu.Unlock()

	wCmd := s.clock()
	work := s.snapshot()
	tx := &memWorkspaceCreationTx{store: work, wCmd: wCmd, failAt: s.FailAt}
	if err := fn(tx); err != nil {
		return err
	}
	if s.CommitRollback != nil {
		return fmt.Errorf("workspace store commit: %w: %w", port.ErrUnavailable, s.CommitRollback)
	}
	s.adopt(work)
	if s.CommitUnknown != nil {
		return fmt.Errorf("workspace store commit: %w: %w", port.ErrOutcomeUnknown, s.CommitUnknown)
	}
	return nil
}

type memWorkspaceTx struct {
	store  *Store
	header matter.Workspace
	wCmd   time.Time
	failAt string
}

func (t *memWorkspaceTx) Workspace() matter.Workspace { return t.header }
func (t *memWorkspaceTx) WCmd() time.Time             { return t.wCmd }

func (t *memWorkspaceTx) fail(step string) error {
	if t.failAt == step {
		return fmt.Errorf("injected failure at %s", step)
	}
	return nil
}

func (t *memWorkspaceTx) WorkspaceMembershipOf(_ context.Context, user matter.ActorID) (matter.WorkspaceMembership, error) {
	m, ok := t.store.wsMemberships[wsKey{t.header.ID, user}]
	if !ok {
		return matter.WorkspaceMembership{}, port.ErrNotFound
	}
	return m, nil
}

func (t *memWorkspaceTx) MatterMembership(_ context.Context, m matter.MatterID, actor matter.ActorID) (matter.MatterMembership, error) {
	mm, ok := t.store.mMemberships[mmKey{m, actor}]
	if !ok {
		return matter.MatterMembership{}, port.ErrNotFound
	}
	return mm, nil
}

func (t *memWorkspaceTx) CountActiveWorkspaceOwners(_ context.Context) (int, error) {
	n := 0
	for _, m := range t.store.wsMemberships {
		if m.WorkspaceID == t.header.ID && m.Role == matter.WorkspaceRoleOwner && m.Status == matter.StatusActive {
			n++
		}
	}
	return n, nil
}

func (t *memWorkspaceTx) InsertWorkspaceMembership(_ context.Context, m matter.WorkspaceMembership) error {
	if err := t.fail("insert_workspace_membership"); err != nil {
		return err
	}
	k := wsKey{m.WorkspaceID, m.ActorID}
	if _, exists := t.store.wsMemberships[k]; exists {
		return fmt.Errorf("memory: workspace membership %v/%s already exists", m.WorkspaceID, m.ActorID)
	}
	t.store.wsMemberships[k] = m
	return nil
}

func (t *memWorkspaceTx) UpdateWorkspaceMembershipStatus(_ context.Context, user matter.ActorID, status matter.MembershipStatus, expectedRevision int64) (int64, error) {
	if err := t.fail("update_workspace_membership"); err != nil {
		return 0, err
	}
	k := wsKey{t.header.ID, user}
	m, ok := t.store.wsMemberships[k]
	if !ok || t.header.Revision != expectedRevision {
		return 0, fmt.Errorf("workspace membership update: %w", port.ErrVersionConflict)
	}
	m.Status = status
	m.Revision = expectedRevision + 1
	t.store.wsMemberships[k] = m
	return m.Revision, nil
}

func (t *memWorkspaceTx) BumpWorkspaceRevision(_ context.Context, newRevision int64) error {
	if err := t.fail("bump_workspace_revision"); err != nil {
		return err
	}
	t.header.Revision = newRevision
	t.store.wsHeaders[t.header.ID] = t.header
	return nil
}

func (t *memWorkspaceTx) InsertMatter(_ context.Context, h matter.MatterHeader) error {
	if err := t.fail("insert_matter"); err != nil {
		return err
	}
	if _, exists := t.store.matters[h.MatterID]; exists {
		return fmt.Errorf("memory: matter %s already exists", h.MatterID)
	}
	cp := h
	t.store.matters[h.MatterID] = &cp
	return nil
}

func (t *memWorkspaceTx) InsertMatterMembership(_ context.Context, m matter.MatterMembership) error {
	if err := t.fail("insert_matter_membership"); err != nil {
		return err
	}
	k := mmKey{m.MatterID, m.ActorID}
	if _, exists := t.store.mMemberships[k]; exists {
		return fmt.Errorf("memory: matter membership %v/%s already exists", m.MatterID, m.ActorID)
	}
	t.store.mMemberships[k] = m
	return nil
}

func (t *memWorkspaceTx) AppendMatterCreatedEvent(_ context.Context, matterID matter.MatterID, seq int64, id string, actor matter.ActorID, target string, effectiveAt, recordedAt time.Time) error {
	if err := t.fail("append_event"); err != nil {
		return err
	}
	t.store.records = append(t.store.records, matter.EventRecord{
		MatterID: matterID, Seq: seq, ID: id, Type: "matter.created", SchemaVersion: 1,
		ActorKind: "USER", ActorID: strPtr(actor.String()), TargetKind: "MATTER", TargetID: target,
		EffectiveAt: effectiveAt, RecordedAt: recordedAt,
	})
	return nil
}

func (t *memWorkspaceTx) Receipt(_ context.Context, actor matter.ActorID, key matter.IdempotencyKey) (matter.Receipt, error) {
	rc, ok := t.store.receipts[receiptKey{actor, key}]
	if !ok {
		return matter.Receipt{}, port.ErrNotFound
	}
	return rc, nil
}

func (t *memWorkspaceTx) StoreReceipt(_ context.Context, rc matter.Receipt) error {
	if err := t.fail("store_receipt"); err != nil {
		return err
	}
	k := receiptKey{rc.ActorID, rc.IdempotencyKey}
	if _, exists := t.store.receipts[k]; exists {
		return fmt.Errorf("memory receipt: %w", port.ErrIdempotencyKeyReuse)
	}
	t.store.receipts[k] = rc
	return nil
}

func (t *memWorkspaceTx) RecordSecurityAudit(_ context.Context, e matter.SecurityAuditEntry) error {
	t.store.audits = append(t.store.audits, e)
	return nil
}

type memWorkspaceCreationTx struct {
	store  *Store
	wCmd   time.Time
	failAt string
}

func (t *memWorkspaceCreationTx) fail(step string) error {
	if t.failAt == step {
		return fmt.Errorf("injected failure at %s", step)
	}
	return nil
}

func (t *memWorkspaceCreationTx) WCmd() time.Time { return t.wCmd }

func (t *memWorkspaceCreationTx) Receipt(_ context.Context, actor matter.ActorID, key matter.IdempotencyKey) (matter.Receipt, error) {
	rc, ok := t.store.receipts[receiptKey{actor, key}]
	if !ok {
		return matter.Receipt{}, port.ErrNotFound
	}
	return rc, nil
}

func (t *memWorkspaceCreationTx) InsertWorkspace(_ context.Context, w matter.Workspace) error {
	if err := t.fail("insert_workspace"); err != nil {
		return err
	}
	if _, exists := t.store.wsHeaders[w.ID]; exists {
		return fmt.Errorf("memory: workspace %s already exists", w.ID)
	}
	t.store.wsHeaders[w.ID] = w
	return nil
}

func (t *memWorkspaceCreationTx) InsertWorkspaceMembership(_ context.Context, m matter.WorkspaceMembership) error {
	if err := t.fail("insert_workspace_membership"); err != nil {
		return err
	}
	k := wsKey{m.WorkspaceID, m.ActorID}
	if _, exists := t.store.wsMemberships[k]; exists {
		return fmt.Errorf("memory: workspace membership %v/%s already exists", m.WorkspaceID, m.ActorID)
	}
	t.store.wsMemberships[k] = m
	return nil
}

func (t *memWorkspaceCreationTx) StoreReceipt(_ context.Context, rc matter.Receipt) error {
	if err := t.fail("store_receipt"); err != nil {
		return err
	}
	k := receiptKey{rc.ActorID, rc.IdempotencyKey}
	if _, exists := t.store.receipts[k]; exists {
		return fmt.Errorf("memory receipt: %w", port.ErrIdempotencyKeyReuse)
	}
	t.store.receipts[k] = rc
	return nil
}

func (t *memWorkspaceCreationTx) RecordSecurityAudit(_ context.Context, e matter.SecurityAuditEntry) error {
	t.store.audits = append(t.store.audits, e)
	return nil
}

// --- MatterTx membership administration (W1) ---

func (t *memTx) CountActiveMatterOwners(_ context.Context) (int, error) {
	n := 0
	for _, m := range t.store.mMemberships {
		if m.MatterID == t.header.MatterID && m.Role == matter.MatterRoleOwner && m.Status == matter.StatusActive {
			n++
		}
	}
	return n, nil
}

func (t *memTx) InsertMatterMembership(_ context.Context, m matter.MatterMembership) error {
	if err := t.fail("insert_matter_membership"); err != nil {
		return err
	}
	k := mmKey{m.MatterID, m.ActorID}
	if _, exists := t.store.mMemberships[k]; exists {
		return fmt.Errorf("memory: matter membership %v/%s already exists", m.MatterID, m.ActorID)
	}
	t.store.mMemberships[k] = m
	return nil
}

func (t *memTx) UpdateMatterMembershipStatus(_ context.Context, user matter.ActorID, status matter.MembershipStatus, expectedRevision int64) (int64, error) {
	if err := t.fail("update_matter_membership"); err != nil {
		return 0, err
	}
	k := mmKey{t.header.MatterID, user}
	m, ok := t.store.mMemberships[k]
	if !ok || t.header.Revision != expectedRevision {
		return 0, fmt.Errorf("matter membership update: %w", port.ErrVersionConflict)
	}
	m.Status = status
	m.Revision = expectedRevision + 1
	t.store.mMemberships[k] = m
	return m.Revision, nil
}

func (t *memTx) AppendMembershipEvent(_ context.Context, matterID matter.MatterID, seq int64, id, eventType, targetKind string, targetID string, actor matter.ActorID, targetUser matter.ActorID, reason string, effectiveAt, recordedAt time.Time) error {
	if err := t.fail("append_event"); err != nil {
		return err
	}
	t.store.records = append(t.store.records, matter.EventRecord{
		MatterID: matterID, Seq: seq, ID: id, Type: eventType, SchemaVersion: 1,
		ActorKind: "USER", ActorID: strPtr(actor.String()), TargetKind: targetKind, TargetID: targetID,
		EffectiveAt: effectiveAt, RecordedAt: recordedAt, Reason: strPtrNonEmpty(reason),
	})
	return nil
}

func strPtr(s string) *string { return &s }

func strPtrNonEmpty(s string) *string {
	if s == "" {
		return nil
	}
	return &s
}

// --- W1 read model ---

func (s *memSnapshot) WorkspaceByID(_ context.Context, id matter.WorkspaceID) (matter.Workspace, error) {
	w, ok := s.state.wsHeaders[id]
	if !ok {
		return matter.Workspace{}, port.ErrNotFound
	}
	return w, nil
}

// EventsPage returns the matter's history records ordered by (recorded_at, seq).
func (s *memSnapshot) EventsPage(_ context.Context, m matter.MatterID, cursor *matter.EventCursor, limit int) (matter.EventPage, error) {
	if limit <= 0 || limit > 200 {
		limit = 200
	}
	var rows []matter.EventRecord
	for _, r := range s.state.records {
		if r.MatterID != m {
			continue
		}
		if cursor != nil && !r.RecordedAt.After(cursor.RecordedAt) && (!r.RecordedAt.Equal(cursor.RecordedAt) || r.Seq <= cursor.Seq) {
			continue
		}
		rows = append(rows, r)
	}
	sort.Slice(rows, func(i, j int) bool {
		if rows[i].RecordedAt.Equal(rows[j].RecordedAt) {
			return rows[i].Seq < rows[j].Seq
		}
		return rows[i].RecordedAt.Before(rows[j].RecordedAt)
	})
	page := matter.EventPage{AsOf: s.asOf}
	if len(rows) > limit {
		rows = rows[:limit]
		last := rows[len(rows)-1]
		page.NextCursor = &matter.EventCursor{RecordedAt: last.RecordedAt, Seq: last.Seq}
	}
	page.Events = rows
	return page, nil
}

// RecentEvents returns the newest records, newest first.
func (s *memSnapshot) RecentEvents(_ context.Context, m matter.MatterID, limit int) ([]matter.EventRecord, error) {
	var rows []matter.EventRecord
	for _, r := range s.state.records {
		if r.MatterID == m {
			rows = append(rows, r)
		}
	}
	sort.Slice(rows, func(i, j int) bool {
		if rows[i].RecordedAt.Equal(rows[j].RecordedAt) {
			return rows[i].Seq > rows[j].Seq
		}
		return rows[i].RecordedAt.After(rows[j].RecordedAt)
	})
	if limit > 0 && len(rows) > limit {
		rows = rows[:limit]
	}
	return rows, nil
}

// ReceiptFor returns the stored receipt for (actor, key).
func (s *memSnapshot) ReceiptFor(_ context.Context, actor matter.ActorID, key matter.IdempotencyKey) (matter.Receipt, error) {
	rc, ok := s.state.receipts[receiptKey{actor, key}]
	if !ok {
		return matter.Receipt{}, port.ErrNotFound
	}
	return rc, nil
}

// AccessibleMatters returns the caller's active matters inside the workspace, ordered
// by matter id, with the caller's active matter role.
func (s *memSnapshot) AccessibleMatters(_ context.Context, workspace matter.WorkspaceID, actor matter.ActorID, cursor *matter.MatterCursor, limit int) (matter.AccessibleMatterPage, error) {
	if limit <= 0 || limit > 200 {
		limit = 200
	}
	var all []matter.AccessibleMatter
	for k, mm := range s.state.mMemberships {
		if mm.ActorID != actor || mm.Status != matter.StatusActive {
			continue
		}
		h, ok := s.state.matters[k.m]
		if !ok || h.WorkspaceID != workspace {
			continue
		}
		all = append(all, matter.AccessibleMatter{Header: *h, CallerRole: mm.Role})
	}
	sort.Slice(all, func(i, j int) bool { return all[i].Header.MatterID < all[j].Header.MatterID })
	rows := all[:0:0]
	for _, am := range all {
		if cursor == nil || am.Header.MatterID > cursor.MatterID {
			rows = append(rows, am)
		}
	}
	page := matter.AccessibleMatterPage{AsOf: s.asOf, Total: len(all)}
	if len(rows) > limit {
		rows = rows[:limit]
		page.NextCursor = &matter.MatterCursor{MatterID: rows[len(rows)-1].Header.MatterID}
	}
	page.Matters = rows
	return page, nil
}

// MyWorkspaces returns the caller's ACTIVE workspace memberships ordered by workspace id.
func (s *memSnapshot) MyWorkspaces(_ context.Context, actor matter.ActorID, cursor *matter.WorkspaceCursor, limit int) (matter.AccessibleWorkspacePage, error) {
	if limit <= 0 || limit > 200 {
		limit = 200
	}
	var all []matter.AccessibleWorkspace
	for k, m := range s.state.wsMemberships {
		if k.actor != actor || m.Status != matter.StatusActive {
			continue
		}
		if w, ok := s.state.wsHeaders[k.ws]; ok {
			all = append(all, matter.AccessibleWorkspace{Workspace: w, CallerRole: m.Role})
		}
	}
	sort.Slice(all, func(i, j int) bool { return all[i].Workspace.ID < all[j].Workspace.ID })
	rows := []matter.AccessibleWorkspace{}
	for _, w := range all {
		if cursor == nil || w.Workspace.ID > cursor.WorkspaceID {
			rows = append(rows, w)
		}
	}
	page := matter.AccessibleWorkspacePage{AsOf: s.asOf, Total: len(all)}
	if len(rows) > limit {
		rows = rows[:limit]
		page.NextCursor = &matter.WorkspaceCursor{WorkspaceID: rows[len(rows)-1].Workspace.ID}
	}
	page.Workspaces = rows
	return page, nil
}

// WorkspaceMembers returns ACTIVE workspace members ordered by user id.
func (s *memSnapshot) WorkspaceMembers(_ context.Context, workspace matter.WorkspaceID) ([]matter.Member, error) {
	out := []matter.Member{}
	for k, m := range s.state.wsMemberships {
		if k.ws == workspace && m.Status == matter.StatusActive {
			out = append(out, matter.Member{UserID: m.ActorID, DisplayName: "Test User", Role: string(m.Role), Status: m.Status, Revision: m.Revision})
		}
	}
	sort.Slice(out, func(i, j int) bool { return out[i].UserID < out[j].UserID })
	return out, nil
}

// MatterMembers returns ACTIVE matter members ordered by user id.
func (s *memSnapshot) MatterMembers(_ context.Context, id matter.MatterID) ([]matter.Member, error) {
	out := []matter.Member{}
	for k, m := range s.state.mMemberships {
		if k.m == id && m.Status == matter.StatusActive {
			out = append(out, matter.Member{UserID: m.ActorID, DisplayName: "Test User", Role: string(m.Role), Status: m.Status, Revision: m.Revision})
		}
	}
	sort.Slice(out, func(i, j int) bool { return out[i].UserID < out[j].UserID })
	return out, nil
}

// Compile-time checks that the double satisfies the W1 ports.
var (
	_ port.WorkspaceStore          = (*Store)(nil)
	_ port.MatterMembershipAdminTx = (*memTx)(nil)
	_ port.MatterReadSnapshot      = (*memSnapshot)(nil)
)

// --- Test-kit readers: persisted-state observability for behavioral tests ---

// WSMembership returns the persisted workspace membership row, if any.
func (s *Store) WSMembership(ws matter.WorkspaceID, actor matter.ActorID) (matter.WorkspaceMembership, bool) {
	s.mu.Lock()
	defer s.mu.Unlock()
	m, ok := s.wsMemberships[wsKey{ws, actor}]
	return m, ok
}

// MMembershipOf returns the persisted matter membership row, if any.
func (s *Store) MMembershipOf(m matter.MatterID, actor matter.ActorID) (matter.MatterMembership, bool) {
	s.mu.Lock()
	defer s.mu.Unlock()
	mm, ok := s.mMemberships[mmKey{m, actor}]
	return mm, ok
}

// WSRevision returns the persisted workspace header revision, if the workspace exists.
func (s *Store) WSRevision(ws matter.WorkspaceID) (int64, bool) {
	s.mu.Lock()
	defer s.mu.Unlock()
	w, ok := s.wsHeaders[ws]
	if !ok {
		return 0, false
	}
	return w.Revision, true
}

// MatterRevision returns the persisted matter header revision, if the matter exists.
func (s *Store) MatterRevision(m matter.MatterID) (int64, bool) {
	s.mu.Lock()
	defer s.mu.Unlock()
	h, ok := s.matters[m]
	if !ok {
		return 0, false
	}
	return h.Revision, true
}

// SetMatterRevision pins the matter header revision (fixture helper for CAS tests).
func (s *Store) SetMatterRevision(m matter.MatterID, rev int64) {
	s.mu.Lock()
	defer s.mu.Unlock()
	if h, ok := s.matters[m]; ok {
		h.Revision = rev
	}
}

// AllRecords returns the persisted matter-scoped history records (read model).
func (s *Store) AllRecords() []matter.EventRecord {
	s.mu.Lock()
	defer s.mu.Unlock()
	return append([]matter.EventRecord(nil), s.records...)
}
