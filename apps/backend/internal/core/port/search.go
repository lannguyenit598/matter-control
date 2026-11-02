package port

import (
	"context"
	"errors"

	"leonx.me/matter-control/internal/core/domain/matter"
)

var (
	ErrSearchInvalid = errors.New("invalid search request")
	ErrSearchStale   = errors.New("search results changed")
)

type SearchQuery struct {
	ActorID, Epoch, Query, MatterID string
	Types                           []string
	Limit                           int
	Cursors                         map[string]string
}
type SearchBinding struct {
	ActorID, Epoch, Query, Group, MatterID string
	Limit                                  int
}
type SearchAnchor struct{ Fingerprint, Kind, ID string }
type SearchRead struct {
	Binding SearchBinding
	Anchor  SearchAnchor
}

type SearchStore interface {
	SearchPage(context.Context, SearchRead) (matter.SearchPage, error)
}
type SearchCursors interface {
	Open(string, SearchBinding) (SearchAnchor, error)
	Seal(SearchBinding, SearchAnchor) (string, error)
}
type SearchService interface {
	Search(context.Context, SearchQuery) (matter.SearchResult, error)
}
