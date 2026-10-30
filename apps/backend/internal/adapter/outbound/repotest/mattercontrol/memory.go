// Package mattercontrol is the shared contract-test kit for the MatterControl
// transaction spine (port.MatterStore + service). It provides an in-memory double
// with real transaction semantics and a World seeder/observer used by the shared
// suite; storage adapters run the same suite through the same World interface.
package mattercontrol

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"sync"
	"time"

	"leonx.me/matter-control/internal/core/domain/matter"
	"leonx.me/matter-control/internal/core/port"
)

// ErrInjected is the sentinel carried by every injected seam failure so tests can
// distinguish seam errors from real defects.
var ErrInjected = errors.New("injected failure")

// Counts reports row counts by table, for atomicity assertions.
type Counts struct {
	Nodes            int
	Requirements     int
	Actions          int
	Events           int
	Receipts         int
	ReceiptMatters   int
	Audits           int
	Matters          int
	WorkspaceMembers int
	MatterMembers    int
}

// World provisions and observes the fixtures behind a MatterStore: identities,
// workspaces, memberships, matters and structural rows that this slice has no
// product command for. Implementations are for tests only.
type World interface {
	AddUser(id matter.ActorID)
	AddWorkspace(id matter.WorkspaceID)
	SetWorkspaceMembership(workspace matter.WorkspaceID, actor matter.ActorID, role matter.WorkspaceRole, status matter.MembershipStatus)
	AddMatter(id matter.MatterID, workspace matter.WorkspaceID)
	SetMatterMembership(m matter.MatterID, actor matter.ActorID, role matter.MatterRole, status matter.MembershipStatus)
	// InsertActionNode adds an ACTION node with its typed row: the kind-mismatch
	// fixture for uniform read outcomes.
	InsertActionNode(id matter.NodeID, m matter.MatterID)
	// SetElapsedBoundary pins a pending temporal boundary in the past of the store's
	// command clock, so the next command on the matter is due to process it
	// (BE01-F02 fixture).
	SetElapsedBoundary(m matter.MatterID)
	// SetFutureBoundary pins a pending temporal boundary after the store's command
	// clock: not due, safe to proceed, and it must be preserved by a successful
	// command.
	SetFutureBoundary(m matter.MatterID)
	// NextBoundary returns the matter's pending boundary instant (ok=false when the
	// header carries none).
	NextBoundary(m matter.MatterID) (time.Time, bool)
	Counts() Counts
	// Requirement returns the stored typed row (ok=false when absent).
	Requirement(id matter.RequirementID) (matter.Requirement, bool)
	Events() []matter.RequirementCreatedEvent
	Receipts() []matter.Receipt
	Audits() []matter.SecurityAuditEntry
	// SetVerification pins a Requirement's verification state (test fixture): verification
	// commands belong to W3, but the work-graph rules must be proven against VERIFIED inputs now.
	SetVerification(id matter.NodeID, state matter.VerificationState)
	// Reopen returns a NEW MatterStore handle over the same data, simulating a
	// repository restart for replay tests.
	Reopen() port.MatterStore
}

// Store is the in-memory MatterStore double. Execute serializes on one mutex and
// provides rollback by restoring a deep copy of the state when fn fails; View reads
// a point-in-time copy. Per-matter lock fidelity is the postgres adapter's contract;
// the double guarantees the same observable atomicity and replay outcomes.
type Store struct {
	mu sync.Mutex

	matters       map[matter.MatterID]*matter.MatterHeader
	wsHeaders     map[matter.WorkspaceID]matter.Workspace
	wsMemberships map[wsKey]matter.WorkspaceMembership
	mMemberships  map[mmKey]matter.MatterMembership
	nodes         map[matter.NodeID]matter.Node
	// requirements and actions hold the unified typed records; edges/workstreams/parties/
	// milestones are the W2 work-graph tables.
	requirements map[matter.RequirementID]matter.WorkItem
	actions      map[matter.NodeID]matter.WorkItem
	edges        map[string]matter.Edge
	workstreams  map[matter.WorkstreamID]matter.Workstream
	parties      map[matter.PartyID]matter.Party
	milestones   map[matter.MilestoneID]matter.Milestone
	// W3 evidence tables.
	documents   map[matter.DocumentID]matter.Document
	versions    map[matter.VersionID]matter.DocumentVersion
	signatures  []matter.SignatureObservation
	criteria    map[matter.CriterionID]matter.Criterion
	evidence    map[matter.EvidenceID]matter.Evidence
	claims      map[matter.ClaimID]matter.Claim
	assessments map[matter.AssessmentID]matter.Assessment
	disputes    map[matter.DisputeID]matter.Dispute
	verifiers   map[mmKey]bool
	// W4 filings.
	filings    map[matter.NodeID]matter.Filing
	filingCyc  []matter.FilingCycle
	filingSubs []matter.FilingSubmission
	filingObs  []matter.FilingObservation
	// W5 context records.
	contexts map[string]matter.ContextRecord

	reviewGrids        map[string]matter.ReviewGrid
	reviewAnswers      []matter.ReviewAnswer
	reviewQuestionRevs []reviewQuestionRev
	events             []matter.RequirementCreatedEvent
	// records holds the W1 read model: every matter-scoped history event as a
	// generic record (requirement.created, matter.created, membership.*).
	records []matter.EventRecord
	// W6 RULE-014 import-source registry.
	importSources map[importSourceKey]matter.ImportSource
	receipts      map[receiptKey]matter.Receipt
	audits        []matter.SecurityAuditEntry

	clock func() time.Time

	// FailAt injects a failure into the matching transaction step
	// ("insert_node", "insert_requirement", "append_event", "store_receipt",
	// "complete_matter"), asserting full rollback. The membership steps
	// ("membership_unavailable", "membership_unexpected") fail the membership
	// lookups in BOTH Execute transactions and View snapshots, proving that
	// storage failures stay distinct from absence (BE01-F03).
	FailAt string
	// CommitRollback, when set, makes a successful transaction fail at commit with a
	// KNOWN rollback (wraps port.ErrUnavailable); state is discarded.
	CommitRollback error
	// CommitUnknown, when set, makes a successful transaction commit but lose the
	// acknowledgement (wraps port.ErrOutcomeUnknown).
	CommitUnknown error
}

type (
	wsKey struct {
		ws    matter.WorkspaceID
		actor matter.ActorID
	}
	mmKey struct {
		m     matter.MatterID
		actor matter.ActorID
	}
	receiptKey struct {
		actor matter.ActorID
		key   matter.IdempotencyKey
	}
	importSourceKey struct {
		matter     matter.MatterID
		sourceName string
		rowKey     string
	}
)

// NewMemoryStore returns an empty Store using the given clock (deterministic tests).
func NewMemoryStore(clock func() time.Time) *Store {
	return &Store{
		matters:       map[matter.MatterID]*matter.MatterHeader{},
		wsHeaders:     map[matter.WorkspaceID]matter.Workspace{},
		wsMemberships: map[wsKey]matter.WorkspaceMembership{},
		mMemberships:  map[mmKey]matter.MatterMembership{},
		nodes:         map[matter.NodeID]matter.Node{},
		requirements:  map[matter.RequirementID]matter.WorkItem{},
		actions:       map[matter.NodeID]matter.WorkItem{},
		edges:         map[string]matter.Edge{},
		workstreams:   map[matter.WorkstreamID]matter.Workstream{},
		parties:       map[matter.PartyID]matter.Party{},
		milestones:    map[matter.MilestoneID]matter.Milestone{},
		documents:     map[matter.DocumentID]matter.Document{},
		versions:      map[matter.VersionID]matter.DocumentVersion{},
		criteria:      map[matter.CriterionID]matter.Criterion{},
		evidence:      map[matter.EvidenceID]matter.Evidence{},
		claims:        map[matter.ClaimID]matter.Claim{},
		assessments:   map[matter.AssessmentID]matter.Assessment{},
		disputes:      map[matter.DisputeID]matter.Dispute{},
		verifiers:     map[mmKey]bool{},
		filings:       map[matter.NodeID]matter.Filing{},
		contexts:      map[string]matter.ContextRecord{},
		reviewGrids:   map[string]matter.ReviewGrid{},
		receipts:      map[receiptKey]matter.Receipt{},
		importSources: map[importSourceKey]matter.ImportSource{},
		clock:         clock,
	}
}

// SetFailAt injects a failure into the matching transaction step ("" clears).
func (s *Store) SetFailAt(step string) { s.FailAt = step }

// SetCommitRollback simulates a known commit abort (nil clears).
func (s *Store) SetCommitRollback(err error) { s.CommitRollback = err }

// SetCommitUnknown simulates a lost commit acknowledgement (nil clears).
func (s *Store) SetCommitUnknown(err error) { s.CommitUnknown = err }

// snapshot deep-copies the state so a failed transaction can be discarded. Struct values
// are copied shallowly: rows are insert-only in this slice, so aliasing pointer fields
// across the copy cannot leak a rolled-back mutation.
func (s *Store) snapshot() *Store {
	cp := &Store{clock: s.clock}
	cp.matters = make(map[matter.MatterID]*matter.MatterHeader, len(s.matters))
	for k, v := range s.matters {
		h := *v
		if h.NextBoundaryAt != nil {
			t := *h.NextBoundaryAt
			h.NextBoundaryAt = &t
		}
		cp.matters[k] = &h
	}
	cp.wsHeaders = make(map[matter.WorkspaceID]matter.Workspace, len(s.wsHeaders))
	for k, v := range s.wsHeaders {
		cp.wsHeaders[k] = v
	}
	cp.wsMemberships = make(map[wsKey]matter.WorkspaceMembership, len(s.wsMemberships))
	for k, v := range s.wsMemberships {
		cp.wsMemberships[k] = v
	}
	cp.mMemberships = make(map[mmKey]matter.MatterMembership, len(s.mMemberships))
	for k, v := range s.mMemberships {
		cp.mMemberships[k] = v
	}
	cp.nodes = make(map[matter.NodeID]matter.Node, len(s.nodes))
	for k, v := range s.nodes {
		cp.nodes[k] = v
	}
	// Work items are replaced whole on every write (never mutated in place), so a shallow
	// copy of the maps is a faithful rollback point.
	cp.requirements = make(map[matter.RequirementID]matter.WorkItem, len(s.requirements))
	for k, v := range s.requirements {
		cp.requirements[k] = v
	}
	cp.actions = make(map[matter.NodeID]matter.WorkItem, len(s.actions))
	for k, v := range s.actions {
		cp.actions[k] = v
	}
	cp.edges = make(map[string]matter.Edge, len(s.edges))
	for k, v := range s.edges {
		cp.edges[k] = v
	}
	cp.importSources = make(map[importSourceKey]matter.ImportSource, len(s.importSources))
	for k, v := range s.importSources {
		cp.importSources[k] = v
	}
	cp.workstreams = make(map[matter.WorkstreamID]matter.Workstream, len(s.workstreams))
	for k, v := range s.workstreams {
		cp.workstreams[k] = v
	}
	cp.parties = make(map[matter.PartyID]matter.Party, len(s.parties))
	for k, v := range s.parties {
		cp.parties[k] = v
	}
	cp.milestones = make(map[matter.MilestoneID]matter.Milestone, len(s.milestones))
	for k, v := range s.milestones {
		cp.milestones[k] = v
	}
	cp.documents = copyMap(s.documents)
	cp.versions = copyMap(s.versions)
	cp.signatures = append([]matter.SignatureObservation(nil), s.signatures...)
	cp.criteria = copyMap(s.criteria)
	cp.evidence = copyMap(s.evidence)
	cp.claims = copyMap(s.claims)
	cp.assessments = copyMap(s.assessments)
	cp.disputes = copyMap(s.disputes)
	cp.verifiers = copyMap(s.verifiers)
	cp.filings = copyMap(s.filings)
	cp.contexts = copyMap(s.contexts)
	cp.reviewGrids = copyMap(s.reviewGrids)
	cp.reviewAnswers = append([]matter.ReviewAnswer(nil), s.reviewAnswers...)
	cp.reviewQuestionRevs = append([]reviewQuestionRev(nil), s.reviewQuestionRevs...)
	cp.filingCyc = append([]matter.FilingCycle(nil), s.filingCyc...)
	cp.filingSubs = append([]matter.FilingSubmission(nil), s.filingSubs...)
	cp.filingObs = append([]matter.FilingObservation(nil), s.filingObs...)
	cp.events = append([]matter.RequirementCreatedEvent(nil), s.events...)
	cp.records = append([]matter.EventRecord(nil), s.records...)
	cp.receipts = make(map[receiptKey]matter.Receipt, len(s.receipts))
	for k, v := range s.receipts {
		rc := v
		rc.Matters = append([]matter.MatterID(nil), v.Matters...)
		if v.Snapshot != nil {
			snap := *v.Snapshot
			rc.Snapshot = &snap
		}
		if v.WorkspaceSnapshot != nil {
			snap := *v.WorkspaceSnapshot
			if snap.Matter != nil {
				m := *snap.Matter
				snap.Matter = &m
			}
			rc.WorkspaceSnapshot = &snap
		}
		if v.MembershipSnapshot != nil {
			snap := *v.MembershipSnapshot
			rc.MembershipSnapshot = &snap
		}
		if v.ItemSnapshot != nil {
			snap := *v.ItemSnapshot
			rc.ItemSnapshot = &snap
		}
		if v.CreatedSnapshot != nil {
			snap := *v.CreatedSnapshot
			rc.CreatedSnapshot = &snap
		}
		if v.PurgeAfter != nil {
			t := *v.PurgeAfter
			rc.PurgeAfter = &t
		}
		cp.receipts[k] = rc
	}
	cp.audits = append([]matter.SecurityAuditEntry(nil), s.audits...)
	return cp
}

// Execute implements port.MatterStore with unconditional transaction semantics.
func (s *Store) Execute(ctx context.Context, matterID matter.MatterID, fn func(tx port.MatterTx) error) error {
	if err := ctx.Err(); err != nil {
		return fmt.Errorf("matter store: %w: %w", port.ErrUnavailable, err)
	}
	s.mu.Lock()
	defer s.mu.Unlock()

	header, ok := s.matters[matterID]
	if !ok {
		return port.ErrNotFound
	}
	tCmd := s.clock()
	if header.LastRecordedAt.After(tCmd) {
		tCmd = header.LastRecordedAt
	}

	work := s.snapshot()
	workHeader, _ := work.matters[matterID]
	tx := &memTx{store: work, header: *workHeader, tCmd: tCmd, failAt: s.FailAt}
	if err := fn(tx); err != nil {
		return err // rolled back: work is discarded
	}
	if s.CommitRollback != nil {
		return fmt.Errorf("matter store commit: %w: %w", port.ErrUnavailable, s.CommitRollback)
	}
	s.adopt(work)
	if s.CommitUnknown != nil {
		return fmt.Errorf("matter store commit: %w: %w", port.ErrOutcomeUnknown, s.CommitUnknown)
	}
	return nil
}

// adopt replaces the live state with the committed working copy.
func (s *Store) adopt(work *Store) {
	s.matters = work.matters
	s.wsHeaders = work.wsHeaders
	s.wsMemberships = work.wsMemberships
	s.mMemberships = work.mMemberships
	s.nodes = work.nodes
	s.requirements = work.requirements
	s.actions = work.actions
	s.edges = work.edges
	s.workstreams = work.workstreams
	s.parties = work.parties
	s.milestones = work.milestones
	s.documents, s.versions, s.signatures = work.documents, work.versions, work.signatures
	s.criteria, s.evidence, s.claims = work.criteria, work.evidence, work.claims
	s.assessments, s.disputes, s.verifiers = work.assessments, work.disputes, work.verifiers
	s.filings, s.filingCyc, s.filingSubs, s.filingObs = work.filings, work.filingCyc, work.filingSubs, work.filingObs
	s.contexts = work.contexts
	s.reviewGrids, s.reviewAnswers, s.reviewQuestionRevs = work.reviewGrids, work.reviewAnswers, work.reviewQuestionRevs
	s.events = work.events
	s.records = work.records
	s.importSources = work.importSources
	s.receipts = work.receipts
	s.audits = work.audits
}

// View implements port.MatterStore with a point-in-time copy.
func (s *Store) View(ctx context.Context, fn func(snap port.MatterSnapshot) error) error {
	if err := ctx.Err(); err != nil {
		return fmt.Errorf("matter store: %w: %w", port.ErrUnavailable, err)
	}
	s.mu.Lock()
	frozen := s.snapshot()
	asOf := s.clock()
	failAt := s.FailAt
	s.mu.Unlock()
	return fn(&memSnapshot{state: frozen, asOf: asOf, failAt: failAt})
}

type memTx struct {
	store  *Store
	header matter.MatterHeader
	tCmd   time.Time
	failAt string
}

func (t *memTx) Matter() matter.MatterHeader { return t.header }
func (t *memTx) TCmd() time.Time             { return t.tCmd }

func (t *memTx) fail(step string) error {
	if t.failAt == step {
		return fmt.Errorf("injected failure at %s", step)
	}
	return nil
}

// membershipFailure returns the injected membership lookup error for the given step
// name, or nil when the step does not match. Unavailable mirrors the adapters'
// wrapped ErrUnavailable shape; unexpected is any non-ErrNotFound failure. Only
// ErrNotFound (never injected here) means absence.
func membershipFailure(failAt, step string) error {
	switch failAt {
	case step + "_unavailable":
		return fmt.Errorf("memory store: %w: %w", port.ErrUnavailable, ErrInjected)
	case step + "_unexpected":
		return fmt.Errorf("memory store: %w", ErrInjected)
	}
	return nil
}

func (t *memTx) WorkspaceMembership(_ context.Context, ws matter.WorkspaceID, actor matter.ActorID) (matter.WorkspaceMembership, error) {
	if err := membershipFailure(t.failAt, "membership"); err != nil {
		return matter.WorkspaceMembership{}, err
	}
	m, ok := t.store.wsMemberships[wsKey{ws, actor}]
	if !ok {
		return matter.WorkspaceMembership{}, port.ErrNotFound
	}
	return m, nil
}

func (t *memTx) MatterMembership(_ context.Context, m matter.MatterID, actor matter.ActorID) (matter.MatterMembership, error) {
	if err := membershipFailure(t.failAt, "membership"); err != nil {
		return matter.MatterMembership{}, err
	}
	mm, ok := t.store.mMemberships[mmKey{m, actor}]
	if !ok {
		return matter.MatterMembership{}, port.ErrNotFound
	}
	return mm, nil
}

func (t *memTx) Receipt(_ context.Context, actor matter.ActorID, key matter.IdempotencyKey) (matter.Receipt, error) {
	rc, ok := t.store.receipts[receiptKey{actor, key}]
	if !ok {
		return matter.Receipt{}, port.ErrNotFound
	}
	return rc, nil
}

func (t *memTx) InsertNode(_ context.Context, node matter.Node) error {
	if err := t.fail("insert_node"); err != nil {
		return err
	}
	if _, exists := t.store.nodes[node.ID]; exists {
		return fmt.Errorf("memory: node %s already exists", node.ID)
	}
	t.store.nodes[node.ID] = node
	return nil
}

func (t *memTx) InsertRequirement(_ context.Context, r matter.Requirement) error {
	if err := t.fail("insert_requirement"); err != nil {
		return err
	}
	if _, exists := t.store.requirements[r.ID]; exists {
		return fmt.Errorf("memory: requirement %s already exists", r.ID)
	}
	t.store.requirements[r.ID] = r.AsWorkItem()
	return nil
}

func (t *memTx) AppendRequirementCreated(_ context.Context, e matter.RequirementCreatedEvent) error {
	if err := t.fail("append_event"); err != nil {
		return err
	}
	t.store.events = append(t.store.events, e)
	// Mirror the PostgreSQL read model: every command event is part of matter history.
	actor, key := e.Actor.String(), e.IdempotencyKey.String()
	wi := e.Requirement.AsWorkItem()
	title, outcome := wi.Title, wi.Outcome
	after := map[string]any{
		"id": wi.ID.String(), "matterId": wi.MatterID.String(),
		"title": title, "outcome": outcome,
		"executionState": string(wi.Execution), "dependencyState": string(wi.Dependency),
		"verificationState": string(wi.Verification), "revision": wi.Revision,
	}
	if wi.OwnerActorID != nil {
		after["ownerActorId"] = wi.OwnerActorID.String()
	}
	if wi.DueAt != nil {
		after["dueAt"] = wi.DueAt.Format(time.RFC3339Nano)
	}
	afterJSON, aerr := json.Marshal(after)
	if aerr != nil {
		afterJSON = nil
	}
	t.store.records = append(t.store.records, matter.EventRecord{
		MatterID: e.MatterID, Seq: e.Seq, ID: e.EventID, Type: "requirement.created", SchemaVersion: 1,
		ActorKind: "USER", ActorID: &actor, TargetKind: "REQUIREMENT", TargetID: e.TargetID.String(),
		EffectiveAt: e.EffectiveAt, RecordedAt: e.RecordedAt, CommandKey: &key, After: afterJSON,
	})
	return nil
}

func (t *memTx) StoreReceipt(_ context.Context, rc matter.Receipt) error {
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

func (t *memTx) CompleteMatter(_ context.Context, seq int64, tCmd time.Time) error {
	if err := t.fail("complete_matter"); err != nil {
		return err
	}
	h := t.store.matters[t.header.MatterID]
	h.EventSeq = seq
	h.LastRecordedAt = tCmd
	h.BoundariesAppliedUntil = tCmd
	h.Revision++
	t.store.matters[t.header.MatterID] = h
	return nil
}

func (t *memTx) RecordSecurityAudit(_ context.Context, e matter.SecurityAuditEntry) error {
	t.store.audits = append(t.store.audits, e)
	return nil
}

type memSnapshot struct {
	state  *Store
	asOf   time.Time
	failAt string
}

func (s *memSnapshot) AsOf() time.Time { return s.asOf }

func (s *memSnapshot) RequirementByID(_ context.Context, id matter.RequirementID) (matter.Requirement, matter.MatterID, error) {
	w, ok := s.state.requirements[id]
	if !ok {
		// Absent typed row covers nonexistent ids and ACTION nodes alike: uniform outcome.
		return matter.Requirement{}, "", port.ErrNotFound
	}
	return w.AsRequirement(), w.MatterID, nil
}

func (s *memSnapshot) MatterHeader(_ context.Context, id matter.MatterID) (matter.MatterHeader, error) {
	h, ok := s.state.matters[id]
	if !ok {
		return matter.MatterHeader{}, port.ErrNotFound
	}
	return *h, nil
}

func (s *memSnapshot) WorkspaceMembership(_ context.Context, ws matter.WorkspaceID, actor matter.ActorID) (matter.WorkspaceMembership, error) {
	if err := membershipFailure(s.failAt, "membership"); err != nil {
		return matter.WorkspaceMembership{}, err
	}
	m, ok := s.state.wsMemberships[wsKey{ws, actor}]
	if !ok {
		return matter.WorkspaceMembership{}, port.ErrNotFound
	}
	return m, nil
}

func (s *memSnapshot) MatterMembership(_ context.Context, m matter.MatterID, actor matter.ActorID) (matter.MatterMembership, error) {
	if err := membershipFailure(s.failAt, "membership"); err != nil {
		return matter.MatterMembership{}, err
	}
	mm, ok := s.state.mMemberships[mmKey{m, actor}]
	if !ok {
		return matter.MatterMembership{}, port.ErrNotFound
	}
	return mm, nil
}

// MemoryWorld is the World implementation over a Store.
type MemoryWorld struct {
	store *Store
}

// NewMemoryWorld wires a World around store.
func NewMemoryWorld(store *Store) *MemoryWorld { return &MemoryWorld{store: store} }

// Store exposes the underlying store.
func (w *MemoryWorld) Store() *Store { return w.store }

func (w *MemoryWorld) AddUser(matter.ActorID) {}

// AddWorkspace seeds a workspace header (W1): the name is derived from the id for
// fixture purposes; product workspaces are created by CreateWorkspace.
func (w *MemoryWorld) AddWorkspace(id matter.WorkspaceID) {
	w.store.mu.Lock()
	defer w.store.mu.Unlock()
	if _, ok := w.store.wsHeaders[id]; !ok {
		w.store.wsHeaders[id] = matter.Workspace{ID: id, Name: "WS-" + id.String()[:8], Revision: 1}
	}
}

func (w *MemoryWorld) SetWorkspaceMembership(workspace matter.WorkspaceID, actor matter.ActorID, role matter.WorkspaceRole, status matter.MembershipStatus) {
	w.store.mu.Lock()
	defer w.store.mu.Unlock()
	w.store.wsMemberships[wsKey{workspace, actor}] = matter.WorkspaceMembership{
		WorkspaceID: workspace, ActorID: actor, Role: role, Status: status,
	}
}

func (w *MemoryWorld) AddMatter(id matter.MatterID, workspace matter.WorkspaceID) {
	w.store.mu.Lock()
	defer w.store.mu.Unlock()
	w.store.matters[id] = &matter.MatterHeader{MatterID: id, WorkspaceID: workspace}
}

func (w *MemoryWorld) SetMatterMembership(m matter.MatterID, actor matter.ActorID, role matter.MatterRole, status matter.MembershipStatus) {
	w.store.mu.Lock()
	defer w.store.mu.Unlock()
	w.store.mMemberships[mmKey{m, actor}] = matter.MatterMembership{
		MatterID: m, ActorID: actor, Role: role, Status: status,
	}
}

func (w *MemoryWorld) InsertActionNode(id matter.NodeID, m matter.MatterID) {
	w.store.mu.Lock()
	defer w.store.mu.Unlock()
	w.store.nodes[id] = matter.Node{ID: id, MatterID: m, Kind: matter.NodeAction}
	w.store.actions[id] = matter.WorkItem{
		ID: id, Kind: matter.NodeAction, MatterID: m, Title: "Structural action", Outcome: "Structural typed-totality row",
		Execution: matter.ExecutionNotStarted, Dependency: matter.DependencyReady, Revision: 1,
	}
}

// SetElapsedBoundary pins a pending boundary one tick before the next command
// instant: with the deterministic clock, every later command on the matter is due
// to process it.
func (w *MemoryWorld) SetElapsedBoundary(m matter.MatterID) {
	w.store.mu.Lock()
	defer w.store.mu.Unlock()
	h, ok := w.store.matters[m]
	if !ok {
		panic("mattercontrol: SetElapsedBoundary on unknown matter " + m)
	}
	due := w.store.clock().Add(-time.Second)
	h.NextBoundaryAt = &due
}

// SetFutureBoundary pins a pending boundary well after the command clock.
func (w *MemoryWorld) SetFutureBoundary(m matter.MatterID) {
	w.store.mu.Lock()
	defer w.store.mu.Unlock()
	h, ok := w.store.matters[m]
	if !ok {
		panic("mattercontrol: SetFutureBoundary on unknown matter " + m)
	}
	due := w.store.clock().Add(time.Hour)
	h.NextBoundaryAt = &due
}

// NextBoundary reports the matter's pending boundary, if any.
func (w *MemoryWorld) NextBoundary(m matter.MatterID) (time.Time, bool) {
	w.store.mu.Lock()
	defer w.store.mu.Unlock()
	h, ok := w.store.matters[m]
	if !ok || h.NextBoundaryAt == nil {
		return time.Time{}, false
	}
	return *h.NextBoundaryAt, true
}

func (w *MemoryWorld) Counts() Counts {
	w.store.mu.Lock()
	defer w.store.mu.Unlock()
	totalReceiptMatters := 0
	for _, rc := range w.store.receipts {
		totalReceiptMatters += len(rc.Matters)
	}
	return Counts{
		Nodes:            len(w.store.nodes),
		Requirements:     len(w.store.requirements),
		Actions:          len(w.store.actions),
		Events:           len(w.store.events),
		Receipts:         len(w.store.receipts),
		ReceiptMatters:   totalReceiptMatters,
		Audits:           len(w.store.audits),
		Matters:          len(w.store.matters),
		WorkspaceMembers: len(w.store.wsMemberships),
		MatterMembers:    len(w.store.mMemberships),
	}
}

func (w *MemoryWorld) Requirement(id matter.RequirementID) (matter.Requirement, bool) {
	w.store.mu.Lock()
	defer w.store.mu.Unlock()
	it, ok := w.store.requirements[id]
	return it.AsRequirement(), ok
}

func (w *MemoryWorld) Events() []matter.RequirementCreatedEvent {
	w.store.mu.Lock()
	defer w.store.mu.Unlock()
	return append([]matter.RequirementCreatedEvent(nil), w.store.events...)
}

func (w *MemoryWorld) Receipts() []matter.Receipt {
	w.store.mu.Lock()
	defer w.store.mu.Unlock()
	out := make([]matter.Receipt, 0, len(w.store.receipts))
	for _, rc := range w.store.receipts {
		out = append(out, rc)
	}
	return out
}

func (w *MemoryWorld) Audits() []matter.SecurityAuditEntry {
	w.store.mu.Lock()
	defer w.store.mu.Unlock()
	return append([]matter.SecurityAuditEntry(nil), w.store.audits...)
}

// Reopen returns the same store handle: the double has no connection lifecycle.
func (w *MemoryWorld) Reopen() port.MatterStore { return w.store }

// SetVerification pins a Requirement's verification state without any command.
func (w *MemoryWorld) SetVerification(id matter.NodeID, state matter.VerificationState) {
	w.store.mu.Lock()
	defer w.store.mu.Unlock()
	it := w.store.requirements[matter.RequirementID(id)]
	it.Verification = state
	w.store.requirements[matter.RequirementID(id)] = it
}

// IsMemoryDouble marks the in-memory double: step-failure injection is only supported there.
func (s *Store) IsMemoryDouble() {}

// copyMap shallow-copies a map: records are replaced whole on every write, never mutated in place.
func copyMap[K comparable, V any](in map[K]V) map[K]V {
	out := make(map[K]V, len(in))
	for k, v := range in {
		out[k] = v
	}
	return out
}
