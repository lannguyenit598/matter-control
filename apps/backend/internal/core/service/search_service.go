package service

import (
	"context"
	"errors"
	"log/slog"
	"strings"
	"unicode"
	"unicode/utf8"

	"leonx.me/matter-control/internal/core/domain/matter"
	"leonx.me/matter-control/internal/core/port"
)

type SearchService struct {
	store   port.SearchStore
	cursors port.SearchCursors
	logger  *slog.Logger
}

func NewSearchService(store port.SearchStore, cursors port.SearchCursors, logger *slog.Logger) *SearchService {
	return &SearchService{store: store, cursors: cursors, logger: logger}
}

func (s *SearchService) Search(ctx context.Context, q port.SearchQuery) (matter.SearchResult, error) {
	out := matter.SearchResult{Groups: make(map[string]matter.SearchGroup)}
	if strings.ContainsFunc(q.Query, unicode.IsControl) {
		return out, port.ErrSearchInvalid
	}
	q.Query = strings.TrimSpace(q.Query)
	if _, err := matter.NewActorID(q.ActorID); err != nil {
		return out, port.ErrSearchInvalid
	}
	if !utf8.ValidString(q.Query) || utf8.RuneCountInString(q.Query) < 2 || utf8.RuneCountInString(q.Query) > 100 || len(q.Epoch) < 1 || len(q.Epoch) > 100 || strings.ContainsFunc(q.Query, unicode.IsControl) {
		return out, port.ErrSearchInvalid
	}
	if q.Limit == 0 {
		q.Limit = 5
	}
	if q.Limit < 1 || q.Limit > 25 {
		return out, port.ErrSearchInvalid
	}
	if q.MatterID != "" {
		if _, err := matter.NewMatterID(q.MatterID); err != nil {
			return out, port.ErrSearchInvalid
		}
	}
	allowed := map[string]bool{"workspaces": true, "matters": true, "workItems": true, "documents": true}
	if q.Types == nil {
		q.Types = []string{"workspaces", "matters", "workItems", "documents"}
	}
	if len(q.Types) == 0 {
		return out, port.ErrSearchInvalid
	}
	seen := map[string]bool{}
	for _, g := range q.Types {
		if !allowed[g] || seen[g] {
			return out, port.ErrSearchInvalid
		}
		seen[g] = true
	}
	for g, c := range q.Cursors {
		if !seen[g] || len(c) > 2048 {
			return out, port.ErrSearchInvalid
		}
	}
	if s.cursors == nil {
		return out, port.ErrUnavailable
	}
	successes := 0
	for _, g := range q.Types {
		binding := port.SearchBinding{ActorID: q.ActorID, Epoch: q.Epoch, Query: q.Query, Group: g, MatterID: q.MatterID, Limit: q.Limit}
		anchor := port.SearchAnchor{}
		if token := q.Cursors[g]; token != "" {
			var err error
			anchor, err = s.cursors.Open(token, binding)
			if err != nil {
				return out, err
			}
		}
		page, err := s.store.SearchPage(ctx, port.SearchRead{Binding: binding, Anchor: anchor})
		group := matter.SearchGroup{Status: "ok", Items: page.Items, HasMore: page.HasMore, AsOf: page.AsOf}
		if group.Items == nil {
			group.Items = []matter.SearchItem{}
		}
		if errors.Is(err, port.ErrSearchInvalid) {
			return out, err
		}
		if errors.Is(err, port.ErrSearchStale) {
			return out, port.ErrSearchStale
		}
		if err != nil {
			group = matter.SearchGroup{Status: "unavailable", Items: []matter.SearchItem{}}
		} else {
			successes++
			if page.HasMore && len(page.Items) > 0 {
				last := page.Items[len(page.Items)-1]
				group.NextCursor, err = s.cursors.Seal(binding, port.SearchAnchor{Fingerprint: page.Fingerprint, Kind: last.Kind, ID: last.ID})
				if err != nil {
					return out, port.ErrUnavailable
				}
			}
		}
		s.logger.InfoContext(ctx, "metadata search group", "group", g, "outcome", group.Status, "operation_id", port.RequestMetaFromContext(ctx).RequestID)
		out.Groups[g] = group
	}
	if successes == 0 {
		return out, port.ErrUnavailable
	}
	return out, nil
}
