package matter

import "time"

// SearchItem contains only metadata readable under the parent scope's memberships.
type SearchItem struct {
	SameName                                                bool
	ID, Kind, Label                                         string
	WorkspaceID, WorkspaceName, MatterID, MatterTitle, Role string
	Outcome, Execution                                      string
	DueAt                                                   *time.Time
	Version                                                 int
	UploadedAt                                              *time.Time
}

type SearchPage struct {
	Items       []SearchItem
	Fingerprint string
	HasMore     bool
	AsOf        time.Time
}

type SearchGroup struct {
	Status     string
	Items      []SearchItem
	HasMore    bool
	NextCursor string
	AsOf       time.Time
}

type SearchResult struct{ Groups map[string]SearchGroup }
