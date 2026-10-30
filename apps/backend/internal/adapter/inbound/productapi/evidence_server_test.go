package productapi

import (
	"net/http"
	"strconv"
	"strings"
	"testing"

	"github.com/google/uuid"

	"leonx.me/matter-control/internal/core/domain/matter"
)

// proofFixture: alice OWNER, bob EDITOR (designated verifier), carol VIEWER, a Requirement.
func proofFixture(t *testing.T, e *env) (m, req string) {
	t.Helper()
	ws := e.do("POST", "/api/v1/workspaces", "t-alice", key(), `{"name":"Acme"}`)
	wsID, tag := ws.json()["id"].(string), ws.Header().Get("ETag")
	mm := e.do("POST", "/api/v1/workspaces/"+wsID+"/matters", "t-alice", withKey(uuid.Must(uuid.NewV7()).String(), map[string]string{"If-Match": tag}), `{"title":"Atlas"}`)
	e.expect(mm, 201, "")
	m = mm.json()["id"].(string)
	for _, u := range []string{e.bob, e.carol} {
		e.world.SetWorkspaceMembership(matter.WorkspaceID(wsID), matter.ActorID(u), matter.WorkspaceRoleMember, matter.StatusActive)
	}
	e.world.SetMatterMembership(matter.MatterID(m), matter.ActorID(e.bob), matter.MatterRoleEditor, matter.StatusActive)
	e.world.SetMatterMembership(matter.MatterID(m), matter.ActorID(e.carol), matter.MatterRoleViewer, matter.StatusActive)
	r := e.do("POST", "/api/v1/matters/"+m+"/requirements", "t-alice", key(), `{"title":"Signed SPA","outcome":"Executed"}`)
	e.expect(r, 201, "")
	return m, r.json()["id"].(string)
}

func TestProof_HTTPFlow(t *testing.T) {
	e := newEnv(t)
	m, req := proofFixture(t, e)
	base := "/api/v1/matters/" + m
	proof := base + "/work-items/" + req + "/proof"

	// verifiers: OWNER designates; the checklist starts UNVERIFIED with no criteria (never vacuous).
	e.expect(e.do("POST", base+"/verifiers", "t-bob", nil, `{"userId":"`+e.bob+`"}`), 403, "urn:mc:forbidden")
	e.expect(e.do("POST", base+"/verifiers", "t-alice", nil, `{"userId":"`+e.carol+`"}`), 409, "urn:mc:rejected") // VIEWER cannot verify
	e.expect(e.do("POST", base+"/verifiers", "t-alice", nil, `{"userId":"`+e.bob+`"}`), 200, "")
	p := e.do("GET", proof, "t-carol", nil, "")
	e.expect(p, 200, "")
	if p.json()["verification"] != "UNVERIFIED" || len(p.json()["criteria"].([]any)) != 0 {
		t.Fatalf("%s", p.Body)
	}
	e.expect(e.do("GET", proof, "t-ghost", nil, ""), 403, "urn:mc:forbidden")

	// criterion (editor), evidence (alice submits, so bob is independent), assessment
	cr := e.do("POST", base+"/work-items/"+req+"/criteria", "t-alice", nil, `{"title":"Signed copy","mandatory":true,"versionRule":"NONE"}`)
	e.expect(cr, 201, "")
	crit := cr.json()["criteria"].([]any)[0].(map[string]any)
	if crit["etag"] == "" || crit["revision"].(float64) != 1 {
		t.Fatalf("%v", crit)
	}
	k := uuid.Must(uuid.NewV7()).String()
	body := `{"reference":"synthetic-ref","claims":["` + crit["id"].(string) + `"]}`
	ev := e.do("POST", base+"/evidence", "t-alice", withKey(k, nil), body)
	e.expect(ev, 201, "")
	replay := e.do("POST", base+"/evidence", "t-alice", withKey(k, nil), body)
	if replay.Header().Get("Idempotent-Replayed") != "true" || replay.Body.String() != ev.Body.String() {
		t.Fatalf("replay must be byte-stable: %s vs %s", replay.Body, ev.Body)
	}
	e.expect(e.do("POST", base+"/evidence", "t-alice", withKey(k, nil), `{"reference":"other"}`), 422, "urn:mc:idempotency-key-reuse")
	e.expect(e.do("POST", base+"/evidence", "t-alice", nil, body), 400, "urn:mc:bad-request") // key required
	e.expect(e.do("POST", base+"/evidence", "t-carol", key(), body), 403, "urn:mc:forbidden")

	cl := e.do("GET", proof, "t-carol", nil, "").json()["criteria"].([]any)[0].(map[string]any)["claims"].([]any)[0].(map[string]any)["id"].(string)
	// exp is the raw expectedAssessmentId member: "" omits it (a missing precondition).
	asm := func(token string, epoch int, verdict, exp string) resp {
		return e.do("POST", base+"/claims/"+cl+"/assessments", token, nil, `{"verdict":"`+verdict+`","rationale":"checked","expectedSubjectEpoch":`+strconv.Itoa(epoch)+exp+`}`)
	}
	const sawNone = `,"expectedAssessmentId":""`
	e.expect(asm("t-alice", 0, "ACCEPTED", sawNone), 409, "urn:mc:rejected")       // not a designated verifier
	e.expect(asm("t-bob", 0, "ACCEPTED", ""), 428, "urn:mc:precondition-required") // F02: the binding is mandatory
	self := asm("t-bob", 0, "ACCEPTED", sawNone)                                   // bob did not supply it: independent
	e.expect(self, 201, "")
	if self.json()["verification"] != "VERIFIED" {
		t.Fatalf("%s", self.Body)
	}
	if read := e.do("GET", base+"/work-items/"+req, "t-carol", nil, ""); read.json()["item"].(map[string]any)["verification"] != "VERIFIED" {
		t.Fatalf("the item read agrees with the proof view: %s", read.Body)
	}
	// F02: a reader that still believes no assessment exists is stale (no mutation); a binding to
	// the id it actually read succeeds.
	e.expect(asm("t-bob", 0, "REJECTED", sawNone), 412, "urn:mc:precondition-failed")
	seen := e.do("GET", proof, "t-carol", nil, "").json()["criteria"].([]any)[0].(map[string]any)["claims"].([]any)[0].(map[string]any)["assessment"].(map[string]any)["id"].(string)
	if v := e.do("GET", proof, "t-carol", nil, "").json()["verification"]; v != "VERIFIED" {
		t.Fatalf("a refused stale review must not change the proof: %v", v)
	}
	e.expect(asm("t-bob", 0, "REJECTED", `,"expectedAssessmentId":"`+seen+`"`), 201, "")
	rej := asm("t-bob", 0, "MAYBE", sawNone)
	e.expect(rej, 409, "urn:mc:rejected")
	if rej.json()["code"] != "invalid-verdict" {
		t.Fatalf("%s", rej.Body)
	}
}

func TestDocuments_HTTPUploadPromotionAndContent(t *testing.T) {
	e := newEnv(t)
	m, _ := proofFixture(t, e)
	base := "/api/v1/matters/" + m
	d := e.do("POST", base+"/documents", "t-alice", key(), `{"name":"SPA"}`)
	e.expect(d, 201, "")
	doc := d.json()["id"].(string)
	up := func(token, k, name, content string) resp {
		return e.do("POST", base+"/documents/"+doc+"/versions", token,
			map[string]string{"Idempotency-Key": k, "Content-Type": "application/pdf", "X-Filename": name}, content)
	}

	e.expect(up("t-carol", uuid.NewString(), "a.pdf", "viewer"), 403, "urn:mc:forbidden")
	if e.objs.Count() != 0 {
		t.Fatal("a refused writer's bytes are never stored")
	}
	big := up("t-alice", uuid.Must(uuid.NewV7()).String(), "a.pdf", strings.Repeat("x", 65))
	e.expect(big, http.StatusRequestEntityTooLarge, "urn:mc:payload-too-large")
	e.expect(up("t-alice", uuid.Must(uuid.NewV7()).String(), "../a.pdf", "x"), 409, "urn:mc:rejected")
	k := uuid.Must(uuid.NewV7()).String()
	v1 := up("t-alice", k, "spa.pdf", "content one")
	e.expect(v1, 201, "")
	e.expect(up("t-alice", k, "spa.pdf", "content two"), 422, "urn:mc:idempotency-key-reuse")
	v2 := up("t-alice", uuid.Must(uuid.NewV7()).String(), "spa-2.pdf", "content two")
	e.expect(v2, 201, "")
	id1, id2 := v1.json()["id"].(string), v2.json()["id"].(string)

	got := e.do("GET", base+"/documents/"+doc+"?promoteTo="+id1, "t-bob", nil, "")
	e.expect(got, 200, "")
	gj := got.json()
	if gj["document"].(map[string]any)["currentVersionId"] != nil || len(gj["versions"].([]any)) != 2 {
		t.Fatalf("nothing is current by upload: %s", got.Body)
	}
	tok := gj["promotionImpact"].(map[string]any)["token"].(string)
	tag := got.Header().Get("ETag")
	promo := `{"targetVersionId":"` + id1 + `","expectedCurrentVersionId":"","reason":"agreed","impactToken":"` + tok + `"}`
	e.expect(e.do("POST", base+"/documents/"+doc+"/promotion", "t-bob", map[string]string{"If-Match": tag}, promo), 403, "urn:mc:forbidden")
	e.expect(e.do("POST", base+"/documents/"+doc+"/promotion", "t-alice", nil, promo), 428, "urn:mc:precondition-required")
	e.expect(e.do("POST", base+"/documents/"+doc+"/promotion", "t-alice", map[string]string{"If-Match": `"` + strings.Repeat("0", 64) + `"`}, promo), 412, "urn:mc:precondition-failed")
	ok := e.do("POST", base+"/documents/"+doc+"/promotion", "t-alice", map[string]string{"If-Match": tag}, promo)
	e.expect(ok, 200, "")
	if ok.json()["document"].(map[string]any)["currentVersionId"] != id1 || ok.Header().Get("ETag") == tag {
		t.Fatalf("%s", ok.Body)
	}
	_ = id2

	// content: exact bytes, always an attachment of opaque bytes, readable by a viewer, not by a stranger
	c := e.do("GET", base+"/documents/"+doc+"/versions/"+id1+"/content", "t-carol", nil, "")
	e.expect(c, 200, "")
	if c.Body.String() != "content one" || c.Header().Get("Content-Type") != "application/octet-stream" ||
		!strings.HasPrefix(c.Header().Get("Content-Disposition"), "attachment") || c.Header().Get("X-Content-Type-Options") != "nosniff" ||
		c.Header().Get("MC-Media-Type") != "application/pdf" {
		t.Fatalf("%q %v", c.Body, c.Header())
	}
	e.expect(e.do("GET", base+"/documents/"+doc+"/versions/"+id1+"/content", "t-ghost", nil, ""), 403, "urn:mc:forbidden")
	e.expect(e.do("GET", base+"/documents/"+uuid.NewString()+"/versions/"+id1+"/content", "t-carol", nil, ""), 404, "urn:mc:not-found")
}
