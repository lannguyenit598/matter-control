package productapi

import (
	"testing"
	"time"

	"github.com/google/uuid"
)

func TestFilings_HTTPFlow(t *testing.T) {
	e := newEnv(t)
	m, req := proofFixture(t, e)
	base := "/api/v1/matters/" + m

	party := e.do("POST", base+"/parties", "t-alice", nil, `{"name":"Competition authority","kind":"AUTHORITY"}`)
	e.expect(party, 201, "")
	pid := party.json()["id"].(string)

	k := uuid.Must(uuid.NewV7()).String()
	body := `{"title":"Merger filing","outcome":"Clearance","requirementId":"` + req + `","authorityPartyId":"` + pid + `","ownerId":"` + e.bob + `","proofRequired":false}`
	created := e.do("POST", base+"/filings", "t-alice", withKey(k, nil), body)
	e.expect(created, 201, "")
	replay := e.do("POST", base+"/filings", "t-alice", withKey(k, nil), body)
	if replay.Header().Get("Idempotent-Replayed") != "true" || replay.Body.String() != created.Body.String() {
		t.Fatalf("replay must be byte-stable: %s vs %s", replay.Body, created.Body)
	}
	e.expect(e.do("POST", base+"/filings", "t-alice", withKey(k, nil), `{"title":"x","outcome":"y","requirementId":"`+req+`","authorityPartyId":"`+pid+`"}`), 422, "urn:mc:idempotency-key-reuse")
	e.expect(e.do("POST", base+"/filings", "t-carol", key(), body), 403, "urn:mc:forbidden")
	id := created.json()["id"].(string)
	// Every filing declares its package criteria first, whatever its outcome-proof flag says (F03).
	e.expect(e.do("POST", base+"/work-items/"+id+"/criteria", "t-alice", nil, `{"title":"Package complete","mandatory":true,"versionRule":"NONE"}`), 201, "")
	// A filing without declared package criteria cannot start package preparation, with the reason.
	bare := e.do("POST", base+"/filings", "t-alice", key(), body)
	e.expect(bare, 201, "")
	bareID := bare.json()["id"].(string)
	bareTag := e.do("GET", base+"/filings/"+bareID, "t-carol", nil, "").Header().Get("ETag")
	refused := e.do("POST", base+"/filings/"+bareID+"/stage", "t-alice", map[string]string{"If-Match": bareTag}, `{"to":"PACKAGE_PREPARATION"}`)
	e.expect(refused, 409, "urn:mc:rejected")
	if refused.json()["code"] != "package-criteria-required" {
		t.Fatalf("%s", refused.Body)
	}

	got := e.do("GET", base+"/filings/"+id, "t-carol", nil, "")
	e.expect(got, 200, "")
	tag := got.Header().Get("ETag")
	gj := got.json()
	if tag == "" || gj["etag"] != tag || gj["filing"].(map[string]any)["stage"] != "REQUIREMENT" || len(gj["cycles"].([]any)) != 1 {
		t.Fatalf("%s", got.Body)
	}
	if next := gj["next"].([]any); len(next) != 1 || next[0] != "PACKAGE_PREPARATION" {
		t.Fatalf("next stages: %v", next)
	}

	stage := base + "/filings/" + id + "/stage"
	e.expect(e.do("POST", stage, "t-alice", nil, `{"to":"PACKAGE_PREPARATION"}`), 428, "urn:mc:precondition-required")
	e.expect(e.do("POST", stage, "t-alice", map[string]string{"If-Match": `"` + uuid.NewString() + `"`}, `{"to":"PACKAGE_PREPARATION"}`), 412, "urn:mc:precondition-failed")
	e.expect(e.do("POST", stage, "t-carol", map[string]string{"If-Match": tag}, `{"to":"PACKAGE_PREPARATION"}`), 403, "urn:mc:forbidden")
	bad := e.do("POST", stage, "t-alice", map[string]string{"If-Match": tag}, `{"to":"APPROVAL"}`)
	e.expect(bad, 409, "urn:mc:rejected")
	if bad.json()["code"] != "transition-not-allowed" {
		t.Fatalf("%s", bad.Body)
	}
	e.expect(e.do("POST", stage, "t-alice", map[string]string{"If-Match": tag}, `{"to":"PACKAGE_PREPARATION","status":"DONE"}`), 400, "urn:mc:malformed-body")
	ok := e.do("POST", stage, "t-alice", map[string]string{"If-Match": tag}, `{"to":"PACKAGE_PREPARATION","reference":"kick-off"}`)
	e.expect(ok, 200, "")
	if ok.Header().Get("ETag") == tag || ok.json()["item"].(map[string]any)["execution"] != "IN_PROGRESS" {
		t.Fatalf("a stage change moves the revision and the execution: %s", ok.Body)
	}
	// the generic status endpoint refuses a filing
	e.expect(e.do("POST", base+"/work-items/"+id+"/execution", "t-alice", map[string]string{"If-Match": ok.Header().Get("ETag")}, `{"to":"COMPLETED","reason":"x","completedAt":"`+time.Now().Add(-time.Hour).UTC().Format(time.RFC3339)+`"}`), 409, "urn:mc:rejected")

	lst := e.do("GET", base+"/filings", "t-carol", nil, "")
	e.expect(lst, 200, "")
	if items := lst.json()["items"].([]any); len(items) != 2 || items[0].(map[string]any)["filing"].(map[string]any)["stage"] != "PACKAGE_PREPARATION" {
		t.Fatalf("%s", lst.Body)
	}
	e.expect(e.do("GET", base+"/filings/"+req, "t-carol", nil, ""), 404, "urn:mc:not-found")

	// owner-only steps
	e.expect(e.do("POST", base+"/filings/"+id+"/reopening", "t-bob", map[string]string{"If-Match": ok.Header().Get("ETag")}, `{"reason":"x"}`), 403, "urn:mc:forbidden")
	nr := e.do("POST", base+"/filings/"+id+"/negative-outcome", "t-bob", map[string]string{"If-Match": ok.Header().Get("ETag")}, `{"outcome":"REJECTED"}`)
	e.expect(nr, 409, "urn:mc:rejected") // nothing submitted yet

	// F03: the OWNER alone records the no-signature applicability decision; it is guarded by the
	// filing revision, needs a reason and is retained on the filing read.
	sa := base + "/filings/" + id + "/signature-applicability"
	et := e.do("GET", base+"/filings/"+id, "t-carol", nil, "").Header().Get("ETag")
	decide := `{"signatureNotRequired":true,"reason":"informational filing; no signatures apply"}`
	e.expect(e.do("POST", sa, "t-alice", nil, decide), 428, "urn:mc:precondition-required")
	e.expect(e.do("POST", sa, "t-bob", map[string]string{"If-Match": et}, decide), 403, "urn:mc:forbidden")
	e.expect(e.do("POST", sa, "t-alice", map[string]string{"If-Match": `"` + uuid.NewString() + `"`}, decide), 412, "urn:mc:precondition-failed")
	noReason := e.do("POST", sa, "t-alice", map[string]string{"If-Match": et}, `{"signatureNotRequired":true,"reason":" "}`)
	e.expect(noReason, 409, "urn:mc:rejected")
	if noReason.json()["code"] != "reason-required" {
		t.Fatalf("%s", noReason.Body)
	}
	set := e.do("POST", sa, "t-alice", map[string]string{"If-Match": et}, decide)
	e.expect(set, 200, "")
	f := set.json()["filing"].(map[string]any)
	if f["signatureNotRequired"] != true || f["signatureNotRequiredReason"] == "" || f["signatureNotRequiredBy"] != e.alice || f["signatureNotRequiredAt"] == nil || set.Header().Get("ETag") == et {
		t.Fatalf("the decision is retained with reason/decider/instant and moves the revision: %s", set.Body)
	}
	if again := e.do("GET", base+"/filings/"+id, "t-carol", nil, "").json()["filing"].(map[string]any); again["signatureNotRequired"] != true {
		t.Fatalf("the decision survives a re-read: %v", again)
	}
}
