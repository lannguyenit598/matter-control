package productapi

import (
	"errors"
	"testing"
)

func TestDecodeStrict(t *testing.T) {
	type body struct {
		Name string `json:"name"`
		Sub  *struct {
			A int `json:"a"`
		} `json:"sub"`
	}
	ok := []string{`{"name":"x"}`, ` {"name":"x","sub":{"a":1}} `}
	for _, in := range ok {
		var b body
		if err := decodeStrict([]byte(in), &b); err != nil {
			t.Errorf("%s: %v", in, err)
		}
	}
	bad := map[string]string{
		"unknown field":    `{"name":"x","actorId":"u"}`,
		"duplicate key":    `{"name":"x","name":"y"}`,
		"nested duplicate": `{"sub":{"a":1,"a":2}}`,
		"trailing data":    `{"name":"x"} {"name":"y"}`,
		"array top level":  `[{"name":"x"}]`,
		"empty":            ``,
		"wrong type":       `{"name":3}`,
		"truncated":        `{"name":"x"`,
		"scalar":           `"x"`,
	}
	for name, in := range bad {
		var b body
		if err := decodeStrict([]byte(in), &b); !errors.Is(err, errMalformed) {
			t.Errorf("%s: got %v, want errMalformed", name, err)
		}
	}
}

func TestFingerprint_FrameIsUnambiguousAndStable(t *testing.T) {
	base := fingerprint("POST", "/workspaces", "/api/v1/workspaces", []byte(`{"name":"a"}`), "")
	if base != fingerprint("POST", "/workspaces", "/api/v1/workspaces", []byte(`{"name":"a"}`), "") {
		t.Fatal("not deterministic")
	}
	variants := []string{
		fingerprint("PUT", "/workspaces", "/api/v1/workspaces", []byte(`{"name":"a"}`), ""),
		fingerprint("POST", "/other", "/api/v1/workspaces", []byte(`{"name":"a"}`), ""),
		fingerprint("POST", "/workspaces", "/api/v1/other", []byte(`{"name":"a"}`), ""),
		fingerprint("POST", "/workspaces", "/api/v1/workspaces", []byte(`{"name":"b"}`), ""),
		fingerprint("POST", "/workspaces", "/api/v1/workspaces", []byte(`{"name":"a"} `), ""), // no normalization
		fingerprint("POST", "/workspaces", "/api/v1/workspaces", []byte(`{"name":"a"}`), `"etag"`),
	}
	seen := map[string]bool{base: true}
	for i, v := range variants {
		if seen[v] {
			t.Errorf("variant %d collides", i)
		}
		seen[v] = true
	}
	// Length prefixes: moving bytes between adjacent members must change the hash.
	if fingerprint("POST", "ab", "c", nil, "") == fingerprint("POST", "a", "bc", nil, "") {
		t.Fatal("frame is ambiguous")
	}
}

func TestEtagIsStrongAndRepresentationDetermined(t *testing.T) {
	a, b := etagOf([]byte(`{"revision":1}`)), etagOf([]byte(`{"revision":2}`))
	if a == b || a != etagOf([]byte(`{"revision":1}`)) || a[0] != '"' || a[len(a)-1] != '"' {
		t.Fatalf("etag: %s %s", a, b)
	}
}
