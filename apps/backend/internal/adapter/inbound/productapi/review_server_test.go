package productapi

import (
	"encoding/base64"
	"fmt"
	"net/http"
	"strings"
	"testing"

	"github.com/google/uuid"
)

// reviewFixture returns a matter, one uploaded version and an empty grid with its ETag.
func reviewFixture(t *testing.T, e *env) (base, version, gridID, tag string) {
	t.Helper()
	m, _ := proofFixture(t, e)
	base = "/api/v1/matters/" + m
	d := e.do("POST", base+"/documents", "t-alice", key(), `{"name":"SPA"}`)
	e.expect(d, 201, "")
	up := e.do("POST", base+"/documents/"+d.json()["id"].(string)+"/versions", "t-alice",
		map[string]string{"Idempotency-Key": uuid.Must(uuid.NewV7()).String(), "Content-Type": "application/pdf", "X-Filename": "spa.pdf"}, "content one")
	e.expect(up, 201, "")
	version = up.json()["id"].(string)
	g := e.do("POST", base+"/review-grids", "t-bob", key(), `{"name":"Change of control"}`)
	e.expect(g, 201, "")
	gridID = g.json()["id"].(string)
	if loc := g.Header().Get("Location"); loc != base+"/review-grids/"+gridID {
		t.Fatalf("Location = %q", loc)
	}
	got := e.do("GET", base+"/review-grids/"+gridID, "t-carol", nil, "")
	e.expect(got, 200, "")
	return base, version, gridID, got.Header().Get("ETag")
}

func ifMatch(tag string) map[string]string { return map[string]string{"If-Match": tag} }

// F01 (RMV): an omitted or null expectation is a missing precondition (428), never an explicit
// "no current answer"; only a stated "" records an observed empty cell. Authorization and
// hidden-resource precedence come first, and a refused command writes nothing, not even a receipt.
func TestReviewGrid_HTTPAnswerExpectationPresence(t *testing.T) {
	e := newEnv(t)
	base, version, gridID, tag := reviewFixture(t, e)
	g := base + "/review-grids/" + gridID
	q := e.do("POST", g+"/questions", "t-bob", ifMatch(tag), `{"text":"Q?"}`)
	e.expect(q, 200, "")
	qid := q.json()["questions"].([]any)[0].(map[string]any)["id"].(string)
	e.expect(e.do("POST", g+"/versions", "t-bob", ifMatch(q.Header().Get("ETag")), `{"versionId":"`+version+`"}`), 200, "")

	answer := func(hdr map[string]string, body string) resp {
		return e.do("POST", g+"/answers", "t-bob", hdr, body)
	}
	missing := `{"versionId":"` + version + `","questionId":"` + qid + `","questionRevision":1,"state":"ABSENT"}`
	null := `{"versionId":"` + version + `","questionId":"` + qid + `","expectedAnswerId":null,"questionRevision":1,"state":"ABSENT"}`

	// red: the decoder maps absent and null onto the same "" as an explicit empty cell.
	k := uuid.Must(uuid.NewV7()).String()
	e.expect(answer(withKey(k, nil), missing), 428, "urn:mc:precondition-required")
	e.expect(answer(key(), null), 428, "urn:mc:precondition-required")
	e.expect(answer(key(), `{"versionId":"`+version+`","questionId":"`+qid+`","expectedAnswerId":42,"questionRevision":1,"state":"ABSENT"}`), 400, "urn:mc:malformed-body")

	// Nothing was written: the cell is still pending, and the refused key was not consumed.
	view := e.do("GET", g, "t-carol", nil, "")
	e.expect(view, 200, "")
	cells := view.json()["cells"].([]any)
	if len(cells) != 1 || cells[0].(map[string]any)["state"] != "PENDING" {
		t.Fatalf("refused expectation-less answers must write nothing: %s", view.Body)
	}
	empty := `{"versionId":"` + version + `","questionId":"` + qid + `","expectedAnswerId":"","questionRevision":1,"state":"ABSENT"}`
	e.expect(answer(withKey(k, nil), empty), 201, "")

	// Precedence is unchanged: an anonymous caller, a VIEWER and a known nonmember get their
	// standing answers with and without the expectation, never the missing-precondition reply.
	e.expect(e.do("POST", g+"/answers", "", key(), missing), 401, "urn:mc:unauthenticated")
	e.expect(e.do("POST", g+"/answers", "t-carol", key(), missing), 403, "urn:mc:forbidden")
	e.expect(e.do("POST", g+"/answers", "t-ghost", key(), missing), 403, "")
	e.expect(e.do("POST", g+"/answers", "t-carol", key(), empty), 403, "urn:mc:forbidden")
}

// F03 (RMV): the bounded page stays 100, but the envelope never claims false completeness and
// older answers are reachable through the documented cursor continuation.
func TestReviewGrid_HTTPHistoryPagination(t *testing.T) {
	e := newEnv(t)
	base, version, gridID, tag := reviewFixture(t, e)
	g := base + "/review-grids/" + gridID
	q := e.do("POST", g+"/questions", "t-bob", ifMatch(tag), `{"text":"Q?"}`)
	e.expect(q, 200, "")
	qid := q.json()["questions"].([]any)[0].(map[string]any)["id"].(string)
	e.expect(e.do("POST", g+"/versions", "t-bob", ifMatch(q.Header().Get("ETag")), `{"versionId":"`+version+`"}`), 200, "")
	h := g + "/cells/" + version + "/" + qid + "/history"

	// empty: an honest empty page, no invented total
	empty := e.do("GET", h, "t-carol", nil, "")
	e.expect(empty, 200, "")
	if page := empty.json()["page"].(map[string]any); page["total"] != nil || page["nextCursor"] != nil {
		t.Fatalf("empty history must claim nothing: %v", page)
	}

	// one answer: still no cursor
	first := `{"versionId":"` + version + `","questionId":"` + qid + `","expectedAnswerId":"","questionRevision":1,"state":"REVIEWED","text":"Answer 0"}`
	r := e.do("POST", g+"/answers", "t-bob", key(), first)
	e.expect(r, 201, "")
	single := e.do("GET", h+"?limit=1", "t-carol", nil, "")
	e.expect(single, 200, "")
	if page := single.json()["page"].(map[string]any); page["nextCursor"] != nil {
		t.Fatalf("a full page must not continue: %v", page)
	}

	// 101 answers: page one is bounded at 100 with a truthful continuation, page two reaches
	// the original answer.
	expected := r.json()["id"].(string)
	ids := map[string]bool{}
	for i := 1; i <= 100; i++ {
		body := fmt.Sprintf(`{"versionId":"%s","questionId":"%s","expectedAnswerId":"%s","questionRevision":1,"state":"REVIEWED","text":"Answer %d"}`, version, qid, expected, i)
		res := e.do("POST", g+"/answers", "t-bob", key(), body)
		e.expect(res, 201, "")
		id := res.json()["id"].(string)
		ids[id] = true
		expected = id
	}
	p1 := e.do("GET", h, "t-carol", nil, "")
	e.expect(p1, 200, "")
	j := p1.json()
	items := j["items"].([]any)
	page := j["page"].(map[string]any)
	if len(items) != 100 || page["total"] != nil || page["nextCursor"] == nil {
		t.Fatalf("page one must be bounded and truthful: %d items, %v", len(items), page)
	}
	if items[0].(map[string]any)["text"] != "Answer 100" {
		t.Fatalf("newest first: %s", items[0].(map[string]any)["text"])
	}
	cursor := page["nextCursor"].(string)
	p2 := e.do("GET", h+"?cursor="+cursor+"&limit=100", "t-carol", nil, "")
	e.expect(p2, 200, "")
	j2 := p2.json()
	items2 := j2["items"].([]any)
	if len(items2) != 1 || items2[0].(map[string]any)["text"] != "Answer 0" || j2["page"].(map[string]any)["nextCursor"] != nil {
		t.Fatalf("the original answer must be reachable: %s", p2.Body)
	}

	// a smaller limit walks the same trail without duplicates or gaps
	seen := map[string]bool{}
	u := h + "?limit=7"
	pages := 0
	for u != "" {
		res := e.do("GET", u, "t-carol", nil, "")
		e.expect(res, 200, "")
		for _, it := range res.json()["items"].([]any) {
			id := it.(map[string]any)["id"].(string)
			if seen[id] {
				t.Fatalf("duplicated answer across pages: %s", id)
			}
			seen[id] = true
		}
		if next := res.json()["page"].(map[string]any)["nextCursor"]; next != nil {
			u = h + "?limit=7&cursor=" + next.(string)
		} else {
			u = ""
		}
		pages++
		if pages > 20 {
			t.Fatal("continuation did not end")
		}
	}
	if len(seen) != 101 {
		t.Fatalf("traversal saw %d of 101 answers", len(seen))
	}

	// untrusted cursors and limits
	e.expect(e.do("GET", h+"?cursor=!!not-base64!!", "t-carol", nil, ""), 400, "")
	e.expect(e.do("GET", h+"?cursor="+base64.RawURLEncoding.EncodeToString([]byte(`{"at":"not-a-time","id":"x"}`)), "t-carol", nil, ""), 400, "")
	e.expect(e.do("GET", h+"?cursor="+base64.RawURLEncoding.EncodeToString([]byte(`{"at":"2026-10-29T08:00:00Z","id":"01a17c8f-15d0-7386-8133-c1625313f6d1","extra":true}`)), "t-carol", nil, ""), 200, "")
	e.expect(e.do("GET", h+"?cursor="+base64.RawURLEncoding.EncodeToString(make([]byte, 9000)), "t-carol", nil, ""), 400, "")
	e.expect(e.do("GET", h+"?limit=0", "t-carol", nil, ""), 400, "")
	e.expect(e.do("GET", h+"?limit=-1", "t-carol", nil, ""), 400, "")
	e.expect(e.do("GET", h+"?limit=101", "t-carol", nil, ""), 400, "")
	// a viewer reads every page; a known nonmember is denied like any other read
	e.expect(e.do("GET", h+"?limit=1", "t-carol", nil, ""), 200, "")
	e.expect(e.do("GET", h+"?limit=1", "t-ghost", nil, ""), 403, "")
}

func TestReviewGrid_HTTPFlow(t *testing.T) {
	e := newEnv(t)
	base, version, gridID, tag := reviewFixture(t, e)
	g := base + "/review-grids/" + gridID

	// boundary and authorization
	e.expect(e.do("GET", g, "", nil, ""), 401, "urn:mc:unauthenticated")
	e.expect(e.do("POST", base+"/review-grids", "t-carol", key(), `{"name":"x"}`), 403, "urn:mc:forbidden")
	e.expect(e.do("POST", base+"/review-grids", "t-bob", nil, `{"name":"x"}`), 400, "")
	e.expect(e.do("POST", base+"/review-grids", "t-bob", key(), `{"name":"x","extra":1}`), 400, "urn:mc:malformed-body")
	e.expect(e.do("POST", base+"/review-grids", "t-bob", withKey(uuid.NewString(), ifMatch(tag)), `{"name":"x"}`), 400, "urn:mc:precondition-not-applicable")
	e.expect(e.do("GET", g, "t-ghost", nil, ""), 403, "")

	// structure needs the grid ETag
	e.expect(e.do("POST", g+"/questions", "t-bob", nil, `{"text":"Is there a change-of-control clause?"}`), 428, "urn:mc:precondition-required")
	e.expect(e.do("POST", g+"/questions", "t-bob", ifMatch(`"`+uuid.NewString()+`"`), `{"text":"Q?"}`), 412, "urn:mc:precondition-failed")
	e.expect(e.do("POST", g+"/questions", "t-carol", ifMatch(tag), `{"text":"Q?"}`), 403, "urn:mc:forbidden")
	q := e.do("POST", g+"/questions", "t-bob", ifMatch(tag), `{"text":"Is there a change-of-control clause?"}`)
	e.expect(q, 200, "")
	tag2 := q.Header().Get("ETag")
	if tag2 == "" || tag2 == tag || q.Header().Get("MC-Source-Revision") == "" {
		t.Fatalf("a structure change yields a new tag and states its boundary: %v", q.Header())
	}
	e.expect(e.do("POST", g+"/versions", "t-bob", ifMatch(tag), `{"versionId":"`+version+`"}`), 412, "urn:mc:precondition-failed") // stale tag
	v := e.do("POST", g+"/versions", "t-bob", ifMatch(tag2), `{"versionId":"`+version+`"}`)
	e.expect(v, 200, "")
	vj := v.json()
	vers, qs, cells := vj["versions"].([]any), vj["questions"].([]any), vj["cells"].([]any)
	if len(vers) != 1 || len(qs) != 1 || len(cells) != 1 || vers[0].(map[string]any)["documentName"] != "SPA" || cells[0].(map[string]any)["state"] != "PENDING" {
		t.Fatalf("view: %s", v.Body)
	}
	questionID := qs[0].(map[string]any)["id"].(string)

	// unknown and duplicate versions
	tag3 := v.Header().Get("ETag")
	e.expect(e.do("POST", g+"/versions", "t-bob", ifMatch(tag3), `{"versionId":"`+uuid.NewString()+`"}`), 409, "urn:mc:rejected")
	e.expect(e.do("POST", g+"/versions", "t-bob", ifMatch(tag3), `{"versionId":"`+version+`"}`), 409, "urn:mc:rejected")

	// answers: receipted, CAS on the expected answer id, replay is byte-stable
	body := `{"versionId":"` + version + `","questionId":"` + questionID + `","expectedAnswerId":"","questionRevision":1,"state":"REVIEWED","text":"Clause 12.3","pageRef":"14","quoteRef":"on a change of control"}`
	k := uuid.Must(uuid.NewV7()).String()
	first := e.do("POST", g+"/answers", "t-bob", withKey(k, nil), body)
	e.expect(first, 201, "")
	replay := e.do("POST", g+"/answers", "t-bob", withKey(k, nil), body)
	if replay.Header().Get("Idempotent-Replayed") != "true" || replay.Body.String() != first.Body.String() {
		t.Fatalf("replay must be byte-stable: %s vs %s", replay.Body, first.Body)
	}
	e.expect(e.do("POST", g+"/answers", "t-carol", key(), body), 403, "urn:mc:forbidden")
	e.expect(e.do("POST", g+"/answers", "t-bob", key(), strings.Replace(body, `"questionRevision":1,`, "", 1)), 428, "urn:mc:precondition-required")
	e.expect(e.do("POST", g+"/answers", "t-bob", key(), strings.Replace(body, `"questionRevision":1`, `"questionRevision":9`, 1)), 412, "urn:mc:precondition-failed")
	e.expect(e.do("POST", g+"/answers", "t-bob", key(), body), 412, "urn:mc:precondition-failed") // expects "none", one exists
	answerID := first.json()["id"].(string)
	next := strings.Replace(body, `"expectedAnswerId":""`, `"expectedAnswerId":"`+answerID+`"`, 1)
	e.expect(e.do("POST", g+"/answers", "t-bob", key(), strings.Replace(next, `"state":"REVIEWED"`, `"state":"OCR_ERROR"`, 1)), 422, "urn:mc:validation")
	next = strings.Replace(next, `"state":"REVIEWED"`, `"state":"ABSENT"`, 1)
	e.expect(e.do("POST", g+"/answers", "t-bob", key(), next), 201, "")

	// view and history
	view := e.do("GET", g, "t-carol", nil, "")
	e.expect(view, 200, "")
	cell := view.json()["cells"].([]any)[0].(map[string]any)
	if cell["state"] != "ABSENT" || cell["stale"] != false || cell["answer"].(map[string]any)["supersedesId"] != answerID {
		t.Fatalf("cell: %v", cell)
	}
	h := g + "/cells/" + version + "/" + questionID + "/history"
	hist := e.do("GET", h, "t-carol", nil, "")
	e.expect(hist, 200, "")
	if items := hist.json()["items"].([]any); len(items) != 2 || items[0].(map[string]any)["state"] != "ABSENT" {
		t.Fatalf("history: %s", hist.Body)
	}
	e.expect(e.do("GET", h+"?limit=1", "t-carol", nil, ""), 200, "")
	e.expect(e.do("GET", h+"?limit=101", "t-carol", nil, ""), 400, "")
	e.expect(e.do("GET", h+"?limit=0", "t-carol", nil, ""), 400, "")

	// revising the question stales the answer; the old wording stays readable
	rev := e.do("POST", g+"/questions/"+questionID+"/revision", "t-bob", ifMatch(view.Header().Get("ETag")), `{"text":"Is there a termination right on change of control?"}`)
	e.expect(rev, 200, "")
	rj := rev.json()
	if rj["cells"].([]any)[0].(map[string]any)["stale"] != true || len(rj["questionHistory"].([]any)) != 2 {
		t.Fatalf("after revision: %s", rev.Body)
	}

	// removing the row keeps the answers readable through history
	rem := e.do("POST", g+"/versions/"+version+"/removal", "t-bob", ifMatch(rev.Header().Get("ETag")), "")
	e.expect(rem, 200, "")
	if len(rem.json()["cells"].([]any)) != 0 {
		t.Fatalf("row still shown: %s", rem.Body)
	}
	e.expect(e.do("GET", h, "t-carol", nil, ""), 200, "")

	// list
	lst := e.do("GET", base+"/review-grids", "t-carol", nil, "")
	e.expect(lst, 200, "")
	if items := lst.json()["items"].([]any); len(items) != 1 || items[0].(map[string]any)["questionCount"] != float64(1) {
		t.Fatalf("list: %s", lst.Body)
	}
}

func TestReviewGrid_HTTPCrossMatterVersionLooksMissing(t *testing.T) {
	e := newEnv(t)
	base, _, gridID, tag := reviewFixture(t, e)
	// A version of a different matter, and a random id, give the same answer.
	m2, _ := proofFixture(t, e)
	d := e.do("POST", "/api/v1/matters/"+m2+"/documents", "t-alice", key(), `{"name":"Other"}`)
	e.expect(d, 201, "")
	up := e.do("POST", "/api/v1/matters/"+m2+"/documents/"+d.json()["id"].(string)+"/versions", "t-alice",
		map[string]string{"Idempotency-Key": uuid.Must(uuid.NewV7()).String(), "Content-Type": "application/pdf", "X-Filename": "o.pdf"}, "other")
	e.expect(up, 201, "")
	foreign := up.json()["id"].(string)
	g := base + "/review-grids/" + gridID
	cross := e.do("POST", g+"/versions", "t-bob", ifMatch(tag), `{"versionId":"`+foreign+`"}`)
	missing := e.do("POST", g+"/versions", "t-bob", ifMatch(tag), `{"versionId":"`+uuid.NewString()+`"}`)
	e.expect(cross, http.StatusConflict, "urn:mc:rejected")
	e.expect(missing, http.StatusConflict, "urn:mc:rejected")
	if cross.Body.String() != missing.Body.String() {
		t.Fatalf("cross-matter and missing must be byte-identical:\n%s\n%s", cross.Body, missing.Body)
	}
	// And another matter's grid id is simply not found.
	e.expect(e.do("GET", "/api/v1/matters/"+m2+"/review-grids/"+gridID, "t-alice", nil, ""), 404, "")
}
