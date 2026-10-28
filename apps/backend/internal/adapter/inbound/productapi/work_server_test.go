package productapi

import (
	"net/url"
	"testing"
	"time"

	"github.com/google/uuid"
)

// workFixture builds workspace -> matter with alice as OWNER over HTTP and returns ids.
func workFixture(t *testing.T, e *env) (matterID string) {
	t.Helper()
	ws := e.do("POST", "/api/v1/workspaces", "t-alice", key(), `{"name":"Acme"}`)
	wsID, tag := ws.json()["id"].(string), ws.Header().Get("ETag")
	m := e.do("POST", "/api/v1/workspaces/"+wsID+"/matters", "t-alice", withKey(uuid.Must(uuid.NewV7()).String(), map[string]string{"If-Match": tag}), `{"title":"Atlas"}`)
	e.expect(m, 201, "")
	return m.json()["id"].(string)
}

func (e *env) newAction(matterID, title string) (id, etag string) {
	e.t.Helper()
	r := e.do("POST", "/api/v1/matters/"+matterID+"/actions", "t-alice", key(), `{"title":"`+title+`","outcome":"done"}`)
	e.expect(r, 201, "")
	return r.json()["item"].(map[string]any)["id"].(string), r.Header().Get("ETag")
}

func (e *env) etagOfItem(matterID, id string) string {
	return e.do("GET", "/api/v1/matters/"+matterID+"/work-items/"+id, "t-alice", nil, "").Header().Get("ETag")
}

func TestWorkItems_CreateReadPatchAndExecution(t *testing.T) {
	e := newEnv(t)
	m := workFixture(t, e)
	base := "/api/v1/matters/" + m + "/work-items/"

	// Action creation is receipted: replay is byte-stable and flagged; different body = key reuse.
	k := uuid.Must(uuid.NewV7()).String()
	first := e.do("POST", "/api/v1/matters/"+m+"/actions", "t-alice", withKey(k, nil), `{"title":"Draft SPA","outcome":"First draft"}`)
	e.expect(first, 201, "")
	replay := e.do("POST", "/api/v1/matters/"+m+"/actions", "t-alice", withKey(k, nil), `{"title":"Draft SPA","outcome":"First draft"}`)
	if replay.Header().Get("Idempotent-Replayed") != "true" || replay.Body.String() != first.Body.String() {
		t.Fatalf("replay must be byte-stable: %s vs %s", replay.Body, first.Body)
	}
	e.expect(e.do("POST", "/api/v1/matters/"+m+"/actions", "t-alice", withKey(k, nil), `{"title":"Other","outcome":"x"}`), 422, "urn:mc:idempotency-key-reuse")
	e.expect(e.do("POST", "/api/v1/matters/"+m+"/actions", "t-bob", key(), `{"title":"x","outcome":"y"}`), 404, "urn:mc:not-found")
	e.expect(e.do("POST", "/api/v1/matters/"+m+"/actions", "t-alice", key(), `{"title":"x","outcome":"y","execution":"COMPLETED"}`), 400, "urn:mc:malformed-body")

	item := first.json()["item"].(map[string]any)
	id := item["id"].(string)
	if item["kind"] != "ACTION" || item["execution"] != "NOT_STARTED" || item["dependency"] != "READY" || item["ownerId"] != nil || item["dueAt"] != nil || item["verification"] != nil {
		t.Fatalf("initial action state: %v", item)
	}
	if d := first.json()["derived"].(map[string]any); d["timing"] != "ON_TRACK" || d["noDueDate"] != true || d["attention"] != "NORMAL" {
		t.Fatalf("derived: %v", d)
	}
	tag := first.Header().Get("ETag")
	if tag == "" || e.etagOfItem(m, id) != tag || first.json()["etag"] != tag {
		t.Fatal("the creation ETag equals the read ETag and the body's etag member")
	}
	lst := e.do("GET", "/api/v1/matters/"+m+"/work-items", "t-alice", nil, "")
	if lst.json()["items"].([]any)[0].(map[string]any)["etag"] != tag {
		t.Fatalf("a list row carries the etag to send as If-Match: %s", lst.Body)
	}

	// PATCH: absent If-Match -> 428, stale -> 412, derived members cannot be sent (unknown field).
	e.expect(e.do("PATCH", base+id, "t-alice", nil, `{"title":"x"}`), 428, "urn:mc:precondition-required")
	e.expect(e.do("PATCH", base+id, "t-alice", map[string]string{"If-Match": `"` + uuid.NewString() + `"`}, `{"title":"x"}`), 412, "urn:mc:precondition-failed")
	e.expect(e.do("PATCH", base+id, "t-alice", map[string]string{"If-Match": tag}, `{"dependency":"READY"}`), 400, "urn:mc:malformed-body")
	e.expect(e.do("PATCH", base+id, "t-alice", map[string]string{"If-Match": tag}, `{"dueAt":"2026-06-15"}`), 422, "urn:mc:validation")
	e.expect(e.do("PATCH", base+id, "t-alice", map[string]string{"If-Match": tag}, `{"ownerId":"`+e.bob+`"}`), 409, "urn:mc:rejected") // bob is not a member of the matter
	patched := e.do("PATCH", base+id, "t-alice", map[string]string{"If-Match": tag}, `{"title":" Draft SPA v2 ","ownerId":"`+e.alice+`","dueAt":"2026-06-15T09:00:00+07:00"}`)
	e.expect(patched, 200, "")
	pi := patched.json()["item"].(map[string]any)
	if pi["title"] != "Draft SPA v2" || pi["ownerId"] != e.alice || pi["dueAt"] != "2026-06-15T02:00:00Z" || pi["revision"].(float64) != 2 {
		t.Fatalf("patched: %v", pi)
	}
	if patched.Header().Get("ETag") == tag {
		t.Fatal("a new revision has a new ETag")
	}
	e.expect(e.do("PATCH", base+id, "t-alice", map[string]string{"If-Match": tag}, `{"title":"stale"}`), 412, "urn:mc:precondition-failed")

	// The ETag survives the clock: derived members move with time but never invalidate If-Match.
	tag2 := patched.Header().Get("ETag")
	if e.etagOfItem(m, id) != tag2 {
		t.Fatal("the ETag covers only the revision-determined item")
	}

	// Execution transitions: WAITING without a party is a rejection with a stable code.
	exec := func(ifMatch, body string) resp {
		return e.do("POST", base+id+"/execution", "t-alice", map[string]string{"If-Match": ifMatch}, body)
	}
	rej := exec(tag2, `{"to":"WAITING","waitingCondition":"signed draft"}`)
	e.expect(rej, 409, "urn:mc:rejected")
	if rej.json()["code"] != "waiting-details-required" {
		t.Fatalf("rejection code: %v", rej.json())
	}
	started := exec(tag2, `{"to":"IN_PROGRESS"}`)
	e.expect(started, 200, "")
	if started.json()["item"].(map[string]any)["execution"] != "IN_PROGRESS" {
		t.Fatalf("started: %s", started.Body)
	}
	bad := exec(started.Header().Get("ETag"), `{"to":"NOT_STARTED"}`)
	e.expect(bad, 409, "urn:mc:rejected")
	if bad.json()["code"] != "transition-not-allowed" || len(bad.json()["alternatives"].([]any)) == 0 {
		t.Fatalf("unlisted transitions report the allowed alternatives: %s", bad.Body)
	}
	e.expect(exec(started.Header().Get("ETag"), `{"to":"CANCELLED","reason":"scope"}`), 200, "") // alice is OWNER
	e.expect(e.do("POST", base+id+"/execution", "t-bob", map[string]string{"If-Match": tag2}, `{"to":"COMPLETED"}`), 404, "urn:mc:not-found")
}

func TestWorkItems_DependenciesGridAndMyActions(t *testing.T) {
	e := newEnv(t)
	m := workFixture(t, e)
	base := "/api/v1/matters/" + m + "/work-items/"
	a, _ := e.newAction(m, "Upstream")
	b, _ := e.newAction(m, "Downstream")
	c, _ := e.newAction(m, "Third")

	dep := func(target, source, gate, reason string) resp {
		return e.do("POST", base+target+"/dependencies", "t-alice", map[string]string{"If-Match": e.etagOfItem(m, target)},
			`{"sourceId":"`+source+`","gate":"`+gate+`","reason":"`+reason+`"}`)
	}
	added := dep(b, a, "COMPLETION", "a first")
	e.expect(added, 200, "")
	body := added.json()
	if body["item"].(map[string]any)["dependency"] != "BLOCKED" || len(body["upstream"].([]any)) != 1 {
		t.Fatalf("the target is BLOCKED by the new gate: %s", added.Body)
	}
	up := body["upstream"].([]any)[0].(map[string]any)
	if up["gate"] != "COMPLETION" || up["satisfied"] != false || up["reason"] != "NOT_COMPLETED" || up["other"].(map[string]any)["id"] != a {
		t.Fatalf("edge view: %v", up)
	}
	edgeID := up["id"].(string)

	e.expect(dep(b, a, "COMPLETION", ""), 409, "urn:mc:rejected") // reason required
	cyc := dep(a, b, "COMPLETION", "back edge")
	e.expect(cyc, 409, "urn:mc:rejected")
	if cyc.json()["code"] != "cycle" || len(cyc.json()["path"].([]any)) != 2 {
		t.Fatalf("a refused cycle is explained by its path: %s", cyc.Body)
	}
	dup := dep(b, a, "PROOF", "again")
	if dup.json()["code"] != "duplicate-edge" {
		t.Fatalf("%s", dup.Body)
	}
	if self := dep(a, a, "COMPLETION", "x"); self.json()["code"] != "self-edge" {
		t.Fatalf("%s", self.Body)
	}

	// Completing the blocked target is rejected with the failed gate in the body.
	blocked := e.do("POST", base+b+"/execution", "t-alice", map[string]string{"If-Match": e.etagOfItem(m, b)}, `{"to":"COMPLETED","reason":"x","completedAt":"`+time.Now().Add(-time.Hour).UTC().Format(time.RFC3339)+`"}`)
	e.expect(blocked, 409, "urn:mc:rejected")
	gates := blocked.json()["gates"].([]any)
	if blocked.json()["code"] != "dependency-blocked" || len(gates) != 1 || gates[0].(map[string]any)["sourceId"] != a || gates[0].(map[string]any)["gate"] != "COMPLETION" {
		t.Fatalf("rejection names the gate: %s", blocked.Body)
	}

	// Grid: kind/dependency filters, text search, sort, paging with an opaque cursor.
	list := func(q url.Values) resp {
		return e.do("GET", "/api/v1/matters/"+m+"/work-items?"+q.Encode(), "t-alice", nil, "")
	}
	r := list(url.Values{"dependency": {"BLOCKED"}})
	e.expect(r, 200, "")
	if items := r.json()["items"].([]any); len(items) != 1 || items[0].(map[string]any)["item"].(map[string]any)["id"] != b {
		t.Fatalf("blocked filter: %s", r.Body)
	}
	if r.Header().Get("MC-As-Of") == "" || r.json()["page"].(map[string]any)["total"].(float64) != 1 {
		t.Fatalf("snapshot instant and total: %v", r.Header())
	}
	r = list(url.Values{"q": {"third"}})
	if items := r.json()["items"].([]any); len(items) != 1 || items[0].(map[string]any)["item"].(map[string]any)["id"] != c {
		t.Fatalf("text: %s", r.Body)
	}
	p1 := list(url.Values{"limit": {"2"}, "sort": {"title"}})
	cur := p1.json()["page"].(map[string]any)["nextCursor"]
	if cur == nil || len(p1.json()["items"].([]any)) != 2 {
		t.Fatalf("page 1: %s", p1.Body)
	}
	p2 := list(url.Values{"limit": {"2"}, "sort": {"title"}, "cursor": {cur.(string)}})
	if len(p2.json()["items"].([]any)) != 1 || p2.json()["page"].(map[string]any)["nextCursor"] != nil {
		t.Fatalf("page 2: %s", p2.Body)
	}
	e.expect(list(url.Values{"cursor": {"%%"}}), 400, "urn:mc:bad-request")
	e.expect(e.do("GET", "/api/v1/matters/"+m+"/work-items", "t-bob", nil, ""), 404, "urn:mc:not-found")

	// Removal needs a reason and recomputes the target.
	rm := func(reason string) resp {
		return e.do("POST", base+b+"/dependencies/"+edgeID+"/removal", "t-alice", map[string]string{"If-Match": e.etagOfItem(m, b)}, `{"reason":"`+reason+`"}`)
	}
	e.expect(rm(""), 409, "urn:mc:rejected")
	gone := rm("scope reduced")
	e.expect(gone, 200, "")
	if gone.json()["item"].(map[string]any)["dependency"] != "READY" || len(gone.json()["upstream"].([]any)) != 0 {
		t.Fatalf("removal: %s", gone.Body)
	}

	// My Actions: only the caller's own assigned work; sections; no recommendation for the rest.
	e.expect(e.do("PATCH", base+a, "t-alice", map[string]string{"If-Match": e.etagOfItem(m, a)}, `{"ownerId":"`+e.alice+`"}`), 200, "")
	mine := e.do("GET", "/api/v1/me/actions", "t-alice", nil, "")
	e.expect(mine, 200, "")
	next := mine.json()["next"].([]any)
	if len(next) != 1 || next[0].(map[string]any)["item"].(map[string]any)["id"] != a || next[0].(map[string]any)["matterId"] != m || next[0].(map[string]any)["reason"] == "" {
		t.Fatalf("my actions: %s", mine.Body)
	}
	other := e.do("GET", "/api/v1/me/actions", "t-bob", nil, "")
	e.expect(other, 200, "")
	for _, k := range []string{"next", "waiting", "blocked", "historical"} {
		if n := len(other.json()[k].([]any)); n != 0 {
			t.Fatalf("bob has nothing assigned and nothing of alice's matter leaks (%s=%d)", k, n)
		}
	}
}

func TestMilestonesPartiesAndWorkstreams(t *testing.T) {
	e := newEnv(t)
	m := workFixture(t, e)
	base := "/api/v1/matters/" + m

	ms := e.do("POST", base+"/milestones", "t-alice", nil, `{"name":"Signing","dueAt":"2026-07-01T00:00:00+07:00"}`)
	e.expect(ms, 201, "")
	if ms.json()["status"].(map[string]any)["state"] != "UNASSESSED" {
		t.Fatalf("a milestone without prerequisites is unassessed: %s", ms.Body)
	}
	msID, msTag := ms.json()["milestone"].(map[string]any)["id"].(string), ms.Header().Get("ETag")
	e.expect(e.do("PUT", base+"/milestones/"+msID+"/prerequisites", "t-alice", nil, `{"prerequisites":[],"reason":"x"}`), 428, "urn:mc:precondition-required")
	set := e.do("PUT", base+"/milestones/"+msID+"/prerequisites", "t-alice", map[string]string{"If-Match": msTag}, `{"prerequisites":[],"critical":true,"reason":"gates closing"}`)
	e.expect(set, 200, "")
	if set.json()["milestone"].(map[string]any)["revision"].(float64) != 2 {
		t.Fatalf("%s", set.Body)
	}
	e.expect(e.do("PUT", base+"/milestones/"+msID+"/prerequisites", "t-alice", map[string]string{"If-Match": msTag}, `{"prerequisites":[],"reason":"stale"}`), 412, "urn:mc:precondition-failed")
	list := e.do("GET", base+"/milestones", "t-alice", nil, "")
	if items := list.json()["items"].([]any); len(items) != 1 || items[0].(map[string]any)["etag"] == nil {
		t.Fatalf("%s", list.Body)
	}

	p := e.do("POST", base+"/parties", "t-alice", nil, `{"name":"Authority","kind":"AUTHORITY","contact":"desk@authority.test"}`)
	e.expect(p, 201, "")
	pid, ptag := p.json()["id"].(string), p.Header().Get("ETag")
	if p.json()["etag"] != ptag {
		t.Fatal("the body carries the same etag as the header")
	}
	up := e.do("PATCH", base+"/parties/"+pid, "t-alice", map[string]string{"If-Match": ptag}, `{"contact":"registry@authority.test"}`)
	e.expect(up, 200, "")
	if up.json()["contact"] != "registry@authority.test" || up.json()["revision"].(float64) != 2 {
		t.Fatalf("%s", up.Body)
	}
	e.expect(e.do("PATCH", base+"/parties/"+pid, "t-alice", map[string]string{"If-Match": ptag}, `{"contact":"stale"}`), 412, "urn:mc:precondition-failed")
	e.expect(e.do("GET", base+"/parties", "t-bob", nil, ""), 404, "urn:mc:not-found")

	w := e.do("POST", base+"/workstreams", "t-alice", nil, `{"name":"Closing"}`)
	e.expect(w, 201, "")
	if wl := e.do("GET", base+"/workstreams", "t-alice", nil, ""); len(wl.json()["items"].([]any)) != 1 {
		t.Fatalf("%s", wl.Body)
	}
	if wo := e.do("GET", base+"/waiting-on", "t-alice", nil, ""); wo.Code != 200 || len(wo.json()["items"].([]any)) != 0 {
		t.Fatalf("an empty waiting-on is an empty list, not an error: %s", wo.Body)
	}
}
