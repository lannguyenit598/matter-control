package productapi

import (
	"encoding/json"
	"net/http"
	"strings"
	"time"

	"github.com/labstack/echo/v5"

	"github.com/example/userapi/internal/core/domain/matter"
	"github.com/example/userapi/internal/core/port"
)

// optString is a patch member that distinguishes absent (leave alone) from present: a JSON null
// or an empty string clears a nullable field.
type optString struct {
	Set   bool
	Value string
}

func (o *optString) UnmarshalJSON(b []byte) error {
	o.Set = true
	if string(b) == "null" {
		o.Value = ""
		return nil
	}
	return json.Unmarshal(b, &o.Value)
}

func (o optString) port() port.OptString { return port.OptString{Set: o.Set, Value: o.Value} }

type createActionRequest struct {
	Title   string `json:"title"`
	Outcome string `json:"outcome"`
}

type patchWorkItemRequest struct {
	Title      *string   `json:"title"`
	Outcome    *string   `json:"outcome"`
	Owner      optString `json:"ownerId"`
	Due        optString `json:"dueAt"`
	Workstream optString `json:"workstreamId"`
}

type executionRequest struct {
	To               string `json:"to"`
	Reason           string `json:"reason"`
	WaitingPartyID   string `json:"waitingPartyId"`
	WaitingCondition string `json:"waitingCondition"`
	CompletedAt      string `json:"completedAt"`
}

type escalationRequest struct {
	Reason string `json:"reason"`
}

type addDependencyRequest struct {
	SourceID string `json:"sourceId"`
	Gate     string `json:"gate"`
	Reason   string `json:"reason"`
}

type removeDependencyRequest struct {
	Reason string `json:"reason"`
}

type createWorkstreamRequest struct {
	Name string `json:"name"`
}

type createPartyRequest struct {
	Name    string `json:"name"`
	Kind    string `json:"kind"`
	Contact string `json:"contact"`
	Notes   string `json:"notes"`
}

type patchPartyRequest struct {
	Name    *string `json:"name"`
	Kind    *string `json:"kind"`
	Contact *string `json:"contact"`
	Notes   *string `json:"notes"`
}

type createMilestoneRequest struct {
	Name     string `json:"name"`
	DueAt    string `json:"dueAt"`
	Critical bool   `json:"critical"`
}

type milestonePrerequisitesRequest struct {
	Prerequisites []string `json:"prerequisites"`
	Critical      bool     `json:"critical"`
	Reason        string   `json:"reason"`
}

// itemCAS maps If-Match onto the item revision through the item's canonical representation.
func (s *server) itemCAS(c *echo.Context, matterID, itemID string) (int64, error) {
	return expectedRevision(c.Request().Header.Get("If-Match"), func() ([]byte, int64, error) {
		d, err := s.Work.GetWorkItem(c.Request().Context(), port.GetWorkItemQuery{ActorID: actorOf(c), MatterID: matterID, ItemID: itemID})
		if err != nil {
			return nil, 0, err
		}
		b, _ := itemETag(d.View.Item)
		return b, d.View.Item.Revision, nil
	})
}

func respondEnvelope(c *echo.Context, status int, v matter.WorkItemView, asOf time.Time) error {
	_, tag := itemETag(v.Item)
	c.Response().Header().Set("ETag", tag)
	provenance(c, asOf, v.Item.Revision)
	_, err := respond(c, status, envelopeDTO(v), false)
	return err
}

func respondDetail(c *echo.Context, status int, d matter.WorkItemDetail) error {
	_, tag := itemETag(d.View.Item)
	c.Response().Header().Set("ETag", tag)
	provenance(c, d.AsOf, d.View.Item.Revision)
	_, err := respond(c, status, detailDTO(d), false)
	return err
}

func (s *server) createAction(c *echo.Context) error {
	var req createActionRequest
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
	res, err := s.Work.CreateAction(c.Request().Context(), port.CreateActionCmd{
		ActorID: actorOf(c), MatterID: c.Param("id"), IdempotencyKey: key, RequestHash: s.fp(c, raw), Title: req.Title, Outcome: req.Outcome,
	})
	if err != nil {
		return err
	}
	markReplay(c, res.Replayed)
	c.Response().Header().Set("Location", apiPrefix+"/matters/"+c.Param("id")+"/work-items/"+res.Item.ID.String())
	return respondEnvelope(c, http.StatusCreated, matter.ViewOf(res.Item, res.RecordedAt, nil), time.Time{})
}

func parseOffset(c *echo.Context) (int, error) {
	raw := c.QueryParam("cursor")
	if raw == "" {
		return 0, nil
	}
	var off int
	if err := decodeCursor(raw, &off); err != nil || off < 0 {
		return 0, decodeCursor("!", &off)
	}
	return off, nil
}

func (s *server) listWorkItems(c *echo.Context) error {
	limit, err := parseLimit(c)
	if err != nil {
		return err
	}
	offset, err := parseOffset(c)
	if err != nil {
		return err
	}
	q := c.QueryParams()
	f := port.WorkFilter{
		Kind: q.Get("kind"), Dependency: q.Get("dependency"), Timing: q.Get("timing"), Attention: q.Get("attention"),
		Owner: q.Get("owner"), Workstream: q.Get("workstream"), Text: q.Get("q"),
	}
	for _, e := range q["execution"] {
		for _, part := range strings.Split(e, ",") {
			if part = strings.TrimSpace(part); part != "" {
				f.Execution = append(f.Execution, part)
			}
		}
	}
	page, err := s.Work.ListWorkItems(c.Request().Context(), port.ListWorkItemsQuery{
		ActorID: actorOf(c), MatterID: c.Param("id"), Filter: f, Sort: q.Get("sort"), Desc: q.Get("desc") == "true", Limit: limit, Offset: offset,
	})
	if err != nil {
		return err
	}
	out := page2[workItemEnvelope]{Items: make([]workItemEnvelope, 0, len(page.Items)), Page: pageMeta{Limit: limit, MaxLimit: maxPageLimit, Total: &page.Total}}
	for _, v := range page.Items {
		out.Items = append(out.Items, envelopeDTO(v))
	}
	if page.NextOffset != nil {
		out.Page.NextCursor = encodeCursor(*page.NextOffset)
	}
	provenance(c, page.AsOf, page.Revision)
	_, err = respond(c, http.StatusOK, out, false)
	return err
}

// page2 is the paging envelope for work items (the same shape as page[T]).
type page2[T any] = page[T]

func (s *server) getWorkItem(c *echo.Context) error {
	d, err := s.Work.GetWorkItem(c.Request().Context(), port.GetWorkItemQuery{ActorID: actorOf(c), MatterID: c.Param("id"), ItemID: c.Param("itemId")})
	if err != nil {
		return err
	}
	return respondDetail(c, http.StatusOK, d)
}

func (s *server) patchWorkItem(c *echo.Context) error {
	var req patchWorkItemRequest
	if _, err := readJSON(c, &req); err != nil {
		return err
	}
	rev, err := s.itemCAS(c, c.Param("id"), c.Param("itemId"))
	if err != nil {
		return err
	}
	v, err := s.Work.UpdateWorkItem(c.Request().Context(), port.UpdateWorkItemCmd{
		ActorID: actorOf(c), MatterID: c.Param("id"), ItemID: c.Param("itemId"), ExpectedRevision: rev,
		Title: req.Title, Outcome: req.Outcome, Owner: req.Owner.port(), Due: req.Due.port(), Workstream: req.Workstream.port(),
	})
	if err != nil {
		return err
	}
	return respondEnvelope(c, http.StatusOK, v, time.Time{})
}

func (s *server) transitionExecution(c *echo.Context) error {
	var req executionRequest
	if _, err := readJSON(c, &req); err != nil {
		return err
	}
	rev, err := s.itemCAS(c, c.Param("id"), c.Param("itemId"))
	if err != nil {
		return err
	}
	v, err := s.Work.TransitionExecution(c.Request().Context(), port.TransitionExecutionCmd{
		ActorID: actorOf(c), MatterID: c.Param("id"), ItemID: c.Param("itemId"), ExpectedRevision: rev, To: req.To,
		Reason: req.Reason, WaitingPartyID: req.WaitingPartyID, WaitingCondition: req.WaitingCondition, CompletedAt: req.CompletedAt,
	})
	if err != nil {
		return err
	}
	return respondEnvelope(c, http.StatusOK, v, time.Time{})
}

func (s *server) escalate(c *echo.Context) error {
	var req escalationRequest
	if _, err := readJSON(c, &req); err != nil {
		return err
	}
	rev, err := s.itemCAS(c, c.Param("id"), c.Param("itemId"))
	if err != nil {
		return err
	}
	v, err := s.Work.Escalate(c.Request().Context(), port.EscalateCmd{
		ActorID: actorOf(c), MatterID: c.Param("id"), ItemID: c.Param("itemId"), ExpectedRevision: rev, Reason: req.Reason,
	})
	if err != nil {
		return err
	}
	return respondEnvelope(c, http.StatusOK, v, time.Time{})
}

func (s *server) addDependency(c *echo.Context) error {
	var req addDependencyRequest
	if _, err := readJSON(c, &req); err != nil {
		return err
	}
	rev, err := s.itemCAS(c, c.Param("id"), c.Param("itemId"))
	if err != nil {
		return err
	}
	d, err := s.Work.AddDependency(c.Request().Context(), port.AddDependencyCmd{
		ActorID: actorOf(c), MatterID: c.Param("id"), SourceID: req.SourceID, TargetID: c.Param("itemId"), Gate: req.Gate,
		Reason: req.Reason, ExpectedTargetRevision: rev,
	})
	if err != nil {
		return err
	}
	return respondDetail(c, http.StatusOK, d)
}

func (s *server) removeDependency(c *echo.Context) error {
	var req removeDependencyRequest
	if _, err := readJSON(c, &req); err != nil {
		return err
	}
	rev, err := s.itemCAS(c, c.Param("id"), c.Param("itemId"))
	if err != nil {
		return err
	}
	d, err := s.Work.RemoveDependency(c.Request().Context(), port.RemoveDependencyCmd{
		ActorID: actorOf(c), MatterID: c.Param("id"), EdgeID: c.Param("edgeId"), Reason: req.Reason, ExpectedTargetRevision: rev,
	})
	if err != nil {
		return err
	}
	return respondDetail(c, http.StatusOK, d)
}

func (s *server) listWorkstreams(c *echo.Context) error {
	ws, err := s.Work.ListWorkstreams(c.Request().Context(), port.MatterListQuery{ActorID: actorOf(c), MatterID: c.Param("id")})
	if err != nil {
		return err
	}
	out := make([]workstreamBody, 0, len(ws))
	for _, w := range ws {
		out = append(out, workstreamBody{ID: w.ID.String(), Name: w.Name, Revision: w.Revision})
	}
	n := len(out)
	_, err = respond(c, http.StatusOK, page[workstreamBody]{Items: out, Page: pageMeta{Limit: n, MaxLimit: maxPageLimit, Total: &n}}, false)
	return err
}

func (s *server) createWorkstream(c *echo.Context) error {
	var req createWorkstreamRequest
	if _, err := readJSON(c, &req); err != nil {
		return err
	}
	if err := requireNoIfMatch(c); err != nil {
		return err
	}
	w, err := s.Work.CreateWorkstream(c.Request().Context(), port.CreateWorkstreamCmd{ActorID: actorOf(c), MatterID: c.Param("id"), Name: req.Name})
	if err != nil {
		return err
	}
	_, err = respond(c, http.StatusCreated, workstreamBody{ID: w.ID.String(), Name: w.Name, Revision: w.Revision}, true)
	return err
}

func (s *server) listParties(c *echo.Context) error {
	ps, err := s.Work.ListParties(c.Request().Context(), port.MatterListQuery{ActorID: actorOf(c), MatterID: c.Param("id")})
	if err != nil {
		return err
	}
	out := make([]partyBody, 0, len(ps))
	for _, p := range ps {
		out = append(out, partyDTO(p))
	}
	n := len(out)
	_, err = respond(c, http.StatusOK, page[partyBody]{Items: out, Page: pageMeta{Limit: n, MaxLimit: maxPageLimit, Total: &n}}, false)
	return err
}

func (s *server) createParty(c *echo.Context) error {
	var req createPartyRequest
	if _, err := readJSON(c, &req); err != nil {
		return err
	}
	if err := requireNoIfMatch(c); err != nil {
		return err
	}
	p, err := s.Work.CreateParty(c.Request().Context(), port.CreatePartyCmd{
		ActorID: actorOf(c), MatterID: c.Param("id"), Name: req.Name, Kind: req.Kind, Contact: req.Contact, Notes: req.Notes,
	})
	if err != nil {
		return err
	}
	_, tag := partyETag(p)
	c.Response().Header().Set("ETag", tag)
	_, err = respond(c, http.StatusCreated, partyDTO(p), false)
	return err
}

func (s *server) patchParty(c *echo.Context) error {
	var req patchPartyRequest
	if _, err := readJSON(c, &req); err != nil {
		return err
	}
	rev, err := expectedRevision(c.Request().Header.Get("If-Match"), func() ([]byte, int64, error) {
		ps, err := s.Work.ListParties(c.Request().Context(), port.MatterListQuery{ActorID: actorOf(c), MatterID: c.Param("id")})
		if err != nil {
			return nil, 0, err
		}
		for _, p := range ps {
			if p.ID.String() == c.Param("partyId") {
				b, _ := partyETag(p)
				return b, p.Revision, nil
			}
		}
		return nil, 0, port.ErrNotFound
	})
	if err != nil {
		return err
	}
	p, err := s.Work.UpdateParty(c.Request().Context(), port.UpdatePartyCmd{
		ActorID: actorOf(c), MatterID: c.Param("id"), PartyID: c.Param("partyId"), ExpectedRevision: rev,
		Name: req.Name, Kind: req.Kind, Contact: req.Contact, Notes: req.Notes,
	})
	if err != nil {
		return err
	}
	_, tag := partyETag(p)
	c.Response().Header().Set("ETag", tag)
	_, err = respond(c, http.StatusOK, partyDTO(p), false)
	return err
}

func (s *server) listMilestones(c *echo.Context) error {
	ms, err := s.Work.ListMilestones(c.Request().Context(), port.MatterListQuery{ActorID: actorOf(c), MatterID: c.Param("id")})
	if err != nil {
		return err
	}
	out := make([]milestoneViewBody, 0, len(ms))
	for _, m := range ms {
		out = append(out, milestoneViewDTO(m))
	}
	n := len(out)
	_, err = respond(c, http.StatusOK, page[milestoneViewBody]{Items: out, Page: pageMeta{Limit: n, MaxLimit: maxPageLimit, Total: &n}}, false)
	return err
}

func milestoneETag(m matter.Milestone) ([]byte, string) {
	b, _ := json.Marshal(milestoneDTO(m)) // skip: primitives only
	return b, etagOf(b)
}

func (s *server) createMilestone(c *echo.Context) error {
	var req createMilestoneRequest
	if _, err := readJSON(c, &req); err != nil {
		return err
	}
	if err := requireNoIfMatch(c); err != nil {
		return err
	}
	v, err := s.Work.CreateMilestone(c.Request().Context(), port.CreateMilestoneCmd{
		ActorID: actorOf(c), MatterID: c.Param("id"), Name: req.Name, Due: req.DueAt, Critical: req.Critical,
	})
	if err != nil {
		return err
	}
	_, tag := milestoneETag(v.Milestone)
	c.Response().Header().Set("ETag", tag)
	_, err = respond(c, http.StatusCreated, milestoneViewDTO(v), false)
	return err
}

func (s *server) setMilestonePrerequisites(c *echo.Context) error {
	var req milestonePrerequisitesRequest
	if _, err := readJSON(c, &req); err != nil {
		return err
	}
	rev, err := expectedRevision(c.Request().Header.Get("If-Match"), func() ([]byte, int64, error) {
		ms, err := s.Work.ListMilestones(c.Request().Context(), port.MatterListQuery{ActorID: actorOf(c), MatterID: c.Param("id")})
		if err != nil {
			return nil, 0, err
		}
		for _, m := range ms {
			if m.Milestone.ID.String() == c.Param("milestoneId") {
				b, _ := milestoneETag(m.Milestone)
				return b, m.Milestone.Revision, nil
			}
		}
		return nil, 0, port.ErrNotFound
	})
	if err != nil {
		return err
	}
	v, err := s.Work.SetMilestonePrerequisites(c.Request().Context(), port.SetMilestonePrerequisitesCmd{
		ActorID: actorOf(c), MatterID: c.Param("id"), MilestoneID: c.Param("milestoneId"), ExpectedRevision: rev,
		Prerequisites: req.Prerequisites, Critical: req.Critical, Reason: req.Reason,
	})
	if err != nil {
		return err
	}
	_, tag := milestoneETag(v.Milestone)
	c.Response().Header().Set("ETag", tag)
	_, err = respond(c, http.StatusOK, milestoneViewDTO(v), false)
	return err
}

func (s *server) waitingOn(c *echo.Context) error {
	items, err := s.Work.WaitingOn(c.Request().Context(), port.MatterListQuery{ActorID: actorOf(c), MatterID: c.Param("id")})
	if err != nil {
		return err
	}
	out := make([]workItemEnvelope, 0, len(items))
	for _, v := range items {
		out = append(out, envelopeDTO(v))
	}
	n := len(out)
	_, err = respond(c, http.StatusOK, page[workItemEnvelope]{Items: out, Page: pageMeta{Limit: n, MaxLimit: maxPageLimit, Total: &n}}, false)
	return err
}

// myActions lists the caller's own assigned work across the matters they can access. The query
// has no matter or user parameter: the actor is the authenticated principal and nothing else.
func (s *server) myActions(c *echo.Context) error {
	m, err := s.Work.MyActions(c.Request().Context(), port.MyActionsQuery{ActorID: actorOf(c)})
	if err != nil {
		return err
	}
	provenance(c, m.AsOf, 0)
	_, err = respond(c, http.StatusOK, myActionsBody{
		Next: assignedDTOs(m.Next), Waiting: assignedDTOs(m.Waiting), Blocked: assignedDTOs(m.Blocked), Historical: assignedDTOs(m.Historical),
	}, false)
	return err
}
