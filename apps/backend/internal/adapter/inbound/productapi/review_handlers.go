package productapi

import (
	"encoding/json"
	"fmt"
	"net/http"
	"strconv"
	"time"

	"github.com/labstack/echo/v5"

	"leonx.me/matter-control/internal/core/domain/matter"
	"leonx.me/matter-control/internal/core/port"
)

type createReviewGridRequest struct {
	Name string `json:"name"`
}

type reviewVersionRequest struct {
	VersionID string `json:"versionId"`
}

type reviewQuestionRequest struct {
	Text string `json:"text"`
}

type reviewAnswerRequest struct {
	VersionID  string `json:"versionId"`
	QuestionID string `json:"questionId"`
	// ExpectedAnswerID is the id of the answer the writer saw; "" explicitly expects an
	// observed empty cell and an absent or null field is a missing precondition (428).
	ExpectedAnswerID *string `json:"expectedAnswerId"`
	QuestionRevision int     `json:"questionRevision"`
	State            string  `json:"state"`
	Text             string  `json:"text"`
	PageRef          string  `json:"pageRef"`
	QuoteRef         string  `json:"quoteRef"`
}

// gridCAS maps If-Match onto the grid revision. The tag is the hash of the grid header
// representation, so every structure change yields a new tag.
func (s *server) gridCAS(c *echo.Context, matterID, gridID string) (int64, error) {
	return expectedRevision(c.Request().Header.Get("If-Match"), func() ([]byte, int64, error) {
		v, err := s.Review.GetGrid(c.Request().Context(), port.GetReviewGridQuery{ActorID: actorOf(c), MatterID: matterID, GridID: gridID})
		if err != nil {
			return nil, 0, err
		}
		b, err := json.Marshal(reviewGridDTO(v.Grid))
		return b, v.Grid.Revision, err
	})
}

func (s *server) respondReviewGrid(c *echo.Context, status int, matterID, gridID string) error {
	v, err := s.Review.GetGrid(c.Request().Context(), port.GetReviewGridQuery{ActorID: actorOf(c), MatterID: matterID, GridID: gridID})
	if err != nil {
		return err
	}
	head, err := json.Marshal(reviewGridDTO(v.Grid))
	if err != nil {
		return err
	}
	c.Response().Header().Set("ETag", etagOf(head))
	provenance(c, v.AsOf, v.Revision)
	_, err = respond(c, status, reviewViewDTO(v), false)
	return err
}

func (s *server) listReviewGrids(c *echo.Context) error {
	gs, err := s.Review.ListGrids(c.Request().Context(), port.MatterListQuery{ActorID: actorOf(c), MatterID: c.Param("id")})
	if err != nil {
		return err
	}
	items := make([]reviewGridBody, len(gs))
	for i, g := range gs {
		items[i] = reviewGridDTO(g)
	}
	n := len(items)
	_, err = respond(c, http.StatusOK, page[reviewGridBody]{Items: items, Page: pageMeta{Limit: n, MaxLimit: maxPageLimit, Total: &n}}, false)
	return err
}

func (s *server) createReviewGrid(c *echo.Context) error {
	var req createReviewGridRequest
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
	res, err := s.Review.CreateGrid(c.Request().Context(), port.CreateReviewGridCmd{
		ActorID: actorOf(c), MatterID: c.Param("id"), IdempotencyKey: key, RequestHash: s.fp(c, raw), Name: req.Name,
	})
	if err != nil {
		return err
	}
	markReplay(c, res.Replayed)
	c.Response().Header().Set("Location", apiPrefix+"/matters/"+c.Param("id")+"/review-grids/"+res.ID)
	_, err = respond(c, http.StatusCreated, createdBody{ID: res.ID, Kind: res.Kind, Seq: res.Seq}, false)
	return err
}

func (s *server) getReviewGrid(c *echo.Context) error {
	return s.respondReviewGrid(c, http.StatusOK, c.Param("id"), c.Param("gridId"))
}

func (s *server) addReviewVersion(c *echo.Context) error {
	var req reviewVersionRequest
	if _, err := readJSON(c, &req); err != nil {
		return err
	}
	rev, err := s.gridCAS(c, c.Param("id"), c.Param("gridId"))
	if err != nil {
		return err
	}
	if _, err := s.Review.AddGridVersion(c.Request().Context(), port.ReviewVersionCmd{
		ActorID: actorOf(c), MatterID: c.Param("id"), GridID: c.Param("gridId"), VersionID: req.VersionID, ExpectedRevision: rev,
	}); err != nil {
		return err
	}
	return s.respondReviewGrid(c, http.StatusOK, c.Param("id"), c.Param("gridId"))
}

func (s *server) removeReviewVersion(c *echo.Context) error {
	rev, err := s.gridCAS(c, c.Param("id"), c.Param("gridId"))
	if err != nil {
		return err
	}
	if _, err := s.Review.RemoveGridVersion(c.Request().Context(), port.ReviewVersionCmd{
		ActorID: actorOf(c), MatterID: c.Param("id"), GridID: c.Param("gridId"), VersionID: c.Param("versionId"), ExpectedRevision: rev,
	}); err != nil {
		return err
	}
	return s.respondReviewGrid(c, http.StatusOK, c.Param("id"), c.Param("gridId"))
}

func (s *server) addReviewQuestion(c *echo.Context) error {
	var req reviewQuestionRequest
	if _, err := readJSON(c, &req); err != nil {
		return err
	}
	rev, err := s.gridCAS(c, c.Param("id"), c.Param("gridId"))
	if err != nil {
		return err
	}
	if _, err := s.Review.AddQuestion(c.Request().Context(), port.AddReviewQuestionCmd{
		ActorID: actorOf(c), MatterID: c.Param("id"), GridID: c.Param("gridId"), Text: req.Text, ExpectedRevision: rev,
	}); err != nil {
		return err
	}
	return s.respondReviewGrid(c, http.StatusOK, c.Param("id"), c.Param("gridId"))
}

func (s *server) reviseReviewQuestion(c *echo.Context) error {
	var req reviewQuestionRequest
	if _, err := readJSON(c, &req); err != nil {
		return err
	}
	rev, err := s.gridCAS(c, c.Param("id"), c.Param("gridId"))
	if err != nil {
		return err
	}
	if _, err := s.Review.ReviseQuestion(c.Request().Context(), port.ReviseReviewQuestionCmd{
		ActorID: actorOf(c), MatterID: c.Param("id"), GridID: c.Param("gridId"), QuestionID: c.Param("questionId"), Text: req.Text, ExpectedRevision: rev,
	}); err != nil {
		return err
	}
	return s.respondReviewGrid(c, http.StatusOK, c.Param("id"), c.Param("gridId"))
}

func (s *server) recordReviewAnswer(c *echo.Context) error {
	var req reviewAnswerRequest
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
	res, err := s.Review.RecordAnswer(c.Request().Context(), port.RecordReviewAnswerCmd{
		ActorID: actorOf(c), MatterID: c.Param("id"), IdempotencyKey: key, RequestHash: s.fp(c, raw), GridID: c.Param("gridId"),
		VersionID: req.VersionID, QuestionID: req.QuestionID, ExpectedAnswerID: req.ExpectedAnswerID, ExpectedQuestionRevision: req.QuestionRevision, State: req.State,
		Text: req.Text, PageRef: req.PageRef, QuoteRef: req.QuoteRef,
	})
	if err != nil {
		return err
	}
	markReplay(c, res.Replayed)
	_, err = respond(c, http.StatusCreated, createdBody{ID: res.ID, Kind: res.Kind, Seq: res.Seq}, false)
	return err
}

// historyCursorJSON is the opaque paging token of one answer-history page: the last answer's
// recorded instant and id. It is a seek position only; every page is re-authorized.
type historyCursorJSON struct {
	At string `json:"at"`
	ID string `json:"id"`
}

func (s *server) reviewHistory(c *echo.Context) error {
	limit := matter.MaxReviewHistory
	if raw := c.QueryParam("limit"); raw != "" {
		n, err := strconv.Atoi(raw)
		if err != nil || n < 1 || n > matter.MaxReviewHistory {
			return fmt.Errorf("%w: limit must be between 1 and %d", errBadRequest, matter.MaxReviewHistory)
		}
		limit = n
	}
	var cursor *matter.ReviewAnswerCursor
	if raw := c.QueryParam("cursor"); raw != "" {
		var cur historyCursorJSON
		if err := decodeCursor(raw, &cur); err != nil {
			return err
		}
		at, err := time.Parse(time.RFC3339Nano, cur.At)
		if err != nil {
			return fmt.Errorf("%w: invalid cursor", errBadRequest)
		}
		id, err := matter.ParseReviewID(cur.ID, "cursor")
		if err != nil {
			return fmt.Errorf("%w: invalid cursor", errBadRequest)
		}
		cursor = &matter.ReviewAnswerCursor{AnsweredAt: at, ID: id}
	}
	hist, err := s.Review.AnswerHistory(c.Request().Context(), port.ReviewHistoryQuery{
		ActorID: actorOf(c), MatterID: c.Param("id"), GridID: c.Param("gridId"), VersionID: c.Param("versionId"), QuestionID: c.Param("questionId"), Limit: limit, Cursor: cursor,
	})
	if err != nil {
		return err
	}
	items := make([]reviewAnswerBody, len(hist.Items))
	for i, a := range hist.Items {
		items[i] = reviewAnswerDTO(a)
	}
	// total stays unknown: a keyset page does not count the trail, so none is claimed.
	out := page[reviewAnswerBody]{Items: items, Page: pageMeta{Limit: limit, MaxLimit: matter.MaxReviewHistory}}
	if hist.NextCursor != nil {
		out.Page.NextCursor = encodeCursor(historyCursorJSON{At: ts(hist.NextCursor.AnsweredAt), ID: hist.NextCursor.ID})
	}
	_, err = respond(c, http.StatusOK, out, false)
	return err
}
