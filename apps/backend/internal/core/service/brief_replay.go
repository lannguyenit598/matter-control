package service

// Deterministic reconstruction of the work state at a brief's as-of instant (t2) from the
// append-only history (RULE-016/019). Command-owned full snapshots replace an item's state;
// derived-state events patch only their own keys. Anything the replay cannot attribute is
// reported as port.ErrBriefUnreconstructable instead of being skipped.

import (
	"encoding/json"
	"fmt"
	"sort"
	"time"

	"github.com/example/userapi/internal/core/domain/matter"
	"github.com/example/userapi/internal/core/port"
)

type replayedItem struct {
	filing             bool
	filingOwnerUnknown bool
	kind               string
	m                  map[string]any
}

// creation events carry the item's full initial state.
func briefCreationTypes() map[string]string {
	return map[string]string{
		"requirement.created":        string(matter.NodeRequirement),
		"action.created":             string(matter.NodeAction),
		"import.requirement.created": string(matter.NodeRequirement),
		"import.action.created":      string(matter.NodeAction),
		"filing.created":             string(matter.NodeAction),
	}
}

// full-snapshot events replace the item's state; patch events change only their own keys.
func briefFullTypes() map[string]bool {
	return map[string]bool{"work.updated": true, "work.execution_changed": true, "bulk.updated": true, "filing.work_changed": true}
}

func briefPatchKeys() map[string][]string {
	return map[string][]string{
		"work.dependency_changed":      {"dependency"},
		"work.verification_changed":    {"verification"},
		"work.applicability_changed":   {"applicability", "verification"},
		"subject.proof_epoch_advanced": {"proofEpoch"},
	}
}

// briefAliases maps the legacy requirement-DTO key names onto the snapshot key names.
func briefAliases() map[string]string {
	return map[string]string{
		"executionState": "execution", "dependencyState": "dependency", "verificationState": "verification",
		"ownerActorId": "owner", "dueAt": "due",
	}
}

func unreconstructable(format string, args ...any) error {
	return fmt.Errorf("%w: %s", port.ErrBriefUnreconstructable, fmt.Sprintf(format, args...))
}

func decodeObject(r matter.EventRecord) (map[string]any, error) {
	var v any
	if err := json.Unmarshal(r.After, &v); err != nil {
		return nil, unreconstructable("event %s (%s) has an unreadable payload", r.ID, r.Type)
	}
	m, ok := v.(map[string]any)
	if !ok {
		return nil, unreconstructable("event %s (%s) has a non-object payload", r.ID, r.Type)
	}
	if nested, ok := m["requirement"].(map[string]any); ok && r.Type == "requirement.created" {
		m = nested
	}
	aliases := briefAliases()
	out := make(map[string]any, len(m))
	for k, val := range m {
		if to, ok := aliases[k]; ok {
			k = to
		}
		out[k] = val
	}
	return out, nil
}

func instantOf(v any) *time.Time {
	s, ok := v.(string)
	if !ok || s == "" {
		return nil
	}
	t, err := time.Parse(time.RFC3339Nano, s)
	if err != nil {
		return nil
	}
	return &t
}

// replayBrief folds the history (recorded_at ≤ t2, ordered by recorded time then sequence) into the
// work items outstanding at t2. Per the approved contract an item is dropped only if its state at t2
// was CANCELLED; completion does not remove it (completed is not verified), and the reader sees its
// execution and verification side by side.
func replayBrief(events []matter.EventRecord, t2 time.Time) ([]matter.BriefOutstandingItem, error) {
	creation, full, patches := briefCreationTypes(), briefFullTypes(), briefPatchKeys()
	items := map[string]*replayedItem{}
	events = append([]matter.EventRecord(nil), events...)
	sort.SliceStable(events, func(i, j int) bool {
		if events[i].RecordedAt.Equal(events[j].RecordedAt) {
			return events[i].Seq < events[j].Seq
		}
		return events[i].RecordedAt.Before(events[j].RecordedAt)
	})
	for _, r := range events {
		if r.RecordedAt.After(t2) {
			continue
		}
		kind, isCreate := creation[r.Type]
		patchKeys, isPatch := patches[r.Type]
		switch {
		case isCreate:
			m, err := decodeObject(r)
			if err != nil {
				return nil, err
			}
			if r.Type == "filing.created" { // a filing is an Action that starts in its initial state
				for k, v := range map[string]any{"execution": string(matter.ExecutionNotStarted), "dependency": string(matter.DependencyReady)} {
					if _, ok := m[k]; !ok {
						m[k] = v
					}
				}
			}
			_, ownerKnown := m["owner"]
			items[r.TargetID] = &replayedItem{kind: kind, m: m, filing: r.Type == "filing.created", filingOwnerUnknown: r.Type == "filing.created" && !ownerKnown}
		case full[r.Type]:
			it, ok := items[r.TargetID]
			if !ok {
				return nil, unreconstructable("event %s (%s) changes %s, which has no creation event", r.ID, r.Type, r.TargetID)
			}
			m, err := decodeObject(r)
			if err != nil {
				return nil, err
			}
			it.m = m
			it.filingOwnerUnknown = false
		case isPatch:
			it, ok := items[r.TargetID]
			if !ok {
				return nil, unreconstructable("event %s (%s) changes %s, which has no creation event", r.ID, r.Type, r.TargetID)
			}
			m, err := decodeObject(r)
			if err != nil {
				return nil, err
			}
			for _, k := range patchKeys {
				if v, ok := m[k]; ok {
					it.m[k] = v
				}
			}
		case r.Type == "filing.stage_changed" || r.Type == "filing.closed" || r.Type == "filing.reopened":
			it, ok := items[r.TargetID]
			if !ok {
				return nil, unreconstructable("filing %s has no creation", r.TargetID)
			}
			m, err := decodeObject(r)
			if err != nil {
				return nil, err
			}
			execution := matter.ExecutionInProgress
			switch r.Type {
			case "filing.closed":
				execution = matter.ExecutionCancelled
			case "filing.stage_changed":
				to, _ := m["to"].(string)
				switch matter.FilingStage(to) {
				case matter.StageSubmission, matter.StageReview:
					execution = matter.ExecutionWaiting
				case matter.StageApproval:
					execution = matter.ExecutionCompleted
				case matter.StagePackage, matter.StageSignature, matter.StageReceipt, matter.StageSupplement, matter.StageResponse:
				default:
					return nil, unreconstructable("filing %s has unknown stage %s", r.TargetID, to)
				}
			}
			it.m["execution"] = string(execution)
			if ep, ok := m["proofEpoch"]; ok {
				it.m["proofEpoch"] = ep
			}
			if rev, ok := it.m["revision"].(float64); ok {
				it.m["revision"] = rev + 1
			}
		}
	}
	for id, item := range items {
		if item.filing && item.m["execution"] != string(matter.ExecutionCancelled) {
			revision, ok := item.m["revision"].(float64)
			if !ok || revision < 1 || revision != float64(int64(revision)) {
				return nil, unreconstructable("filing %s lacks historical revision provenance", id)
			}
		}
		if item.filingOwnerUnknown && item.m["execution"] != string(matter.ExecutionCancelled) {
			return nil, unreconstructable("filing %s lacks historical owner provenance", id)
		}
	}
	effective, expired, err := replayBriefProof(events, items, t2)
	if err != nil {
		return nil, err
	}
	var out []matter.BriefOutstandingItem
	for id, it := range items {
		state := effective[matter.NodeID(id)]
		it.m["verification"], it.m["dependency"] = string(state.Verification), string(state.Dependency)
		execution, _ := it.m["execution"].(string)
		verification, _ := it.m["verification"].(string)
		if execution == string(matter.ExecutionCancelled) {
			continue
		}
		o := matter.BriefOutstandingItem{ItemID: id, Kind: it.kind, Execution: execution, Verification: verification, ProofExpired: expired[id]}
		o.Title, _ = it.m["title"].(string)
		o.Outcome, _ = it.m["outcome"].(string)
		o.Dependency, _ = it.m["dependency"].(string)
		if v, ok := it.m["revision"].(float64); ok {
			o.Revision = int64(v)
		}
		if v, ok := it.m["owner"].(string); ok && v != "" {
			o.Owner = &v
		}
		o.Due = instantOf(it.m["due"])
		out = append(out, o)
	}
	sort.Slice(out, func(i, j int) bool { return out[i].ItemID < out[j].ItemID })
	return out, nil
}
