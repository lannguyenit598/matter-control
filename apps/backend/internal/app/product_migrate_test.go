package app

import (
	"context"
	"log/slog"
	"path/filepath"
	"testing"
	"time"

	"leonx.me/matter-control/internal/adapter/outbound/postgres/pgtest"
	"leonx.me/matter-control/internal/config"
)

// PI-02/WP4 migration-identity contract, proven locally: `mcapi migrate` validates the whole
// configuration (every MC_OIDC_* value must be nonempty) but never READS the OIDC key file and
// never CONTACTS the identity provider. The migrate-only Cloud Run job therefore needs neither
// the OIDC secret volume nor any issuer network access — do not grant the migration SA OIDC-key
// access. Actual Supabase/provider behavior stays NOT_RUN (runbook gate).
func TestMigrateProductNeverReadsOIDCKeyOrContactsIdP(t *testing.T) {
	adminDSN := pgtest.FreshSchemaDSNFrom(t, "MC_TEST_DATABASE_URL")
	missingKeyFile := filepath.Join(t.TempDir(), "no-key-file.json")
	env := map[string]string{
		"MC_DATABASE_URL":           adminDSN,
		"MC_OBJECT_BACKEND":         "fs",
		"MC_OBJECT_DIR":             t.TempDir(),
		"MC_OIDC_ISSUER":            "https://migrate-contract.synthetic.invalid", // unreachable on purpose
		"MC_OIDC_INTROSPECTION_URL": "https://migrate-contract.synthetic.invalid/oauth/v2/introspect",
		"MC_OIDC_AUDIENCE":          "migrate-contract-project-audience",
		"MC_OIDC_API_KEY_FILE":      missingKeyFile, // path does not exist and must never be opened
	}
	cfg, err := config.LoadProduct(func(key string) (string, bool) { v, ok := env[key]; return v, ok })
	if err != nil {
		t.Fatalf("placeholder configuration must validate (nonempty checks only): %v", err)
	}
	ctx, cancel := context.WithTimeout(context.Background(), 90*time.Second)
	defer cancel()
	if err := MigrateProduct(ctx, cfg, slog.New(slog.NewTextHandler(pgtestDiscard{}, nil))); err != nil {
		t.Fatalf("migrate must succeed without the OIDC key file or IdP access: %v", err)
	}
}

// The full config also fails closed when an MC_OIDC_* value is empty (the job cannot skip
// validation even though migrate would never use the values).
func TestMigrateConfigurationRejectsEmptyOIDCValues(t *testing.T) {
	base := map[string]string{
		"MC_DATABASE_URL":           "postgres://synthetic.invalid/db",
		"MC_OBJECT_BACKEND":         "fs",
		"MC_OBJECT_DIR":             t.TempDir(),
		"MC_OIDC_ISSUER":            "https://migrate-contract.synthetic.invalid",
		"MC_OIDC_INTROSPECTION_URL": "https://migrate-contract.synthetic.invalid/oauth/v2/introspect",
		"MC_OIDC_AUDIENCE":          "migrate-contract-project-audience",
		"MC_OIDC_API_KEY_FILE":      "/synthetic/no-key.json",
	}
	for _, key := range []string{"MC_OIDC_ISSUER", "MC_OIDC_INTROSPECTION_URL", "MC_OIDC_AUDIENCE", "MC_OIDC_API_KEY_FILE"} {
		env := make(map[string]string, len(base))
		for k, v := range base {
			env[k] = v
		}
		delete(env, key)
		if _, err := config.LoadProduct(func(k string) (string, bool) { v, ok := env[k]; return v, ok }); err == nil {
			t.Fatalf("missing %s must fail configuration validation", key)
		}
	}
}

type pgtestDiscard struct{}

func (pgtestDiscard) Write(p []byte) (int, error) { return len(p), nil }
