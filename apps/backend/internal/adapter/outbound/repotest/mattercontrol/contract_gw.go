package mattercontrol

// W7 original Golden Workflow ledgers (AC-161/162/163), run unchanged against the in-memory double
// and the PostgreSQL adapter. Each checkpoint is a real command through the services, followed by
// assertions on the five independent axes (Execution, Verification, Dependency, Timing, Attention),
// the exact versions and proof involved, and the recorded history. Rows are written to
// MC_GW_LEDGER_DIR (one JSON file per workflow and store) when it is set, so a run leaves evidence.
// This is service-level evidence: it is not a browser journey.

import (
	"encoding/json"
	"errors"
	"fmt"
	"os"
	"path/filepath"
	"strings"
	"testing"
	"time"

	"leonx.me/matter-control/internal/core/domain/matter"
	"leonx.me/matter-control/internal/core/port"
)

type gwAxes struct {
	Execution, Verification, Dependency, Timing, Attention string
}

func axesOf(v matter.WorkItemView) gwAxes {
	ver := string(v.Item.Verification)
	if ver == "" {
		ver = "N/A"
	}
	return gwAxes{string(v.Item.Execution), ver, string(v.Item.Dependency), string(v.Timing.State), string(v.Attention.State)}
}

type gwRow struct {
	Workflow, AC, Stage, Variant string
	Actor, ActorRole             string
	Subject                      string
	PreRevision, PostRevision    int64
	Before, After                gwAxes
	ProofEpoch                   int64
	EventTypes                   []string
	FirstSeq, LastSeq            int64
	Note                         string
}

type gwLedger struct {
	t     *testing.T
	e     *w2Env
	name  string
	ac    string
	store string
	rows  []gwRow
}

func newGWLedger(t *testing.T, e *w2Env, name, ac string) *gwLedger {
	store := "postgres"
	if _, ok := e.b.Store.(interface{ IsMemoryDouble() }); ok {
		store = "memory"
	}
	l := &gwLedger{t: t, e: e, name: name, ac: ac, store: store}
	t.Cleanup(l.flush)
	return l
}

func (l *gwLedger) flush() {
	dir := os.Getenv("MC_GW_LEDGER_DIR")
	if dir == "" || len(l.rows) == 0 {
		return
	}
	if err := os.MkdirAll(dir, 0o750); err != nil { //nolint:gosec // operator-chosen evidence directory for test runs
		l.t.Logf("ledger dir: %v", err)
		return
	}
	b, _ := json.MarshalIndent(l.rows, "", "  ") // skip: plain structs always marshal
	name := strings.NewReplacer(" ", "_", "/", "_").Replace(l.t.Name())
	if err := os.WriteFile(filepath.Join(dir, fmt.Sprintf("%s-%s.json", name, l.store)), b, 0o600); err != nil { //nolint:gosec // operator-chosen evidence directory for test runs
		l.t.Logf("ledger write: %v", err)
	}
}

func (l *gwLedger) maxSeq() int64 {
	var m int64
	for _, ev := range l.e.events() {
		if ev.Seq > m {
			m = ev.Seq
		}
	}
	return m
}

// cp runs one checkpoint: it captures the subject's axes and revision before and after `do`, and the
// history events the step recorded, and returns the after-state item view.
func (l *gwLedger) cp(stage, variant string, actor matter.ActorID, role string, subject matter.NodeID, do func()) matter.WorkItemView {
	l.t.Helper()
	before := l.e.detail(subject).View
	seq0 := l.maxSeq()
	do()
	after := l.e.detail(subject).View
	row := gwRow{
		Workflow: l.name, AC: l.ac, Stage: stage, Variant: variant, Actor: actor.String(), ActorRole: role, Subject: subject.String(),
		PreRevision: before.Item.Revision, PostRevision: after.Item.Revision, Before: axesOf(before), After: axesOf(after),
		ProofEpoch: after.Item.ProofEpoch, FirstSeq: seq0 + 1, LastSeq: l.maxSeq(),
	}
	for _, ev := range l.e.events() {
		if ev.Seq > seq0 {
			row.EventTypes = append(row.EventTypes, ev.Type)
		}
	}
	l.rows = append(l.rows, row)
	return after
}

// refused asserts a denial changed nothing: same revision, no new history, no new submission.
func (l *gwLedger) refused(label string, subject matter.NodeID, do func() error, code string) {
	l.t.Helper()
	rev, seq := l.e.detail(subject).View.Item.Revision, l.maxSeq()
	err := do()
	if err == nil {
		l.t.Fatalf("%s: expected a refusal", label)
	}
	if code != "" {
		mustCode(l.t, label, err, code)
	}
	if l.e.detail(subject).View.Item.Revision != rev || l.maxSeq() != seq {
		l.t.Fatalf("%s: a refused command left a revision or a history event", label)
	}
	l.rows = append(l.rows, gwRow{Workflow: l.name, AC: l.ac, Stage: label, Variant: "denied", Subject: subject.String(), PreRevision: rev, PostRevision: rev, Note: err.Error()})
}

func needAxes(t *testing.T, label string, got, want gwAxes) {
	t.Helper()
	if want.Execution != "" && got.Execution != want.Execution {
		t.Fatalf("%s: execution %s, want %s", label, got.Execution, want.Execution)
	}
	if want.Verification != "" && got.Verification != want.Verification {
		t.Fatalf("%s: verification %s, want %s", label, got.Verification, want.Verification)
	}
	if want.Dependency != "" && got.Dependency != want.Dependency {
		t.Fatalf("%s: dependency %s, want %s", label, got.Dependency, want.Dependency)
	}
	if got.Timing == "" || got.Attention == "" {
		t.Fatalf("%s: timing and attention must always be readable: %+v", label, got)
	}
}

func stageEventsOf(rows []gwRow, stage string) []string {
	for _, r := range rows {
		if r.Stage == stage && r.Variant != "denied" {
			return r.EventTypes
		}
	}
	return nil
}

// SuiteGW runs the three original Golden Workflows as checkpoint ledgers.
func SuiteGW(t *testing.T, newBundle Factory) {
	t.Helper()
	t.Run("GW-03 Regulatory Filing (AC-163): two supplement cycles, approval, reopen", func(t *testing.T) { gw03(t, newBundle) })
	t.Run("GW-03 alternates: no supplement, rejection and closure, revoked rights, stale stage", func(t *testing.T) { gw03Alternates(t, newBundle) })
	t.Run("GW-01 Transaction (AC-161): approval to post-closing", func(t *testing.T) { gw01(t, newBundle) })
	t.Run("GW-02 Due Diligence (AC-162): request to resolution", func(t *testing.T) { gw02(t, newBundle) })
}

func gw03(t *testing.T, newBundle Factory) {
	e := newW2Env(t, newBundle)
	l := newGWLedger(t, e, "GW-03", "AC-163")
	f := e.newFiling(true) // U1 (editor) creates and owns the filing; U2 (reviewer) verifies independently
	doc := e.document("Filing package").Document.ID.String()
	v1, v2, v3 := e.version(doc, sum(1)), e.version(doc, sum(2)), e.version(doc, sum(3))

	// Requirement: the filing and the linked Requirement stay distinct, in their initial states.
	req0 := e.detail(f.req.ID).View
	post := l.cp("Requirement", "main", e.editor, "EDITOR", f.filingID, func() {})
	d := f.get()
	if f.filingID == f.req.ID || post.Item.Kind != matter.NodeAction || req0.Item.Kind != matter.NodeRequirement {
		t.Fatalf("the filing and its Requirement are different records: %v %v", post.Item.Kind, req0.Item.Kind)
	}
	if d.Filing.Stage != matter.StageRequirement || d.Filing.RequirementID != f.req.ID || len(d.Cycles) != 1 || post.Item.ProofEpoch != 0 {
		t.Fatalf("initial stage, link, cycle and epoch: %+v", d.Filing)
	}
	needAxes(t, "Requirement", axesOf(post), gwAxes{Execution: "NOT_STARTED", Verification: "UNVERIFIED", Dependency: "READY"})

	// Package Preparation: allowed only with declared package criteria; IN_PROGRESS.
	l.refused("Package Preparation without criteria", f.filingID, func() error { return errOf(f.adv(e.editor, "PACKAGE_PREPARATION", nil)) }, "package-criteria-required")
	sigC, _ := e.criterion(f.filingID, port.CriterionInput{Title: "Signed filing form", Mandatory: true, Rule: "NONE"})
	pkgC, _ := e.criterion(f.filingID, port.CriterionInput{Title: "Package complete", Mandatory: true, Rule: "NONE"})
	// BF-01: the authority's decision is its own OUTCOME criterion; it never gates submission and
	// only an independent verifier's acceptance of the outcome evidence satisfies it.
	outC, _ := e.criterion(f.filingID, port.CriterionInput{Title: "Authority decision accepted", Mandatory: true, Rule: "NONE", Purpose: "OUTCOME"})
	l.refused("Outcome criterion on a record that is not a filing", f.req.ID, func() error {
		_, err := e.ev.CreateCriterion(e.ctx, port.CreateCriterionCmd{ActorID: e.editor.String(), MatterID: e.m.String(), SubjectID: f.req.ID.String(),
			Criterion: port.CriterionInput{Title: "Nope", Mandatory: true, Rule: "NONE", Purpose: "OUTCOME"}})
		return err
	}, "outcome-criterion-not-applicable")
	post = l.cp("Package Preparation", "main", e.editor, "EDITOR", f.filingID, func() { f.must("PACKAGE_PREPARATION", nil) })
	needAxes(t, "Package Preparation", axesOf(post), gwAxes{Execution: "IN_PROGRESS", Verification: "UNVERIFIED"})

	// Signature: package contents identified; a missing signature keeps the package unsatisfied.
	l.refused("Signature without contents", f.filingID, func() error { return errOf(f.adv(e.editor, "SIGNATURE", nil)) }, "package-contents-required")
	post = l.cp("Signature", "main", e.editor, "EDITOR", f.filingID, func() {
		f.must("SIGNATURE", func(c *port.AdvanceFilingCmd) { c.VersionIDs = []string{v1.String()} })
	})
	needAxes(t, "Signature", axesOf(post), gwAxes{Execution: "IN_PROGRESS", Verification: "UNVERIFIED"})
	submit1 := func(mut func(*port.AdvanceFilingCmd)) error {
		_, err := f.adv(e.editor, "SUBMISSION", func(c *port.AdvanceFilingCmd) {
			c.Reference, c.VersionIDs, c.ObservedAt = "SUB-1", []string{v1.String()}, past()
			if mut != nil {
				mut(c)
			}
		})
		return err
	}
	l.refused("Submission with unsatisfied package and signature", f.filingID, func() error { return submit1(nil) }, "guard-failed")
	_, err := f.adv(e.editor, "SUBMISSION", func(c *port.AdvanceFilingCmd) { c.Reference, c.VersionIDs = "SUB-1", []string{v1.String()} })
	var rej *matter.RejectedError
	if !asRejected(err, &rej) || !strings.Contains(rej.Message, "Signed filing form") || !strings.Contains(rej.Message, "Package complete") {
		t.Fatalf("the refusal names exactly what is missing: %v", err)
	}

	// Independent review: the submitter never reviews their own proof.
	for _, c := range []matter.CriterionID{sigC, pkgC} {
		if _, err := e.submit(e.editor, func(s *port.SubmitEvidenceCmd) { s.Claims = []string{c.String()} }); err != nil {
			t.Fatal(err)
		}
	}
	mustCode(t, "self review", errOf(e.assess(e.editor, f.filingID, e.claimOf(f.filingID, sigC).Claim.ID, "ACCEPTED")), "not-verifier")
	if _, err := e.assess(e.reviewer, f.filingID, e.claimOf(f.filingID, sigC).Claim.ID, "ACCEPTED"); err != nil {
		t.Fatal(err)
	}
	e.state("one of two mandatory criteria accepted: partial", f.filingID, matter.VerificationPartiallyVerified)
	l.refused("Submission with the package still unsatisfied", f.filingID, func() error { return submit1(nil) }, "guard-failed")
	if _, err := e.assess(e.reviewer, f.filingID, e.claimOf(f.filingID, pkgC).Claim.ID, "ACCEPTED"); err != nil {
		t.Fatal(err)
	}
	// The package is ready, but the filing is not VERIFIED while its outcome criterion is open.
	e.state("package accepted, outcome criterion still open", f.filingID, matter.VerificationPartiallyVerified)
	if ck := e.checklist(f.filingID); !ck.Result.Package.Ready() || !ck.Result.Outcome.Declared() || ck.Result.Outcome.Ready() {
		t.Fatalf("package ready, outcome declared but not accepted: %+v %+v", ck.Result.Package, ck.Result.Outcome)
	}

	// Submission: exact version set of cycle 1; denied wrong version, future time, missing reference.
	l.refused("Submission with a wrong version", f.filingID, func() error {
		return submit1(func(c *port.AdvanceFilingCmd) { c.VersionIDs = []string{"01a17c8f-15d0-7386-8133-c1625313f6d1"} })
	}, "unknown-version")
	l.refused("Submission dated in the future", f.filingID, func() error {
		return submit1(func(c *port.AdvanceFilingCmd) {
			c.ObservedAt = time.Now().Add(48 * time.Hour).UTC().Format(time.RFC3339)
		})
	}, "observed-in-future")
	l.refused("Submission without a reference", f.filingID, func() error { return submit1(func(c *port.AdvanceFilingCmd) { c.Reference = "" }) }, "reference-required")
	post = l.cp("Submission", "cycle 1", e.editor, "EDITOR", f.filingID, func() {
		f.must("SUBMISSION", func(c *port.AdvanceFilingCmd) {
			c.Reference, c.VersionIDs, c.ObservedAt = "SUB-1", []string{v1.String()}, past()
		})
	})
	d = f.get()
	if post.Item.Execution != matter.ExecutionWaiting || post.Item.WaitingPartyID == nil || *post.Item.WaitingPartyID != f.party.ID || post.Item.CompletedAt != nil {
		t.Fatalf("submitted is not completed: it waits on the authority: %+v", post.Item)
	}
	if len(d.Submissions) != 1 || d.Submissions[0].Reference != "SUB-1" || len(d.Submissions[0].Versions) != 1 || d.Submissions[0].Versions[0] != v1 || d.Cycles[0].SubmittedAt == nil {
		t.Fatalf("cycle 1 keeps its exact version set: %+v", d.Submissions)
	}
	if post.Item.OwnerActorID == nil || *post.Item.OwnerActorID != e.editor {
		t.Fatalf("the accountable internal owner remains while waiting: %+v", post.Item)
	}
	needAxes(t, "Submission", axesOf(post), gwAxes{Execution: "WAITING", Verification: "PARTIALLY_VERIFIED", Dependency: "READY"})

	// Receipt: acknowledgement evidence; distinct from submission and from approval.
	l.refused("Receipt without evidence", f.filingID, func() error { return errOf(f.adv(e.editor, "RECEIPT", nil)) }, "evidence-required")
	post = l.cp("Receipt", "main", e.editor, "EDITOR", f.filingID, func() {
		f.must("RECEIPT", func(c *port.AdvanceFilingCmd) { c.EvidenceIDs = []string{f.evidence("ack-1")} })
	})
	if post.Item.Execution == matter.ExecutionCompleted || f.get().Filing.Stage != matter.StageReceipt || post.Item.CompletedAt != nil {
		t.Fatalf("a receipt is not an approval: %+v", post.Item)
	}
	if r := e.detail(f.req.ID).View.Item; r.Execution != matter.ExecutionNotStarted || r.Verification == matter.VerificationVerified {
		t.Fatalf("a receipt never completes or verifies the linked Requirement: %+v", r)
	}

	// Authority Review: waiting on the authority with the internal owner accountable.
	post = l.cp("Authority Review", "main", e.editor, "EDITOR", f.filingID, func() { f.must("AUTHORITY_REVIEW", nil) })
	needAxes(t, "Authority Review", axesOf(post), gwAxes{Execution: "WAITING", Dependency: "READY"})

	// Supplement and Response: two complete cycles, distinct references, owner, due and versions.
	due := time.Now().Add(72 * time.Hour).UTC().Format(time.RFC3339)
	l.refused("Supplement without the request details", f.filingID, func() error { return errOf(f.adv(e.editor, "SUPPLEMENT", nil)) }, "supplement-details-required")
	epochBefore := e.detail(f.filingID).View.Item.ProofEpoch
	post = l.cp("Supplement", "cycle 2", e.editor, "EDITOR", f.filingID, func() {
		f.must("SUPPLEMENT", func(c *port.AdvanceFilingCmd) {
			c.RequestRef, c.CycleOwnerID, c.CycleDue = "REQ-1", e.editor.String(), due
		})
	})
	d = f.get()
	if d.Filing.CurrentCycle != 2 || len(d.Cycles) != 2 || post.Item.ProofEpoch != epochBefore {
		t.Fatalf("a new cycle is not a new proof epoch: cycle=%d epoch %d->%d", d.Filing.CurrentCycle, epochBefore, post.Item.ProofEpoch)
	}
	if d.Cycles[0].SubmittedAt == nil || len(d.Submissions) != 1 || d.Cycles[1].RequestRef != "REQ-1" {
		t.Fatalf("cycle 1 is not overwritten: %+v", d.Cycles)
	}
	extra, _ := e.criterion(f.filingID, port.CriterionInput{Title: "Additional market data", Mandatory: true, Rule: "NONE"})
	l.refused("Response with the requested item unsatisfied", f.filingID, func() error {
		_, err := f.adv(e.editor, "RESPONSE", func(c *port.AdvanceFilingCmd) { c.Reference = "RESP-2"; c.VersionIDs = []string{v2.String()} })
		return err
	}, "guard-failed")
	if _, err := e.submit(e.editor, func(s *port.SubmitEvidenceCmd) { s.Claims = []string{extra.String()} }); err != nil {
		t.Fatal(err)
	}
	if _, err := e.assess(e.reviewer, f.filingID, e.claimOf(f.filingID, extra).Claim.ID, "ACCEPTED"); err != nil {
		t.Fatal(err)
	}
	l.cp("Response", "cycle 2", e.editor, "EDITOR", f.filingID, func() {
		f.must("RESPONSE", func(c *port.AdvanceFilingCmd) { c.Reference = "RESP-2"; c.VersionIDs = []string{v2.String()} })
	})
	post = l.cp("Authority Review", "after cycle 2", e.editor, "EDITOR", f.filingID, func() { f.must("AUTHORITY_REVIEW", nil) })
	needAxes(t, "Authority Review after the response", axesOf(post), gwAxes{Execution: "WAITING"})
	l.cp("Supplement", "cycle 3", e.editor, "EDITOR", f.filingID, func() {
		f.must("SUPPLEMENT", func(c *port.AdvanceFilingCmd) {
			c.RequestRef, c.CycleOwnerID, c.CycleDue = "REQ-2", e.editor.String(), due
		})
	})
	l.cp("Response", "cycle 3", e.editor, "EDITOR", f.filingID, func() {
		f.must("RESPONSE", func(c *port.AdvanceFilingCmd) { c.Reference = "RESP-3"; c.VersionIDs = []string{v3.String()} })
	})
	l.cp("Authority Review", "after cycle 3", e.editor, "EDITOR", f.filingID, func() { f.must("AUTHORITY_REVIEW", nil) })
	d = f.get()
	if len(d.Cycles) != 3 || d.Filing.CurrentCycle != 3 || len(d.Submissions) != 3 {
		t.Fatalf("three cycles, three submissions: %+v", d)
	}
	refs := map[string]bool{}
	for i, want := range []matter.VersionID{v1, v2, v3} {
		s := d.Submissions[i]
		refs[s.Reference] = true
		if s.CycleNo != i+1 || len(s.Versions) != 1 || s.Versions[0] != want {
			t.Fatalf("each cycle keeps its own exact version set: %+v", d.Submissions)
		}
	}
	if len(refs) != 3 || e.detail(f.filingID).View.Item.ProofEpoch != 0 {
		t.Fatalf("distinct references and an unchanged proof epoch: %v", refs)
	}

	// Approval: needs outcome evidence; completes the filing, not the Requirement; verification is its own axis.
	l.refused("Approval without outcome evidence", f.filingID, func() error { return errOf(f.adv(e.editor, "APPROVAL", nil)) }, "evidence-required")
	outcome1 := f.evidence("decision-1")
	post = l.cp("Approval", "main", e.editor, "EDITOR", f.filingID, func() {
		f.must("APPROVAL", func(c *port.AdvanceFilingCmd) {
			c.EvidenceIDs = []string{outcome1}
			c.Reference, c.ObservedAt = "DEC-1", past()
		})
	})
	// BF-01: recording the authority's decision completes the filing but does not accept the outcome.
	needAxes(t, "Approval", axesOf(post), gwAxes{Execution: "COMPLETED", Verification: "PARTIALLY_VERIFIED"})
	if post.Item.CompletedAt == nil {
		t.Fatal("completion time is recorded")
	}
	if ck := e.checklist(f.filingID); ck.Result.Outcome.Ready() || !ck.Result.Package.Ready() {
		t.Fatalf("approval evidence alone leaves the outcome pending: %+v", ck.Result)
	}
	if got := f.get().OutcomeVerification; got != matter.OutcomePending {
		t.Fatalf("the filing says its outcome is pending, not verified: %s", got)
	}
	if _, err := e.ev.AddClaim(e.ctx, port.AddClaimCmd{ActorID: e.editor.String(), MatterID: e.m.String(), EvidenceID: outcome1, CriterionID: outC.String()}); err != nil {
		t.Fatal(err)
	}
	mustCode(t, "the submitter never accepts the outcome", errOf(e.assess(e.editor, f.filingID, e.claimOf(f.filingID, outC).Claim.ID, "ACCEPTED")), "not-verifier")
	e.state("outcome claimed but not independently accepted", f.filingID, matter.VerificationPartiallyVerified)
	if _, err := e.assess(e.reviewer, f.filingID, e.claimOf(f.filingID, outC).Claim.ID, "ACCEPTED"); err != nil {
		t.Fatal(err)
	}
	e.state("independent outcome acceptance", f.filingID, matter.VerificationVerified)
	if got := f.get().OutcomeVerification; got != matter.OutcomeAccepted {
		t.Fatalf("an accepted outcome is reported as such: %s", got)
	}
	if r := e.detail(f.req.ID).View.Item; r.Execution != matter.ExecutionNotStarted || r.Verification == matter.VerificationVerified {
		t.Fatalf("filing approval never completes or verifies the linked Requirement: %+v", r)
	}
	if got := f.get(); len(got.Submissions) != 3 || got.Submissions[0].Versions[0] != v1 || got.Submissions[2].Versions[0] != v3 {
		t.Fatalf("exact submitted versions stay retrievable: %+v", got.Submissions)
	}
	l.refused("Approval of a closed filing", f.filingID, func() error {
		return errOf(f.adv(e.editor, "APPROVAL", func(c *port.AdvanceFilingCmd) { c.EvidenceIDs = []string{outcome1} }))
	}, "filing-closed")

	// OWNER reopen: a new proof epoch; earlier submissions and the earlier outcome stay; old evidence cannot approve.
	reopen := func(actor matter.ActorID, reason string) error {
		_, err := e.fil.Reopen(e.ctx, port.ReasonedFilingCmd{ActorID: actor.String(), MatterID: e.m.String(), FilingID: f.filingID.String(), ExpectedRevision: f.get().View.Item.Revision, Reason: reason})
		return err
	}
	l.refused("Reopen by an editor", f.filingID, func() error { return reopen(e.editor, "x") }, "")
	post = l.cp("Reopen", "OWNER", e.owner, "OWNER", f.filingID, func() {
		if err := reopen(e.owner, "authority asked to reconsider"); err != nil {
			t.Fatal(err)
		}
	})
	needAxes(t, "Reopen", axesOf(post), gwAxes{Execution: "IN_PROGRESS", Verification: "UNVERIFIED"})
	if post.Item.ProofEpoch != 1 || len(f.get().Submissions) != 3 {
		t.Fatalf("reopen advances the epoch and keeps the submissions: epoch=%d", post.Item.ProofEpoch)
	}
	l.refused("Approval on pre-reopen evidence", f.filingID, func() error {
		return errOf(f.adv(e.editor, "APPROVAL", func(c *port.AdvanceFilingCmd) { c.EvidenceIDs = []string{outcome1} }))
	}, "evidence-before-reopen")

	// History: the stage steps are recorded in order, each with a strictly increasing sequence.
	var last int64
	stages := 0
	for _, ev := range e.events() {
		if ev.Seq <= last {
			t.Fatalf("history sequence must be strictly increasing: %d after %d", ev.Seq, last)
		}
		last = ev.Seq
		if ev.Type == "filing.stage_changed" {
			stages++
		}
	}
	if stages < 10 {
		t.Fatalf("every stage step is in the history, got %d", stages)
	}
	if !contains(stageEventsOf(l.rows, "Approval"), "filing.stage_changed") {
		t.Fatalf("approval recorded its stage event: %v", stageEventsOf(l.rows, "Approval"))
	}
}

func contains(ss []string, want string) bool {
	for _, s := range ss {
		if s == want {
			return true
		}
	}
	return false
}

func asRejected(err error, target **matter.RejectedError) bool { return errors.As(err, target) }
