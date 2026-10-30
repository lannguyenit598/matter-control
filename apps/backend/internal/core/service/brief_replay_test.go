package service

import (
	"errors"
	"testing"
	"time"

	"leonx.me/matter-control/internal/core/domain/matter"
	"leonx.me/matter-control/internal/core/port"
)

var replayT0 = time.Date(2026, 10, 1, 9, 0, 0, 0, time.UTC)

func rec(seq int64, at time.Time, typ, kind, target, after string) matter.EventRecord {
	r := matter.EventRecord{Seq: seq, ID: typ + target, Type: typ, TargetKind: kind, TargetID: target, RecordedAt: at, EffectiveAt: at}
	if after != "" {
		r.After = []byte(after)
	}
	return r
}

// A brief uses exactly the same proof rules as a live read, at its historical instant.
func proofReplayHistory() []matter.EventRecord {
	return []matter.EventRecord{
		rec(1, replayT0, "requirement.created", "REQUIREMENT", "r1", `{"requirement":{"title":"Approval","executionState":"COMPLETED","verificationState":"VERIFIED","dependencyState":"READY","revision":3}}`),
		rec(2, replayT0, "action.created", "ACTION", "a1", `{"title":"Downstream","execution":"NOT_STARTED","dependency":"READY","revision":1}`),
		rec(3, replayT0, "criterion.created", "CRITERION", "c1", `{"subject":"r1","mandatory":true,"rule":"NONE","revision":1,"retired":false}`),
		rec(4, replayT0, "evidence.submitted", "EVIDENCE", "e1", `{"kind":"EXTERNAL_REFERENCE","validFrom":"2026-10-01T09:00:00Z"}`),
		rec(5, replayT0, "evidence.claimed", "CLAIM", "k1", `{"evidence":"e1","criterion":"c1","criterionRevision":1}`),
		rec(6, replayT0, "assessment.recorded", "ASSESSMENT", "v1", `{"claim":"k1","subject":"r1","subjectEpoch":0,"verdict":"ACCEPTED","effectiveUntil":"2026-10-01T10:00:00Z"}`),
		rec(7, replayT0, "dependency.added", "DEPENDENCY", "d1", `{"source":"r1","target":"a1","gate":"PROOF"}`),
	}
}
func TestReplayBrief_ProofExpiryAtT2(t *testing.T) {
	for _, tc := range []struct {
		name                     string
		at                       time.Duration
		extra                    []matter.EventRecord
		verification, dependency string
		expired                  bool
	}{
		{"before", 30 * time.Minute, nil, "VERIFIED", "READY", false},
		{"boundary", time.Hour, nil, "UNVERIFIED", "BLOCKED", true},
		{"after", 2 * time.Hour, nil, "UNVERIFIED", "BLOCKED", true},
		{"revoked", 2 * time.Hour, []matter.EventRecord{rec(8, replayT0, "assessment.revoked", "ASSESSMENT", "v1", `{}`)}, "UNVERIFIED", "BLOCKED", false},
		{"withdrawn", 2 * time.Hour, []matter.EventRecord{rec(8, replayT0, "evidence.withdrawn", "EVIDENCE", "e1", `{"withdrawnAt":"2026-10-01T09:00:00Z"}`)}, "UNVERIFIED", "BLOCKED", false},
		{"open dispute survives expiry", 2 * time.Hour, []matter.EventRecord{rec(8, replayT0, "dispute.raised", "DISPUTE", "x1", `{"assessment":"v1"}`)}, "DISPUTED", "BLOCKED", true},
		{"new epoch", 2 * time.Hour, []matter.EventRecord{rec(8, replayT0, "subject.proof_epoch_advanced", "REQUIREMENT", "r1", `{"proofEpoch":1}`)}, "UNVERIFIED", "BLOCKED", false},
		{"criterion revision", 2 * time.Hour, []matter.EventRecord{rec(8, replayT0, "criterion.revised", "CRITERION", "c1", `{"subject":"r1","mandatory":true,"rule":"NONE","revision":2,"retired":false}`)}, "UNVERIFIED", "BLOCKED", false},
	} {
		t.Run(tc.name, func(t *testing.T) {
			got, err := replayBrief(append(proofReplayHistory(), tc.extra...), replayT0.Add(tc.at))
			if err != nil {
				t.Fatal(err)
			}
			byID := map[string]matter.BriefOutstandingItem{}
			for _, it := range got {
				byID[it.ItemID] = it
			}
			if byID["r1"].Verification != tc.verification || byID["r1"].ProofExpired != tc.expired || byID["a1"].Dependency != tc.dependency {
				t.Fatalf("got %+v", got)
			}
		})
	}
}
func TestReplayBrief_AlternativeAndOptionalProof(t *testing.T) {
	for _, mandatory := range []bool{true, false} {
		history := proofReplayHistory()
		if !mandatory {
			history = append(history, rec(8, replayT0, "criterion.revised", "CRITERION", "c1", `{"subject":"r1","mandatory":false,"rule":"NONE","revision":1,"retired":false}`))
		}
		history = append(history,
			rec(9, replayT0, "evidence.submitted", "EVIDENCE", "e2", `{"kind":"EXTERNAL_REFERENCE","validFrom":"2026-10-01T09:00:00Z"}`),
			rec(10, replayT0, "evidence.claimed", "CLAIM", "k2", `{"evidence":"e2","criterion":"c1","criterionRevision":1}`),
			rec(11, replayT0, "assessment.recorded", "ASSESSMENT", "v2", `{"claim":"k2","subject":"r1","subjectEpoch":0,"verdict":"ACCEPTED","effectiveUntil":null}`))
		got, err := replayBrief(history, replayT0.Add(2*time.Hour))
		if err != nil {
			t.Fatal(err)
		}
		for _, it := range got {
			if it.ItemID == "r1" && (it.ProofExpired || (mandatory && it.Verification != "VERIFIED") || (!mandatory && it.Verification != "UNVERIFIED")) {
				t.Fatalf("mandatory %v: %+v", mandatory, it)
			}
		}
	}
}

// Cancelled work drops out of the outstanding set; reopening brings it back.
func TestReplayBrief_CancelledDropsOutAndReopenReturns(t *testing.T) {
	history := []matter.EventRecord{
		rec(1, replayT0, "action.created", "ACTION", "a1", `{"title":"A","outcome":"o","execution":"NOT_STARTED","dependency":"READY","revision":1}`),
		rec(2, replayT0.Add(time.Minute), "work.execution_changed", "ACTION", "a1", `{"title":"A","outcome":"o","execution":"CANCELLED","dependency":"READY","revision":2}`),
		rec(3, replayT0.Add(2*time.Minute), "work.execution_changed", "ACTION", "a1", `{"title":"A","outcome":"o","execution":"IN_PROGRESS","dependency":"READY","revision":3}`),
	}
	for at, want := range map[time.Duration]int{30 * time.Second: 1, 90 * time.Second: 0, 5 * time.Minute: 1} {
		got, err := replayBrief(history, replayT0.Add(at))
		if err != nil || len(got) != want {
			t.Fatalf("at +%v: %v %+v, want %d outstanding", at, err, got, want)
		}
	}
}

// An assessment recorded before expiry facts existed cannot be attributed, and must not make every
// brief of a matter with proof fail.
func TestReplayBrief_LegacyUnattributableAssessmentFailsClosed(t *testing.T) {
	history := []matter.EventRecord{
		rec(1, replayT0, "action.created", "ACTION", "a1", `{"title":"A","outcome":"o","execution":"NOT_STARTED","dependency":"READY"}`),
		rec(2, replayT0.Add(time.Minute), "assessment.recorded", "ASSESSMENT", "x1", `{"claim":"c1","verdict":"ACCEPTED","subjectEpoch":0,"criterionRevision":1}`),
	}
	got, err := replayBrief(history, replayT0.Add(time.Hour))
	if !errors.Is(err, port.ErrBriefUnreconstructable) {
		t.Fatalf("%v %+v", err, got)
	}
}

// Events recorded after t2 never leak into the state at t2, whatever order they are supplied in.
func TestReplayBrief_IgnoresEventsAfterT2(t *testing.T) {
	history := []matter.EventRecord{
		rec(1, replayT0, "action.created", "ACTION", "a1", `{"title":"A","outcome":"o","execution":"NOT_STARTED","dependency":"READY","revision":1}`),
		rec(2, replayT0.Add(time.Hour), "work.execution_changed", "ACTION", "a1", `{"title":"A","outcome":"o","execution":"CANCELLED","dependency":"READY","revision":2}`),
	}
	got, err := replayBrief(history, replayT0.Add(time.Minute))
	if err != nil || len(got) != 1 || got[0].Execution != "NOT_STARTED" {
		t.Fatalf("%v %+v", err, got)
	}
}

// History the replay cannot attribute is an error, never a silently thinner success.
func TestReplayBrief_UnreconstructableHistoryFailsLoudly(t *testing.T) {
	created := rec(1, replayT0, "action.created", "ACTION", "a1", `{"title":"A","outcome":"o","execution":"NOT_STARTED","dependency":"READY"}`)
	for name, history := range map[string][]matter.EventRecord{
		"a change to an item that was never created":         {rec(1, replayT0, "work.execution_changed", "ACTION", "ghost", `{"execution":"COMPLETED"}`)},
		"a derived change to an item that was never created": {rec(1, replayT0, "work.dependency_changed", "ACTION", "ghost", `{"dependency":"BLOCKED"}`)},
		"an unreadable snapshot":                             {created, rec(2, replayT0.Add(time.Second), "work.updated", "ACTION", "a1", `{not json`)},
		"a snapshot that is not an object":                   {created, rec(2, replayT0.Add(time.Second), "work.updated", "ACTION", "a1", `["x"]`)},
		"an expiry fact without its subject":                 {created, rec(2, replayT0.Add(time.Second), "assessment.recorded", "ASSESSMENT", "x1", `{"claim":"c1","verdict":"ACCEPTED","effectiveUntil":null}`)},
		"a creation event with no payload":                   {rec(1, replayT0, "action.created", "ACTION", "a1", "")},
	} {
		t.Run(name, func(t *testing.T) {
			if _, err := replayBrief(history, replayT0.Add(time.Hour)); !errors.Is(err, port.ErrBriefUnreconstructable) {
				t.Fatalf("want ErrBriefUnreconstructable, got %v", err)
			}
		})
	}
}

// Clearing an owner or due date is state: a full snapshot without the key replaces, it does not merge.
func TestReplayBrief_FullSnapshotReplacesOwner(t *testing.T) {
	history := []matter.EventRecord{
		rec(1, replayT0, "action.created", "ACTION", "a1", `{"title":"A","outcome":"o","execution":"NOT_STARTED","dependency":"READY","owner":"u1","due":"2026-12-01T00:00:00Z"}`),
		rec(2, replayT0.Add(time.Minute), "work.updated", "ACTION", "a1", `{"title":"A2","outcome":"o","execution":"NOT_STARTED","dependency":"READY"}`),
	}
	got, err := replayBrief(history, replayT0.Add(time.Hour))
	if err != nil || len(got) != 1 || got[0].Owner != nil || got[0].Due != nil || got[0].Title != "A2" {
		t.Fatalf("%v %+v", err, got)
	}
}

func TestReplayBrief_FilingCommandsReplayExecution(t *testing.T) {
	history := []matter.EventRecord{
		rec(1, replayT0, "filing.created", "FILING", "f1", `{"title":"File","proofRequired":false,"owner":null,"revision":1}`),
		rec(2, replayT0.Add(time.Minute), "filing.stage_changed", "FILING", "f1", `{"from":"REQUIREMENT","to":"PACKAGE_PREPARATION","proofEpoch":0}`),
		rec(3, replayT0.Add(2*time.Minute), "filing.closed", "FILING", "f1", `{"kind":"CLOSE_NEGATIVE","proofEpoch":0}`),
		rec(4, replayT0.Add(3*time.Minute), "filing.reopened", "FILING", "f1", `{"kind":"REOPEN","proofEpoch":1}`),
	}
	for _, tc := range []struct {
		at   time.Duration
		want string
	}{{90 * time.Second, "IN_PROGRESS"}, {150 * time.Second, ""}, {210 * time.Second, "IN_PROGRESS"}} {
		got, err := replayBrief(history, replayT0.Add(tc.at))
		if err != nil {
			t.Fatal(err)
		}
		if tc.want == "" {
			if len(got) != 0 {
				t.Fatalf("closed filing remains: %+v", got)
			}
			continue
		}
		if len(got) != 1 || got[0].Execution != tc.want {
			t.Fatalf("at %v: %+v", tc.at, got)
		}
	}
}

func TestReplayBrief_LegacyImportedBlockedWithoutEdgesFailsClosed(t *testing.T) {
	history := []matter.EventRecord{rec(1, replayT0, "import.action.created", "ACTION", "a1", `{"title":"Imported","execution":"NOT_STARTED","dependency":"BLOCKED"}`)}
	if _, err := replayBrief(history, replayT0.Add(time.Minute)); !errors.Is(err, port.ErrBriefUnreconstructable) {
		t.Fatalf("missing edge history must not become READY: %v", err)
	}
}

func TestReplayBrief_LegacyFilingOwnerIsUnknownUntilFullSnapshot(t *testing.T) {
	history := []matter.EventRecord{rec(1, replayT0, "filing.created", "FILING", "f1", `{"title":"Legacy filing","proofRequired":false}`)}
	if _, err := replayBrief(history, replayT0); !errors.Is(err, port.ErrBriefUnreconstructable) {
		t.Fatalf("omitted legacy owner is not known unassigned: %v", err)
	}
	history = append(history, rec(2, replayT0.Add(time.Minute), "filing.work_changed", "FILING", "f1", `{"title":"Legacy filing","execution":"IN_PROGRESS","owner":"a1","revision":2}`))
	got, err := replayBrief(history, replayT0.Add(time.Minute))
	if err != nil || len(got) != 1 || got[0].Owner == nil || *got[0].Owner != "a1" {
		t.Fatalf("snapshot restores owner provenance: %v %+v", err, got)
	}
}

func TestReplayBrief_LegacyFilingRevisionUnavailable(t *testing.T) {
	for _, raw := range []string{`{"title":"Filing","owner":null}`, `{"title":"Filing","owner":null,"revision":"bad"}`} {
		history := []matter.EventRecord{rec(1, replayT0, "filing.created", "FILING", "f1", raw), rec(2, replayT0.Add(time.Minute), "filing.stage_changed", "FILING", "f1", `{"to":"PACKAGE_PREPARATION"}`)}
		if _, err := replayBrief(history, replayT0.Add(time.Minute)); !errors.Is(err, port.ErrBriefUnreconstructable) {
			t.Fatalf("unknown revision is not zero: %v", err)
		}
	}
}
