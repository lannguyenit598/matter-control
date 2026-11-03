package productapi

import (
	"errors"
	"net/http"
	"time"

	"github.com/labstack/echo/v5"

	"leonx.me/matter-control/internal/core/port"
)

type searchBody struct {
	Query    string            `json:"q"`
	Epoch    string            `json:"epoch"`
	Types    []string          `json:"types"`
	MatterID string            `json:"matterId"`
	Limit    *int              `json:"limit"`
	Cursors  map[string]string `json:"cursors"`
}

func (s *server) search(c *echo.Context) error {
	start := time.Now()
	c.Response().Header().Set("Cache-Control", "private, no-store")
	if s.Search == nil {
		return port.ErrUnavailable
	}
	c.Request().Body = http.MaxBytesReader(c.Response(), c.Request().Body, 16<<10)
	var body searchBody
	if _, err := readJSON(c, &body); err != nil {
		var maxBytes *http.MaxBytesError
		if errors.As(err, &maxBytes) {
			return c.JSON(http.StatusRequestEntityTooLarge, mk(413, "payload-too-large", "Payload Too Large", "search body exceeds 16 KiB", false))
		}
		return err
	}
	limit := 5
	if body.Limit != nil {
		limit = *body.Limit
		if limit < 1 || limit > 25 {
			return port.ErrSearchInvalid
		}
	}
	out, err := s.Search.Search(c.Request().Context(), port.SearchQuery{ActorID: actorOf(c), Epoch: body.Epoch, Query: body.Query, Types: body.Types, MatterID: body.MatterID, Limit: limit, Cursors: body.Cursors})
	s.Logger.InfoContext(c.Request().Context(), "metadata search", "duration_ms", time.Since(start).Milliseconds(), "success", err == nil, "operation_id", port.RequestMetaFromContext(c.Request().Context()).RequestID)
	if err != nil {
		return err
	}
	groups := map[string]any{}
	for key, g := range out.Groups {
		items := make([]any, 0, len(g.Items))
		for _, x := range g.Items {
			items = append(items, map[string]any{"sameName": x.SameName, "id": x.ID, "kind": x.Kind, "label": x.Label, "workspaceId": x.WorkspaceID, "workspaceName": x.WorkspaceName, "matterId": x.MatterID, "matterTitle": x.MatterTitle, "role": x.Role, "outcome": x.Outcome, "execution": x.Execution, "dueAt": x.DueAt, "version": x.Version, "uploadedAt": x.UploadedAt})
		}
		groups[key] = map[string]any{"status": g.Status, "items": items, "hasMore": g.HasMore, "nextCursor": g.NextCursor, "asOf": g.AsOf}
	}
	_, err = respond(c, http.StatusOK, map[string]any{"groups": groups}, false)
	return err
}
