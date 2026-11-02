package productapi

import (
	"encoding/base64"
	"errors"
	"strings"
	"testing"
	"time"

	"leonx.me/matter-control/internal/core/port"
)

func TestSearchCursorAuthenticatedPrivateAndBound(t *testing.T) {
	now := time.Unix(1800000000, 0)
	key := base64.StdEncoding.EncodeToString([]byte(strings.Repeat("k", 32)))
	codec := NewSearchCursors(key, func() time.Time { return now })
	binding := port.SearchBinding{ActorID: "actor", Epoch: "epoch", Query: "Confidential Đề", Group: "workItems", Limit: 5}
	anchor := port.SearchAnchor{Kind: "ACTION", ID: "id", Fingerprint: "hash"}
	token, err := codec.Seal(binding, anchor)
	if err != nil {
		t.Fatal(err)
	}
	got, err := codec.Open(token, binding)
	if err != nil || got != anchor {
		t.Fatalf("roundtrip: %+v %v", got, err)
	}
	raw, _ := base64.RawURLEncoding.DecodeString(token)
	if strings.Contains(string(raw), "Confidential") || strings.Contains(string(raw), "epoch") {
		t.Fatal("plaintext leaked")
	}
	for _, change := range []func(*port.SearchBinding){func(b *port.SearchBinding) { b.ActorID = "other" }, func(b *port.SearchBinding) { b.Epoch = "other" }, func(b *port.SearchBinding) { b.Query = "other" }, func(b *port.SearchBinding) { b.Group = "documents" }, func(b *port.SearchBinding) { b.Limit = 10 }, func(b *port.SearchBinding) { b.MatterID = "other" }} {
		other := binding
		change(&other)
		if _, err = codec.Open(token, other); !errors.Is(err, port.ErrSearchStale) {
			t.Fatal("unbound")
		}
	}
	for _, bad := range []string{token[:len(token)-2], token + "x", strings.Repeat("a", 2049)} {
		if _, err = codec.Open(bad, binding); err == nil {
			t.Fatal("tamper accepted")
		}
	}
	now = now.Add(6 * time.Minute)
	if _, err = codec.Open(token, binding); err == nil {
		t.Fatal("expired")
	}
	if NewSearchCursors("", time.Now) != nil {
		t.Fatal("missing key enabled")
	}
}
