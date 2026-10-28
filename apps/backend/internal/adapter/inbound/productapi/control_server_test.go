package productapi

import (
	"testing"

	"github.com/google/uuid"
)

func TestControlRoomAndContext_HTTP(t *testing.T) {
	e := newEnv(t)
	m, req := proofFixture(t, e)
	base := "/api/v1/matters/" + m

	// context records: receipted creation, strong ETag, CAS update
	k := uuid.Must(uuid.NewV7()).String()
	body := `{"kind":"DECISION","title":"Choose the filing route","body":"short or long form","links":["` + req + `"]}`
	created := e.do("POST", base+"/context-records", "t-alice", withKey(k, nil), body)
	e.expect(created, 201, "")
	replay := e.do("POST", base+"/context-records", "t-alice", withKey(k, nil), body)
	if replay.Header().Get("Idempotent-Replayed") != "true" || replay.Body.String() != created.Body.String() {
		t.Fatalf("replay must be byte-stable: %s vs %s", replay.Body, created.Body)
	}
	e.expect(e.do("POST", base+"/context-records", "t-carol", key(), body), 403, "urn:mc:forbidden")
	e.expect(e.do("POST", base+"/context-records", "t-alice", key(), `{"kind":"NOTE","title":"x"}`), 422, "urn:mc:validation")
	e.expect(e.do("POST", base+"/context-records", "t-alice", key(), `{"kind":"RISK","title":"x","links":["`+uuid.NewString()+`"]}`), 409, "urn:mc:rejected")
	id := created.json()["id"].(string)

	lst := e.do("GET", base+"/context-records", "t-carol", nil, "")
	e.expect(lst, 200, "")
	rec := lst.json()["items"].([]any)[0].(map[string]any)
	tag := rec["etag"].(string)
	patch := `{"close":true,"reason":"decided"}`
	e.expect(e.do("PATCH", base+"/context-records/"+id, "t-alice", nil, patch), 428, "urn:mc:precondition-required")
	e.expect(e.do("PATCH", base+"/context-records/"+id, "t-alice", map[string]string{"If-Match": `"` + uuid.NewString() + `"`}, patch), 412, "urn:mc:precondition-failed")
	e.expect(e.do("PATCH", base+"/context-records/"+id, "t-carol", map[string]string{"If-Match": tag}, patch), 403, "urn:mc:forbidden")
	e.expect(e.do("PATCH", base+"/context-records/"+id, "t-alice", map[string]string{"If-Match": tag}, `{"close":true}`), 409, "urn:mc:rejected")
	ok := e.do("PATCH", base+"/context-records/"+id, "t-alice", map[string]string{"If-Match": tag}, patch)
	e.expect(ok, 200, "")
	if ok.json()["status"] != "CLOSED" || ok.Header().Get("ETag") == tag {
		t.Fatalf("%s", ok.Body)
	}

	// the Control Room: boundary, sections, no mutation
	e.expect(e.do("POST", base+"/context-records", "t-alice", key(), `{"kind":"RISK","title":"Counterparty may delay","links":["`+req+`"]}`), 201, "")
	room := e.do("GET", base+"/control-room?changes=5", "t-carol", nil, "")
	e.expect(room, 200, "")
	if room.Header().Get("MC-As-Of") == "" || room.Header().Get("MC-Source-Revision") == "" {
		t.Fatalf("the response states its boundary: %v", room.Header())
	}
	rj := room.json()
	if rj["asOf"] == "" || rj["state"].(map[string]any)["total"].(float64) != 1 || len(rj["risks"].([]any)) != 1 || len(rj["decisions"].([]any)) != 0 {
		t.Fatalf("%s", room.Body)
	}
	for _, section := range []string{"blockers", "nextActions", "waiting", "milestones", "gaps", "findings", "changes"} {
		if _, ok := rj[section].([]any); !ok {
			t.Fatalf("section %s must be a list, never null/absent: %s", section, room.Body)
		}
	}
	if len(rj["changes"].([]any)) == 0 || len(rj["changes"].([]any)) > 5 {
		t.Fatalf("changes honours its bound: %d", len(rj["changes"].([]any)))
	}
	// F04: the room carries every record (closed ones too) and the labels it refers to, so a page
	// needs no second read to describe it.
	recs := rj["records"].([]any)
	titles := rj["titles"].(map[string]any)
	if len(recs) != 2 || titles[req] == nil {
		t.Fatalf("records and titles belong to the same snapshot: %s", room.Body)
	}
	e.expect(e.do("GET", base+"/control-room?changes=0", "t-carol", nil, ""), 400, "urn:mc:bad-request")
	e.expect(e.do("GET", base+"/control-room", "t-ghost", nil, ""), 403, "urn:mc:forbidden")
}
