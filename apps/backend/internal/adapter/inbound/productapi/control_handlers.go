package productapi

import (
	"net/http"
	"strconv"

	"github.com/labstack/echo/v5"

	"leonx.me/matter-control/internal/core/port"
)

type createContextRequest struct {
	Kind  string   `json:"kind"`
	Title string   `json:"title"`
	Body  string   `json:"body"`
	Links []string `json:"links"`
}

type patchContextRequest struct {
	Title  *string   `json:"title"`
	Body   *string   `json:"body"`
	Links  *[]string `json:"links"`
	Close  bool      `json:"close"`
	Reopen bool      `json:"reopen"`
	Reason string    `json:"reason"`
}

func (s *server) controlRoom(c *echo.Context) error {
	changes := 0
	if raw := c.QueryParam("changes"); raw != "" {
		n, err := strconv.Atoi(raw)
		if err != nil || n < 1 || n > 100 {
			return errBadRequest
		}
		changes = n
	}
	r, err := s.Control.ControlRoom(c.Request().Context(), port.ControlRoomQuery{ActorID: actorOf(c), MatterID: c.Param("id"), RecentChanges: changes})
	if err != nil {
		return err
	}
	provenance(c, r.AsOf, r.Revision)
	_, err = respond(c, http.StatusOK, controlRoomDTO(r), false)
	return err
}

func (s *server) listContext(c *echo.Context) error {
	rs, err := s.Control.ListContextRecords(c.Request().Context(), port.MatterListQuery{ActorID: actorOf(c), MatterID: c.Param("id")})
	if err != nil {
		return err
	}
	n := len(rs)
	_, err = respond(c, http.StatusOK, page[contextRecordBody]{Items: contextDTOs(rs), Page: pageMeta{Limit: n, MaxLimit: maxPageLimit, Total: &n}}, false)
	return err
}

func (s *server) createContext(c *echo.Context) error {
	var req createContextRequest
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
	res, err := s.Control.CreateContextRecord(c.Request().Context(), port.CreateContextRecordCmd{
		ActorID: actorOf(c), MatterID: c.Param("id"), IdempotencyKey: key, RequestHash: s.fp(c, raw),
		Kind: req.Kind, Title: req.Title, Body: req.Body, Links: req.Links,
	})
	if err != nil {
		return err
	}
	markReplay(c, res.Replayed)
	c.Response().Header().Set("Location", apiPrefix+"/matters/"+c.Param("id")+"/context-records/"+res.ID)
	_, err = respond(c, http.StatusCreated, createdBody{ID: res.ID, Kind: res.Kind, Seq: res.Seq}, false)
	return err
}

// contextCAS maps If-Match onto the record revision through the record's canonical representation.
func (s *server) contextCAS(c *echo.Context, matterID, recordID string) (int64, error) {
	return expectedRevision(c.Request().Header.Get("If-Match"), func() ([]byte, int64, error) {
		rs, err := s.Control.ListContextRecords(c.Request().Context(), port.MatterListQuery{ActorID: actorOf(c), MatterID: matterID})
		if err != nil {
			return nil, 0, err
		}
		for _, r := range rs {
			if r.ID == recordID {
				b, _ := contextETag(r)
				return b, r.Revision, nil
			}
		}
		return nil, 0, port.ErrNotFound
	})
}

func (s *server) patchContext(c *echo.Context) error {
	var req patchContextRequest
	if _, err := readJSON(c, &req); err != nil {
		return err
	}
	rev, err := s.contextCAS(c, c.Param("id"), c.Param("recordId"))
	if err != nil {
		return err
	}
	r, err := s.Control.UpdateContextRecord(c.Request().Context(), port.UpdateContextRecordCmd{
		ActorID: actorOf(c), MatterID: c.Param("id"), RecordID: c.Param("recordId"), ExpectedRevision: rev,
		Title: req.Title, Body: req.Body, Links: req.Links, Close: req.Close, Reopen: req.Reopen, Reason: req.Reason,
	})
	if err != nil {
		return err
	}
	_, tag := contextETag(r)
	c.Response().Header().Set("ETag", tag)
	_, err = respond(c, http.StatusOK, contextDTO(r), false)
	return err
}
