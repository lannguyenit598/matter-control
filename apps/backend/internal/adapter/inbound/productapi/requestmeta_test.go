package productapi

import (
	"testing"

	"github.com/google/uuid"
)

// A1: the requestMeta middleware injects the client IP (remote address at the test boundary)
// and a server-generated correlation id, so every security-audit row is traceable to a request
// even when the caller sends no headers.
func TestSecurityAuditCarriesRequestMeta(t *testing.T) {
	e := newEnv(t)
	// A real workspace, then a MEMBER attempting an admin grant: the command-path deny records
	// the restricted audit row.
	ws := e.do("POST", "/api/v1/workspaces", "t-alice", key(), `{"name":"Acme"}`)
	wsID := ws.json()["id"].(string)
	// t-bob has no membership: the workspace is hidden (uniform 404) and the hidden-command
	// deny records the audit row (W1 contract asserts the same increment).
	e.expect(e.do("POST", "/api/v1/workspaces/"+wsID+"/members", "t-bob", key(),
		`{"userId":"`+uuid.NewString()+`","role":"MEMBER"}`), 404, "urn:mc:not-found")
	audits := e.world.Audits()
	if len(audits) == 0 {
		t.Fatal("no audit rows recorded")
	}
	last := audits[len(audits)-1]
	// The env's fake transport declares an X-Forwarded-For hop (TEST-NET); the middleware
	// prefers it, which is the documented behavior.
	if last.ClientIP != "192.0.2.1" {
		t.Fatalf("client ip = %q, want the declared forwarded hop", last.ClientIP)
	}
	if len(last.RequestID) < 16 {
		t.Fatalf("request id must be a generated correlation id, got %q", last.RequestID)
	}
}

// An inbound well-formed X-Request-Id is preserved as the correlation id.
func TestSecurityAuditHonorsInboundRequestID(t *testing.T) {
	e := newEnv(t)
	ws2 := e.do("POST", "/api/v1/workspaces", "t-alice", key(), `{"name":"Beta"}`)
	wsID2 := ws2.json()["id"].(string)
	e.expect(e.do("POST", "/api/v1/workspaces/"+wsID2+"/members", "t-bob",
		map[string]string{"X-Request-Id": "web-abc-123", "Idempotency-Key": uuid.NewString(), "Content-Type": "application/json"},
		`{"userId":"`+uuid.NewString()+`","role":"MEMBER"}`), 404, "urn:mc:not-found")
	audits := e.world.Audits()
	last := audits[len(audits)-1]
	if last.RequestID != "web-abc-123" {
		t.Fatalf("inbound request id not honored: %q", last.RequestID)
	}
}
