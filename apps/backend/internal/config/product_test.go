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
