package config

import (
	"errors"
	"log/slog"
	"net/url"
	"time"
)

// ProductConfig configures `mcapi`, the MatterControl product API. It is a separate
// binary with its own MC_* variables so the native User API configuration stays untouched.
type ProductConfig struct {
	HTTPAddr        string
	LogLevel        slog.Level
	RequestTimeout  time.Duration
	ShutdownDelay   time.Duration
	ShutdownTimeout time.Duration

	// DatabaseURL is the PRODUCT database. Never point it at a native userapi database.
	DatabaseURL    string
	MigrateOnStart bool

	// ObjectDir is the private directory that holds document bytes (local/PoC adapter).
	ObjectDir string
	// MaxUploadBytes bounds one document upload.
	MaxUploadBytes int64

	OIDC OIDC
}

// OIDC pins the one canonical issuer and the introspection client (contract §1).
type OIDC struct {
	Issuer           string
	IntrospectionURL string
	// Audience is the MatterControl API audience the introspected token must contain.
	Audience string
	// APIKeyFile is the ZITADEL API application's key JSON (private_key_jwt).
	APIKeyFile string
	// APIClientID, when set, is the API application's client id the key file must belong to; a key
	// for any other application is refused at startup (fail closed). It is a public identifier.
	APIClientID string
	// CacheTTL bounds the per-token introspection cache; 0 disables it. It is a load
	// shield, not a revocation guarantee.
	CacheTTL time.Duration
}

// LoadProduct reads the MC_* variables. Every error is collected and reported together.
func LoadProduct(lookup func(string) (string, bool)) (ProductConfig, error) {
	p := &parser{lookup: lookup}
	cfg := ProductConfig{
		HTTPAddr:        p.str("MC_HTTP_ADDR", "127.0.0.1:8081"),
		RequestTimeout:  p.duration("MC_REQUEST_TIMEOUT", "10s"),
		ShutdownDelay:   p.duration("MC_SHUTDOWN_DELAY", "0s"),
		ShutdownTimeout: p.duration("MC_SHUTDOWN_TIMEOUT", "10s"),
		DatabaseURL:     p.str("MC_DATABASE_URL", ""),
		MigrateOnStart:  p.bool("MC_MIGRATE_ON_START", false),
		ObjectDir:       p.str("MC_OBJECT_DIR", ""),
		MaxUploadBytes:  p.int64("MC_MAX_UPLOAD_BYTES", 25<<20),
		OIDC: OIDC{
			Issuer:           p.str("MC_OIDC_ISSUER", ""),
			IntrospectionURL: p.str("MC_OIDC_INTROSPECTION_URL", ""),
			Audience:         p.str("MC_OIDC_AUDIENCE", ""),
			APIKeyFile:       p.str("MC_OIDC_API_KEY_FILE", ""),
			APIClientID:      p.str("MC_OIDC_API_CLIENT_ID", ""),
			CacheTTL:         p.duration("MC_OIDC_CACHE_TTL", "0s"),
		},
	}
	if err := cfg.LogLevel.UnmarshalText([]byte(p.str("MC_LOG_LEVEL", "info"))); err != nil {
		p.fail("MC_LOG_LEVEL: %w", err)
	}
	if cfg.RequestTimeout <= 0 {
		p.fail("MC_REQUEST_TIMEOUT: must be > 0")
	}
	if cfg.ShutdownDelay < 0 || cfg.ShutdownTimeout < 0 {
		p.fail("MC_SHUTDOWN_DELAY and MC_SHUTDOWN_TIMEOUT must be >= 0")
	}
	if cfg.MaxUploadBytes < 1 {
		p.fail("MC_MAX_UPLOAD_BYTES: must be >= 1")
	}
	if cfg.OIDC.CacheTTL < 0 {
		p.fail("MC_OIDC_CACHE_TTL: must be >= 0")
	}
	for key, v := range map[string]string{
		"MC_DATABASE_URL": cfg.DatabaseURL, "MC_OBJECT_DIR": cfg.ObjectDir, "MC_OIDC_ISSUER": cfg.OIDC.Issuer,
		"MC_OIDC_INTROSPECTION_URL": cfg.OIDC.IntrospectionURL, "MC_OIDC_AUDIENCE": cfg.OIDC.Audience,
		"MC_OIDC_API_KEY_FILE": cfg.OIDC.APIKeyFile,
	} {
		if v == "" {
			p.fail("%s is required", key)
		}
	}
	for key, v := range map[string]string{"MC_OIDC_ISSUER": cfg.OIDC.Issuer, "MC_OIDC_INTROSPECTION_URL": cfg.OIDC.IntrospectionURL} {
		if u, err := url.Parse(v); v != "" && (err != nil || (u.Scheme != "http" && u.Scheme != "https") || u.Host == "") {
			p.fail("%s: must be an absolute http(s) URL", key)
		}
	}
	if len(p.errs) > 0 {
		return ProductConfig{}, errors.Join(p.errs...)
	}
	return cfg, nil
}
