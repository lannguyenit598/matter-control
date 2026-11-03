package matter

import (
	"bytes"
	"encoding/json"
	"fmt"
	"time"
)

// ---------- Saved Views (RLF-04, REQ-MC-P1-12) ----------

// SavedViewID identifies one private view.
type SavedViewID string

func NewSavedViewID(s string) (SavedViewID, error) { return newUUID[SavedViewID](s, "savedViewId") }
func (id SavedViewID) String() string              { return string(id) }

// SavedViewFilters is the validated filter shape a view may store: exactly the work-grid query
// fields, no record copies, tokens, URLs or executable content. Zero-value members mean "no
// filter"; every member is display/decision data the caller could already read.
type SavedViewFilters struct {
	Kind       string `json:"kind,omitempty"`
	Execution  string `json:"execution,omitempty"`
	Dependency string `json:"dependency,omitempty"`
	Timing     string `json:"timing,omitempty"`
	Attention  string `json:"attention,omitempty"`
	Owner      string `json:"owner,omitempty"`
	Workstream string `json:"workstream,omitempty"`
	Q          string `json:"q,omitempty"`
	Sort       string `json:"sort,omitempty"`
	Desc       string `json:"desc,omitempty"`
}

// SavedView is one private named filter definition, scoped to its owner and its Matter. It is
// not a copied snapshot of legal records: applying a view re-runs the authorized grid read, so
// the results always reflect current access and current data.
type SavedView struct {
	ID        SavedViewID
	MatterID  MatterID
	OwnerID   ActorID
	Name      string
	Filters   SavedViewFilters
	CreatedAt time.Time
	UpdatedAt time.Time
	Revision  int64
}

// ParseSavedViewFilters decodes stored/requested filter JSON strictly: unknown members and
// duplicates are rejected, so a view can never smuggle arbitrary content.
func ParseSavedViewFilters(b []byte) (SavedViewFilters, error) {
	var f SavedViewFilters
	dec := json.NewDecoder(bytes.NewReader(b))
	dec.DisallowUnknownFields()
	dec.UseNumber()
	if err := dec.Decode(&f); err != nil {
		return SavedViewFilters{}, fmt.Errorf("saved view filters: %w", err)
	}
	if dec.More() {
		return SavedViewFilters{}, fmt.Errorf("saved view filters: trailing content")
	}
	return f, nil
}
