package config_test

import (
	"log/slog"
	"testing"
	"time"

	"github.com/example/userapi/internal/config"
)

func validProduct() map[string]string {
	return map[string]string{
		"MC_DATABASE_URL":           "postgres://127.0.0.1:55440/mc",
		"MC_OBJECT_DIR":             "/var/lib/mc/objects",
		"MC_OIDC_ISSUER":            "http://localhost:8080",
		"MC_OIDC_INTROSPECTION_URL": "http://localhost:8080/oauth/v2/introspect",
		"MC_OIDC_AUDIENCE":          "aud",
		"MC_OIDC_API_KEY_FILE":      "/run/secrets/key.json",
	}
}

func TestLoadProduct_Defaults(t *testing.T) {
	cfg, err := config.LoadProduct(env(validProduct()))
	if err != nil {
		t.Fatal(err)
	}
	if cfg.HTTPAddr != "127.0.0.1:8081" || cfg.LogLevel != slog.LevelInfo || cfg.RequestTimeout != 10*time.Second ||
		cfg.ShutdownTimeout != 10*time.Second || cfg.ShutdownDelay != 0 || cfg.MigrateOnStart || cfg.OIDC.CacheTTL != 0 || cfg.MaxUploadBytes != 25<<20 || cfg.ObjectDir == "" {
		t.Fatalf("defaults: %+v", cfg)
	}
}

func TestLoadProduct_Errors(t *testing.T) {
	mutate := func(k, v string) map[string]string { m := validProduct(); m[k] = v; return m }
	cases := map[string]map[string]string{
		"nothing set":        {},
		"no database":        mutate("MC_DATABASE_URL", ""),
		"no issuer":          mutate("MC_OIDC_ISSUER", ""),
		"relative issuer":    mutate("MC_OIDC_ISSUER", "localhost:8080"),
		"ftp introspection":  mutate("MC_OIDC_INTROSPECTION_URL", "ftp://idp/introspect"),
		"no audience":        mutate("MC_OIDC_AUDIENCE", ""),
		"no key file":        mutate("MC_OIDC_API_KEY_FILE", ""),
		"bad log level":      mutate("MC_LOG_LEVEL", "loud"),
		"zero timeout":       mutate("MC_REQUEST_TIMEOUT", "0s"),
		"negative delay":     mutate("MC_SHUTDOWN_DELAY", "-1s"),
		"negative cache ttl": mutate("MC_OIDC_CACHE_TTL", "-1s"),
		"bad bool":           mutate("MC_MIGRATE_ON_START", "maybe"),
		"no object dir":      mutate("MC_OBJECT_DIR", ""),
		"zero upload limit":  mutate("MC_MAX_UPLOAD_BYTES", "0"),
		"bad upload limit":   mutate("MC_MAX_UPLOAD_BYTES", "lots"),
	}
	for name, m := range cases {
		if _, err := config.LoadProduct(env(m)); err == nil {
			t.Errorf("%s: expected an error", name)
		}
	}
}

func TestLoadProduct_APIClientIDIsOptionalAndPublic(t *testing.T) {
	cfg, err := config.LoadProduct(env(validProduct()))
	if err != nil || cfg.OIDC.APIClientID != "" {
		t.Fatalf("optional: %+v %v", cfg.OIDC, err)
	}
	m := validProduct()
	m["MC_OIDC_API_CLIENT_ID"] = "396983864414715432"
	cfg, err = config.LoadProduct(env(m))
	if err != nil || cfg.OIDC.APIClientID != "396983864414715432" {
		t.Fatalf("set: %+v %v", cfg.OIDC, err)
	}
}

func TestLoadProduct_IdentityURLsNeedTLSExceptLoopback(t *testing.T) {
	with := func(k, v string) map[string]string { m := validProduct(); m[k] = v; return m }
	for _, key := range []string{"MC_OIDC_ISSUER", "MC_OIDC_INTROSPECTION_URL"} {
		for _, bad := range []string{
			"http://idp.example.com", "http://10.0.0.5:8080", "http://localhost.evil.test",
			"http://127.0.0.1.evil.test", "http://[::2]:8080",
		} {
			if _, err := config.LoadProduct(env(with(key, bad))); err == nil {
				t.Errorf("%s=%s: plain http to a non-loopback host must be refused", key, bad)
			}
		}
		for _, ok := range []string{
			"https://idp.example.com", "http://localhost:8080", "http://127.0.0.1:8080", "http://[::1]:8080",
		} {
			if _, err := config.LoadProduct(env(with(key, ok))); err != nil {
				t.Errorf("%s=%s: %v", key, ok, err)
			}
		}
	}
}

func TestLoadProduct_MigrationURLDefaultsToRuntimeURL(t *testing.T) {
	cfg, err := config.LoadProduct(env(validProduct()))
	if err != nil || cfg.MigrationURL() != cfg.DatabaseURL {
		t.Fatalf("unset: %q vs %q (%v)", cfg.MigrationURL(), cfg.DatabaseURL, err)
	}
	m := validProduct()
	m["MC_MIGRATE_DATABASE_URL"] = "postgres://migrator@127.0.0.1:55440/mc"
	cfg, err = config.LoadProduct(env(m))
	if err != nil || cfg.MigrationURL() != "postgres://migrator@127.0.0.1:55440/mc" || cfg.DatabaseURL != "postgres://127.0.0.1:55440/mc" {
		t.Fatalf("set: migration %q runtime %q (%v)", cfg.MigrationURL(), cfg.DatabaseURL, err)
	}
}

func TestLoadProduct_MaxInFlight(t *testing.T) {
	cfg, err := config.LoadProduct(env(validProduct()))
	if err != nil || cfg.MaxInFlight != 0 {
		t.Fatalf("default must be unlimited: %d %v", cfg.MaxInFlight, err)
	}
	m := validProduct()
	m["MC_MAX_IN_FLIGHT"] = "32"
	if cfg, err = config.LoadProduct(env(m)); err != nil || cfg.MaxInFlight != 32 {
		t.Fatalf("set: %d %v", cfg.MaxInFlight, err)
	}
	for _, bad := range []string{"-1", "many", "3000000000"} {
		m["MC_MAX_IN_FLIGHT"] = bad
		if _, err := config.LoadProduct(env(m)); err == nil {
			t.Errorf("MC_MAX_IN_FLIGHT=%s must be refused", bad)
		}
	}
}
