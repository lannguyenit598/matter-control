package config

import (
	"errors"
	"log/slog"
	"net"
	"net/url"
	"strings"
	"time"
)

// ProductConfig configures `mcapi`, the MatterControl product API. It is a separate
// binary with its own MC_* variables so the native User API configuration stays untouched.
type ProductConfig struct {
	HTTPAddr        string
	LogLevel        slog.Level
	RequestTimeout  time.Duration
	TransferTimeout time.Duration
	ShutdownDelay   time.Duration
	ShutdownTimeout time.Duration

	// DatabaseURL is the PRODUCT database. Never point it at a native userapi database.
	DatabaseURL string
	// MigrateDatabaseURL is an optional connection for the schema owner. Only `mcapi migrate`
	// and MC_MIGRATE_ON_START use it, so the serving role needs no DDL rights.
	MigrateDatabaseURL   string
	MigrateOnStart       bool
	LocalPeopleDirectory bool

	// ObjectBackend picks where document bytes live: "fs" (a private local directory, the
	// local/PoC adapter) or "r2" (a private Cloudflare R2 bucket). Cloud Run's disk is
	// per-instance and ephemeral, so a deployed API must use "r2".
	ObjectBackend string
	// ObjectDir is the private directory that holds document bytes (ObjectBackend "fs").
	ObjectDir string
	// R2 addresses the bucket for ObjectBackend "r2". The credentials are secrets: supply them from
	// a secret store, scope the token to this bucket (Object Read & Write), never log them.
	R2 R2
	// MaxUploadBytes bounds one document upload.
	MaxUploadBytes int64
	// MaxInFlight caps concurrent API requests; 0 = unlimited. The right number is a workload
	// decision (owned by the Product Owner), so it defaults to off.
	MaxInFlight int

	OIDC OIDC
}

// R2 is the connection to one Cloudflare R2 bucket (S3-compatible API).
type R2 struct {
	Endpoint        string
	Bucket          string
	AccessKeyID     string
	SecretAccessKey string
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
	inFlight := p.int64("MC_MAX_IN_FLIGHT", 0)
	cfg := ProductConfig{
		HTTPAddr:             p.str("MC_HTTP_ADDR", "127.0.0.1:8081"),
		RequestTimeout:       p.duration("MC_REQUEST_TIMEOUT", "10s"),
		TransferTimeout:      p.duration("MC_TRANSFER_TIMEOUT", "60s"),
		ShutdownDelay:        p.duration("MC_SHUTDOWN_DELAY", "0s"),
		ShutdownTimeout:      p.duration("MC_SHUTDOWN_TIMEOUT", "10s"),
		DatabaseURL:          p.str("MC_DATABASE_URL", ""),
		MigrateDatabaseURL:   p.str("MC_MIGRATE_DATABASE_URL", ""),
		MigrateOnStart:       p.bool("MC_MIGRATE_ON_START", false),
		LocalPeopleDirectory: p.bool("MC_LOCAL_PEOPLE_DIRECTORY", false),
		ObjectBackend:        p.str("MC_OBJECT_BACKEND", "fs"),
		ObjectDir:            p.str("MC_OBJECT_DIR", ""),
		R2: R2{
			Endpoint:        p.str("MC_R2_ENDPOINT", ""),
			Bucket:          p.str("MC_R2_BUCKET", ""),
			AccessKeyID:     p.str("MC_R2_ACCESS_KEY_ID", ""),
			SecretAccessKey: p.str("MC_R2_SECRET_ACCESS_KEY", ""),
		},
		MaxUploadBytes: p.int64("MC_MAX_UPLOAD_BYTES", 25<<20),
		MaxInFlight:    int(inFlight),
		OIDC: OIDC{
			Issuer:           p.str("MC_OIDC_ISSUER", ""),
			IntrospectionURL: p.str("MC_OIDC_INTROSPECTION_URL", ""),
			Audience:         p.str("MC_OIDC_AUDIENCE", ""),
			APIKeyFile:       p.str("MC_OIDC_API_KEY_FILE", ""),
			APIClientID:      p.str("MC_OIDC_API_CLIENT_ID", ""),
			// A5: a deliberate small TTL bounds the revocation window (a cached "active" answer
			// can be up to TTL stale after a ZITADEL revocation); 0 disables the cache entirely.
			CacheTTL: p.duration("MC_OIDC_CACHE_TTL", "30s"),
		},
	}
	if err := cfg.LogLevel.UnmarshalText([]byte(p.str("MC_LOG_LEVEL", "info"))); err != nil {
		p.fail("MC_LOG_LEVEL: %w", err)
	}
	if cfg.RequestTimeout <= 0 {
		p.fail("MC_REQUEST_TIMEOUT: must be > 0")
	}
	if cfg.TransferTimeout <= 0 {
		p.fail("MC_TRANSFER_TIMEOUT: must be > 0")
	}
	if cfg.OIDC.CacheTTL < 0 {
		p.fail("MC_OIDC_CACHE_TTL: must be >= 0 (0 disables the introspection cache)")
	}
	if cfg.ShutdownDelay < 0 || cfg.ShutdownTimeout < 0 {
		p.fail("MC_SHUTDOWN_DELAY and MC_SHUTDOWN_TIMEOUT must be >= 0")
	}
	if cfg.MaxUploadBytes < 1 {
		p.fail("MC_MAX_UPLOAD_BYTES: must be >= 1")
	}
	if inFlight < 0 || inFlight > 1<<20 {
		p.fail("MC_MAX_IN_FLIGHT: must be between 0 (unlimited) and %d", 1<<20)
	}
	if cfg.OIDC.CacheTTL < 0 {
		p.fail("MC_OIDC_CACHE_TTL: must be >= 0")
	}
	for key, v := range map[string]string{
		"MC_DATABASE_URL": cfg.DatabaseURL, "MC_OIDC_ISSUER": cfg.OIDC.Issuer,
		"MC_OIDC_INTROSPECTION_URL": cfg.OIDC.IntrospectionURL, "MC_OIDC_AUDIENCE": cfg.OIDC.Audience,
		"MC_OIDC_API_KEY_FILE": cfg.OIDC.APIKeyFile,
	} {
		if v == "" {
			p.fail("%s is required", key)
		}
	}
	switch cfg.ObjectBackend {
	case "fs":
		if p.str("K_SERVICE", "") != "" {
			p.fail("MC_OBJECT_BACKEND=fs is forbidden when K_SERVICE is set; use r2")
		}
		if cfg.ObjectDir == "" {
			p.fail("MC_OBJECT_DIR is required")
		}
	case "r2":
		for key, v := range map[string]string{
			"MC_R2_ENDPOINT": cfg.R2.Endpoint, "MC_R2_BUCKET": cfg.R2.Bucket,
			"MC_R2_ACCESS_KEY_ID": cfg.R2.AccessKeyID, "MC_R2_SECRET_ACCESS_KEY": cfg.R2.SecretAccessKey,
		} {
			if v == "" {
				p.fail("%s is required when MC_OBJECT_BACKEND=r2", key)
			}
		}
	default:
		p.fail("MC_OBJECT_BACKEND: must be fs or r2")
	}
	for key, v := range map[string]string{"MC_OIDC_ISSUER": cfg.OIDC.Issuer, "MC_OIDC_INTROSPECTION_URL": cfg.OIDC.IntrospectionURL, "MC_R2_ENDPOINT": cfg.R2.Endpoint} {
		u, err := url.Parse(v)
		switch {
		case v == "":
		case err != nil || (u.Scheme != "http" && u.Scheme != "https") || u.Host == "":
			p.fail("%s: must be an absolute http(s) URL", key)
		case u.Scheme == "http" && !isLoopback(u.Hostname()):
			// The token check carries a signed client assertion and bearer tokens: plain http is
			// acceptable only to a process on this machine (local development).
			p.fail("%s: must use https unless the host is loopback", key)
		}
	}
	if len(p.errs) > 0 {
		return ProductConfig{}, errors.Join(p.errs...)
	}
	return cfg, nil
}

// MigrationURL is the connection migrations run on: MigrateDatabaseURL when set, else DatabaseURL.
func (c ProductConfig) MigrationURL() string {
	if c.MigrateDatabaseURL != "" {
		return c.MigrateDatabaseURL
	}
	return c.DatabaseURL
}

// isLoopback reports whether host is "localhost" or a loopback IP literal.
func isLoopback(host string) bool {
	if strings.EqualFold(host, "localhost") {
		return true
	}
	ip := net.ParseIP(host)
	return ip != nil && ip.IsLoopback()
}
