package objectstore_test

import (
	"context"
	"os"
	"path/filepath"
	"strings"
	"testing"

	"github.com/aws/aws-sdk-go-v2/aws"
	"github.com/aws/aws-sdk-go-v2/credentials"
	"github.com/aws/aws-sdk-go-v2/service/s3"

	"leonx.me/matter-control/internal/adapter/outbound/objectstore"
	"leonx.me/matter-control/internal/adapter/outbound/repotest/objectcontract"
	"leonx.me/matter-control/internal/core/domain/matter"
)

func TestContract_Filesystem(t *testing.T) {
	objectcontract.Run(t, func(t *testing.T) objectcontract.Subject {
		dir := t.TempDir()
		s, err := objectstore.New(dir)
		if err != nil {
			t.Fatal(err)
		}
		t.Cleanup(func() { _ = s.Close() })
		path := func(m matter.MatterID, sha string) string { return filepath.Join(dir, m.String(), sha[:2], sha) }
		return objectcontract.Subject{
			Store: s,
			Damage: func(t *testing.T, m matter.MatterID, sha string) {
				if err := os.WriteFile(path(m, sha), []byte("tampered"), 0o600); err != nil {
					t.Fatal(err)
				}
			},
			Remove: func(t *testing.T, m matter.MatterID, sha string) {
				if err := os.Remove(path(m, sha)); err != nil {
					t.Fatal(err)
				}
			},
		}
	})
}

// The R2 adapter against the in-process fake S3 endpoint (always runs).
func TestContract_R2_FakeS3(t *testing.T) {
	objectcontract.Run(t, func(t *testing.T) objectcontract.Subject {
		f, r := newFake(t)
		key := func(m matter.MatterID, sha string) string { return m.String() + "/" + sha[:2] + "/" + sha }
		return objectcontract.Subject{
			Store: r,
			Damage: func(t *testing.T, m matter.MatterID, sha string) {
				f.mu.Lock()
				defer f.mu.Unlock()
				f.objects[key(m, sha)] = []byte("tampered")
			},
			Remove: func(t *testing.T, m matter.MatterID, sha string) {
				f.mu.Lock()
				defer f.mu.Unlock()
				delete(f.objects, key(m, sha))
			},
		}
	})
}

// The R2 adapter against a REAL bucket. Skipped unless all four variables are set, so CI and a
// plain `go test` never touch a bucket or need a secret. Use a dedicated test bucket and a token
// limited to it: the run writes small synthetic objects under random matter ids and removes what
// it can (a token without delete rights leaves them behind).
//
//	MC_TEST_R2_ENDPOINT  https://<account>.r2.cloudflarestorage.com
//	MC_TEST_R2_BUCKET    test bucket name
//	MC_TEST_R2_ACCESS_KEY_ID / MC_TEST_R2_SECRET_ACCESS_KEY
func TestContract_R2_RealBucket(t *testing.T) {
	cfg := objectstore.R2Config{
		Endpoint:        os.Getenv("MC_TEST_R2_ENDPOINT"),
		Bucket:          os.Getenv("MC_TEST_R2_BUCKET"),
		AccessKeyID:     os.Getenv("MC_TEST_R2_ACCESS_KEY_ID"),
		SecretAccessKey: os.Getenv("MC_TEST_R2_SECRET_ACCESS_KEY"),
	}
	if cfg.Endpoint == "" || cfg.Bucket == "" || cfg.AccessKeyID == "" || cfg.SecretAccessKey == "" {
		t.Skip("set MC_TEST_R2_ENDPOINT, _BUCKET, _ACCESS_KEY_ID and _SECRET_ACCESS_KEY to run against a real bucket")
	}
	raw := s3.New(s3.Options{
		BaseEndpoint:               aws.String(cfg.Endpoint),
		Region:                     "auto",
		Credentials:                credentials.NewStaticCredentialsProvider(cfg.AccessKeyID, cfg.SecretAccessKey, ""),
		UsePathStyle:               true,
		RequestChecksumCalculation: aws.RequestChecksumCalculationWhenRequired,
		ResponseChecksumValidation: aws.ResponseChecksumValidationWhenRequired,
	})
	objectcontract.Run(t, func(t *testing.T) objectcontract.Subject {
		r, err := objectstore.NewR2(cfg)
		if err != nil {
			t.Fatal(err)
		}
		key := func(m matter.MatterID, sha string) *string { return aws.String(m.String() + "/" + sha[:2] + "/" + sha) }
		return objectcontract.Subject{
			Store: r,
			Damage: func(t *testing.T, m matter.MatterID, sha string) {
				k := key(m, sha)
				_, err := raw.PutObject(context.Background(), &s3.PutObjectInput{Bucket: &cfg.Bucket, Key: k, Body: strings.NewReader("tampered")})
				if err != nil {
					t.Fatalf("damage: %v", err)
				}
				t.Cleanup(func() {
					_, _ = raw.DeleteObject(context.Background(), &s3.DeleteObjectInput{Bucket: &cfg.Bucket, Key: k})
				}) // skip: best-effort cleanup of synthetic test data
			},
			Remove: func(t *testing.T, m matter.MatterID, sha string) {
				if _, err := raw.DeleteObject(context.Background(), &s3.DeleteObjectInput{Bucket: &cfg.Bucket, Key: key(m, sha)}); err != nil {
					t.Fatalf("remove: %v", err)
				}
			},
		}
	})
}
