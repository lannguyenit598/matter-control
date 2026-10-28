package app

import (
	"os"
	"path/filepath"
	"strings"
	"testing"

	"github.com/example/userapi/internal/config"
)

// A key file that belongs to another application is refused at startup, and neither id is leaked.
func TestNewTokenVerifier_RefusesAKeyForAnotherApplication(t *testing.T) {
	dir := t.TempDir()
	keyFile := filepath.Join(dir, "key.json")
	if err := os.WriteFile(keyFile, []byte(`{"clientId":"111","keyId":"k","key":"not-a-pem"}`), 0o600); err != nil {
		t.Fatal(err)
	}
	cfg := config.ProductConfig{OIDC: config.OIDC{
		Issuer: "https://idp.test", IntrospectionURL: "https://idp.test/oauth/v2/introspect", Audience: "aud",
		APIKeyFile: keyFile, APIClientID: "222",
	}}
	_, err := newTokenVerifier(cfg)
	if err == nil || !strings.Contains(err.Error(), "different application") {
		t.Fatalf("want a fail-closed refusal, got %v", err)
	}
	if strings.Contains(err.Error(), "111") || strings.Contains(err.Error(), "222") {
		t.Fatalf("the error must not echo client ids: %v", err)
	}
}
