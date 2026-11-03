package matter

import (
	"sort"
	"strings"
	"time"

	"leonx.me/matter-control/internal/core/domain"
)

// Context records are the basic reasoning around the work: a Decision to be made or taken, a
// Finding, a Risk, or an Entity (a counterparty, person or organisation referred to by name).
// They never change execution, verification or dependency state, and an Entity never grants
// access (RULE-014): it is a reference, not an account.

type ContextKind string

const (
	ContextDecision ContextKind = "DECISION"
	ContextFinding  ContextKind = "FINDING"
	ContextRisk     ContextKind = "RISK"
	ContextEntity   ContextKind = "ENTITY"
)

func (k ContextKind) Valid() bool {
	switch k {
	case ContextDecision, ContextFinding, ContextRisk, ContextEntity:
		return true
	}
	return false
}

type ContextStatus string

const (
	ContextOpen   ContextStatus = "OPEN"
	ContextClosed ContextStatus = "CLOSED"
)

// ContextRecord is a matter-scoped note linked to the work items it concerns.
type ContextRecord struct {
	ID        string
	MatterID  MatterID
	Kind      ContextKind
	Title     string
	Body      string
	Status    ContextStatus
	Links     []NodeID
	CreatedBy ActorID
	CreatedAt time.Time
	// ClosedReason explains why a record was closed; a closed record stays visible.
	ClosedReason string
	Revision     int64
}

// ContextSet is the context rows of one matter, read with the work graph.
type ContextSet struct{ Records []ContextRecord }

// Linked returns the open records of kind that concern the given item.
func (s ContextSet) Linked(kind ContextKind, item NodeID) []ContextRecord {
	var out []ContextRecord
	for _, r := range s.Records {
		if r.Kind != kind || r.Status != ContextOpen {
			continue
		}
		for _, l := range r.Links {
			if l == item {
				out = append(out, r)
				break
			}
		}
	}
	return out
}

// NewContextRecord validates the user-supplied parts of a record.
func NewContextRecord(id string, m MatterID, kind ContextKind, title, body string, links []NodeID, by ActorID, at time.Time) (ContextRecord, error) {
	v := &domain.ValidationError{}
	if !kind.Valid() {
		v.Add("kind", "must be DECISION, FINDING, RISK or ENTITY")
	}
	t := strings.TrimSpace(title)
	if t == "" || len(t) > 200 {
		v.Add("title", "must be 1 to 200 characters")
	}
	b := strings.TrimSpace(body)
	if len(b) > 4000 {
		v.Add("body", "must be at most 4000 characters")
	}
	if v.HasErrors() {
		return ContextRecord{}, v
	}
	seen := map[NodeID]bool{}
	var ls []NodeID
	for _, l := range links {
		if !seen[l] {
			seen[l] = true
			ls = append(ls, l)
		}
	}
	sort.Slice(ls, func(i, j int) bool { return ls[i] < ls[j] })
	return ContextRecord{ID: id, MatterID: m, Kind: kind, Title: t, Body: b, Status: ContextOpen, Links: ls, CreatedBy: by, CreatedAt: at, Revision: 1}, nil
}
