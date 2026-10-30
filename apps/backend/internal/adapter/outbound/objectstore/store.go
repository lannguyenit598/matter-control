// Package objectstore keeps document bytes on the local filesystem, content-addressed by SHA-256
// within a matter. It is the local/PoC adapter for port.ObjectStore: it proves the contract
// (never overwritten, size-limited, checksum-verified on read) and says nothing about a
// production object store.
package objectstore

import (
	"context"
	"crypto/sha256"
	"encoding/hex"
	"errors"
	"fmt"
	"io"
	"io/fs"
	"os"
	"regexp"

	"github.com/google/uuid"

	"leonx.me/matter-control/internal/core/domain/matter"
	"leonx.me/matter-control/internal/core/port"
)

var shaRe = regexp.MustCompile(`^[0-9a-f]{64}$`)

// Store is rooted at one private directory; os.Root makes every access traversal-safe.
type Store struct{ root *os.Root }

var _ port.ObjectStore = (*Store)(nil)

// New opens (creating it 0700 when missing) the store directory.
func New(dir string) (*Store, error) {
	if err := os.MkdirAll(dir, 0o700); err != nil {
		return nil, fmt.Errorf("object store dir: %w", err)
	}
	root, err := os.OpenRoot(dir)
	if err != nil {
		return nil, fmt.Errorf("open object store: %w", err)
	}
	return &Store{root: root}, nil
}

// Close releases the root handle.
func (s *Store) Close() error { return s.root.Close() }

func tmpName() string { return uuid.Must(uuid.NewV7()).String() }

func objectPath(m matter.MatterID, sum string) (dir, file string) {
	dir = m.String() + "/" + sum[:2]
	return dir, dir + "/" + sum
}

// Put streams r into a temporary file, hashing as it goes, and publishes it under its digest.
// More than maxBytes stores nothing and returns port.ErrObjectTooLarge. Storing the same bytes
// twice is a no-op, so an orphan left by a failed command is harmless.
func (s *Store) Put(_ context.Context, m matter.MatterID, r io.Reader, maxBytes int64) (port.ObjectRef, error) {
	if err := s.root.MkdirAll(m.String()+"/tmp", 0o700); err != nil {
		return port.ObjectRef{}, fmt.Errorf("%w: %w", port.ErrObjectUnavailable, err)
	}
	tmp := fmt.Sprintf("%s/tmp/%s", m, tmpName())
	f, err := s.root.OpenFile(tmp, os.O_WRONLY|os.O_CREATE|os.O_EXCL, 0o600)
	if err != nil {
		return port.ObjectRef{}, fmt.Errorf("%w: %w", port.ErrObjectUnavailable, err)
	}
	cleanup := func() { _ = f.Close(); _ = s.root.Remove(tmp) } // skip: best-effort removal of our own temp file
	h := sha256.New()
	n, err := io.Copy(io.MultiWriter(f, h), io.LimitReader(r, maxBytes+1))
	if err != nil {
		cleanup()
		return port.ObjectRef{}, fmt.Errorf("%w: %w", port.ErrObjectUnavailable, err)
	}
	if n > maxBytes {
		cleanup()
		return port.ObjectRef{}, port.ErrObjectTooLarge
	}
	if err := f.Sync(); err != nil {
		cleanup()
		return port.ObjectRef{}, fmt.Errorf("%w: %w", port.ErrObjectUnavailable, err)
	}
	if err := f.Close(); err != nil {
		_ = s.root.Remove(tmp) // skip: temp file only
		return port.ObjectRef{}, fmt.Errorf("%w: %w", port.ErrObjectUnavailable, err)
	}
	sum := hex.EncodeToString(h.Sum(nil))
	dir, final := objectPath(m, sum)
	if _, err := s.root.Stat(final); err == nil {
		_ = s.root.Remove(tmp) // skip: identical content already published
		return port.ObjectRef{SHA256: sum, Size: n}, nil
	}
	if err := s.root.MkdirAll(dir, 0o700); err != nil {
		_ = s.root.Remove(tmp) // skip: temp file only
		return port.ObjectRef{}, fmt.Errorf("%w: %w", port.ErrObjectUnavailable, err)
	}
	if err := s.root.Rename(tmp, final); err != nil {
		_ = s.root.Remove(tmp) // skip: temp file only
		return port.ObjectRef{}, fmt.Errorf("%w: %w", port.ErrObjectUnavailable, err)
	}
	return port.ObjectRef{SHA256: sum, Size: n}, nil
}

// Open returns the content, verifying the digest at EOF: a corrupted object ends the read with
// port.ErrObjectCorrupt (an ErrObjectUnavailable) instead of being served as if it were the
// recorded version; absent bytes are port.ErrObjectMissing.
func (s *Store) Open(_ context.Context, m matter.MatterID, sum string) (io.ReadCloser, error) {
	if !shaRe.MatchString(sum) {
		return nil, port.ErrObjectUnavailable
	}
	_, p := objectPath(m, sum)
	f, err := s.root.Open(p)
	if err != nil {
		if errors.Is(err, fs.ErrNotExist) {
			return nil, port.ErrObjectMissing
		}
		return nil, fmt.Errorf("%w: %w", port.ErrObjectUnavailable, err)
	}
	return &verifying{f: f, h: sha256.New(), want: sum}, nil
}

type verifying struct {
	f io.ReadCloser
	h interface {
		io.Writer
		Sum([]byte) []byte
	}
	want string
}

func (v *verifying) Read(p []byte) (int, error) {
	n, err := v.f.Read(p)
	_, _ = v.h.Write(p[:n]) // skip: hash.Hash.Write never fails
	if errors.Is(err, io.EOF) && hex.EncodeToString(v.h.Sum(nil)) != v.want {
		return n, port.ErrObjectCorrupt
	}
	return n, err
}

func (v *verifying) Close() error { return v.f.Close() }
