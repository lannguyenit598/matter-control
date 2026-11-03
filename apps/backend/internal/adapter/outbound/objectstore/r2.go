package objectstore

import (
	"bytes"
	"context"
	"crypto/sha256"
	"encoding/base64"
	"encoding/hex"
	"errors"
	"fmt"
	"io"

	"github.com/aws/aws-sdk-go-v2/aws"
	"github.com/aws/aws-sdk-go-v2/credentials"
	"github.com/aws/aws-sdk-go-v2/service/s3"
	"github.com/aws/smithy-go"

	"leonx.me/matter-control/internal/core/domain/matter"
	"leonx.me/matter-control/internal/core/port"
)

// R2Config addresses one private Cloudflare R2 bucket through its S3-compatible API. Endpoint is
// https://<account>.r2.cloudflarestorage.com (or the jurisdiction form, e.g. <account>.eu.…). The
// token should be limited to this bucket with Object Read & Write only.
type R2Config struct {
	Endpoint        string
	Bucket          string
	AccessKeyID     string
	SecretAccessKey string
}

// R2 is port.ObjectStore on an S3-compatible bucket. It keeps the local adapter's contract:
// content is addressed by SHA-256 within a matter, never changed once stored, size-limited on
// write and checksum-verified on read. Keys are <matter>/<sha[:2]>/<sha>, the same layout as the
// local directory, so an existing object directory can be copied into the bucket as it is.
type R2 struct {
	api    s3API
	bucket string
}

// s3API is the part of the S3 client used here; tests give the real client a fake endpoint.
type s3API interface {
	HeadObject(context.Context, *s3.HeadObjectInput, ...func(*s3.Options)) (*s3.HeadObjectOutput, error)
	PutObject(context.Context, *s3.PutObjectInput, ...func(*s3.Options)) (*s3.PutObjectOutput, error)
	GetObject(context.Context, *s3.GetObjectInput, ...func(*s3.Options)) (*s3.GetObjectOutput, error)
}

var _ port.ObjectStore = (*R2)(nil)

// NewR2 builds the client. It makes no request: a wrong endpoint or token shows on first use as
// port.ErrObjectUnavailable (a retryable 503), never as a silent success.
func NewR2(cfg R2Config) (*R2, error) {
	if cfg.Endpoint == "" || cfg.Bucket == "" || cfg.AccessKeyID == "" || cfg.SecretAccessKey == "" {
		return nil, errors.New("r2 object store: endpoint, bucket and credentials are required")
	}
	client := s3.New(s3.Options{
		BaseEndpoint: aws.String(cfg.Endpoint),
		Region:       "auto", // R2 ignores the region but the signer needs one
		Credentials:  credentials.NewStaticCredentialsProvider(cfg.AccessKeyID, cfg.SecretAccessKey, ""),
		UsePathStyle: true,
		// R2 does not accept the SDK's default CRC32 trailer; the SHA-256 header is set explicitly.
		RequestChecksumCalculation: aws.RequestChecksumCalculationWhenRequired,
		ResponseChecksumValidation: aws.ResponseChecksumValidationWhenRequired,
	})
	return &R2{api: client, bucket: cfg.Bucket}, nil
}

func objectKey(m matter.MatterID, sum string) string {
	_, key := objectPath(m, sum)
	return key
}

func unavailable(err error) error { return fmt.Errorf("%w: %w", port.ErrObjectUnavailable, err) }

func notFound(err error) bool {
	var apiErr smithy.APIError
	if !errors.As(err, &apiErr) {
		return false
	}
	switch apiErr.ErrorCode() {
	case "NoSuchKey", "NotFound":
		return true
	}
	return false
}

// Put reads r (at most maxBytes) into memory to learn its digest, then stores it under that digest.
// The bytes are held in memory because the key is the digest; the size bound (MC_MAX_UPLOAD_BYTES)
// and the in-flight limit keep that small. Storing the same bytes again sends no upload, so an
// orphan left by a failed command is harmless. An object of the wrong size under that key (a
// damaged earlier write) is replaced, since the digest says what it must contain.
func (s *R2) Put(ctx context.Context, m matter.MatterID, r io.Reader, maxBytes int64) (port.ObjectRef, error) {
	body, err := io.ReadAll(io.LimitReader(r, maxBytes+1))
	if err != nil {
		return port.ObjectRef{}, unavailable(err)
	}
	if int64(len(body)) > maxBytes {
		return port.ObjectRef{}, port.ErrObjectTooLarge
	}
	digest := sha256.Sum256(body)
	sum := hex.EncodeToString(digest[:])
	ref := port.ObjectRef{SHA256: sum, Size: int64(len(body))}
	key := objectKey(m, sum)

	head, err := s.api.HeadObject(ctx, &s3.HeadObjectInput{Bucket: &s.bucket, Key: &key})
	switch {
	case err == nil && head.ContentLength != nil && *head.ContentLength == ref.Size:
		return ref, nil
	case err != nil && !notFound(err):
		return port.ObjectRef{}, unavailable(err)
	}
	_, err = s.api.PutObject(ctx, &s3.PutObjectInput{
		Bucket:         &s.bucket,
		Key:            &key,
		Body:           bytes.NewReader(body),
		ContentLength:  aws.Int64(ref.Size),
		ChecksumSHA256: aws.String(base64.StdEncoding.EncodeToString(digest[:])),
		ContentType:    aws.String("application/octet-stream"),
	})
	if err != nil {
		return port.ObjectRef{}, unavailable(err)
	}
	return ref, nil
}

// Open streams the object and verifies its digest at EOF: a corrupted or replaced object ends the
// read with port.ErrObjectCorrupt instead of being served as the recorded version; an absent key
// is port.ErrObjectMissing. Both are ErrObjectUnavailable, which a store that is down also is.
func (s *R2) Open(ctx context.Context, m matter.MatterID, sum string) (io.ReadCloser, error) {
	if !shaRe.MatchString(sum) {
		return nil, port.ErrObjectUnavailable
	}
	key := objectKey(m, sum)
	out, err := s.api.GetObject(ctx, &s3.GetObjectInput{Bucket: &s.bucket, Key: &key})
	if err != nil {
		if notFound(err) {
			return nil, port.ErrObjectMissing
		}
		return nil, unavailable(err)
	}
	return &verifying{f: out.Body, h: sha256.New(), want: sum}, nil
}
