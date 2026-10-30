package zitadel

import (
	"context"
	"crypto"
	"crypto/rand"
	"crypto/rsa"
	"crypto/sha256"
	"crypto/x509"
	"encoding/base64"
	"encoding/json"
	"encoding/pem"
	"errors"
	"net/http"
	"net/http/httptest"
	"strings"
	"sync/atomic"
	"testing"
	"time"

	"leonx.me/matter-control/internal/core/port"
)

const (
	testIssuer   = "http://localhost:8080"
	testAudience = "396855361123975171"
	testClientID = "396855361123975171"
	testKeyID    = "key-1"
)

var now = time.Date(2026, 10, 27, 12, 0, 0, 0, time.UTC)

type fakeIdP struct {
	srv      *httptest.Server
	key      *rsa.PrivateKey
	hits     atomic.Int32
	respond  func(w http.ResponseWriter, token string)
	assertOK atomic.Bool
	at       func() time.Time // the double's notion of now (assertion freshness)
}

func newFakeIdP(t *testing.T) *fakeIdP {
	t.Helper()
	key, err := rsa.GenerateKey(rand.Reader, 2048)
	if err != nil {
		t.Fatal(err)
	}
	f := &fakeIdP{key: key, at: func() time.Time { return now }}
	f.assertOK.Store(true)
	f.srv = httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		f.hits.Add(1)
		if err := r.ParseForm(); err != nil {
			http.Error(w, "bad form", http.StatusBadRequest)
			return
		}
		if r.PostForm.Get("client_assertion_type") != "urn:ietf:params:oauth:client-assertion-type:jwt-bearer" ||
			!f.checkAssertion(r.PostForm.Get("client_assertion")) {
			f.assertOK.Store(false)
			w.WriteHeader(http.StatusUnauthorized)
			_, _ = w.Write([]byte(`{"error":"invalid_client"}`))
			return
		}
		f.respond(w, r.PostForm.Get("token"))
	}))
	t.Cleanup(f.srv.Close)
	return f
}

// checkAssertion verifies the RS256 signature, header and claims of the client assertion.
func (f *fakeIdP) checkAssertion(jwt string) bool {
	parts := strings.Split(jwt, ".")
	if len(parts) != 3 {
		return false
	}
	sig, err := base64.RawURLEncoding.DecodeString(parts[2])
	if err != nil {
		return false
	}
	digest := sha256.Sum256([]byte(parts[0] + "." + parts[1]))
	if rsa.VerifyPKCS1v15(&f.key.PublicKey, crypto.SHA256, digest[:], sig) != nil {
		return false
	}
	var hdr struct{ Alg, Kid string }
	var claims struct {
		Iss, Sub string
		Aud      any
		Iat, Exp int64
	}
	hb, _ := base64.RawURLEncoding.DecodeString(parts[0])
	cb, _ := base64.RawURLEncoding.DecodeString(parts[1])
	if json.Unmarshal(hb, &hdr) != nil || json.Unmarshal(cb, &claims) != nil {
		return false
	}
	return hdr.Alg == "RS256" && hdr.Kid == testKeyID &&
		claims.Iss == testClientID && claims.Sub == testClientID && claims.Aud == testIssuer &&
		claims.Iat <= f.at().Unix() && claims.Exp > f.at().Unix()
}

func (f *fakeIdP) pem() []byte {
	return pem.EncodeToMemory(&pem.Block{Type: "RSA PRIVATE KEY", Bytes: x509.MarshalPKCS1PrivateKey(f.key)})
}

func (f *fakeIdP) verifier(t *testing.T) *Verifier {
	t.Helper()
	v, err := New(Config{
		IntrospectionURL: f.srv.URL, Issuer: testIssuer, Audience: testAudience,
		ClientID: testClientID, KeyID: testKeyID, PrivateKeyPEM: f.pem(),
		Clock: func() time.Time { return now }, Timeout: 2 * time.Second,
	})
	if err != nil {
		t.Fatal(err)
	}
	return v
}

func activeBody(w http.ResponseWriter, sub string, aud any, iss string, exp time.Time) {
	_ = json.NewEncoder(w).Encode(map[string]any{
		"active": true, "sub": sub, "aud": aud, "iss": iss, "exp": exp.Unix(),
		"username": "ignored@example.test",
	})
}

func TestVerify_ActiveTokenIsNormalized(t *testing.T) {
	f := newFakeIdP(t)
	f.respond = func(w http.ResponseWriter, _ string) {
		activeBody(w, "user-1", []string{"other", testAudience}, testIssuer, now.Add(time.Hour))
	}
	got, err := f.verifier(t).Verify(context.Background(), "opaque-token")
	if err != nil {
		t.Fatal(err)
	}
	if !got.Active || got.Issuer != testIssuer || got.Subject != "user-1" || !got.ExpiresAt.Equal(now.Add(time.Hour)) {
		t.Fatalf("token: %+v", got)
	}
	if !f.assertOK.Load() {
		t.Fatal("client assertion was not accepted by the IdP double")
	}
}

func TestVerify_StringAudienceAccepted(t *testing.T) {
	f := newFakeIdP(t)
	f.respond = func(w http.ResponseWriter, _ string) {
		activeBody(w, "user-1", testAudience, testIssuer, now.Add(time.Hour))
	}
	if _, err := f.verifier(t).Verify(context.Background(), "t"); err != nil {
		t.Fatal(err)
	}
}

func TestVerify_RejectsAsUnauthenticated(t *testing.T) {
	cases := map[string]func(w http.ResponseWriter){
		"inactive": func(w http.ResponseWriter) { _, _ = w.Write([]byte(`{"active":false}`)) },
		"wrong issuer": func(w http.ResponseWriter) {
			activeBody(w, "u", testAudience, "http://evil.example", now.Add(time.Hour))
		},
		"wrong audience": func(w http.ResponseWriter) {
			activeBody(w, "u", []string{"zitadel-admin"}, testIssuer, now.Add(time.Hour))
		},
		"missing aud":   func(w http.ResponseWriter) { activeBody(w, "u", nil, testIssuer, now.Add(time.Hour)) },
		"expired":       func(w http.ResponseWriter) { activeBody(w, "u", testAudience, testIssuer, now.Add(-2*time.Minute)) },
		"empty subject": func(w http.ResponseWriter) { activeBody(w, "", testAudience, testIssuer, now.Add(time.Hour)) },
		"no expiry": func(w http.ResponseWriter) {
			_, _ = w.Write([]byte(`{"active":true,"sub":"u","aud":"` + testAudience + `","iss":"` + testIssuer + `"}`))
		},
	}
	for name, body := range cases {
		t.Run(name, func(t *testing.T) {
			f := newFakeIdP(t)
			f.respond = func(w http.ResponseWriter, _ string) { body(w) }
			_, err := f.verifier(t).Verify(context.Background(), "t")
			if !errors.Is(err, port.ErrUnauthenticated) {
				t.Fatalf("got %v, want ErrUnauthenticated", err)
			}
		})
	}
}

func TestVerify_ExpiryLeewayIsBounded(t *testing.T) {
	f := newFakeIdP(t)
	f.respond = func(w http.ResponseWriter, _ string) {
		activeBody(w, "u", testAudience, testIssuer, now.Add(-30*time.Second))
	}
	if _, err := f.verifier(t).Verify(context.Background(), "t"); err != nil {
		t.Fatalf("30s past expiry is inside the 60s leeway: %v", err)
	}
}

func TestVerify_EmptyBearerNeverCallsTheIdP(t *testing.T) {
	f := newFakeIdP(t)
	f.respond = func(w http.ResponseWriter, _ string) { t.Error("must not be called") }
	_, err := f.verifier(t).Verify(context.Background(), "  ")
	if !errors.Is(err, port.ErrUnauthenticated) || f.hits.Load() != 0 {
		t.Fatalf("err=%v hits=%d", err, f.hits.Load())
	}
}

func TestVerify_OutagesFailClosedAsUnavailable(t *testing.T) {
	cases := map[string]func(w http.ResponseWriter){
		"5xx":               func(w http.ResponseWriter) { w.WriteHeader(http.StatusBadGateway) },
		"assertion refused": func(w http.ResponseWriter) { w.WriteHeader(http.StatusUnauthorized) },
		"garbage":           func(w http.ResponseWriter) { _, _ = w.Write([]byte("<html>")) },
	}
	for name, body := range cases {
		t.Run(name, func(t *testing.T) {
			f := newFakeIdP(t)
			f.respond = func(w http.ResponseWriter, _ string) { body(w) }
			_, err := f.verifier(t).Verify(context.Background(), "t")
			if !errors.Is(err, port.ErrUnavailable) || errors.Is(err, port.ErrUnauthenticated) {
				t.Fatalf("got %v, want ErrUnavailable only", err)
			}
		})
	}
	t.Run("unreachable", func(t *testing.T) {
		f := newFakeIdP(t)
		f.respond = func(w http.ResponseWriter, _ string) {}
		v := f.verifier(t)
		f.srv.Close()
		if _, err := v.Verify(context.Background(), "t"); !errors.Is(err, port.ErrUnavailable) {
			t.Fatalf("got %v", err)
		}
	})
}

func TestVerify_CacheIsBoundedAndNotAForeverGuarantee(t *testing.T) {
	f := newFakeIdP(t)
	f.respond = func(w http.ResponseWriter, _ string) {
		activeBody(w, "u", testAudience, testIssuer, now.Add(time.Hour))
	}
	clock := now
	f.at = func() time.Time { return clock }
	v, err := New(Config{
		IntrospectionURL: f.srv.URL, Issuer: testIssuer, Audience: testAudience,
		ClientID: testClientID, KeyID: testKeyID, PrivateKeyPEM: f.pem(),
		Clock: func() time.Time { return clock }, CacheTTL: 30 * time.Second,
	})
	if err != nil {
		t.Fatal(err)
	}
	for range 3 {
		if _, err := v.Verify(context.Background(), "same"); err != nil {
			t.Fatal(err)
		}
	}
	if f.hits.Load() != 1 {
		t.Fatalf("hits within TTL = %d, want 1", f.hits.Load())
	}
	clock = clock.Add(31 * time.Second)
	if _, err := v.Verify(context.Background(), "same"); err != nil {
		t.Fatal(err)
	}
	if f.hits.Load() != 2 {
		t.Fatalf("hits after TTL = %d, want 2", f.hits.Load())
	}
	// A token that later becomes inactive is NOT cached as active past the TTL, and
	// inactive results are never cached at all.
	f.respond = func(w http.ResponseWriter, _ string) { _, _ = w.Write([]byte(`{"active":false}`)) }
	clock = clock.Add(31 * time.Second)
	for range 2 {
		if _, err := v.Verify(context.Background(), "same"); !errors.Is(err, port.ErrUnauthenticated) {
			t.Fatalf("got %v", err)
		}
	}
}

func TestNew_RejectsBadConfiguration(t *testing.T) {
	f := newFakeIdP(t)
	base := Config{IntrospectionURL: f.srv.URL, Issuer: testIssuer, Audience: testAudience, ClientID: testClientID, KeyID: testKeyID, PrivateKeyPEM: f.pem()}
	for name, mutate := range map[string]func(*Config){
		"no url":      func(c *Config) { c.IntrospectionURL = "" },
		"no issuer":   func(c *Config) { c.Issuer = "" },
		"no audience": func(c *Config) { c.Audience = "" },
		"no client":   func(c *Config) { c.ClientID = "" },
		"no key id":   func(c *Config) { c.KeyID = "" },
		"bad pem":     func(c *Config) { c.PrivateKeyPEM = []byte("nope") },
	} {
		t.Run(name, func(t *testing.T) {
			c := base
			mutate(&c)
			if _, err := New(c); err == nil {
				t.Fatal("expected error")
			}
		})
	}
}
