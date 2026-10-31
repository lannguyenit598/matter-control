package productapi

import (
	"fmt"
	"net/http"
	"time"

	"github.com/labstack/echo/v5"

	"leonx.me/matter-control/internal/core/domain/matter"
	"leonx.me/matter-control/internal/core/port"
)

// ---------- GET /matters (BF-08) ----------

type discoveredMatterBody struct {
	matterBody
	WorkspaceName string `json:"workspaceName"`
}

type discoveryCursorJSON struct {
	Key string `json:"k"`
	ID  string `json:"id"`
}

// discoverMatters finds the caller's accessible Matters by title across their active workspaces.
// The query has no workspace or user parameter: the actor is the authenticated principal, and the
// service returns names, counts and pagination only for rows the caller is already authorized for.
func (s *server) discoverMatters(c *echo.Context) error {
	limit, err := parseLimit(c)
	if err != nil {
		return err
	}
	q := port.DiscoverMattersQuery{ActorID: actorOf(c), Query: c.QueryParam("q"), Limit: limit}
	if raw := c.QueryParam("cursor"); raw != "" {
		var cur discoveryCursorJSON
		if err := decodeCursor(raw, &cur); err != nil {
			return err
		}
		q.After = &matter.DiscoveryCursor{SortKey: cur.Key, MatterID: matter.MatterID(cur.ID)}
	}
	res, err := s.Workspaces.DiscoverMatters(c.Request().Context(), q)
	if err != nil {
		return err
	}
	out := page[discoveredMatterBody]{Items: make([]discoveredMatterBody, 0, len(res.Items)), Page: pageMeta{Limit: limit, MaxLimit: maxPageLimit, Total: &res.Total}}
	for _, m := range res.Items {
		out.Items = append(out.Items, discoveredMatterBody{matterBody: matterDTO(m.Header, m.CallerRole), WorkspaceName: m.WorkspaceName})
	}
	if res.Next != nil {
		out.Page.NextCursor = encodeCursor(discoveryCursorJSON{Key: res.Next.SortKey, ID: res.Next.MatterID.String()})
	}
	provenance(c, res.AsOf, 0)
	_, err = respond(c, http.StatusOK, out, false)
	return err
}

// ---------- GET /me/reviews (BF-05) ----------

type pendingAssessmentBody struct {
	MatterID          string  `json:"matterId"`
	MatterTitle       string  `json:"matterTitle"`
	SubjectID         string  `json:"subjectId"`
	SubjectKind       string  `json:"subjectKind"`
	SubjectTitle      string  `json:"subjectTitle"`
	SubjectEpoch      int64   `json:"subjectEpoch"`
	CriterionID       string  `json:"criterionId"`
	CriterionTitle    string  `json:"criterionTitle"`
	CriterionRevision int64   `json:"criterionRevision"`
	CriterionPurpose  string  `json:"criterionPurpose"`
	ClaimID           string  `json:"claimId"`
	ClaimedAt         string  `json:"claimedAt"`
	ClaimedBy         string  `json:"claimedBy"`
	ClaimedByName     string  `json:"claimedByName"`
	EvidenceID        string  `json:"evidenceId"`
	EvidenceKind      string  `json:"evidenceKind"`
	EvidenceReference string  `json:"evidenceReference"`
	SubmittedBy       string  `json:"submittedBy"`
	SubmittedByName   string  `json:"submittedByName"`
	VersionID         *string `json:"versionId"`
	VersionLabel      string  `json:"versionLabel"`
	Reason            string  `json:"reason"`
}

type reviewCursorJSON struct {
	At string `json:"at"`
	ID string `json:"id"`
}

// myReviews lists the claims the caller may assess as a designated independent verifier. It is a
// separate read from /me/actions (assigned work); it never lists work the caller could not do.
func (s *server) myReviews(c *echo.Context) error {
	limit, err := parseLimit(c)
	if err != nil {
		return err
	}
	q := port.ReviewQueueQuery{ActorID: actorOf(c), Limit: limit}
	if raw := c.QueryParam("cursor"); raw != "" {
		var cur reviewCursorJSON
		if err := decodeCursor(raw, &cur); err != nil {
			return err
		}
		at, perr := time.Parse(time.RFC3339Nano, cur.At)
		if perr != nil {
			return fmt.Errorf("%w: invalid cursor", errBadRequest)
		}
		q.After = &matter.ReviewCursor{ClaimedAt: at, ClaimID: matter.ClaimID(cur.ID)}
	}
	res, err := s.Evidence.ReviewQueue(c.Request().Context(), q)
	if err != nil {
		return err
	}
	out := page[pendingAssessmentBody]{Items: make([]pendingAssessmentBody, 0, len(res.Items)), Page: pageMeta{Limit: limit, MaxLimit: maxPageLimit, Total: &res.Total}}
	for _, r := range res.Items {
		b := pendingAssessmentBody{
			MatterID: r.MatterID.String(), MatterTitle: r.MatterTitle, SubjectID: r.SubjectID.String(), SubjectKind: string(r.SubjectKind),
			SubjectTitle: r.SubjectTitle, SubjectEpoch: r.SubjectEpoch, CriterionID: r.CriterionID.String(), CriterionTitle: r.CriterionTitle,
			CriterionRevision: r.CriterionRevision, CriterionPurpose: string(r.CriterionPurpose), ClaimID: r.ClaimID.String(), ClaimedAt: ts(r.ClaimedAt),
			ClaimedBy: r.ClaimedBy.String(), ClaimedByName: r.ClaimedByName, EvidenceID: r.EvidenceID.String(), EvidenceKind: string(r.EvidenceKind),
			EvidenceReference: r.EvidenceReference, SubmittedBy: r.EvidenceSubmitter.String(), SubmittedByName: r.SubmittedByName,
			VersionLabel: r.VersionLabel, Reason: string(r.Reason),
		}
		if r.VersionID != nil {
			v := r.VersionID.String()
			b.VersionID = &v
		}
		out.Items = append(out.Items, b)
	}
	if res.Next != nil {
		out.Page.NextCursor = encodeCursor(reviewCursorJSON{At: ts(res.Next.ClaimedAt), ID: res.Next.ClaimID.String()})
	}
	provenance(c, res.AsOf, 0)
	_, err = respond(c, http.StatusOK, out, false)
	return err
}
