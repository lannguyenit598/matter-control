package productapi

import (
	"bytes"
	"context"
	"encoding/json"
	"mime/multipart"
	"net/http/httptest"
	"strings"
	"testing"
	"time"

	"github.com/google/uuid"

	"github.com/example/userapi/internal/core/domain/matter"
)

// multipartDo posts a sheet upload (file + fields + optional plan JSON part).
func (e *env) multipartDo(path, token, csv string, plan string) resp {
	e.t.Helper()
	return e.multipartSheetDo(path, token, "csv", csv, plan)
}

func (e *env) multipartSheetDo(path, token, format, content, plan string) resp {
	e.t.Helper()
	var buf bytes.Buffer
	mw := multipart.NewWriter(&buf)
	fw, err := mw.CreateFormFile("file", "counsel.csv")
	if err != nil {
		e.t.Fatal(err)
	}
	_, _ = fw.Write([]byte(content))
	_ = mw.WriteField("sourceName", "counsel.csv")
	_ = mw.WriteField("format", format)
	if plan != "" {
		_ = mw.WriteField("plan", plan)
	}
	_ = mw.Close()
	req := httptest.NewRequestWithContext(context.Background(), "POST", path, &buf)
	req.Header.Set("Content-Type", mw.FormDataContentType())
	req.Header.Set("Authorization", "Bearer "+token)
	rec := httptest.NewRecorder()
	e.h.ServeHTTP(rec, req)
	return resp{rec}
}

func (r resp) list() []map[string]any {
	var out []map[string]any
	if err := json.Unmarshal(r.Body.Bytes(), &out); err != nil {
		panic(err)
	}
	return out
}

// The bulk edit speaks the camelCase wire contract, authorizes by role, applies rows
// independently and replays a retried row without re-applying it.
func TestBulk_HTTPFlow(t *testing.T) {
	e := newEnvSized(t, 1<<20)
	m, req := proofFixture(t, e)
	base := "/api/v1/matters/" + m
	other := e.do("POST", base+"/requirements", "t-alice", key(), `{"title":"Second","outcome":"Done"}`)
	e.expect(other, 201, "")
	otherID := other.json()["id"].(string)

	k1, k2 := uuid.Must(uuid.NewV7()).String(), uuid.Must(uuid.NewV7()).String()
	body := `{"rows":[{"rowKey":"r1","itemId":"` + req + `","expectedRevision":1,"title":"Renamed"},{"rowKey":"r2","itemId":"` + otherID + `","expectedRevision":9,"title":"Stale"}]}`

	e.expect(e.do("POST", base+"/bulk/preview", "t-carol", nil, body), 403, "urn:mc:forbidden")
	e.expect(e.do("POST", base+"/bulk/preview", "t-alice", nil, `{"rows":[]}`), 400, "urn:mc:bad-request")
	pv := e.do("POST", base+"/bulk/preview", "t-alice", nil, body)
	e.expect(pv, 200, "")
	if pv.Header().Get("MC-As-Of") == "" {
		t.Fatal("a preview carries its as-of boundary")
	}
	pj := pv.json()
	rows := pj["rows"].([]any)
	first := rows[0].(map[string]any)
	if pj["previewId"] == "" || pj["asOf"] == "" || first["rowKey"] != "r1" || first["found"] != true || first["valid"] != true || first["title"] == nil {
		t.Fatalf("preview wire shape: %s", pv.Body)
	}

	commit := `{"attemptKey":"` + uuid.Must(uuid.NewV7()).String() + `","rows":[` +
		`{"rowKey":"r1","idempotencyKey":"` + k1 + `","itemId":"` + req + `","expectedRevision":1,"title":"Renamed"},` +
		`{"rowKey":"r2","idempotencyKey":"` + k2 + `","itemId":"` + otherID + `","expectedRevision":9,"title":"Stale"}]}`
	// Rights are decided for the endpoint, as for the preview: a viewer is refused outright.
	e.expect(e.do("POST", base+"/bulk/commit", "t-carol", nil, commit), 403, "urn:mc:forbidden")
	e.expect(e.do("POST", base+"/bulk/commit", "t-alice", nil, `{"rows":[]}`), 400, "urn:mc:bad-request")
	done := e.do("POST", base+"/bulk/commit", "t-alice", nil, commit)
	e.expect(done, 200, "")
	rs := done.list()
	if len(rs) != 2 || rs[0]["status"] != "SUCCESS" || rs[0]["itemId"] != req || rs[0]["revision"] == nil {
		t.Fatalf("row 1 applies: %s", done.Body)
	}
	if rs[1]["status"] != "FAILURE" || rs[1]["code"] != "stale" {
		t.Fatalf("a stale row fails alone, with a distinct code: %s", done.Body)
	}
	again := e.do("POST", base+"/bulk/commit", "t-alice", nil, commit).list()
	if again[0]["status"] != "SUCCESS_REPLAYED" {
		t.Fatalf("a retried row replays instead of re-applying: %v", again)
	}
	if got := e.do("GET", base+"/work-items/"+req, "t-alice", nil, "").json()["item"].(map[string]any); got["title"] != "Renamed" || got["revision"].(float64) != 2 {
		t.Fatalf("applied exactly once: %v", got)
	}
}

const importGraph = "rowkey,kind,title,description,dependencies\nR1,REQUIREMENT,Clearance,Obtain clearance,\nA1,ACTION,Prepare,Package ready,R1\n"

func TestImport_HTTPFlow(t *testing.T) {
	e := newEnvSized(t, 1<<20)
	m, _ := proofFixture(t, e)
	base := "/api/v1/matters/" + m

	e.expect(e.multipartDo(base+"/import/preview", "t-carol", importGraph, ""), 403, "urn:mc:forbidden")
	pv := e.multipartDo(base+"/import/preview", "t-alice", importGraph, "")
	e.expect(pv, 200, "")
	pj := pv.json()
	prow := pj["rows"].([]any)[1].(map[string]any)
	if pj["sourceName"] != "counsel.csv" || prow["rowKey"] != "A1" || prow["dependencies"].([]any)[0] != "R1" || len(prow["errors"].([]any)) != 0 || prow["contentHash"] == "" {
		t.Fatalf("preview wire shape: %s", pv.Body)
	}
	if g := pj["groups"].([]any); len(g) != 1 || g[0].(map[string]any)["valid"] != true || len(g[0].(map[string]any)["rowIdx"].([]any)) != 2 {
		t.Fatalf("a row-key reference forms one valid group: %s", pv.Body)
	}

	plan := `{"runKey":"` + uuid.Must(uuid.NewV7()).String() + `","rowKeys":{"R1":"` + uuid.Must(uuid.NewV7()).String() + `","A1":"` + uuid.Must(uuid.NewV7()).String() + `"}}`
	e.expect(e.multipartDo(base+"/import/commit", "t-alice", importGraph, ""), 400, "urn:mc:bad-request") // plan part is required
	done := e.multipartDo(base+"/import/commit", "t-alice", importGraph, plan)
	e.expect(done, 200, "")
	rs := done.list()
	if len(rs) != 2 || rs[0]["status"] != "SUCCESS" || rs[1]["status"] != "SUCCESS" || rs[1]["itemId"] == "" || rs[1]["contentHash"] == "" {
		t.Fatalf("both rows import: %s", done.Body)
	}
	detail := e.do("GET", base+"/work-items/"+rs[1]["itemId"].(string), "t-alice", nil, "").json()
	up := detail["upstream"].([]any)
	if len(up) != 1 || up[0].(map[string]any)["other"].(map[string]any)["id"] != rs[0]["itemId"] {
		t.Fatalf("the row-key reference became a persisted edge: %v", detail["upstream"])
	}
	replay := e.multipartDo(base+"/import/commit", "t-alice", importGraph, plan).list()
	if replay[0]["status"] != "SUCCESS_REPLAYED" || replay[1]["itemId"] != rs[1]["itemId"] {
		t.Fatalf("the same source replays: %v", replay)
	}

	// An invalid reference rejects its whole group with the reason, over the wire.
	bad := "rowkey,kind,title,description,dependencies\nB1,REQUIREMENT,Head,o,\nB2,ACTION,Tail,o,B1;NOPE\n"
	badPlan := `{"runKey":"` + uuid.Must(uuid.NewV7()).String() + `","rowKeys":{"B1":"` + uuid.Must(uuid.NewV7()).String() + `","B2":"` + uuid.Must(uuid.NewV7()).String() + `"}}`
	br := e.multipartDo(base+"/import/commit", "t-alice", bad, badPlan).list()
	for _, r := range br {
		if r["status"] != "FAILURE" || r["code"] != "group-rejected" || r["itemId"] != nil {
			t.Fatalf("group rejected whole: %v", br)
		}
	}
	if !strings.Contains(br[1]["detail"].(string), "NOPE") {
		t.Fatalf("the rejection names the bad reference: %v", br[1])
	}
	// A missing file is a bad request; an oversized upload is refused before it is parsed whole.
	e.expect(e.do("POST", base+"/import/preview", "t-alice", nil, "{}"), 400, "")
	huge := newEnvSized(t, 128)
	hm, _ := proofFixture(t, huge)
	hr := huge.multipartDo("/api/v1/matters/"+hm+"/import/preview", "t-alice", importGraph+strings.Repeat("X,ACTION,t,o,\n", 50), "")
	if hr.Code != 413 {
		t.Fatalf("an upload over the limit is refused: %d %s", hr.Code, hr.Body)
	}
}

func TestExportAndBrief_HTTP(t *testing.T) {
	e := newEnvSized(t, 1<<20)
	m, req := proofFixture(t, e)
	base := "/api/v1/matters/" + m

	csv := e.do("GET", base+"/export?format=csv", "t-carol", nil, "")
	e.expect(csv, 200, "")
	if !strings.HasPrefix(csv.Header().Get("Content-Type"), "text/csv") || !strings.Contains(csv.Header().Get("Content-Disposition"), "attachment") ||
		csv.Header().Get("MC-As-Of") == "" || !strings.Contains(csv.Body.String(), "Signed SPA") {
		t.Fatalf("csv export: %v %s", csv.Header(), csv.Body)
	}
	xlsx := e.do("GET", base+"/export", "t-carol", nil, "")
	e.expect(xlsx, 200, "")
	if !strings.HasPrefix(xlsx.Header().Get("Content-Type"), "application/vnd.openxmlformats") || !strings.HasPrefix(xlsx.Body.String(), "PK") {
		t.Fatalf("xlsx export: %v", xlsx.Header())
	}
	e.expect(e.do("GET", base+"/export?format=csv", "t-ghost", nil, ""), 403, "urn:mc:forbidden")

	t1 := "2020-01-01T00:00:00Z"
	t2 := csv.Header().Get("MC-As-Of")
	br := e.do("GET", base+"/brief?t1="+t1+"&t2="+t2, "t-carol", nil, "")
	e.expect(br, 200, "")
	bj := br.json()
	out := bj["outstanding"].([]any)
	if bj["matterId"] != m || bj["t1"] == "" || bj["asOf"] == "" || len(out) != 1 || out[0].(map[string]any)["itemId"] != req || len(bj["changes"].([]any)) == 0 {
		t.Fatalf("brief wire shape: %s", br.Body)
	}
	ch := bj["changes"].([]any)[0].(map[string]any)
	if ch["recordedAt"] == "" || ch["effectiveAt"] == "" || ch["lateRecorded"] != false {
		t.Fatalf("a change carries its recorded and effective time: %v", ch)
	}
	// t1 = t2: an empty window with the outstanding work still reported.
	same := e.do("GET", base+"/brief?t1="+t2+"&t2="+t2, "t-carol", nil, "").json()
	if len(same["changes"].([]any)) != 0 || len(same["outstanding"].([]any)) != 1 {
		t.Fatalf("empty window: %v", same)
	}
	e.expect(e.do("GET", base+"/brief?t1="+t2+"&t2="+t1, "t-carol", nil, ""), 400, "urn:mc:invalid-window")
	e.expect(e.do("GET", base+"/brief?t1="+t1+"&t2="+time.Now().Add(72*time.Hour).UTC().Format(time.RFC3339), "t-carol", nil, ""), 400, "urn:mc:invalid-window")
	e.expect(e.do("GET", base+"/brief?t1=yesterday&t2="+t2, "t-carol", nil, ""), 400, "urn:mc:bad-request")
	e.expect(e.do("GET", base+"/brief?t1="+t1, "t-carol", nil, ""), 400, "urn:mc:bad-request")
	e.expect(e.do("GET", base+"/brief?t1="+t1+"&t2="+t2, "t-ghost", nil, ""), 403, "urn:mc:forbidden")
}

func TestImport_WholeSheetFailureIsBadRequest(t *testing.T) {
	for _, tc := range []struct{ name, format, content string }{
		{"empty", "csv", ""}, {"missing rowkey", "csv", "kind,title\nACTION,T\n"}, {"missing kind", "csv", "rowkey,title\nR1,T\n"}, {"missing title", "csv", "rowkey,kind\nR1,ACTION\n"},
		{"malformed csv", "csv", "rowkey,kind,title\n\"unterminated"}, {"malformed xlsx", "xlsx", "private-invalid-workbook-content"},
		{"unsupported format", "txt", "rowkey,kind,title\n"}, {"rows", "csv", "rowkey,kind,title\n" + strings.Repeat("R,ACTION,T\n", 5001)},
	} {
		t.Run(tc.name, func(t *testing.T) {
			e := newEnvSized(t, 1<<20)
			m, _ := proofFixture(t, e)
			base := "/api/v1/matters/" + m
			before := e.do("GET", base+"/export?format=csv", "t-alice", nil, "").Body.String()
			plan := `{"runKey":"` + uuid.Must(uuid.NewV7()).String() + `","rowKeys":{}}`
			for _, path := range []string{"preview", "commit"} {
				r := e.multipartSheetDo(base+"/import/"+path, "t-alice", tc.format, tc.content, plan)
				e.expect(r, 400, "urn:mc:bad-request")
				if strings.Contains(r.Body.String(), "private-invalid-workbook-content") {
					t.Fatal("response leaked uploaded content")
				}
				if r.Header().Get("Content-Type") != "application/problem+json" {
					t.Fatalf("problem media type: %s", r.Header())
				}
			}
			if after := e.do("GET", base+"/export?format=csv", "t-alice", nil, "").Body.String(); after != before {
				t.Fatal("invalid import mutated export")
			}
		})
	}
}

func TestDataCommit_SavedReceiptScopeIsHiddenOverHTTP(t *testing.T) {
	for _, mode := range []string{"bulk", "import"} {
		t.Run(mode, func(t *testing.T) {
			e := newEnvSized(t, 1<<20)
			first, item := proofFixture(t, e)
			second, _ := proofFixture(t, e)
			key := uuid.Must(uuid.NewV7()).String()
			commit := func(m, title string) resp {
				if mode == "bulk" {
					return e.do("POST", "/api/v1/matters/"+m+"/bulk/commit", "t-bob", nil, `{"attemptKey":"attempt","rows":[{"rowKey":"R1","idempotencyKey":"`+key+`","itemId":"`+item+`","expectedRevision":1,"title":"`+title+`"}]}`)
				}
				plan := `{"runKey":"` + uuid.Must(uuid.NewV7()).String() + `","rowKeys":{"R1":"` + key + `"}}`
				return e.multipartDo("/api/v1/matters/"+m+"/import/commit", "t-bob", "rowkey,kind,title,description\nR1,ACTION,"+title+",Done\n", plan)
			}
			r := commit(first, "Changed")
			e.expect(r, 200, "")
			if r.list()[0]["status"] != "SUCCESS" {
				t.Fatalf("first: %s", r.Body)
			}
			e.world.SetMatterMembership(matter.MatterID(first), matter.ActorID(e.bob), matter.MatterRoleEditor, matter.StatusRevoked)
			before := e.do("GET", "/api/v1/matters/"+second+"/export?format=csv", "t-alice", nil, "").Body.String()
			for _, title := range []string{"Changed", "Different"} {
				r = commit(second, title)
				e.expect(r, 200, "")
				row := r.list()[0]
				if row["status"] != "FAILURE" || row["itemId"] != nil || row["revision"] != nil || row["contentHash"] != nil || (row["code"] != "hidden" && row["code"] != "not-found") {
					t.Fatalf("foreign outcome leaked: %s", r.Body)
				}
			}
			if after := e.do("GET", "/api/v1/matters/"+second+"/export?format=csv", "t-alice", nil, "").Body.String(); after != before {
				t.Fatal("denied replay mutated destination")
			}
		})
	}
}

// A lost answer is settled from the actor's own receipt: it names what the row committed, and nobody
// else can read it.
func TestDataReceipts_OwnLookupSettlesAnAttempt(t *testing.T) {
	e := newEnvSized(t, 1<<20)
	m, item := proofFixture(t, e)
	base := "/api/v1/matters/" + m
	bulkKey := uuid.Must(uuid.NewV7()).String()
	e.expect(e.do("POST", base+"/bulk/commit", "t-bob", nil, `{"attemptKey":"a","rows":[{"rowKey":"r1","idempotencyKey":"`+bulkKey+`","itemId":"`+item+`","expectedRevision":1,"title":"Renamed"}]}`), 200, "")
	importKey := uuid.Must(uuid.NewV7()).String()
	plan := `{"runKey":"` + uuid.Must(uuid.NewV7()).String() + `","rowKeys":{"R1":"` + importKey + `"}}`
	imp := e.multipartDo(base+"/import/commit", "t-bob", "rowkey,kind,title,description\nR1,ACTION,Imported,Done\n", plan)
	e.expect(imp, 200, "")

	b := e.do("GET", "/api/v1/operations/"+bulkKey, "t-bob", nil, "")
	e.expect(b, 200, "")
	if row := b.json()["bulkRow"].(map[string]any); b.json()["kind"] != "BULK_ROW_APPLIED" || row["itemId"] != item || row["revision"].(float64) != 2 {
		t.Fatalf("the bulk receipt names what committed: %s", b.Body)
	}
	i := e.do("GET", "/api/v1/operations/"+importKey, "t-bob", nil, "")
	e.expect(i, 200, "")
	if row := i.json()["importRow"].(map[string]any); i.json()["kind"] != "IMPORT_ROW_APPLIED" || row["itemId"] != imp.list()[0]["itemId"] || row["rowKey"] != "R1" {
		t.Fatalf("the import receipt names what committed: %s", i.Body)
	}
	if strings.Contains(b.Body.String(), "ontent") || strings.Contains(i.Body.String(), "ontentHash") {
		t.Fatal("a receipt carries no payload or content hash")
	}
	e.expect(e.do("GET", "/api/v1/operations/"+bulkKey, "t-alice", nil, ""), 404, "urn:mc:not-found") // another actor cannot read it
	e.expect(e.do("GET", "/api/v1/operations/"+uuid.Must(uuid.NewV7()).String(), "t-bob", nil, ""), 404, "urn:mc:not-found")
}
