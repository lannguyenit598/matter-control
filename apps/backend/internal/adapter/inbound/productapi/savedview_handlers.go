package productapi

// RLF-04 Saved Views (REQ-MC-P1-12): private named work-grid filter definitions. A list read
// returns only the caller's own rows; another user's view and a nonexistent view are the same
// uniform 404. Applying a view happens on the existing grid route: the view only names filters.

import (
	"encoding/json"
	"net/http"
	"strings"

	"github.com/labstack/echo/v5"

	"leonx.me/matter-control/internal/core/domain"
	"leonx.me/matter-control/internal/core/domain/matter"
	"leonx.me/matter-control/internal/core/port"
)

type savedViewFiltersBody struct {
	Kind       string `json:"kind"`
	Execution  string `json:"execution"`
	Dependency string `json:"dependency"`
	Timing     string `json:"timing"`
	Attention  string `json:"attention"`
	Owner      string `json:"owner"`
	Workstream string `json:"workstream"`
	Q          string `json:"q"`
	Sort       string `json:"sort"`
	Desc       string `json:"desc"`
}

func (b savedViewFiltersBody) domain() matter.SavedViewFilters {
	return matter.SavedViewFilters(b)
}

var savedViewKinds = map[string]bool{"": true, "REQUIREMENT": true, "ACTION": true}
var savedViewTimings = map[string]bool{"": true, "OVERDUE": true, "DUE_SOON": true, "ON_TRACK": true}
var savedViewDependencies = map[string]bool{"": true, "READY": true, "BLOCKED": true}
var savedViewAttentions = map[string]bool{"": true, "NORMAL": true, "ATTENTION": true, "CRITICAL": true}
var savedViewSorts = map[string]bool{"": true, "due": true, "title": true, "execution": true, "attention": true}

// executionStateAllowed names exactly the states the work grid accepts.
func executionStateAllowed(s string) bool {
	switch matter.ExecutionState(s) {
	case matter.ExecutionNotStarted, matter.ExecutionInProgress, matter.ExecutionWaiting, matter.ExecutionCompleted, matter.ExecutionCancelled:
		return true
	}
	return false
}

// validate checks the stored shape against the values the grid itself accepts, so a restored
// view can never name a filter the grid would refuse.
func (b savedViewFiltersBody) validate() error {
	ve := &domain.ValidationError{}
	if !savedViewKinds[b.Kind] {
		ve.Add("filters.kind", "must be a work kind or empty")
	}
	if !savedViewTimings[b.Timing] {
		ve.Add("filters.timing", "must be a timing or empty")
	}
	if !savedViewDependencies[b.Dependency] {
		ve.Add("filters.dependency", "must be a dependency state or empty")
	}
	if !savedViewAttentions[b.Attention] {
		ve.Add("filters.attention", "must be an attention level or empty")
	}
	if !savedViewSorts[b.Sort] {
		ve.Add("filters.sort", "must be a grid sort or empty")
	}
	if b.Desc != "" && b.Desc != "true" && b.Desc != "false" {
		ve.Add("filters.desc", "must be true or false")
	}
	for _, part := range strings.Split(b.Execution, ",") {
		if part = strings.TrimSpace(part); part != "" && !executionStateAllowed(part) {
			ve.Add("filters.execution", "must be execution states")
			break
		}
	}
	if len(b.Q) > 200 || len(b.Owner) > 64 || len(b.Workstream) > 64 {
		ve.Add("filters", "a filter value is too long")
	}
	if ve.HasErrors() {
		return ve
	}
	return nil
}

type savedViewBody struct {
	ID        string               `json:"id"`
	Name      string               `json:"name"`
	Filters   savedViewFiltersBody `json:"filters"`
	Revision  int64                `json:"revision"`
	CreatedAt string               `json:"createdAt"`
	UpdatedAt string               `json:"updatedAt"`
	ETag      string               `json:"etag"`
}

func savedViewFiltersBodyOf(f matter.SavedViewFilters) savedViewFiltersBody {
	return savedViewFiltersBody{Kind: f.Kind, Execution: f.Execution, Dependency: f.Dependency, Timing: f.Timing,
		Attention: f.Attention, Owner: f.Owner, Workstream: f.Workstream, Q: f.Q, Sort: f.Sort, Desc: f.Desc}
}

func savedViewDTO(v matter.SavedView) savedViewBody {
	return savedViewBody{
		ID: v.ID.String(), Name: v.Name, Filters: savedViewFiltersBodyOf(v.Filters), Revision: v.Revision,
		CreatedAt: ts(v.CreatedAt), UpdatedAt: ts(v.UpdatedAt), ETag: savedViewETag(v),
	}
}

// savedViewETag is the SHA-256 of the canonical revision-determined representation (contract §4):
// the identity, the stored name and filters, and the revision — never a read instant.
func savedViewETag(v matter.SavedView) string {
	b, _ := json.Marshal(map[string]any{"id": v.ID.String(), "name": v.Name, "filters": savedViewFiltersBodyOf(v.Filters), "revision": v.Revision})
	return etagOf(b)
}

type createSavedViewRequest struct {
	Name    string               `json:"name"`
	Filters savedViewFiltersBody `json:"filters"`
}

func mapSavedViews(vs []matter.SavedView) []savedViewBody {
	out := make([]savedViewBody, 0, len(vs))
	for _, v := range vs {
		out = append(out, savedViewDTO(v))
	}
	return out
}

func (s *server) listSavedViews(c *echo.Context) error {
	vs, err := s.SavedViews.ListSavedViews(c.Request().Context(), port.ListSavedViewsQuery{ActorID: actorOf(c), MatterID: c.Param("id")})
	if err != nil {
		return err
	}
	n := len(vs)
	_, err = respond(c, http.StatusOK, page[savedViewBody]{Items: mapSavedViews(vs), Page: pageMeta{Limit: n, MaxLimit: maxPageLimit, Total: &n}}, false)
	return err
}

func (s *server) createSavedView(c *echo.Context) error {
	var req createSavedViewRequest
	raw, err := readJSON(c, &req)
	if err != nil {
		return err
	}
	if err := requireNoIfMatch(c); err != nil {
		return err
	}
	if err := req.Filters.validate(); err != nil {
		return err
	}
	key, err := idempotencyKey(c)
	if err != nil {
		return err
	}
	res, err := s.SavedViews.CreateSavedView(c.Request().Context(), port.CreateSavedViewCmd{
		ActorID: actorOf(c), MatterID: c.Param("id"), IdempotencyKey: key, RequestHash: s.fp(c, raw),
		Name: req.Name, Filters: req.Filters.domain(),
	})
	if err != nil {
		return err
	}
	markReplay(c, res.Replayed)
	c.Response().Header().Set("Location", apiPrefix+"/matters/"+c.Param("id")+"/saved-views/"+res.ID)
	_, err = respond(c, http.StatusCreated, createdBody{ID: res.ID, Kind: res.Kind, Seq: res.Seq}, false)
	return err
}

// savedViewCAS maps If-Match onto the caller's own view revision. A view the caller does not own
// never resolves, so the command answers with the uniform denial.
func (s *server) savedViewCAS(c *echo.Context) (int64, error) {
	return expectedRevision(c.Request().Header.Get("If-Match"), func() ([]byte, int64, error) {
		vs, err := s.SavedViews.ListSavedViews(c.Request().Context(), port.ListSavedViewsQuery{ActorID: actorOf(c), MatterID: c.Param("id")})
		if err != nil {
			return nil, 0, err
		}
		for _, v := range vs {
			if v.ID.String() == c.Param("viewId") {
				b, _ := json.Marshal(map[string]any{"id": v.ID.String(), "name": v.Name, "filters": savedViewFiltersBodyOf(v.Filters), "revision": v.Revision})
				return b, v.Revision, nil
			}
		}
		return nil, 0, port.ErrNotFound
	})
}

func (s *server) updateSavedView(c *echo.Context) error {
	var req createSavedViewRequest
	if _, err := readJSON(c, &req); err != nil {
		return err
	}
	if err := req.Filters.validate(); err != nil {
		return err
	}
	rev, err := s.savedViewCAS(c)
	if err != nil {
		return err
	}
	v, err := s.SavedViews.UpdateSavedView(c.Request().Context(), port.UpdateSavedViewCmd{
		ActorID: actorOf(c), MatterID: c.Param("id"), ViewID: c.Param("viewId"), ExpectedRevision: rev,
		Name: req.Name, Filters: req.Filters.domain(),
	})
	if err != nil {
		return err
	}
	_, err = respond(c, http.StatusOK, savedViewDTO(v), true)
	return err
}

func (s *server) deleteSavedView(c *echo.Context) error {
	rev, err := s.savedViewCAS(c)
	if err != nil {
		return err
	}
	if err := s.SavedViews.DeleteSavedView(c.Request().Context(), port.DeleteSavedViewCmd{
		ActorID: actorOf(c), MatterID: c.Param("id"), ViewID: c.Param("viewId"), ExpectedRevision: rev,
	}); err != nil {
		return err
	}
	_, err = respond(c, http.StatusOK, map[string]any{"deleted": true}, false)
	return err
}
