// Package zitadel verifies OAuth access tokens by authenticated introspection against a
// ZITADEL instance (RFC 7662), authenticating with a private-key JWT client assertion
// (RFC 7523). Opaque tokens are never parsed; ID tokens are never accepted as bearers.
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
	"fmt"
	"io"
	"net/http"
	"net/url"
	"strings"
	"sync"
	"time"

	"leonx.me/matter-control/internal/core/port"
)

const (
	assertionType = "urn:ietf:params:oauth:client-assertion-type:jwt-bearer"
	// expiryLeeway absorbs clock skew between this process and the issuer.
	expiryLeeway = 60 * time.Second
	// assertionLifetime is deliberately short: one assertion per introspection call.
	assertionLifetime = time.Minute
	maxCacheEntries   = 1024
	maxResponseBytes  = 1 << 20
)

// Config pins everything the verifier relies on. Nothing is discovered at request time.
type Config struct {
	IntrospectionURL string
	// Issuer is the one canonical issuer: it is both the client-assertion audience and
	// the exact value the introspected token must carry as iss.
	Issuer string
	// Audience is the MatterControl API audience (the API application's client id)
	// that the introspected token must contain.
	Audience      string
	ClientID      string
	KeyID         string
	PrivateKeyPEM []byte
	HTTPClient    *http.Client
	Timeout       time.Duration
	Clock         func() time.Time
	// CacheTTL bounds the per-token result cache. Zero disables caching. A cached result is
	// NOT a revocation guarantee; it is only a load shield: a revoked token may keep passing
	// for up to TTL after revocation (config default 15s — a deliberate, documented window).
	CacheTTL time.Duration
}

// Verifier implements port.TokenVerifier.
type Verifier struct {
	cfg   Config
	key   *rsa.PrivateKey
	http  *http.Client
	clock func() time.Time

	mu    sync.Mutex
	cache map[[32]byte]cached
}

type cached struct {
	token   port.VerifiedToken
	expires time.Time
}

var _ port.TokenVerifier = (*Verifier)(nil)

// New validates the configuration and parses the signing key.
func New(cfg Config) (*Verifier, error) {
	for name, v := range map[string]string{
		"introspection url": cfg.IntrospectionURL, "issuer": cfg.Issuer, "audience": cfg.Audience,
		"client id": cfg.ClientID, "key id": cfg.KeyID,
	} {
		if strings.TrimSpace(v) == "" {
			return nil, fmt.Errorf("zitadel verifier: %s is required", name)
		}
	}
	key, err := parseRSAKey(cfg.PrivateKeyPEM)
	if err != nil {
		return nil, err
	}
	client := cfg.HTTPClient
	if client == nil {
		timeout := cfg.Timeout
		if timeout <= 0 {
			timeout = 5 * time.Second
		}
		client = &http.Client{Timeout: timeout}
	}
	clock := cfg.Clock
	if clock == nil {
		clock = time.Now
	}
	return &Verifier{cfg: cfg, key: key, http: client, clock: clock, cache: map[[32]byte]cached{}}, nil
}

func parseRSAKey(raw []byte) (*rsa.PrivateKey, error) {
	block, _ := pem.Decode(raw)
	if block == nil {
		return nil, errors.New("zitadel verifier: private key is not PEM")
	}
	if k, err := x509.ParsePKCS1PrivateKey(block.Bytes); err == nil {
		return k, nil
	}
	parsed, err := x509.ParsePKCS8PrivateKey(block.Bytes)
	if err != nil {
		return nil, errors.New("zitadel verifier: private key is neither PKCS#1 nor PKCS#8")
	}
	k, ok := parsed.(*rsa.PrivateKey)
	if !ok {
		return nil, errors.New("zitadel verifier: private key is not RSA")
	}
	return k, nil
}

// Verify introspects the bearer. Invalid/inactive tokens are ErrUnauthenticated;
// anything that prevents a trustworthy answer (transport, 5xx, a refused client
// assertion, malformed responses) is ErrUnavailable — never a silent allow or deny.
func (v *Verifier) Verify(ctx context.Context, bearer string) (port.VerifiedToken, error) {
	bearer = strings.TrimSpace(bearer)
	if bearer == "" {
		return port.VerifiedToken{}, port.ErrUnauthenticated
	}
	now := v.clock()
	sum := sha256.Sum256([]byte(bearer))
	if tok, ok := v.lookup(sum, now); ok {
		return tok, nil
	}
	resp, err := v.introspect(ctx, bearer, now)
	if err != nil {
		return port.VerifiedToken{}, err
	}
	tok, err := v.check(resp, now)
	if err != nil {
		return port.VerifiedToken{}, err
	}
	v.store(sum, tok, now)
	return tok, nil
}

type introspectionResponse struct {
	Active bool            `json:"active"`
	Sub    string          `json:"sub"`
	Iss    string          `json:"iss"`
	Aud    json.RawMessage `json:"aud"`
	Exp    int64           `json:"exp"`
}

func (v *Verifier) introspect(ctx context.Context, bearer string, now time.Time) (introspectionResponse, error) {
	assertion, err := v.assertion(now)
	if err != nil {
		return introspectionResponse{}, fmt.Errorf("zitadel verifier: %w: %w", port.ErrUnavailable, err)
	}
	form := url.Values{
		"client_assertion_type": {assertionType},
		"client_assertion":      {assertion},
		"token":                 {bearer},
	}
	req, err := http.NewRequestWithContext(ctx, http.MethodPost, v.cfg.IntrospectionURL, strings.NewReader(form.Encode()))
	if err != nil {
		return introspectionResponse{}, fmt.Errorf("zitadel verifier: %w: %w", port.ErrUnavailable, err)
	}
	req.Header.Set("Content-Type", "application/x-www-form-urlencoded")
	req.Header.Set("Accept", "application/json")
	res, err := v.http.Do(req)
	if err != nil {
		// Transport errors never echo the request (it carries the token).
		return introspectionResponse{}, fmt.Errorf("zitadel verifier: %w: introspection request failed", port.ErrUnavailable)
	}
	defer func() { _ = res.Body.Close() }()
	if res.StatusCode != http.StatusOK {
		// 401 invalid_client means OUR assertion was refused: an operational fault, not
		// a statement about the user's token.
		_, _ = io.Copy(io.Discard, io.LimitReader(res.Body, maxResponseBytes))
		return introspectionResponse{}, fmt.Errorf("zitadel verifier: %w: introspection returned HTTP %d", port.ErrUnavailable, res.StatusCode)
	}
	var out introspectionResponse
	if err := json.NewDecoder(io.LimitReader(res.Body, maxResponseBytes)).Decode(&out); err != nil {
		return introspectionResponse{}, fmt.Errorf("zitadel verifier: %w: malformed introspection response", port.ErrUnavailable)
	}
	return out, nil
}

func (v *Verifier) check(r introspectionResponse, now time.Time) (port.VerifiedToken, error) {
	if !r.Active {
		return port.VerifiedToken{}, port.ErrUnauthenticated
	}
	aud, ok := audiences(r.Aud)
	if !ok || r.Iss != v.cfg.Issuer || strings.TrimSpace(r.Sub) == "" || r.Exp == 0 {
		return port.VerifiedToken{}, port.ErrUnauthenticated
	}
	contains := false
	for _, a := range aud {
		if a == v.cfg.Audience {
			contains = true
		}
	}
	exp := time.Unix(r.Exp, 0).UTC()
	if !contains || now.After(exp.Add(expiryLeeway)) {
		return port.VerifiedToken{}, port.ErrUnauthenticated
	}
	return port.VerifiedToken{Active: true, Issuer: r.Iss, Subject: r.Sub, ExpiresAt: exp, Audience: aud}, nil
}

// audiences accepts the two RFC 7519 shapes: a string or an array of strings.
func audiences(raw json.RawMessage) ([]string, bool) {
	if len(raw) == 0 {
		return nil, false
	}
	var one string
	if json.Unmarshal(raw, &one) == nil {
		return []string{one}, one != ""
	}
	var many []string
	if json.Unmarshal(raw, &many) == nil {
		return many, len(many) > 0
	}
	return nil, false
}

// assertion builds the RS256 client assertion with the standard library.
func (v *Verifier) assertion(now time.Time) (string, error) {
	enc := base64.RawURLEncoding
	header, err := json.Marshal(map[string]string{"alg": "RS256", "typ": "JWT", "kid": v.cfg.KeyID})
	if err != nil {
		return "", err
	}
	claims, err := json.Marshal(map[string]any{
		"iss": v.cfg.ClientID, "sub": v.cfg.ClientID, "aud": v.cfg.Issuer,
		"iat": now.Unix(), "exp": now.Add(assertionLifetime).Unix(),
	})
	if err != nil {
		return "", err
	}
	signing := enc.EncodeToString(header) + "." + enc.EncodeToString(claims)
	digest := sha256.Sum256([]byte(signing))
	sig, err := rsa.SignPKCS1v15(rand.Reader, v.key, crypto.SHA256, digest[:])
	if err != nil {
		return "", err
	}
	return signing + "." + enc.EncodeToString(sig), nil
}

func (v *Verifier) lookup(sum [32]byte, now time.Time) (port.VerifiedToken, bool) {
	if v.cfg.CacheTTL <= 0 {
		return port.VerifiedToken{}, false
	}
	v.mu.Lock()
	defer v.mu.Unlock()
	c, ok := v.cache[sum]
	if !ok || !now.Before(c.expires) || now.After(c.token.ExpiresAt.Add(expiryLeeway)) {
		delete(v.cache, sum)
		return port.VerifiedToken{}, false
	}
	return c.token, true
}

func (v *Verifier) store(sum [32]byte, tok port.VerifiedToken, now time.Time) {
	if v.cfg.CacheTTL <= 0 {
		return
	}
	v.mu.Lock()
	defer v.mu.Unlock()
	if len(v.cache) >= maxCacheEntries {
		// ponytail: wholesale reset when full; an LRU only if hit rates ever matter.
		v.cache = map[[32]byte]cached{}
	}
	v.cache[sum] = cached{token: tok, expires: now.Add(v.cfg.CacheTTL)}
}
