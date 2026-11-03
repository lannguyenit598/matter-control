package productapi

// RLF-05 playbook HTTP surface: workspace OWNER publishes immutable revisions; matter OWNER
// previews and applies one exact revision atomically. The preview stores nothing; apply is
// receipted and idempotent (same key replays; the same revision under a different key is
// refused). Provenance is readable but is never evidence and completes nothing.

import (
	"net/http"

	"github.com/labstack/echo/v5"

	"leonx.me/matter-control/internal/core/domain"
	"leonx.me/matter-control/internal/core/domain/matter"
	"leonx.me/matter-control/internal/core/port"
)

type playbookBody struct {
	ID        string `json:"id"`
	Name      string `json:"name"`
	Revision  int64  `json:"revision"`
	CreatedAt string `json:"createdAt"`
}

type playbookRevisionBody struct {
	ID        string                 `json:"id"`
	No        int64                  `json:"no"`
	Entries   []matter.PlaybookEntry `json:"entries"`
	CreatedAt string                 `json:"createdAt"`
}

func playbookDTO(p matter.Playbook) playbookBody {
	return playbookBody{ID: p.ID.String(), Name: p.Name, Revision: p.Revision, CreatedAt: ts(p.CreatedAt)}
}

func playbookRevisionDTO(r matter.PlaybookRevision) playbookRevisionBody {
	return playbookRevisionBody{ID: r.ID.String(), No: r.No, Entries: r.Entries, CreatedAt: ts(r.CreatedAt)}
}

type createPlaybookRequest struct {
	Name string `json:"name"`
}

type publishPlaybookRequest struct {
	Entries []matter.PlaybookEntry `json:"entries"`
}

type applyPlaybookRequest struct {
	RevisionID string            `json:"revisionId"`
	OwnerMap   map[string]string `json:"ownerMap"`
}

func (s *server) listPlaybooks(c *echo.Context) error {
	ps, err := s.Playbooks.ListPlaybooks(c.Request().Context(), port.ListPlaybooksQuery{ActorID: actorOf(c), WorkspaceID: c.Param("id")})
	if err != nil {
		return err
	}
	out := make([]playbookBody, 0, len(ps))
	for _, p := range ps {
		out = append(out, playbookDTO(p))
	}
	n := len(out)
	_, err = respond(c, http.StatusOK, page[playbookBody]{Items: out, Page: pageMeta{Limit: n, MaxLimit: maxPageLimit, Total: &n}}, false)
	return err
}

func (s *server) createPlaybook(c *echo.Context) error {
	var req createPlaybookRequest
	raw, err := readJSON(c, &req)
	if err != nil {
		return err
	}
	key, err := idempotencyKey(c)
	if err != nil {
		return err
	}
	rev, err := s.workspaceCAS(c, c.Param("id"))
	if err != nil {
		return err
	}
	res, err := s.Playbooks.CreatePlaybook(c.Request().Context(), port.CreatePlaybookCmd{
		ActorID: actorOf(c), WorkspaceID: c.Param("id"), IdempotencyKey: key, RequestHash: s.fp(c, raw),
		ExpectedRevision: rev, Name: req.Name,
	})
	if err != nil {
		return err
	}
	markReplay(c, res.Replayed)
	c.Response().Header().Set("Location", apiPrefix+"/workspaces/"+c.Param("id")+"/playbooks/"+res.ID)
	_, err = respond(c, http.StatusCreated, createdBody{ID: res.ID, Kind: res.Kind, Seq: res.Seq}, false)
	return err
}

func (s *server) getPlaybook(c *echo.Context) error {
	p, revs, err := s.Playbooks.GetPlaybook(c.Request().Context(), port.GetPlaybookQuery{ActorID: actorOf(c), PlaybookID: c.Param("playbookId")})
	if err != nil {
		return err
	}
	items := make([]playbookRevisionBody, 0, len(revs))
	for _, r := range revs {
		items = append(items, playbookRevisionDTO(r))
	}
	_, err = respond(c, http.StatusOK, map[string]any{"playbook": playbookDTO(p), "revisions": items}, false)
	return err
}

func (s *server) publishPlaybookRevision(c *echo.Context) error {
	var req publishPlaybookRequest
	raw, err := readJSON(c, &req)
	if err != nil {
		return err
	}
	key, err := idempotencyKey(c)
	if err != nil {
		return err
	}
	rev, err := s.workspaceCAS(c, c.Param("id"))
	if err != nil {
		return err
	}
	res, err := s.Playbooks.PublishPlaybookRevision(c.Request().Context(), port.PublishPlaybookRevisionCmd{
		ActorID: actorOf(c), WorkspaceID: c.Param("id"), PlaybookID: c.Param("playbookId"),
		IdempotencyKey: key, RequestHash: s.fp(c, raw), ExpectedRevision: rev, Entries: req.Entries,
	})
	if err != nil {
		return err
	}
	markReplay(c, res.Replayed)
	c.Response().Header().Set("Location", apiPrefix+"/workspaces/"+c.Param("id")+"/playbooks/"+c.Param("playbookId")+"/revisions/"+res.ID)
	_, err = respond(c, http.StatusCreated, createdBody{ID: res.ID, Kind: res.Kind, Seq: res.Seq}, false)
	return err
}

func (s *server) previewPlaybookApplication(c *echo.Context) error {
	revID := c.QueryParam("revision")
	if revID == "" {
		ve := &domain.ValidationError{}
		ve.Add("revision", "the exact revision to preview is required")
		return ve
	}
	v, err := s.Playbooks.PreviewPlaybookApplication(c.Request().Context(), port.PreviewPlaybookApplicationQuery{
		ActorID: actorOf(c), MatterID: c.Param("id"), RevisionID: revID,
	})
	if err != nil {
		return err
	}
	entries := make([]playbookRevisionBody, 0, 1)
	entries = append(entries, playbookRevisionDTO(v.Revision))
	_, err = respond(c, http.StatusOK, map[string]any{
		"playbook": playbookDTO(v.Playbook), "revision": entries[0],
		"ownerKeys": v.OwnerNames, "problems": v.Problems,
	}, false)
	return err
}

func (s *server) applyPlaybook(c *echo.Context) error {
	var req applyPlaybookRequest
	raw, err := readJSON(c, &req)
	if err != nil {
		return err
	}
	key, err := idempotencyKey(c)
	if err != nil {
		return err
	}
	res, err := s.Playbooks.ApplyPlaybook(c.Request().Context(), port.ApplyPlaybookCmd{
		ActorID: actorOf(c), MatterID: c.Param("id"), RevisionID: req.RevisionID,
		IdempotencyKey: key, RequestHash: s.fp(c, raw), OwnerMap: req.OwnerMap,
	})
	if err != nil {
		return err
	}
	markReplay(c, res.Replayed)
	_, err = respond(c, http.StatusCreated, map[string]any{
		"playbookId": res.PlaybookID.String(), "revisionId": res.RevisionID.String(), "revisionNo": res.RevisionNo,
	}, false)
	return err
}

// listPlaybookInstances reads the provenance of every playbook application in this matter: which
// exact revision produced which work item. Provenance is not evidence and completes nothing.
func (s *server) listPlaybookInstances(c *echo.Context) error {
	is, err := s.Playbooks.ListMatterPlaybookInstances(c.Request().Context(), port.ListPlaybookInstancesQuery{ActorID: actorOf(c), MatterID: c.Param("id")})
	if err != nil {
		return err
	}
	items := make([]map[string]any, 0, len(is))
	for _, i := range is {
		items = append(items, map[string]any{
			"revisionId": i.RevisionID.String(), "playbookId": i.PlaybookID.String(),
			"entryKey": i.EntryKey, "itemId": i.ItemID.String(), "appliedAt": ts(i.AppliedAt),
		})
	}
	n := len(items)
	_, err = respond(c, http.StatusOK, page[map[string]any]{Items: items, Page: pageMeta{Limit: n, MaxLimit: maxPageLimit, Total: &n}}, false)
	return err
}
