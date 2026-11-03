package matter

import (
	"bytes"
	"encoding/json"
	"fmt"
	"time"
)

// ---------- Playbooks (RLF-05) ----------

// PlaybookID identifies one Workspace-scoped template container.
type PlaybookID string

func NewPlaybookID(s string) (PlaybookID, error) { return newUUID[PlaybookID](s, "playbookId") }
func (id PlaybookID) String() string             { return string(id) }

// PlaybookRevisionID identifies one immutable published revision.
type PlaybookRevisionID string

func NewPlaybookRevisionID(s string) (PlaybookRevisionID, error) {
	return newUUID[PlaybookRevisionID](s, "playbookRevisionId")
}
func (id PlaybookRevisionID) String() string { return string(id) }

// Playbook is the Workspace-scoped container. Only the Workspace OWNER publishes.
type Playbook struct {
	ID          PlaybookID
	WorkspaceID WorkspaceID
	Name        string
	CreatedBy   ActorID
	CreatedAt   time.Time
	Revision    int64
}

// PlaybookEntry is one step of a template: what kind of work to create, for whom (a stable
// owner key resolved to an ACTIVE Matter member at apply time), and what it depends on (stable
// keys, mapped to COMPLETION-gate edges). It is template content, never executable: no scripts,
// no free-form fields beyond the work item's own, no legal deadline (dueDaysOffset is the
// author's plain scheduling suggestion applied as a due date).
type PlaybookEntry struct {
	Key           string   `json:"key"`
	Kind          string   `json:"kind"`
	Title         string   `json:"title"`
	Outcome       string   `json:"outcome,omitempty"`
	OwnerKey      string   `json:"ownerKey,omitempty"`
	DueDaysOffset int      `json:"dueDaysOffset,omitempty"`
	DependsOn     []string `json:"dependsOn,omitempty"`
}

// PlaybookRevision is one immutable published snapshot of the entries. Published rows are never
// updated or deleted; old instantiations keep reading their exact revision.
type PlaybookRevision struct {
	ID         PlaybookRevisionID
	PlaybookID PlaybookID
	No         int64
	Entries    []PlaybookEntry
	CreatedBy  ActorID
	CreatedAt  time.Time
}

// PlaybookApplicationView is what a Matter OWNER previews before applying: the exact revision,
// which entries need an owner chosen at apply, and the problems apply would refuse. It stores
// nothing and changes nothing.
type PlaybookApplicationView struct {
	Playbook   Playbook
	Revision   PlaybookRevision
	OwnerNames map[string]string // entry key -> "" while unmapped; the person is chosen at apply
	Problems   []string          // problems apply would refuse (e.g. a foreign workspace)
}

// PlaybookInstance records the reproducible provenance of one created work item: which Matter
// applied which revision, which entry produced which item. It is provenance only — never
// evidence, never completion, and it grants no access.
type PlaybookInstance struct {
	MatterID   MatterID
	RevisionID PlaybookRevisionID
	PlaybookID PlaybookID
	EntryKey   string
	ItemID     NodeID
	AppliedBy  ActorID
	AppliedAt  time.Time
}

// ParsePlaybookEntries decodes and validates a revision's entries strictly: unknown members and
// duplicates are refused, keys are unique and stable, references resolve, and the dependency
// graph is acyclic. The same validation guards publishing and applying.
func ParsePlaybookEntries(b []byte) ([]PlaybookEntry, error) {
	var entries []PlaybookEntry
	dec := json.NewDecoder(bytes.NewReader(b))
	dec.DisallowUnknownFields()
	if err := dec.Decode(&entries); err != nil {
		return nil, fmt.Errorf("playbook entries: %w", err)
	}
	if dec.More() {
		return nil, fmt.Errorf("playbook entries: trailing content")
	}
	if err := ValidatePlaybookEntries(entries); err != nil {
		return nil, err
	}
	return entries, nil
}

// ValidatePlaybookEntries enforces the entry shape and reference rules.
func ValidatePlaybookEntries(entries []PlaybookEntry) error {
	if len(entries) == 0 {
		return fmt.Errorf("playbook entries: at least one entry is required")
	}
	if len(entries) > 100 {
		return fmt.Errorf("playbook entries: at most 100 entries")
	}
	keys := map[string]int{}
	for i, e := range entries {
		field := fmt.Sprintf("entries[%d]", i)
		if k := trimKey(e.Key); k == "" || len(k) > 100 {
			return fmt.Errorf("playbook entries: %s.key must be 1..100 characters", field)
		}
		if _, dup := keys[e.Key]; dup {
			return fmt.Errorf("playbook entries: duplicate key %q", e.Key)
		}
		keys[e.Key] = i
		if e.Kind != "REQUIREMENT" && e.Kind != "ACTION" {
			return fmt.Errorf("playbook entries: %s.kind must be REQUIREMENT or ACTION", field)
		}
		if t := trimKey(e.Title); t == "" || len(t) > 300 {
			return fmt.Errorf("playbook entries: %s.title must be 1..300 characters", field)
		}
		if o := trimKey(e.Outcome); o == "" || len(e.Outcome) > 5000 {
			return fmt.Errorf("playbook entries: %s.outcome must be 1..5000 characters", field)
		}
		if e.DueDaysOffset < 0 || e.DueDaysOffset > 3650 {
			return fmt.Errorf("playbook entries: %s.dueDaysOffset must be 0..3650", field)
		}
		if e.OwnerKey != "" {
			if _, ok := keys[e.OwnerKey]; !ok {
				return fmt.Errorf("playbook entries: %s.ownerKey %q is not a key of this playbook", field, e.OwnerKey)
			}
		}
		seen := map[string]bool{}
		for _, d := range e.DependsOn {
			if d == e.Key {
				return fmt.Errorf("playbook entries: %s depends on itself", field)
			}
			if _, ok := keys[d]; !ok {
				return fmt.Errorf("playbook entries: %s.dependsOn %q is not a key of this playbook", field, d)
			}
			if seen[d] {
				return fmt.Errorf("playbook entries: %s lists %q twice", field, d)
			}
			seen[d] = true
		}
	}
	if path := PlaybookCycle(entries); len(path) > 0 {
		return fmt.Errorf("playbook entries: dependency cycle %v", path)
	}
	return nil
}

func trimKey(s string) string {
	out := ""
	for _, r := range s {
		if r == ' ' || r == '\t' || r == '\n' {
			continue
		}
		out += string(r)
	}
	return out
}

// PlaybookCycle returns one dependency cycle as entry keys (empty when acyclic). Template
// dependencies must be a DAG before they may become COMPLETION-gate edges.
func PlaybookCycle(entries []PlaybookEntry) []string {
	deps := map[string][]string{}
	for _, e := range entries {
		deps[e.Key] = e.DependsOn
	}
	const (
		white = 0
		grey  = 1
		black = 2
	)
	state := map[string]int{}
	var stack []string
	var cycle []string
	var visit func(k string) bool
	visit = func(k string) bool {
		state[k] = grey
		stack = append(stack, k)
		for _, d := range deps[k] {
			switch state[d] {
			case grey:
				if i := index(stack, d); i >= 0 {
					cycle = append(append([]string{}, stack[i:]...), d)
				}
				return true
			case white:
				if visit(d) {
					return true
				}
			}
		}
		stack = stack[:len(stack)-1]
		state[k] = black
		return false
	}
	for _, e := range entries {
		if state[e.Key] == white && visit(e.Key) {
			return cycle
		}
	}
	return nil
}

func index(s []string, v string) int {
	for i, x := range s {
		if x == v {
			return i
		}
	}
	return -1
}
