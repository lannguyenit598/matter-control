package postgres

import (
	"context"
	"encoding/json"
	"fmt"
	"time"

	"leonx.me/matter-control/internal/adapter/outbound/postgres/mcsqlc"
	"leonx.me/matter-control/internal/core/domain/matter"
	"leonx.me/matter-control/internal/core/port"
)

type searchRow struct {
	SameName      bool   `json:"sameName"`
	ID            string `json:"id"`
	Kind          string `json:"kind"`
	Label         string `json:"label"`
	WorkspaceID   string `json:"workspaceId"`
	WorkspaceName string `json:"workspaceName"`
	MatterID      string `json:"matterId"`
	MatterTitle   string `json:"matterTitle"`
	Role          string `json:"role"`
	Outcome       string `json:"outcome"`
	Execution     string `json:"execution"`
	DueAt         string `json:"dueAt"`
	Version       int    `json:"version"`
	UploadedAt    string `json:"uploadedAt"`
}

func (s *MatterStore) SearchPage(ctx context.Context, r port.SearchRead) (matter.SearchPage, error) {
	var out matter.SearchPage
	err := s.View(ctx, func(snapshot port.MatterSnapshot) error {
		snap, ok := snapshot.(*pgSnapshot)
		if !ok {
			return port.ErrUnavailable
		}
		b := r.Binding
		row, err := snap.q.SearchMetadataPage(ctx, mcsqlc.SearchMetadataPageParams{Actor: b.ActorID, Query: b.Query, GroupName: b.Group, MatterHint: b.MatterID, AnchorKind: r.Anchor.Kind, AnchorID: r.Anchor.ID, PageLimit: int64(b.Limit + 1)})
		if err != nil {
			return mapMatterError(err)
		}
		if !row.QueryValid {
			return port.ErrSearchInvalid
		}
		if !row.AnchorFound || (r.Anchor.Fingerprint != "" && row.Fingerprint != r.Anchor.Fingerprint) {
			return port.ErrSearchStale
		}
		var rows []searchRow
		if err = json.Unmarshal([]byte(row.Payload), &rows); err != nil {
			return fmt.Errorf("search projection: %w", err)
		}
		out = matter.SearchPage{Items: make([]matter.SearchItem, 0, b.Limit), Fingerprint: row.Fingerprint, AsOf: snap.AsOf(), HasMore: len(rows) > b.Limit}
		for i, x := range rows {
			if i == b.Limit {
				break
			}
			item := matter.SearchItem{SameName: x.SameName, ID: x.ID, Kind: x.Kind, Label: x.Label, WorkspaceID: x.WorkspaceID, WorkspaceName: x.WorkspaceName, MatterID: x.MatterID, MatterTitle: x.MatterTitle, Role: x.Role, Outcome: x.Outcome, Execution: x.Execution, Version: x.Version}
			if x.DueAt != "" {
				t, e := time.Parse(time.RFC3339Nano, x.DueAt)
				if e != nil {
					return e
				}
				item.DueAt = &t
			}
			if x.UploadedAt != "" {
				t, e := time.Parse(time.RFC3339Nano, x.UploadedAt)
				if e != nil {
					return e
				}
				item.UploadedAt = &t
			}
			out.Items = append(out.Items, item)
		}
		return nil
	})
	return out, err
}
