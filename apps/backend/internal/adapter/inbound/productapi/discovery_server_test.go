package productapi

import (
	"strings"
	"testing"

	"github.com/google/uuid"
)

// BF-05: the pending-assessment queue over HTTP.
func TestMyReviews_HTTP(t *testing.T) {
	e := newEnv(t)
	m, req := proofFixture(t, e)
	base := "/api/v1/matters/" + m
	e.expect(e.do("POST", base+"/verifiers", "t-alice", nil, `{"userId":"`+e.bob+`"}`), 200, "")
	e.expect(e.do("POST", base+"/work-items/"+req+"/criteria", "t-alice", nil, `{"title":"Signed copy","mandatory":true,"versionRule":"NONE"}`), 201, "")
	crit := e.do("GET", base+"/work-items/"+req+"/proof", "t-alice", nil, "").json()["criteria"].([]any)[0].(map[string]any)["id"].(string)

	e.expect(e.do("GET", "/api/v1/me/reviews", "", nil, ""), 401, "urn:mc:unauthenticated")
	e.expect(e.do("GET", "/api/v1/me/reviews", "t-ghost", nil, ""), 403, "urn:mc:forbidden")
	none := e.do("GET", "/api/v1/me/reviews", "t-bob", nil, "")
	e.expect(none, 200, "")
	if items := none.json()["items"].([]any); len(items) != 0 {
		t.Fatalf("nothing offered yet: %s", none.Body)
	}

	e.expect(e.do("POST", base+"/evidence", "t-alice", key(), `{"reference":"signed-copy.pdf","claims":["`+crit+`"]}`), 201, "")

	got := e.do("GET", "/api/v1/me/reviews", "t-bob", nil, "")
	e.expect(got, 200, "")
	j := got.json()
	items := j["items"].([]any)
	if len(items) != 1 || j["page"].(map[string]any)["total"].(float64) != 1 {
		t.Fatalf("the designated verifier sees the pending claim: %s", got.Body)
	}
	row := items[0].(map[string]any)
	if row["matterTitle"] != "Atlas" || row["subjectTitle"] != "Signed SPA" || row["criterionTitle"] != "Signed copy" ||
		row["criterionId"] != crit || row["subjectId"] != req || row["claimedBy"] != e.alice || row["reason"] != "PENDING_REVIEW" ||
		row["criterionPurpose"] != "PACKAGE" || row["evidenceReference"] != "signed-copy.pdf" || row["claimId"] == "" {
		t.Fatalf("the row names the exact criterion and context: %v", row)
	}
	// The submitter, a viewer and a non-designated member never see it.
	for _, tok := range []string{"t-alice", "t-carol"} {
		r := e.do("GET", "/api/v1/me/reviews", tok, nil, "")
		e.expect(r, 200, "")
		if len(r.json()["items"].([]any)) != 0 || r.json()["page"].(map[string]any)["total"].(float64) != 0 {
			t.Fatalf("%s must not see the queue: %s", tok, r.Body)
		}
	}
	e.expect(e.do("GET", "/api/v1/me/reviews?limit=0", "t-bob", nil, ""), 400, "urn:mc:bad-request")
	e.expect(e.do("GET", "/api/v1/me/reviews?cursor=%21%21", "t-bob", nil, ""), 400, "urn:mc:bad-request")
}

// BF-08: cross-workspace Matter discovery over HTTP.
func TestDiscoverMatters_HTTP(t *testing.T) {
	e := newEnv(t)
	m, _ := proofFixture(t, e) // Acme / Atlas: alice OWNER, bob EDITOR, carol VIEWER
	e.expect(e.do("GET", "/api/v1/matters", "", nil, ""), 401, "urn:mc:unauthenticated")
	e.expect(e.do("GET", "/api/v1/matters", "t-ghost", nil, ""), 403, "urn:mc:forbidden")

	r := e.do("GET", "/api/v1/matters?q=atl", "t-carol", nil, "")
	e.expect(r, 200, "")
	j := r.json()
	items := j["items"].([]any)
	if len(items) != 1 || j["page"].(map[string]any)["total"].(float64) != 1 {
		t.Fatalf("%s", r.Body)
	}
	row := items[0].(map[string]any)
	if row["id"] != m || row["title"] != "Atlas" || row["workspaceName"] != "Acme" || row["callerRole"] != "VIEWER" {
		t.Fatalf("workspace context and role are shown: %v", row)
	}
	// A second workspace gives pagination across workspaces with the exact total.
	ws := e.do("POST", "/api/v1/workspaces", "t-alice", key(), `{"name":"Beta"}`)
	wsID, tag := ws.json()["id"].(string), ws.Header().Get("ETag")
	e.expect(e.do("POST", "/api/v1/workspaces/"+wsID+"/matters", "t-alice", withKey(uuid.Must(uuid.NewV7()).String(), map[string]string{"If-Match": tag}), `{"title":"Atlas Holdings"}`), 201, "")
	p1 := e.do("GET", "/api/v1/matters?q=atlas&limit=1", "t-alice", nil, "")
	e.expect(p1, 200, "")
	pj := p1.json()["page"].(map[string]any)
	if pj["total"].(float64) != 2 || pj["nextCursor"] == nil || len(p1.json()["items"].([]any)) != 1 {
		t.Fatalf("page one of two: %s", p1.Body)
	}
	p2 := e.do("GET", "/api/v1/matters?q=atlas&limit=1&cursor="+pj["nextCursor"].(string), "t-alice", nil, "")
	e.expect(p2, 200, "")
	if p2.json()["page"].(map[string]any)["nextCursor"] != nil || p2.json()["items"].([]any)[0].(map[string]any)["id"] == p1.json()["items"].([]any)[0].(map[string]any)["id"] {
		t.Fatalf("page two is the other matter: %s", p2.Body)
	}
	// Bob has no access to the second workspace's matter: it never appears, not even in the count.
	bob := e.do("GET", "/api/v1/matters?q=atlas", "t-bob", nil, "")
	if bob.json()["page"].(map[string]any)["total"].(float64) != 1 {
		t.Fatalf("only the accessible matter is counted: %s", bob.Body)
	}
	e.expect(e.do("GET", "/api/v1/matters?q="+strings.Repeat("a", 101), "t-alice", nil, ""), 409, "urn:mc:rejected")
	e.expect(e.do("GET", "/api/v1/matters?cursor=%21%21", "t-alice", nil, ""), 400, "urn:mc:bad-request")
	e.expect(e.do("GET", "/api/v1/matters?limit=0", "t-alice", nil, ""), 400, "urn:mc:bad-request")
}

// BF-01/BF-02: criterion purpose and the filing marker over HTTP.
func TestCriterionPurposeAndFilingMarker_HTTP(t *testing.T) {
	e := newEnv(t)
	m, req := proofFixture(t, e)
	base := "/api/v1/matters/" + m
	party := e.do("POST", base+"/parties", "t-alice", nil, `{"name":"Authority","kind":"AUTHORITY"}`)
	pid := party.json()["id"].(string)
	file := func(proof string) string {
		r := e.do("POST", base+"/filings", "t-alice", key(), `{"title":"F","outcome":"O","requirementId":"`+req+`","authorityPartyId":"`+pid+`","ownerId":"`+e.bob+`","proofRequired":`+proof+`}`)
		e.expect(r, 201, "")
		return r.json()["id"].(string)
	}
	withProof, noProof := file("true"), file("false")

	if d := e.do("GET", base+"/work-items/"+noProof, "t-carol", nil, "").json(); d["isFiling"] != true {
		t.Fatalf("a no-outcome-proof filing is still marked as a filing: %v", d)
	}
	if d := e.do("GET", base+"/work-items/"+req, "t-carol", nil, "").json(); d["isFiling"] != false {
		t.Fatalf("a Requirement is not a filing: %v", d)
	}
	// An outcome criterion exists only on a filing that has outcome verification.
	out := `{"title":"Authority decision accepted","mandatory":true,"versionRule":"NONE","purpose":"OUTCOME"}`
	refused := e.do("POST", base+"/work-items/"+noProof+"/criteria", "t-alice", nil, out)
	e.expect(refused, 409, "urn:mc:rejected")
	if refused.json()["code"] != "outcome-criterion-not-applicable" {
		t.Fatalf("%s", refused.Body)
	}
	e.expect(e.do("POST", base+"/work-items/"+req+"/criteria", "t-alice", nil, out), 409, "urn:mc:rejected")
	e.expect(e.do("POST", base+"/work-items/"+withProof+"/criteria", "t-alice", nil, `{"title":"x","mandatory":true,"versionRule":"NONE","purpose":"SOMETHING"}`), 409, "urn:mc:rejected")
	e.expect(e.do("POST", base+"/work-items/"+noProof+"/criteria", "t-alice", nil, `{"title":"Package","mandatory":true,"versionRule":"NONE"}`), 201, "")
	e.expect(e.do("POST", base+"/work-items/"+withProof+"/criteria", "t-alice", nil, `{"title":"Package","mandatory":true,"versionRule":"NONE"}`), 201, "")
	e.expect(e.do("POST", base+"/work-items/"+withProof+"/criteria", "t-alice", nil, out), 201, "")

	ck := e.do("GET", base+"/work-items/"+withProof+"/proof", "t-carol", nil, "").json()
	pkg, outc := ck["package"].(map[string]any), ck["outcome"].(map[string]any)
	if pkg["total"].(float64) != 1 || pkg["ready"] != false || outc["declared"] != true || outc["ready"] != false {
		t.Fatalf("package and outcome are reported apart: %v", ck)
	}
	purposes := map[string]bool{}
	for _, c := range ck["criteria"].([]any) {
		purposes[c.(map[string]any)["purpose"].(string)] = true
	}
	if !purposes["PACKAGE"] || !purposes["OUTCOME"] {
		t.Fatalf("each criterion states its purpose: %v", purposes)
	}
	// Outcome verification is reported apart from the verification state, on detail, list and work item.
	if d := e.do("GET", base+"/filings/"+withProof, "t-carol", nil, "").json(); d["outcomeVerification"] != "PENDING" {
		t.Fatalf("declared, unaccepted outcome: %v", d["outcomeVerification"])
	}
	if d := e.do("GET", base+"/filings/"+noProof, "t-carol", nil, "").json(); d["outcomeVerification"] != "NOT_TRACKED" {
		t.Fatalf("no outcome verification on a no-proof filing: %v", d["outcomeVerification"])
	}
	if d := e.do("GET", base+"/work-items/"+withProof, "t-carol", nil, "").json(); d["outcomeVerification"] != "PENDING" {
		t.Fatalf("work item carries it for a filing: %v", d["outcomeVerification"])
	}
	if d := e.do("GET", base+"/work-items/"+req, "t-carol", nil, "").json(); d["outcomeVerification"] != nil {
		t.Fatalf("not for a Requirement: %v", d["outcomeVerification"])
	}
	for _, row := range e.do("GET", base+"/filings", "t-carol", nil, "").json()["items"].([]any) {
		if row.(map[string]any)["outcomeVerification"] == nil {
			t.Fatalf("every list row states it: %v", row)
		}
	}
	// A no-outcome-proof filing keeps a reachable checklist for its package criteria.
	nk := e.do("GET", base+"/work-items/"+noProof+"/proof", "t-carol", nil, "")
	e.expect(nk, 200, "")
}
