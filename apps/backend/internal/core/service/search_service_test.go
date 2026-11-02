package service_test

import (
	"context"
	"errors"
	"io"
	"log/slog"
	"testing"
	"time"

	"leonx.me/matter-control/internal/core/domain/matter"
	"leonx.me/matter-control/internal/core/port"
	"leonx.me/matter-control/internal/core/service"
)

type searchStore struct{ calls int }

func (s *searchStore) SearchPage(_ context.Context, _ port.SearchRead) (matter.SearchPage, error) {
	s.calls++
	return matter.SearchPage{Items: []matter.SearchItem{{ID: "row", Kind: "ACTION", Label: "Same title", Outcome: "Different outcome", Execution: "IN_PROGRESS"}}, Fingerprint: "fingerprint", AsOf: time.Unix(100, 0)}, nil
}

type searchTokens struct{}

func (searchTokens) Open(_ string, _ port.SearchBinding) (port.SearchAnchor, error) {
	return port.SearchAnchor{}, port.ErrSearchStale
}
func (searchTokens) Seal(_ port.SearchBinding, _ port.SearchAnchor) (string, error) {
	return "token", nil
}

func TestSearchValidatesBeforeReadAndKeepsDiscriminators(t *testing.T) {
	store := &searchStore{}
	s := service.NewSearchService(store, searchTokens{}, slog.New(slog.NewTextHandler(io.Discard, nil)))
	q := port.SearchQuery{ActorID: "00000000-0000-4000-8000-000000000001", Epoch: "epoch", Query: "Đồng", Types: []string{"workItems"}, Limit: 5}
	out, err := s.Search(context.Background(), q)
	if err != nil || out.Groups["workItems"].Items[0].Outcome != "Different outcome" {
		t.Fatalf("metadata: %+v %v", out, err)
	}
	for _, bad := range []port.SearchQuery{
		{ActorID: q.ActorID, Query: "a", Epoch: "e"}, {ActorID: q.ActorID, Query: "ab", Epoch: "e", Limit: 26},
		{ActorID: q.ActorID, Query: "ab", Epoch: "e", Types: []string{"people"}}, {ActorID: q.ActorID, Query: "a\x00b", Epoch: "e"},
	} {
		if _, err = s.Search(context.Background(), bad); err == nil {
			t.Fatal("invalid accepted")
		}
	}
	if store.calls != 1 {
		t.Fatalf("read before validation: %d", store.calls)
	}
	q.Cursors = map[string]string{"workItems": "bad"}
	if _, err = s.Search(context.Background(), q); !errors.Is(err, port.ErrSearchStale) {
		t.Fatalf("stale: %v", err)
	}
}
