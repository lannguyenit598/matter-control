package productapi

import (
	"context"
	"encoding/json"
	"strings"
	"testing"
	"time"

	"leonx.me/matter-control/internal/core/domain/matter"
	"leonx.me/matter-control/internal/core/port"
)

type notificationHTTPProbe struct {
	calls int
	keys  []string
	limit int
}

func (p *notificationHTTPProbe) ListNotifications(_ context.Context, q port.ListNotificationsQuery) (matter.NotificationPage, error) {
	p.limit = q.Limit
	return matter.NotificationPage{Items: []matter.Notification{{ID: "synthetic", SeenKey: strings.Repeat("a", 64), Seen: true, Kind: matter.NotificationOverdue}}, Total: 1}, nil
}
func (p *notificationHTTPProbe) MarkNotificationsSeen(_ context.Context, cmd port.MarkNotificationsSeenCmd) (time.Time, error) {
	p.calls++
	p.keys = cmd.Keys
	return cmd.At, nil
}
func TestNotificationsHTTPContract(t *testing.T) {
	e := newEnv(t)
	probe := &notificationHTTPProbe{}
	e.h = NewServer(Deps{Notifications: probe, Verifier: e.verifier, Identities: fakeResolver{"s-alice": e.alice}})
	e.expect(e.do("GET", "/api/v1/me/notifications", "", nil, ""), 401, "urn:mc:unauthenticated")
}
func TestNotificationsHTTPKeysAndLimits(t *testing.T) {
	e := newEnv(t)
	probe := &notificationHTTPProbe{}
	e.h = NewServer(Deps{Notifications: probe, Verifier: e.verifier, Identities: fakeResolver{"s-alice": e.alice}})
	read := e.do("GET", "/api/v1/me/notifications?limit=50", "t-alice", nil, "")
	e.expect(read, 200, "")
	item := read.json()["items"].([]any)[0].(map[string]any)
	if item["seen"] != true || item["seenKey"] != strings.Repeat("a", 64) || probe.limit != 50 {
		t.Fatalf("DTO/limit: %s", read.Body)
	}
	e.expect(e.do("GET", "/api/v1/me/notifications?limit=201", "t-alice", nil, ""), 400, "urn:mc:bad-request")
	for _, body := range []string{`{}`, `{"keys":[]}`, `{"keys":["` + strings.Repeat("a", 64) + `"]}`} {
		e.expect(e.do("POST", "/api/v1/me/notifications/seen", "t-alice", nil, body), 200, "")
	}
	before := probe.calls
	keys := make([]string, 201)
	for i := range keys {
		keys[i] = strings.Repeat("a", 64)
	}
	large, err := json.Marshal(map[string]any{"keys": keys})
	if err != nil {
		t.Fatal(err)
	}
	for _, body := range []string{`{"keys":["bad"]}`, `{"keys":["` + strings.Repeat("a", 64) + `","` + strings.Repeat("a", 64) + `"]}`, string(large)} {
		e.expect(e.do("POST", "/api/v1/me/notifications/seen", "t-alice", nil, body), 422, "urn:mc:validation")
	}
	if probe.calls != before {
		t.Fatal("invalid keys reached service")
	}
	e.expect(e.do("POST", "/api/v1/me/notifications/seen", "t-alice", nil, `{"actorId":"other","keys":[]}`), 400, "urn:mc:malformed-body")
}
