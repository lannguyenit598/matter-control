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

// The r2 BA-review filing-F repro, re-run over HTTP on the committed D-9 semantics (fix commit
// dac4262): a proof-required filing whose only criterion is the authority's OUTCOME is refused at
// PACKAGE_PREPARATION (pre-fix it passed — Z-F-01), a proof-required filing with a satisfied
// package but no SIGNATURE criterion is refused at submission (pre-fix it passed — Z-F-02), and
// the flow that declares all three purposes goes through to SUBMISSION.
func TestZFRepro_R2FilingF_OnD9Semantics_HTTP(t *testing.T) {
	e := newEnv(t)
	m, req := proofFixture(t, e)
	base := "/api/v1/matters/" + m
	// The fixture designates no verifier; alice designates bob (EDITOR, never the evidence
	// submitter below) exactly like TestProof_HTTPFlow does.
	e.expect(e.do("POST", base+"/verifiers", "t-alice", nil, `{"userId":"`+e.bob+`"}`), 200, "")
	party := e.do("POST", base+"/parties", "t-alice", nil, `{"name":"Competition authority","kind":"AUTHORITY"}`)
	e.expect(party, 201, "")
	pid := party.json()["id"].(string)
	file := func(title string) string {
		r := e.do("POST", base+"/filings", "t-alice", key(), `{"title":"`+title+`","outcome":"Clearance","requirementId":"`+req+`","authorityPartyId":"`+pid+`","ownerId":"`+e.bob+`","proofRequired":true}`)
		e.expect(r, 201, "")
		return r.json()["id"].(string)
	}
	advance := func(id, body, tag string) resp {
		return e.do("POST", base+"/filings/"+id+"/stage", "t-alice", map[string]string{"If-Match": tag}, body)
	}
	etagOf := func(id string) string {
		return e.do("GET", base+"/filings/"+id, "t-carol", nil, "").Header().Get("ETag")
	}

	// Z-F-01 (r2 filing F): one OUTCOME criterion, zero PACKAGE criteria.
	f1 := file("Filing F (r2 repro)")
	e.expect(e.do("POST", base+"/work-items/"+f1+"/criteria", "t-alice", nil, `{"title":"Authority decision accepted","mandatory":true,"versionRule":"NONE","purpose":"OUTCOME"}`), 201, "")
	refused := advance(f1, `{"to":"PACKAGE_PREPARATION"}`, etagOf(f1))
	e.expect(refused, 409, "urn:mc:rejected")
	if refused.json()["code"] != "package-criteria-required" {
		t.Fatalf("the r2 filing F must be refused at PACKAGE_PREPARATION on the committed semantics: %s", refused.Body)
	}

	// Z-F-02: package declared and satisfied, but no SIGNATURE criterion — submission refuses.
	f2 := file("Filing G (Z-F-02)")
	pkgCr2 := e.do("POST", base+"/work-items/"+f2+"/criteria", "t-alice", nil, `{"title":"Package complete","mandatory":true,"versionRule":"NONE"}`)
	e.expect(pkgCr2, 201, "")
	pkgCrit2 := pkgCr2.json()["criteria"].([]any)[0].(map[string]any)["id"].(string)
	e.expect(advance(f2, `{"to":"PACKAGE_PREPARATION"}`, etagOf(f2)), 200, "")
	// Satisfy the package criterion first: the package gate outranks the signature gate, so the
	// signature refusal must be the one that fires here.
	pkgEv := e.do("POST", base+"/evidence", "t-alice", key(), `{"reference":"package-proof","claims":["`+pkgCrit2+`"]}`)
	e.expect(pkgEv, 201, "")
	// The evidence response does not echo claims; the claim id is read from the proof checklist.
	firstClaim := func(itemID, criterionID string) string {
		p := e.do("GET", base+"/work-items/"+itemID+"/proof", "t-carol", nil, "")
		e.expect(p, 200, "")
		for _, c := range p.json()["criteria"].([]any) {
			cm := c.(map[string]any)
			if cm["id"] == criterionID {
				return cm["claims"].([]any)[0].(map[string]any)["id"].(string)
			}
		}
		t.Fatalf("criterion %s not on the checklist of %s", criterionID, itemID)
		return ""
	}
	pkgClaim := firstClaim(f2, pkgCrit2)
	pkgA := e.do("POST", base+"/claims/"+pkgClaim+"/assessments", "t-bob", nil,
		`{"verdict":"ACCEPTED","rationale":"synthetic independent review","expectedSubjectEpoch":0,"expectedAssessmentId":""}`)
	e.expect(pkgA, 201, "")
	doc := e.do("POST", base+"/documents", "t-alice", key(), `{"name":"Filing package"}`)
	e.expect(doc, 201, "")
	v1 := e.do("POST", base+"/documents/"+doc.json()["id"].(string)+"/versions", "t-alice",
		map[string]string{"Idempotency-Key": uuid.Must(uuid.NewV7()).String(), "Content-Type": "application/pdf", "X-Filename": "package.pdf"}, "package contents")
	e.expect(v1, 201, "")
	vid := v1.json()["id"].(string)
	e.expect(advance(f2, `{"to":"SIGNATURE","versionIds":["`+vid+`"]}`, etagOf(f2)), 200, "")
	subRefused := advance(f2, `{"to":"SUBMISSION","reference":"SUB-1","versionIds":["`+vid+`"]}`, etagOf(f2))
	e.expect(subRefused, 409, "urn:mc:rejected")
	if subRefused.json()["code"] != "signature-criteria-required" {
		t.Fatalf("submission without a SIGNATURE criterion must refuse with signature-criteria-required: %s", subRefused.Body)
	}

	// The D-9 flow: PACKAGE + SIGNATURE + OUTCOME declared; package and signature accepted by the
	// independent verifier; submission passes and the outcome axis stays PENDING.
	f3 := file("Filing H (D-9 flow)")
	// The create response carries the WHOLE checklist sorted by id, so the new criterion is
	// picked by its unique title, not by position.
	critID := func(title, body string) string {
		cr := e.do("POST", base+"/work-items/"+f3+"/criteria", "t-alice", nil, body)
		e.expect(cr, 201, "")
		for _, c := range cr.json()["criteria"].([]any) {
			cm := c.(map[string]any)
			if cm["title"] == title {
				return cm["id"].(string)
			}
		}
		t.Fatalf("created criterion %q not in the checklist response", title)
		return ""
	}
	pkgCrit := critID("Package complete", `{"title":"Package complete","mandatory":true,"versionRule":"NONE"}`)
	sigCrit := critID("Signed filing form", `{"title":"Signed filing form","mandatory":true,"versionRule":"NONE","purpose":"SIGNATURE"}`)
	critID("Authority decision accepted", `{"title":"Authority decision accepted","mandatory":true,"versionRule":"NONE","purpose":"OUTCOME"}`)
	e.expect(advance(f3, `{"to":"PACKAGE_PREPARATION"}`, etagOf(f3)), 200, "")
	e.expect(advance(f3, `{"to":"SIGNATURE","versionIds":["`+vid+`"]}`, etagOf(f3)), 200, "")
	proof := e.do("GET", base+"/work-items/"+f3+"/proof", "t-carol", nil, "")
	e.expect(proof, 200, "")
	pj := proof.json()
	if pj["package"].(map[string]any)["total"].(float64) != 1 || pj["signature"].(map[string]any)["total"].(float64) != 1 || pj["outcome"].(map[string]any)["total"].(float64) != 1 {
		t.Fatalf("the three purposes read apart: %s", proof.Body)
	}
	claim := func(criterionID, reference string) string {
		ev := e.do("POST", base+"/evidence", "t-alice", key(), `{"reference":"`+reference+`","claims":["`+criterionID+`"]}`)
		e.expect(ev, 201, "")
		return firstClaim(f3, criterionID)
	}
	for _, pair := range [][2]string{{pkgCrit, "package-proof"}, {sigCrit, "signature-proof"}} {
		cl := claim(pair[0], pair[1])
		a := e.do("POST", base+"/claims/"+cl+"/assessments", "t-bob", nil,
			`{"verdict":"ACCEPTED","rationale":"synthetic independent review","expectedSubjectEpoch":0,"expectedAssessmentId":""}`)
		e.expect(a, 201, "")
	}
	submitted := advance(f3, `{"to":"SUBMISSION","reference":"SUB-1","versionIds":["`+vid+`"]}`, etagOf(f3))
	e.expect(submitted, 200, "")
	if st := submitted.json()["filing"].(map[string]any)["stage"]; st != "SUBMISSION" {
		t.Fatalf("the D-9 flow reaches SUBMISSION: %s", submitted.Body)
	}
	if ov := submitted.json()["outcomeVerification"]; ov != "PENDING" {
		t.Fatalf("the outcome axis stays pending on the committed semantics: %s", submitted.Body)
	}
}
