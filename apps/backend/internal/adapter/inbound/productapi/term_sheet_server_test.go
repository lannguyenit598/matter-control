package productapi

import (
	"bytes"
	"context"
	"mime/multipart"
	"net/http/httptest"
	"strconv"
	"strings"
	"testing"

	"github.com/google/uuid"

	"leonx.me/matter-control/internal/adapter/outbound/sheet"
	"leonx.me/matter-control/internal/core/port"
)

func TestTermSheetMultipartRevisionAndReceipts(t *testing.T) {
	e := newEnvSized(t, 8<<20)
	matterID, _ := proofFixture(t, e)
	base := "/api/v1/matters/" + matterID
	doc := e.do("POST", base+"/documents", "t-alice", key(), `{"name":"Synthetic contract"}`)
	e.expect(doc, 201, "")
	version := e.do("POST", base+"/documents/"+doc.json()["id"].(string)+"/versions", "t-alice",
		withKey(uuid.Must(uuid.NewV7()).String(), map[string]string{"Content-Type": "application/pdf", "X-Filename": "contract.pdf"}), "synthetic")
	e.expect(version, 201, "")
	sourceID := version.json()["id"].(string)
	revision := func() int {
		return int(e.do("GET", base+"/term-lines", "t-alice", nil, "").json()["matterRevision"].(float64))
	}
	upload := func(k string, rev int, versionID, format, content string) resp {
		t.Helper()
		var buf bytes.Buffer
		writer := multipart.NewWriter(&buf)
		file, err := writer.CreateFormFile("file", "terms."+format)
		if err != nil {
			t.Fatal(err)
		}
		if _, err := file.Write([]byte(content)); err != nil {
			t.Fatal(err)
		}
		for name, value := range map[string]string{"format": format, "documentVersionId": versionID, "expectedRevision": strconv.Itoa(rev)} {
			if err := writer.WriteField(name, value); err != nil {
				t.Fatal(err)
			}
		}
		if err := writer.Close(); err != nil {
			t.Fatal(err)
		}
		req := httptest.NewRequestWithContext(context.Background(), "POST", base+"/term-lines/import", &buf)
		req.Header.Set("Content-Type", writer.FormDataContentType())
		req.Header.Set("Authorization", "Bearer t-alice")
		req.Header.Set("Idempotency-Key", k)
		rec := httptest.NewRecorder()
		e.h.ServeHTTP(rec, req)
		return resp{rec}
	}

	const header = "row_key,field,value_text,value_date\n"
	valid := header + "r1,NOTE,Original synthetic value,\n"
	initial := revision()
	fresh := func() string { return uuid.Must(uuid.NewV7()).String() }
	e.expect(upload(fresh(), initial, uuid.NewString(), "csv", valid), 404, "urn:mc:not-found")
	bad := upload(fresh(), initial, sourceID, "csv", header+"r1,INVALID,synthetic,\n")
	e.expect(bad, 200, "")
	rejected := bad.json()["rejected"].([]any)[0].(map[string]any)
	if rejected["rowKey"] != "row-2" || rejected["code"] != "validation" || rejected["detail"] == nil || revision() != initial {
		t.Fatalf("rejected sheet must leave revision unchanged: %s", bad.Body)
	}
	e.expect(upload(fresh(), initial, sourceID, "csv", valid+strings.Repeat("\n", port.MaxTermSheetBytes-len(valid)+1)),
		413, "urn:mc:payload-too-large")
	atCeiling := valid + strings.Repeat("\n", port.MaxTermSheetBytes-len(valid))
	originalKey := fresh()
	first := upload(originalKey, initial, sourceID, "csv", atCeiling)
	e.expect(first, 200, "")
	if len(first.json()["rejected"].([]any)) != 0 || first.json()["created"] != float64(1) || revision() != initial+1 {
		t.Fatalf("accepted sheet and revision: %s", first.Body)
	}
	noOp := upload(fresh(), initial+1, sourceID, "csv", valid)
	e.expect(noOp, 200, "")
	if noOp.json()["unchanged"] != float64(1) || revision() != initial+1 {
		t.Fatalf("identical facts should be a no-op: %s", noOp.Body)
	}
	xlsx, err := (sheet.Codec{}).EncodeXLSX("Terms", [][]string{
		{"row_key", "field", "value_text", "value_date"}, {"r1", "NOTE", "New synthetic value", ""},
	})
	if err != nil {
		t.Fatal(err)
	}
	e.expect(upload(fresh(), initial+1, sourceID, "xlsx", string(xlsx)), 200, "")
	e.expect(upload(fresh(), initial, sourceID, "csv", valid), 412, "urn:mc:precondition-failed")
	e.expect(upload(originalKey, initial, sourceID, "csv", valid), 422, "urn:mc:idempotency-key-reuse")
	replay := upload(originalKey, initial, sourceID, "csv", atCeiling)
	e.expect(replay, 200, "")
	if replay.json()["replayed"] != true || replay.json()["created"] != float64(1) || revision() != initial+2 {
		t.Fatalf("replay must preserve the original outcome without changing the Matter: %s", replay.Body)
	}
	lines := e.do("GET", base+"/term-lines", "t-alice", nil, "").json()["items"].([]any)
	if got := lines[0].(map[string]any)["valueText"]; got != "New synthetic value" {
		t.Fatalf("replay overwrote the newer sheet: %v", got)
	}
	events := e.do("GET", base+"/events", "t-alice", nil, "").Body.String()
	if strings.Count(events, "term_sheet.imported") != 2 || strings.Contains(events, "synthetic value") {
		t.Fatalf("history must carry two sanitized import events: %s", events)
	}
}
