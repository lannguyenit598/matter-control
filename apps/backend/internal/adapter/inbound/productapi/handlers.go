package productapi

import (
	"net/http"
	"time"

	"github.com/labstack/echo/v5"

	"github.com/example/userapi/internal/core/domain/matter"
	"github.com/example/userapi/internal/core/port"
)

type nameRequest struct {
	Name string `json:"name"`
}

type titleRequest struct {
	Title string `json:"title"`
}

type grantRequest struct {
	UserID string `json:"userId"`
	Role   string `json:"role"`
}

type requirementRequest struct {
	Title   string `json:"title"`
	Outcome string `json:"outcome"`
}

func (s *server) createWorkspace(c *echo.Context) error {
	var req nameRequest
	raw, err := readJSON(c, &req)
	if err != nil {
		return err
	}
	if err := requireNoIfMatch(c); err != nil {
		return err
	}
	key, err := idempotencyKey(c)
	if err != nil {
		return err
	}
	res, err := s.Workspaces.CreateWorkspace(c.Request().Context(), port.CreateWorkspaceCmd{
		ActorID: actorOf(c), Name: req.Name, IdempotencyKey: key, RequestHash: s.fp(c, raw),
	})
	if err != nil {
		return err
	}
	markReplay(c, res.Replayed)
	c.Response().Header().Set("Location", apiPrefix+"/workspaces/"+res.Workspace.ID.String())
	provenance(c, time.Time{}, res.Workspace.Revision)
	_, err = respond(c, http.StatusCreated, workspaceDTO(res.Workspace), true)
	return err
}

func (s *server) listWorkspaces(c *echo.Context) error {
	limit, err := parseLimit(c)
	if err != nil {
		return err
	}
	q := port.ListMyWorkspacesQuery{ActorID: actorOf(c), Limit: limit}
	if raw := c.QueryParam("cursor"); raw != "" {
		var id string
		if err := decodeCursor(raw, &id); err != nil {
			return err
		}
		q.Cursor = &matter.WorkspaceCursor{WorkspaceID: matter.WorkspaceID(id)}
	}
	res, err := s.Workspaces.ListMyWorkspaces(c.Request().Context(), q)
	if err != nil {
		return err
	}
	out := page[workspaceListItem]{Items: make([]workspaceListItem, 0, len(res.Workspaces)), Page: pageMeta{Limit: limit, MaxLimit: maxPageLimit, Total: &res.Total}}
	for _, w := range res.Workspaces {
		out.Items = append(out.Items, workspaceListItem{ID: w.Workspace.ID.String(), Name: w.Workspace.Name, Revision: w.Workspace.Revision, CallerRole: string(w.CallerRole)})
	}
	if res.NextCursor != nil {
		out.Page.NextCursor = encodeCursor(res.NextCursor.WorkspaceID.String())
	}
	provenance(c, res.AsOf, 0)
	_, err = respond(c, http.StatusOK, out, false)
	return err
}

func (s *server) getWorkspace(c *echo.Context) error {
	w, err := s.Workspaces.GetWorkspace(c.Request().Context(), port.GetWorkspaceQuery{ActorID: actorOf(c), WorkspaceID: c.Param("id")})
	if err != nil {
		return err
	}
	provenance(c, time.Time{}, w.Revision)
	_, err = respond(c, http.StatusOK, workspaceDTO(w), true)
	return err
}

func (s *server) listMatters(c *echo.Context) error {
	limit, err := parseLimit(c)
	if err != nil {
		return err
	}
	q := port.ListAccessibleMattersQuery{ActorID: actorOf(c), WorkspaceID: c.Param("id"), Limit: limit}
	if raw := c.QueryParam("cursor"); raw != "" {
		var id string
		if err := decodeCursor(raw, &id); err != nil {
			return err
		}
		q.Cursor = &matter.MatterCursor{MatterID: matter.MatterID(id)}
	}
	res, err := s.Workspaces.ListAccessibleMatters(c.Request().Context(), q)
	if err != nil {
		return err
	}
	out := page[matterBody]{Items: make([]matterBody, 0, len(res.Matters)), Page: pageMeta{Limit: limit, MaxLimit: maxPageLimit, Total: &res.Total}}
	for _, m := range res.Matters {
		out.Items = append(out.Items, matterDTO(m.Header, m.CallerRole))
	}
	if res.NextCursor != nil {
		out.Page.NextCursor = encodeCursor(res.NextCursor.MatterID.String())
	}
	provenance(c, res.AsOf, 0)
	_, err = respond(c, http.StatusOK, out, false)
	return err
}

func (s *server) createMatter(c *echo.Context) error {
	var req titleRequest
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
	res, err := s.Workspaces.CreateMatter(c.Request().Context(), port.CreateMatterCmd{
		ActorID: actorOf(c), WorkspaceID: c.Param("id"), Title: req.Title,
		IdempotencyKey: key, RequestHash: s.fp(c, raw), ExpectedRevision: rev,
	})
	if err != nil {
		return err
	}
	markReplay(c, res.Replayed)
	c.Response().Header().Set("Location", apiPrefix+"/matters/"+res.Matter.MatterID.String())
	provenance(c, time.Time{}, res.Matter.Revision)
	_, err = respond(c, http.StatusCreated, matterDTO(*res.Matter, res.CallerRole), true)
	return err
}

func (s *server) listWorkspaceMembers(c *echo.Context) error {
	ms, err := s.Workspaces.ListWorkspaceMembers(c.Request().Context(), port.ListMembersQuery{ActorID: actorOf(c), ScopeID: c.Param("id")})
	if err != nil {
		return err
	}
	return respondMembers(c, ms)
}

func (s *server) listMatterMembers(c *echo.Context) error {
	ms, err := s.Workspaces.ListMatterMembers(c.Request().Context(), port.ListMembersQuery{ActorID: actorOf(c), ScopeID: c.Param("id")})
	if err != nil {
		return err
	}
	return respondMembers(c, ms)
}

func respondMembers(c *echo.Context, ms []matter.Member) error {
	out := make([]memberBody, 0, len(ms))
	for _, m := range ms {
		out = append(out, memberDTO(m))
	}
	n := len(out)
	_, err := respond(c, http.StatusOK, page[memberBody]{Items: out, Page: pageMeta{Limit: n, MaxLimit: maxPageLimit, Total: &n}}, false)
	return err
}

func (s *server) grantWorkspaceMember(c *echo.Context) error {
	var req grantRequest
	if _, err := readJSON(c, &req); err != nil {
		return err
	}
	rev, err := s.workspaceCAS(c, c.Param("id"))
	if err != nil {
		return err
	}
	res, err := s.Workspaces.GrantWorkspaceMembership(c.Request().Context(), port.GrantWorkspaceMembershipCmd{
		ActorID: actorOf(c), WorkspaceID: c.Param("id"), UserID: req.UserID, Role: req.Role, ExpectedRevision: rev,
	})
	if err != nil {
		return err
	}
	_, err = respond(c, http.StatusOK, membershipChangeDTO(res), false)
	return err
}

func (s *server) revokeWorkspaceMember(c *echo.Context) error {
	rev, err := s.workspaceCAS(c, c.Param("id"))
	if err != nil {
		return err
	}
	res, err := s.Workspaces.RevokeWorkspaceMembership(c.Request().Context(), port.RevokeWorkspaceMembershipCmd{
		ActorID: actorOf(c), WorkspaceID: c.Param("id"), UserID: c.Param("userId"), ExpectedRevision: rev,
	})
	if err != nil {
		return err
	}
	_, err = respond(c, http.StatusOK, membershipChangeDTO(res), false)
	return err
}

func (s *server) grantMatterMember(c *echo.Context) error {
	var req grantRequest
	if _, err := readJSON(c, &req); err != nil {
		return err
	}
	rev, err := s.matterCAS(c, c.Param("id"))
	if err != nil {
		return err
	}
	res, err := s.Workspaces.GrantMatterMembership(c.Request().Context(), port.GrantMatterMembershipCmd{
		ActorID: actorOf(c), MatterID: c.Param("id"), UserID: req.UserID, Role: req.Role, ExpectedRevision: rev,
	})
	if err != nil {
		return err
	}
	_, err = respond(c, http.StatusOK, membershipChangeDTO(res), false)
	return err
}

func (s *server) revokeMatterMember(c *echo.Context) error {
	rev, err := s.matterCAS(c, c.Param("id"))
	if err != nil {
		return err
	}
	res, err := s.Workspaces.RevokeMatterMembership(c.Request().Context(), port.RevokeMatterMembershipCmd{
		ActorID: actorOf(c), MatterID: c.Param("id"), UserID: c.Param("userId"), ExpectedRevision: rev,
	})
	if err != nil {
		return err
	}
	_, err = respond(c, http.StatusOK, membershipChangeDTO(res), false)
	return err
}

func (s *server) getMatter(c *echo.Context) error {
	m, err := s.Workspaces.GetMatter(c.Request().Context(), port.GetMatterQuery{ActorID: actorOf(c), MatterID: c.Param("id")})
	if err != nil {
		return err
	}
	provenance(c, m.AsOf, m.Header.Revision)
	_, err = respond(c, http.StatusOK, matterDTO(m.Header, m.CallerRole), true)
	return err
}

func (s *server) history(c *echo.Context) error {
	limit, err := parseLimit(c)
	if err != nil {
		return err
	}
	q := port.HistoryReadQuery{ActorID: actorOf(c), MatterID: c.Param("id"), Limit: limit}
	if raw := c.QueryParam("cursor"); raw != "" {
		var cur eventCursorJSON
		if err := decodeCursor(raw, &cur); err != nil {
			return err
		}
		at, perr := time.Parse(time.RFC3339Nano, cur.At)
		if perr != nil {
			return decodeCursor("!", &cur)
		}
		q.Cursor = &matter.EventCursor{RecordedAt: at, Seq: cur.Seq}
	}
	res, err := s.Workspaces.HistoryRead(c.Request().Context(), q)
	if err != nil {
		return err
	}
	out := page[eventBody]{Items: make([]eventBody, 0, len(res.Events)), Page: pageMeta{Limit: limit, MaxLimit: maxPageLimit}}
	for _, e := range res.Events {
		out.Items = append(out.Items, eventDTO(e))
	}
	if res.NextCursor != nil {
		out.Page.NextCursor = encodeCursor(eventCursorJSON{At: ts(res.NextCursor.RecordedAt), Seq: res.NextCursor.Seq})
	}
	provenance(c, res.AsOf, 0)
	_, err = respond(c, http.StatusOK, out, false)
	return err
}

func (s *server) createRequirement(c *echo.Context) error {
	var req requirementRequest
	raw, err := readJSON(c, &req)
	if err != nil {
		return err
	}
	if err := requireNoIfMatch(c); err != nil {
		return err
	}
	key, err := idempotencyKey(c)
	if err != nil {
		return err
	}
	res, err := s.Matters.CreateRequirement(c.Request().Context(), port.CreateRequirementCmd{
		ActorID: actorOf(c), MatterID: c.Param("id"), IdempotencyKey: key, RequestHash: s.fp(c, raw),
		Title: req.Title, Outcome: req.Outcome,
	})
	if err != nil {
		return err
	}
	markReplay(c, res.Replayed)
	c.Response().Header().Set("Location", apiPrefix+"/requirements/"+res.Requirement.ID.String())
	provenance(c, time.Time{}, res.Requirement.Revision)
	_, err = respond(c, http.StatusCreated, requirementDTO(res.Requirement), true)
	return err
}

func (s *server) getRequirement(c *echo.Context) error {
	r, err := s.Matters.GetRequirement(c.Request().Context(), port.GetRequirementQuery{ActorID: actorOf(c), ID: c.Param("id")})
	if err != nil {
		return err
	}
	provenance(c, r.AsOf, r.SourceRevision)
	_, err = respond(c, http.StatusOK, requirementDTO(r.Requirement), true)
	return err
}

func (s *server) ownReceipt(c *echo.Context) error {
	rc, err := s.Workspaces.OwnReceipt(c.Request().Context(), port.OwnReceiptQuery{ActorID: actorOf(c), IdempotencyKey: c.Param("key")})
	if err != nil {
		return err
	}
	_, err = respond(c, http.StatusOK, receiptDTO(rc), false)
	return err
}

// reconcile resolves an OUTCOME_UNKNOWN against the caller's stored receipt for that
// key. It never fabricates success: no stored receipt is a uniform 404, and a receipt
// that does not represent the named matter is not disclosed.
func (s *server) reconcile(c *echo.Context) error {
	rc, err := s.Workspaces.OwnReceipt(c.Request().Context(), port.OwnReceiptQuery{ActorID: actorOf(c), IdempotencyKey: c.Param("key")})
	if err != nil {
		return err
	}
	named := matter.MatterID(c.Param("id"))
	represented := rc.MatterID != nil && *rc.MatterID == named
	for _, m := range rc.Matters {
		represented = represented || m == named
	}
	if !represented {
		return port.ErrNotFound
	}
	_, err = respond(c, http.StatusOK, receiptDTO(rc), false)
	return err
}
