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

// TestMyAgenda_WireFiltersAndCursor proves the /me/agenda wire: actor-only read, inclusive
// recorded-date window, deterministic order, keyset cursor and uniform denials.
func TestMyAgenda_WireFiltersAndCursor(t *testing.T) {
	e := newEnv(t)
	m := workFixture(t, e)
	base := "/api/v1/matters/" + m + "/"

	// Two dated actions and one milestone; one action stays undated.
	dated := func(title, due string) {
		r := e.do("POST", base+"actions", "t-alice", key(), `{"title":"`+title+`","outcome":"done"}`)
		e.expect(r, 201, "")
		id := r.json()["item"].(map[string]any)["id"].(string)
		tag := r.Header().Get("ETag")
		e.expect(e.do("PATCH", base+"work-items/"+id, "t-alice", map[string]string{"If-Match": tag}, `{"dueAt":"`+due+`"}`), 200, "")
	}
	dated("Overdue draft", "2026-06-15T02:00:00Z")
	dated("Soon draft", "2026-06-20T02:00:00Z")
	r := e.do("POST", base+"actions", "t-alice", key(), `{"title":"Undated draft","outcome":"done"}`)
	e.expect(r, 201, "")
	ms := e.do("POST", base+"milestones", "t-alice", nil, `{"name":"Closing","dueAt":"2026-07-01T00:00:00Z"}`)
	e.expect(ms, 201, "")

	all := e.do("GET", "/api/v1/me/agenda", "t-alice", nil, "")
	e.expect(all, 200, "")
	rows := all.json()["items"].([]any)
	if len(rows) != 3 {
		t.Fatalf("three dated rows, undated excluded: %s", all.Body)
	}
	first := rows[0].(map[string]any)
	if first["title"] != "Overdue draft" || first["kind"] != "work" || first["timing"] != "OVERDUE" || first["matterTitle"] != "Atlas" {
		t.Fatalf("first row: %v", first)
	}
	milestone := rows[2].(map[string]any)
	if milestone["kind"] != "milestone" || milestone["readiness"] != "UNASSESSED" || milestone["execution"] != "" || milestone["timing"] != "" {
		t.Fatalf("milestone row: %v", milestone)
	}
	if all.json()["page"].(map[string]any)["nextCursor"] != nil {
		t.Fatalf("a full page has no cursor: %s", all.Body)
	}

	// Window bounds: from/until are inclusive UTC dates on the recorded dueAt.
	windowed := e.do("GET", "/api/v1/me/agenda?from=2026-06-15&until=2026-06-15", "t-alice", nil, "")
	e.expect(windowed, 200, "")
	if rows := windowed.json()["items"].([]any); len(rows) != 1 || rows[0].(map[string]any)["title"] != "Overdue draft" {
		t.Fatalf("window keeps only that day: %s", windowed.Body)
	}
	e.expect(e.do("GET", "/api/v1/me/agenda?from=2026-06-21&until=2026-06-19", "t-alice", nil, ""), 400, "urn:mc:bad-request")
	e.expect(e.do("GET", "/api/v1/me/agenda?from=not-a-date", "t-alice", nil, ""), 400, "urn:mc:bad-request")
	e.expect(e.do("GET", "/api/v1/me/agenda?cursor=%00%00", "t-alice", nil, ""), 400, "urn:mc:bad-request")

	// A caller with no memberships gets their own (empty) agenda — a self-derived aggregate,
	// like /me/actions — and never anyone else's rows.
	foreign := e.do("GET", "/api/v1/me/agenda", "t-bob", nil, "")
	e.expect(foreign, 200, "")
	if rows := foreign.json()["items"].([]any); len(rows) != 0 {
		t.Fatalf("a foreign caller sees nothing: %s", foreign.Body)
	}
}

// TestSavedViews_PrivateLifecycle proves REQ-MC-P1-12 on the wire: a view is private to its
// owner, stores a validated filter shape, replays its creation, guards updates by CAS, and
// never leaks across actors.
func TestSavedViews_PrivateLifecycle(t *testing.T) {
	e := newEnv(t)
	m := workFixture(t, e)
	base := "/api/v1/matters/" + m + "/saved-views"

	body := `{"name":" My overdue ","filters":{"kind":"ACTION","timing":"OVERDUE","sort":"due","desc":"true"}}`
	k := uuid.Must(uuid.NewV7()).String()
	first := e.do("POST", base, "t-alice", withKey(k, nil), body)
	e.expect(first, 201, "")
	// Replay with the same key is byte-stable and flagged; a different body on that key is reuse.
	replay := e.do("POST", base, "t-alice", withKey(k, nil), body)
	if replay.Header().Get("Idempotent-Replayed") != "true" || replay.Body.String() != first.Body.String() {
		t.Fatalf("replay must be byte-stable: %s vs %s", replay.Body, first.Body)
	}
	e.expect(e.do("POST", base, "t-alice", withKey(k, nil), `{"name":"Other"}`), 422, "urn:mc:idempotency-key-reuse")

	// Unknown filter members are refused before anything is stored.
	e.expect(e.do("POST", base, "t-alice", key(), `{"name":"x","filters":{"deadline":"tomorrow"}}`), 400, "urn:mc:malformed-body")
	e.expect(e.do("POST", base, "t-alice", key(), `{"name":"x","filters":{"timing":"SOMEDAY"}}`), 422, "urn:mc:validation")
	e.expect(e.do("POST", base, "t-alice", key(), `{"name":"  "}`), 422, "urn:mc:validation")

	id := first.json()["id"].(string)
	tag := e.do("GET", base, "t-alice", nil, "")
	views := tag.json()["items"].([]any)
	if len(views) != 1 || views[0].(map[string]any)["name"] != "My overdue" {
		t.Fatalf("the name is stored trimmed and listed: %s", tag.Body)
	}
	etag := views[0].(map[string]any)["etag"].(string)

	// A duplicate name for the same owner+matter is a typed 409, never a storage error.
	e.expect(e.do("POST", base, "t-alice", key(), body), 409, "urn:mc:rejected")
	// Renaming into an existing own name is refused too.
	dup := e.do("POST", base, "t-alice", key(), `{"name":"Second","filters":{}}`)
	e.expect(dup, 201, "")
	dupID := dup.json()["id"].(string)
	dupTag := e.do("GET", base, "t-alice", nil, "")
	var dupEtag string
	for _, it := range dupTag.json()["items"].([]any) {
		if it.(map[string]any)["id"] == dupID {
			dupEtag = it.(map[string]any)["etag"].(string)
		}
	}
	e.expect(e.do("PATCH", base+"/"+dupID, "t-alice", map[string]string{"If-Match": dupEtag}, `{"name":"My overdue","filters":{}}`), 409, "urn:mc:rejected")

	// Another member of the same matter sees none of this and cannot change it through the id.
	e.expect(e.do("GET", base, "t-bob", nil, ""), 404, "urn:mc:not-found")

	renamed := e.do("PATCH", base+"/"+id, "t-alice", map[string]string{"If-Match": etag}, `{"name":"All overdue","filters":{}}`)
	e.expect(renamed, 200, "")
	if renamed.json()["name"] != "All overdue" || renamed.json()["revision"].(float64) != 2 {
		t.Fatalf("renamed: %s", renamed.Body)
	}
	e.expect(e.do("PATCH", base+"/"+id, "t-alice", map[string]string{"If-Match": etag}, `{"name":"Stale"}`), 412, "urn:mc:precondition-failed")
	e.expect(e.do("PATCH", base+"/"+id, "t-alice", nil, `{"name":"NoTag"}`), 428, "urn:mc:precondition-required")

	// bob gets no matter through the saved-views routes at all.
	e.expect(e.do("PATCH", base+"/"+id, "t-bob", map[string]string{"If-Match": `"x"`}, `{"name":"Steal"}`), 404, "urn:mc:not-found")

	newTag := renamed.json()["etag"].(string)
	e.expect(e.do("POST", base+"/"+id+"/removal", "t-alice", map[string]string{"If-Match": newTag}, ""), 200, "")
	// Only the second view (created for the duplicate-name probe) remains.
	if left := e.do("GET", base, "t-alice", nil, ""); len(left.json()["items"].([]any)) != 1 {
		t.Fatalf("only the second view remains: %s", left.Body)
	}
}

// TestPlaybooks_PublishPreviewApply proves the RLF-05 flow on the wire: workspace OWNER publishes
// an immutable revision, matter OWNER previews and applies it atomically and idempotently, and
// provenance stays readable without completing anything.
func TestPlaybooks_PublishPreviewApply(t *testing.T) {
	e := newEnv(t)
	ws := e.do("POST", "/api/v1/workspaces", "t-alice", key(), `{"name":"Acme"}`)
	e.expect(ws, 201, "")
	wsID, wsTag := ws.json()["id"].(string), ws.Header().Get("ETag")
	mm := e.do("POST", "/api/v1/workspaces/"+wsID+"/matters", "t-alice", withKey(uuid.Must(uuid.NewV7()).String(), map[string]string{"If-Match": wsTag}), `{"title":"Atlas"}`)
	e.expect(mm, 201, "")
	m := mm.json()["id"].(string)

	// The matter creation advanced the workspace revision; re-read before the next CAS write.
	wsTag = e.do("GET", "/api/v1/workspaces/"+wsID, "t-alice", nil, "").Header().Get("ETag")
	// Only the workspace OWNER publishes.
	e.expect(e.do("POST", "/api/v1/workspaces/"+wsID+"/playbooks", "t-bob", key(), `{"name":"Onboarding"}`), 404, "urn:mc:not-found")
	pb := e.do("POST", "/api/v1/workspaces/"+wsID+"/playbooks", "t-alice", withKey(uuid.Must(uuid.NewV7()).String(), map[string]string{"If-Match": wsTag}), `{"name":"Onboarding"}`)
	e.expect(pb, 201, "")
	pbID := pb.json()["id"].(string)

	// Entries are validated before anything is written: cycle, unknown reference, empty.
	cycle := `[{"key":"a","kind":"REQUIREMENT","title":"A","dependsOn":["b"]},{"key":"b","kind":"ACTION","title":"B","dependsOn":["a"]}]`
	e.expect(e.do("POST", "/api/v1/workspaces/"+wsID+"/playbooks/"+pbID+"/revisions", "t-alice", withKey(uuid.Must(uuid.NewV7()).String(), map[string]string{"If-Match": wsTag}), `{"entries":`+cycle+`}`), 422, "urn:mc:validation")
	e.expect(e.do("POST", "/api/v1/workspaces/"+wsID+"/playbooks/"+pbID+"/revisions", "t-alice", withKey(uuid.Must(uuid.NewV7()).String(), map[string]string{"If-Match": wsTag}), `{"entries":[{"key":"a","kind":"REQUIREMENT","title":"A","dependsOn":["ghost"]}]}`), 422, "urn:mc:validation")
	entries := `[{"key":"collect","kind":"REQUIREMENT","title":"Collect documents","outcome":"Complete set"},{"key":"file","kind":"ACTION","title":"File the form","outcome":"Filed and acknowledged","ownerKey":"collect","dependsOn":["collect"],"dueDaysOffset":7}]`
	pub := e.do("POST", "/api/v1/workspaces/"+wsID+"/playbooks/"+pbID+"/revisions", "t-alice", withKey(uuid.Must(uuid.NewV7()).String(), map[string]string{"If-Match": wsTag}), `{"entries":`+entries+`}`)
	e.expect(pub, 201, "")
	revID := pub.json()["id"].(string)
	// A second publish appends; the first revision is immutable.
	pub2 := e.do("POST", "/api/v1/workspaces/"+wsID+"/playbooks/"+pbID+"/revisions", "t-alice", withKey(uuid.Must(uuid.NewV7()).String(), map[string]string{"If-Match": wsTag}), `{"entries":[{"key":"only","kind":"ACTION","title":"Single","outcome":"Done"}]}`)
	e.expect(pub2, 201, "")
	got := e.do("GET", "/api/v1/workspaces/"+wsID+"/playbooks/"+pbID, "t-alice", nil, "")
	e.expect(got, 200, "")
	if revs := got.json()["revisions"].([]any); len(revs) != 2 || revs[0].(map[string]any)["id"] != revID {
		t.Fatalf("revisions append in order: %s", got.Body)
	}

	// Preview: needs an owner mapping for the entry that declares ownerKey.
	prev := e.do("GET", "/api/v1/matters/"+m+"/playbook-applications/preview?revision="+revID, "t-alice", nil, "")
	e.expect(prev, 200, "")
	if keys := prev.json()["ownerKeys"].(map[string]any); len(keys) != 1 || keys["file"] == nil {
		t.Fatalf("the preview names the entries that need an owner: %s", prev.Body)
	}
	// A revision of another playbook id does not exist here: unknown revision is the uniform 404.
	e.expect(e.do("GET", "/api/v1/matters/"+m+"/playbook-applications/preview?revision="+uuid.Must(uuid.NewV7()).String(), "t-alice", nil, ""), 404, "urn:mc:not-found")

	// Apply: receipted and atomic. The owner mapping names an explicit person; alice is OWNER.
	applyKey := uuid.Must(uuid.NewV7()).String()
	applied := e.do("POST", "/api/v1/matters/"+m+"/playbook-applications", "t-alice", withKey(applyKey, nil), `{"revisionId":"`+revID+`","ownerMap":{"file":"`+e.alice+`"}}`)
	e.expect(applied, 201, "")
	replay := e.do("POST", "/api/v1/matters/"+m+"/playbook-applications", "t-alice", withKey(applyKey, nil), `{"revisionId":"`+revID+`","ownerMap":{"file":"`+e.alice+`"}}`)
	e.expect(replay, 201, "")
	if replay.Header().Get("Idempotent-Replayed") != "true" {
		t.Fatalf("apply replay is flagged: %s", replay.Body)
	}
	// The same revision under a different key is refused: no double instantiation.
	e.expect(e.do("POST", "/api/v1/matters/"+m+"/playbook-applications", "t-alice", key(), `{"revisionId":"`+revID+`","ownerMap":{"file":"`+e.alice+`"}}`), 409, "urn:mc:rejected")
	// A revision whose entries declare owners cannot be applied without the mapping; on a
	// second matter the owner-mapping refusal comes before anything is written.
	m2 := e.do("POST", "/api/v1/workspaces/"+wsID+"/matters", "t-alice", withKey(uuid.Must(uuid.NewV7()).String(), map[string]string{"If-Match": e.do("GET", "/api/v1/workspaces/"+wsID, "t-alice", nil, "").Header().Get("ETag")}), `{"title":"Borealis"}`)
	e.expect(m2, 201, "")
	e.expect(e.do("POST", "/api/v1/matters/"+m2.json()["id"].(string)+"/playbook-applications", "t-alice", key(), `{"revisionId":"`+revID+`"}`), 409, "urn:mc:rejected")

	// The created work exists with provenance; the dependency edge satisfies the gate chain.
	grid := e.do("GET", "/api/v1/matters/"+m+"/work-items", "t-alice", nil, "")
	items := grid.json()["items"].([]any)
	if len(items) != 2 {
		t.Fatalf("two items were created: %s", grid.Body)
	}
	inst := e.do("GET", "/api/v1/matters/"+m+"/playbook-instances", "t-alice", nil, "")
	e.expect(inst, 200, "")
	if rows := inst.json()["items"].([]any); len(rows) != 2 {
		t.Fatalf("provenance names every created item: %s", inst.Body)
	}
}

// TestIntakeAndGuidance_Lifecycle proves RLF-06 and RLF-07 on the wire: intake records with
// their original request, decline with an accountable reason, receipted atomic conversion into
// real work; guidance drafts append, only the matter OWNER publishes, and publishing touches no
// legal state.
func TestIntakeAndGuidance_Lifecycle(t *testing.T) {
	e := newEnv(t)
	m := workFixture(t, e)
	base := "/api/v1/matters/" + m + "/"

	// ---- intake ----
	rec := e.do("POST", base+"intake", "t-alice", key(), `{"title":"Client asks about signing","requestText":"Please handle the counterparty signature request.","requester":"Dana (client)","receivedAt":"2026-06-01T00:00:00Z"}`)
	e.expect(rec, 201, "")
	intakeID := rec.json()["id"].(string)
	// The original request stays visible to any member.
	list := e.do("GET", base+"intake", "t-alice", nil, "")
	if rows := list.json()["items"].([]any); len(rows) != 1 || rows[0].(map[string]any)["status"] != "PENDING" {
		t.Fatalf("the recorded request is pending: %s", list.Body)
	}
	// Decline needs a reason and is CAS-guarded.
	r0 := e.do("GET", base+"intake/"+intakeID, "t-alice", nil, "")
	tag0 := r0.Header().Get("ETag")
	e.expect(e.do("POST", base+"intake/"+intakeID+"/decline", "t-alice", nil, `{"reason":"out of scope"}`), 428, "urn:mc:precondition-required")
	e.expect(e.do("POST", base+"intake/"+intakeID+"/decline", "t-alice", map[string]string{"If-Match": tag0}, `{}`), 422, "urn:mc:validation")

	// A fresh record converts into a real ACTION, receipted and replay-stable.
	rec2 := e.do("POST", base+"intake", "t-alice", key(), `{"title":"Signature request","requestText":"Handle it.","receivedAt":"2026-06-02T00:00:00Z"}`)
	e.expect(rec2, 201, "")
	id2 := rec2.json()["id"].(string)
	applyKey := uuid.Must(uuid.NewV7()).String()
	conv := e.do("POST", base+"intake/"+id2+"/conversion", "t-alice", withKey(applyKey, nil), `{"kind":"ACTION","title":"Handle counterparty signature","outcome":"Signature handled"}`)
	e.expect(conv, 200, "")
	itemID := conv.json()["itemId"].(string)
	if itemID == "" || conv.json()["status"] != "CONVERTED" {
		t.Fatalf("the record converted: %s", conv.Body)
	}
	replay := e.do("POST", base+"intake/"+id2+"/conversion", "t-alice", withKey(applyKey, nil), `{"kind":"ACTION","title":"Handle counterparty signature","outcome":"Signature handled"}`)
	if replay.Header().Get("Idempotent-Replayed") != "true" || replay.json()["itemId"] != itemID {
		t.Fatalf("conversion replay: %s", replay.Body)
	}
	// A second conversion of the same record is refused.
	e.expect(e.do("POST", base+"intake/"+id2+"/conversion", "t-alice", key(), `{"kind":"ACTION","title":"Again","outcome":"x"}`), 409, "urn:mc:rejected")
	// The created work is ordinary authorized work.
	e.expect(e.do("GET", base+"work-items/"+itemID, "t-alice", nil, ""), 200, "")

	// ---- guidance ----
	g := e.do("POST", base+"guidance", "t-alice", key(), `{"title":"Signing checklist","body":"Check the authority before signing.","sourceRefs":[]}`)
	e.expect(g, 201, "")
	docID := g.json()["id"].(string)
	draft2 := e.do("POST", base+"guidance/"+docID+"/revisions", "t-alice", key(), `{"body":"Updated checklist.","sourceRefs":[]}`)
	e.expect(draft2, 201, "")
	rev2 := draft2.json()["id"].(string)
	// Only the matter OWNER publishes.
	e.expect(e.do("POST", base+"guidance/"+docID+"/publication", "t-alice", key(), `{"revisionId":"`+rev2+`"}`), 200, "")
	// A published revision cannot be published again.
	e.expect(e.do("POST", base+"guidance/"+docID+"/publication", "t-alice", key(), `{"revisionId":"`+rev2+`"}`), 409, "urn:mc:rejected")
	gl := e.do("GET", base+"guidance", "t-alice", nil, "")
	if rows := gl.json()["items"].([]any); len(rows) != 1 || rows[0].(map[string]any)["revisions"].([]any)[1].(map[string]any)["status"] != "PUBLISHED" {
		t.Fatalf("the revision is published: %s", gl.Body)
	}
	// A foreign member of no matter sees nothing.
	e.expect(e.do("GET", base+"guidance", "t-bob", nil, ""), 404, "urn:mc:not-found")
}
