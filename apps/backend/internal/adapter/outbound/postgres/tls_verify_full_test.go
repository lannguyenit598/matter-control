package postgres

// WP4 TLS preparation proof (MC-ZCODE-PILOT-DEPLOY-READINESS-20261103): the pgx verified-full
// path honors sslrootcert exactly as the operator DSNs use it. Skipped unless a task-owned TLS
// PostgreSQL fixture is supplied (MC_TLS_TEST_DATABASE_URL + MC_TLS_TEST_CA_FILE — see the task
// receipts); when supplied, this test proves with a synthetic CA/hostname pair:
//
//   1. trusted CA + correct hostname (localhost)      -> connection succeeds
//   2. trusted CA + wrong hostname (127.0.0.1)        -> certificate hostname mismatch refused
//   3. wrong CA   + correct hostname                  -> unknown authority refused
//
// Never sets sslmode=require or disables certificate/hostname verification. Deployed Worker →
// actual Supabase TLS remains NOT_RUN; the laptop probe, the local cluster and the final image
// are distinct scopes (runbook TLS matrix).

import (
	"context"
	"crypto/rand"
	"crypto/rsa"
	"crypto/x509"
	"crypto/x509/pkix"
	"encoding/pem"
	"math/big"
	"net/url"
	"os"
	"path/filepath"
	"strings"
	"testing"
	"time"

	"github.com/jackc/pgx/v5"
)

func tlsTestConfig(t *testing.T) (baseURL, caFile string) {
	t.Helper()
	baseURL, caFile = os.Getenv("MC_TLS_TEST_DATABASE_URL"), os.Getenv("MC_TLS_TEST_CA_FILE")
	if baseURL == "" || caFile == "" {
		t.Skip("MC_TLS_TEST_DATABASE_URL / MC_TLS_TEST_CA_FILE not set; skipping TLS fixture test")
	}
	return baseURL, caFile
}

// tlsWrongCA mints a throwaway self-signed CA in-process (unrelated to the fixture CA).
func tlsWrongCA(t *testing.T) string {
	t.Helper()
	k, err := rsa.GenerateKey(rand.Reader, 2048)
	if err != nil {
		t.Fatal(err)
	}
	tpl := x509.Certificate{
		SerialNumber: big.NewInt(1), Subject: pkix.Name{CommonName: "mc-tls-wrong-ca"},
		NotBefore: time.Now().Add(-time.Hour), NotAfter: time.Now().Add(time.Hour),
		IsCA: true, KeyUsage: x509.KeyUsageCertSign | x509.KeyUsageDigitalSignature,
		BasicConstraintsValid: true,
	}
	der, err := x509.CreateCertificate(rand.Reader, &tpl, &tpl, &k.PublicKey, k)
	if err != nil {
		t.Fatal(err)
	}
	dir := t.TempDir()
	path := filepath.Join(dir, "wrong-ca.pem")
	if err := os.WriteFile(path, pem.EncodeToMemory(&pem.Block{Type: "CERTIFICATE", Bytes: der}), 0o600); err != nil {
		t.Fatal(err)
	}
	return path
}

func tlsBuildDSN(t *testing.T, baseURL, host, caFile string) string {
	t.Helper()
	u, err := url.Parse(baseURL)
	if err != nil {
		t.Fatalf("parse TLS fixture DSN: %v", err)
	}
	q := u.Query()
	q.Set("user", "postgres")
	if u.Port() != "" {
		u.Host = host + ":" + u.Port()
	} else {
		u.Host = host
	}
	q.Set("sslmode", "verify-full")
	q.Set("sslrootcert", caFile)
	u.RawQuery = q.Encode()
	return u.String()
}

func TestTLSVerifyFullPaths(t *testing.T) {
	baseURL, caFile := tlsTestConfig(t)
	ctx, cancel := context.WithTimeout(context.Background(), 30*time.Second)
	defer cancel()

	// 1. Trusted CA + the exact hostname on the certificate: succeed.
	if _, err := pgx.Connect(ctx, tlsBuildDSN(t, baseURL, "localhost", caFile)); err != nil {
		t.Fatalf("trusted CA + correct hostname must connect: %v", err)
	}

	// 2. Trusted CA + a hostname/IP NOT on the certificate: refused (no sslmode downgrade).
	if _, err := pgx.Connect(ctx, tlsBuildDSN(t, baseURL, "127.0.0.1", caFile)); err == nil {
		t.Fatal("trusted CA + wrong hostname must be refused")
	} else if !strings.Contains(err.Error(), "cannot validate certificate") &&
		!strings.Contains(err.Error(), "certificate is valid for") &&
		!strings.Contains(err.Error(), "IP SANs") {
		t.Fatalf("expected a hostname-verification failure, got %v", err)
	}

	// 3. Wrong CA + correct hostname: refused (no fallback to system roots when sslrootcert set).
	if _, err := pgx.Connect(ctx, tlsBuildDSN(t, baseURL, "localhost", tlsWrongCA(t))); err == nil {
		t.Fatal("wrong CA must be refused")
	} else if !strings.Contains(err.Error(), "certificate signed by unknown authority") {
		t.Fatalf("expected an unknown-authority failure, got %v", err)
	}
}
