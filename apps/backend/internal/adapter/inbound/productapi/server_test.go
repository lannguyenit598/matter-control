package productapi

import (
	"context"
	"encoding/json"
	"io"
	"log/slog"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"
	"time"

	"github.com/google/uuid"

	"leonx.me/matter-control/internal/adapter/outbound/repotest/mattercontrol"
	"leonx.me/matter-control/internal/adapter/outbound/sheet"
	"leonx.me/matter-control/internal/adapter/outbound/system"
	"leonx.me/matter-control/internal/core/domain/matter"
	"leonx.me/matter-control/internal/core/port"
	"leonx.me/matter-control/internal/core/service"
)

const testIssuer = "http://issuer.test"

type fakeVerifier struct {
	tokens map[string]string // bearer -> subject
	err    error
}

func (f *fakeVerifier) Verify(_ context.Context, bearer string) (port.VerifiedToken, error) {
	if f.err != nil {
		return port.VerifiedToken{}, f.err
	}
	sub, ok := f.tokens[bearer]
	if !ok {
		return port.VerifiedToken{}, port.ErrUnauthenticated
	}
	return port.VerifiedToken{Active: true, Issuer: testIssuer, Subject: sub}, nil
}

type fakeResolver map[string]string // subject -> actor id

func (f fakeResolver) Resolve(_ context.Context, issuer, subject string) (string, error) {
	if id, ok := f[subject]; ok && issuer == testIssuer {
		return id, nil
	}
	return "", port.ErrUnknownIdentity
}

type env struct {
	t        *testing.T
	h        http.Handler
	verifier *fakeVerifier
	alice    string
	bob      string
	carol    string
	world    mattercontrol.World
	objs     *mattercontrol.MemoryObjects
}

func newEnv(t *testing.T) *env { return newEnvSized(t, 64) }

// newEnvSized builds the test server with the given upload limit (64 bytes keeps the document
// upload-limit test small; the W6 import tests need a realistic sheet size).
func newEnvSized(t *testing.T, maxUpload int64, localDirectory ...bool) *env {
	t.Helper()
	base := time.Date(2026, 10, 25, 12, 0, 0, 0, time.UTC)
	n := 0
	store := mattercontrol.NewMemoryStore(func() time.Time { n++; return base.Add(time.Duration(n) * time.Second) })
	world := mattercontrol.NewMemoryWorld(store)
	e := &env{t: t, world: world, objs: mattercontrol.NewMemoryObjects(), verifier: &fakeVerifier{tokens: map[string]string{"t-alice": "s-alice", "t-bob": "s-bob", "t-carol": "s-carol", "t-ghost": "s-ghost"}}}
	res := fakeResolver{}
	for name, dst := range map[string]*string{"alice": &e.alice, "bob": &e.bob, "carol": &e.carol} {
		*dst = uuid.Must(uuid.NewV7()).String()
		world.AddUser(matter.ActorID(*dst))
		res["s-"+name] = *dst
	}
	logger := slog.New(slog.NewTextHandler(io.Discard, nil))
	ids := system.RecordIDv7{}
	e.h = NewServer(Deps{
		LocalPeopleDirectory: len(localDirectory) > 0 && localDirectory[0],
		Workspaces:           service.NewWorkspaceService(store, ids, logger, matter.KeyAgePolicy{}),
		Matters:              service.NewMatterService(store, ids, logger, matter.KeyAgePolicy{}),
		Work:                 service.NewWorkService(store, ids, logger, matter.KeyAgePolicy{}),
		Evidence:             service.NewEvidenceService(service.NewWorkService(store, ids, logger, matter.KeyAgePolicy{}), e.objs),
		Filings:              service.NewFilingService(service.NewWorkService(store, ids, logger, matter.KeyAgePolicy{})),
		Control:              service.NewControlService(service.NewWorkService(store, ids, logger, matter.KeyAgePolicy{})),
		Review:               service.NewReviewService(service.NewWorkService(store, ids, logger, matter.KeyAgePolicy{})),
		DataOps:              service.NewDataOpsService(store, ids, sheet.Codec{}, logger),
		DataOpsCodec:         sheet.Codec{},
		MaxUploadBytes:       maxUpload,
		Verifier:             e.verifier, Identities: res, Logger: logger,
	})
	return e
}

type resp struct {
	*httptest.ResponseRecorder
}

func (r resp) json() map[string]any {
	var m map[string]any
	if err := json.Unmarshal(r.Body.Bytes(), &m); err != nil {
		panic(err)
	}
	return m
}

func (e *env) do(method, path, token string, hdr map[string]string, body string) resp {
	e.t.Helper()
	var rd io.Reader
	if body != "" {
		rd = strings.NewReader(body)
	}
	req := httptest.NewRequestWithContext(context.Background(), method, path, rd)
	if body != "" {
		req.Header.Set("Content-Type", "application/json")
	}
	if token != "" {
		req.Header.Set("Authorization", "Bearer "+token)
	}
	for k, v := range hdr {
		req.Header.Set(k, v)
	}
	rec := httptest.NewRecorder()
	e.h.ServeHTTP(rec, req)
	return resp{rec}
}

func key() map[string]string {
	return map[string]string{"Idempotency-Key": uuid.Must(uuid.NewV7()).String()}
}

func withKey(k string, extra map[string]string) map[string]string {
	h := map[string]string{"Idempotency-Key": k}
	for a, b := range extra {
		h[a] = b
	}
	return h
}

func (e *env) expect(r resp, status int, problemType string) {
	e.t.Helper()
	if r.Code != status {
		e.t.Fatalf("status = %d, want %d; body=%s", r.Code, status, r.Body.String())
	}
	if problemType == "" {
		return
	}
	if ct := r.Header().Get("Content-Type"); ct != problemContentType {
		e.t.Fatalf("content-type = %q", ct)
	}
	if got := r.json()["type"]; got != problemType {
		e.t.Fatalf("problem type = %v, want %s; body=%s", got, problemType, r.Body.String())
	}
}

func TestAuthentication(t *testing.T) {
	e := newEnv(t)
	e.expect(e.do("GET", "/api/v1/workspaces/"+uuid.NewString(), "", nil, ""), 401, "urn:mc:unauthenticated")
	e.expect(e.do("GET", "/api/v1/workspaces/"+uuid.NewString(), "bogus", nil, ""), 401, "urn:mc:unauthenticated")
	r := e.do("GET", "/api/v1/workspaces/"+uuid.NewString(), "t-ghost", nil, "")
	e.expect(r, 403, "urn:mc:forbidden") // verified but not provisioned: explicit provisioning only
	e.verifier.err = port.ErrUnavailable
	e.expect(e.do("GET", "/api/v1/workspaces/"+uuid.NewString(), "t-alice", nil, ""), 503, "urn:mc:unavailable")
	e.verifier.err = nil
	req := httptest.NewRequestWithContext(context.Background(), "GET", "/api/v1/workspaces/x", nil)
	req.Header.Set("Authorization", "Basic abc")
	rec := httptest.NewRecorder()
	e.h.ServeHTTP(rec, req)
	if rec.Code != 401 {
		t.Fatalf("non-bearer scheme: %d", rec.Code)
	}
	e.expect(e.do("GET", "/healthz", "", nil, ""), 200, "")
}

func TestCreateWorkspace_BoundaryAndReplay(t *testing.T) {
	e := newEnv(t)
	body := `{"name":"Acme"}`
	e.expect(e.do("POST", "/api/v1/workspaces", "t-alice", nil, body), 400, "urn:mc:bad-request") // no key
	e.expect(e.do("POST", "/api/v1/workspaces", "t-alice", key(), `{"name":"Acme","actorId":"x"}`), 400, "urn:mc:malformed-body")
	e.expect(e.do("POST", "/api/v1/workspaces", "t-alice", key(), `{"name":"A","name":"B"}`), 400, "urn:mc:malformed-body")
	e.expect(e.do("POST", "/api/v1/workspaces", "t-alice", key(), `{"name":"  "}`), 422, "urn:mc:validation")
	e.expect(e.do("POST", "/api/v1/workspaces", "t-alice", withKey(uuid.Must(uuid.NewV7()).String(), map[string]string{"If-Match": `"x"`}), body), 400, "urn:mc:precondition-not-applicable")
	req := httptest.NewRequestWithContext(context.Background(), "POST", "/api/v1/workspaces", strings.NewReader(body))
	req.Header.Set("Authorization", "Bearer t-alice")
	req.Header.Set("Content-Type", "text/plain")
	req.Header.Set("Idempotency-Key", uuid.Must(uuid.NewV7()).String())
	rec := httptest.NewRecorder()
	e.h.ServeHTTP(rec, req)
	if rec.Code != 415 {
		t.Fatalf("content type: %d", rec.Code)
	}

	k := uuid.Must(uuid.NewV7()).String()
	first := e.do("POST", "/api/v1/workspaces", "t-alice", withKey(k, nil), body)
	e.expect(first, 201, "")
	id := first.json()["id"].(string)
	if loc := first.Header().Get("Location"); loc != "/api/v1/workspaces/"+id || first.Header().Get("ETag") == "" {
		t.Fatalf("headers: %v", first.Header())
	}
	replay := e.do("POST", "/api/v1/workspaces", "t-alice", withKey(k, nil), body)
	e.expect(replay, 201, "")
	if replay.Header().Get("Idempotent-Replayed") != "true" || replay.Body.String() != first.Body.String() || replay.Header().Get("ETag") != first.Header().Get("ETag") {
		t.Fatalf("replay must be byte-stable: %s vs %s", replay.Body, first.Body)
	}
	e.expect(e.do("POST", "/api/v1/workspaces", "t-alice", withKey(k, nil), `{"name":"Other"}`), 422, "urn:mc:idempotency-key-reuse")

	get := e.do("GET", "/api/v1/workspaces/"+id, "t-alice", nil, "")
	e.expect(get, 200, "")
	if get.Header().Get("ETag") != first.Header().Get("ETag") {
		t.Fatal("equal representations must have equal strong ETags")
	}
	e.expect(e.do("GET", "/api/v1/workspaces/"+id, "t-bob", nil, ""), 404, "urn:mc:not-found")
	e.expect(e.do("GET", "/api/v1/workspaces/not-a-uuid", "t-alice", nil, ""), 422, "urn:mc:validation")
}

func TestWorkspaceMatterAndRequirementFlow(t *testing.T) {
	e := newEnv(t)
	ws := e.do("POST", "/api/v1/workspaces", "t-alice", key(), `{"name":"Acme"}`)
	wsID, wsTag := ws.json()["id"].(string), ws.Header().Get("ETag")
	mpath := "/api/v1/workspaces/" + wsID + "/matters"

	// CAS: absent -> 428, stale -> 412, current -> 201.
	e.expect(e.do("POST", mpath, "t-alice", key(), `{"title":"Atlas"}`), 428, "urn:mc:precondition-required")
	e.expect(e.do("POST", mpath, "t-alice", withKey(uuid.Must(uuid.NewV7()).String(), map[string]string{"If-Match": `"` + strings.Repeat("0", 64) + `"`}), `{"title":"Atlas"}`), 412, "urn:mc:precondition-failed")
	e.expect(e.do("POST", mpath, "t-alice", withKey(uuid.Must(uuid.NewV7()).String(), map[string]string{"If-Match": "W/" + wsTag}), `{"title":"Atlas"}`), 400, "urn:mc:bad-request")
	e.expect(e.do("POST", mpath, "t-bob", withKey(uuid.Must(uuid.NewV7()).String(), map[string]string{"If-Match": wsTag}), `{"title":"Atlas"}`), 404, "urn:mc:not-found")

	mk := uuid.Must(uuid.NewV7()).String()
	created := e.do("POST", mpath, "t-alice", withKey(mk, map[string]string{"If-Match": wsTag}), `{"title":"  Atlas "}`)
	e.expect(created, 201, "")
	m := created.json()
	if m["title"] != "Atlas" || m["callerRole"] != "OWNER" {
		t.Fatalf("matter: %v", m)
	}
	matterID := m["id"].(string)
	// Replay with the now-stale tag still replays (no CAS on replay) and flags it.
	replay := e.do("POST", mpath, "t-alice", withKey(mk, map[string]string{"If-Match": wsTag}), `{"title":"  Atlas "}`)
	e.expect(replay, 201, "")
	if replay.Header().Get("Idempotent-Replayed") != "true" || replay.json()["id"] != matterID {
		t.Fatalf("replay: %s", replay.Body)
	}

	// Reads.
	gm := e.do("GET", "/api/v1/matters/"+matterID, "t-alice", nil, "")
	e.expect(gm, 200, "")
	if gm.Header().Get("MC-As-Of") == "" || gm.Header().Get("MC-Source-Revision") == "" || gm.Header().Get("ETag") != created.Header().Get("ETag") {
		t.Fatalf("provenance/etag: %v", gm.Header())
	}
	e.expect(e.do("GET", "/api/v1/matters/"+matterID, "t-bob", nil, ""), 404, "urn:mc:not-found")
	list := e.do("GET", mpath+"?limit=1", "t-alice", nil, "")
	e.expect(list, 200, "")
	pg := list.json()["page"].(map[string]any)
	if pg["maxLimit"].(float64) != 200 || pg["total"].(float64) != 1 || len(list.json()["items"].([]any)) != 1 {
		t.Fatalf("page: %v", pg)
	}
	e.expect(e.do("GET", mpath+"?limit=0", "t-alice", nil, ""), 400, "urn:mc:bad-request")
	e.expect(e.do("GET", mpath+"?cursor=%21%21", "t-alice", nil, ""), 400, "urn:mc:bad-request")

	// Requirement create/read (CAS scope none) and history.
	rpath := "/api/v1/matters/" + matterID + "/requirements"
	e.expect(e.do("POST", rpath, "t-alice", withKey(uuid.Must(uuid.NewV7()).String(), map[string]string{"If-Match": `"x"`}), `{"title":"T","outcome":"O"}`), 400, "urn:mc:precondition-not-applicable")
	rk := uuid.Must(uuid.NewV7()).String()
	rq := e.do("POST", rpath, "t-alice", withKey(rk, nil), `{"title":"Sign SPA","outcome":"Executed SPA"}`)
	e.expect(rq, 201, "")
	rid := rq.json()["id"].(string)
	if rq.json()["ownerId"] != nil || rq.json()["dueAt"] != nil || rq.json()["executionState"] != "NOT_STARTED" {
		t.Fatalf("requirement: %v", rq.json())
	}
	e.expect(e.do("GET", "/api/v1/requirements/"+rid, "t-alice", nil, ""), 200, "")
	e.expect(e.do("GET", "/api/v1/requirements/"+rid, "t-bob", nil, ""), 404, "urn:mc:not-found")
	e.expect(e.do("GET", "/api/v1/requirements/"+matterID, "t-alice", nil, ""), 404, "urn:mc:not-found") // kind mismatch is indistinguishable

	hist := e.do("GET", "/api/v1/matters/"+matterID+"/events?limit=1", "t-alice", nil, "")
	e.expect(hist, 200, "")
	hp := hist.json()["page"].(map[string]any)
	if hp["nextCursor"] == nil {
		t.Fatalf("two events at limit 1 need a next cursor: %v", hp)
	}
	next := e.do("GET", "/api/v1/matters/"+matterID+"/events?limit=1&cursor="+hp["nextCursor"].(string), "t-alice", nil, "")
	e.expect(next, 200, "")
	if next.json()["items"].([]any)[0].(map[string]any)["type"] != "requirement.created" {
		t.Fatalf("second page: %s", next.Body)
	}

	// Own receipt and reconciliation.
	rc := e.do("GET", "/api/v1/operations/"+rk, "t-alice", nil, "")
	e.expect(rc, 200, "")
	if rc.json()["kind"] != "REQUIREMENT_CREATED" || rc.json()["requirement"] == nil {
		t.Fatalf("receipt: %s", rc.Body)
	}
	e.expect(e.do("GET", "/api/v1/operations/"+rk, "t-bob", nil, ""), 404, "urn:mc:not-found")
	e.expect(e.do("POST", "/api/v1/matters/"+matterID+"/operations/"+rk+"/reconciliation", "t-alice", nil, ""), 200, "")
	e.expect(e.do("POST", "/api/v1/matters/"+uuid.NewString()+"/operations/"+rk+"/reconciliation", "t-alice", nil, ""), 404, "urn:mc:not-found")
}

func TestMembershipAdministration(t *testing.T) {
	e := newEnv(t)
	ws := e.do("POST", "/api/v1/workspaces", "t-alice", key(), `{"name":"Acme"}`)
	wsID := ws.json()["id"].(string)
	tag := func() string {
		return e.do("GET", "/api/v1/workspaces/"+wsID, "t-alice", nil, "").Header().Get("ETag")
	}
	grant := func(token, user, role, ifMatch string) resp {
		h := map[string]string{}
		if ifMatch != "" {
			h["If-Match"] = ifMatch
		}
		return e.do("POST", "/api/v1/workspaces/"+wsID+"/members", token, h, `{"userId":"`+user+`","role":"`+role+`"}`)
	}
	e.expect(grant("t-alice", e.bob, "MEMBER", ""), 428, "urn:mc:precondition-required")
	e.expect(grant("t-alice", e.bob, "SUPERUSER", tag()), 422, "urn:mc:validation")
	stale := tag()
	e.expect(grant("t-alice", e.bob, "MEMBER", tag()), 200, "")
	e.expect(grant("t-alice", e.carol, "MEMBER", stale), 412, "urn:mc:precondition-failed") // tag moved on
	e.expect(grant("t-bob", e.carol, "MEMBER", tag()), 403, "urn:mc:forbidden")
	e.expect(grant("t-carol", e.carol, "MEMBER", tag()), 404, "urn:mc:not-found")

	list := e.do("GET", "/api/v1/workspaces/"+wsID+"/members", "t-alice", nil, "")
	e.expect(list, 200, "")
	if len(list.json()["items"].([]any)) != 2 {
		t.Fatalf("members: %s", list.Body)
	}
	e.expect(e.do("GET", "/api/v1/workspaces/"+wsID+"/members", "t-bob", nil, ""), 403, "urn:mc:forbidden")

	rev := func(user, token, ifMatch string) resp {
		h := map[string]string{}
		if ifMatch != "" {
			h["If-Match"] = ifMatch
		}
		return e.do("POST", "/api/v1/workspaces/"+wsID+"/members/"+user+"/revocation", token, h, "")
	}
	e.expect(rev(e.alice, "t-alice", tag()), 403, "urn:mc:last-owner")
	e.expect(rev(e.bob, "t-alice", tag()), 200, "")
	e.expect(e.do("GET", "/api/v1/workspaces/"+wsID, "t-bob", nil, ""), 404, "urn:mc:not-found") // revocation is immediate
}

func TestOutcomeUnknownIsNeverASuccessOrARollbackClaim(t *testing.T) {
	p := toProblem(context.Background(), port.ErrOutcomeUnknown)
	if p.Status != 503 || p.Type != "urn:mc:outcome-unknown" || p.Retryable || !strings.Contains(p.Detail, "no rollback is asserted") {
		t.Fatalf("%+v", p)
	}
	if u := toProblem(context.Background(), port.ErrUnavailable); !u.Retryable || u.Type != "urn:mc:unavailable" {
		t.Fatalf("%+v", u)
	}
}

func TestListMyWorkspaces(t *testing.T) {
	e := newEnv(t)
	e.expect(e.do("GET", "/api/v1/workspaces", "", nil, ""), 401, "urn:mc:unauthenticated")
	empty := e.do("GET", "/api/v1/workspaces", "t-alice", nil, "")
	e.expect(empty, 200, "")
	if items := empty.json()["items"].([]any); len(items) != 0 {
		t.Fatalf("a fresh user has no workspaces: %s", empty.Body)
	}
	ws := e.do("POST", "/api/v1/workspaces", "t-alice", key(), `{"name":"Acme"}`)
	list := e.do("GET", "/api/v1/workspaces?limit=5", "t-alice", nil, "")
	e.expect(list, 200, "")
	item := list.json()["items"].([]any)[0].(map[string]any)
	if item["id"] != ws.json()["id"] || item["callerRole"] != "OWNER" || list.Header().Get("MC-As-Of") == "" {
		t.Fatalf("list: %s", list.Body)
	}
	if bob := e.do("GET", "/api/v1/workspaces", "t-bob", nil, ""); len(bob.json()["items"].([]any)) != 0 {
		t.Fatalf("bob must not see alice's workspace: %s", bob.Body)
	}
	e.expect(e.do("GET", "/api/v1/workspaces?limit=999", "t-alice", nil, ""), 400, "urn:mc:bad-request")
}

// Authentication runs before any body is read: an unauthenticated malformed body is 401,
// never a decode error that would reveal anything about the route (contract section 3).
func TestAuthenticationPrecedesDecode(t *testing.T) {
	e := newEnv(t)
	e.expect(e.do("POST", "/api/v1/workspaces", "", key(), `{"name":`), 401, "urn:mc:unauthenticated")
}
