// Package objectcontract is the shared behavioural contract of port.ObjectStore: every
// implementation (filesystem, memory, R2, and any future one) must pass the same cases, the way
// the PostgreSQL and memory stores share repotest/mattercontrol. An implementation supplies the
// store plus two hooks that damage or remove its stored bytes behind its back, so the contract can
// check how damage is reported without knowing where the bytes live.
package objectcontract

import (
	"bytes"
	"context"
	"crypto/sha256"
	"encoding/hex"
	"errors"
	"io"
	"strings"
	"sync"
	"testing"
	"testing/iotest"

	"github.com/google/uuid"

	"leonx.me/matter-control/internal/core/domain/matter"
	"leonx.me/matter-control/internal/core/port"
)

// Subject is one implementation under test.
type Subject struct {
	Store port.ObjectStore
	// Damage rewrites the stored bytes of (matter, sha) so they no longer match their digest.
	Damage func(t *testing.T, m matter.MatterID, sha string)
	// Remove deletes the stored bytes of (matter, sha), as if the object had been lost.
	Remove func(t *testing.T, m matter.MatterID, sha string)
}

// Factory returns a fresh, isolated subject for one test.
type Factory func(t *testing.T) Subject

func newMatter(t *testing.T) matter.MatterID {
	t.Helper()
	id, err := matter.NewMatterID(uuid.Must(uuid.NewV7()).String())
	if err != nil {
		t.Fatal(err)
	}
	return id
}

// content is unique per test and run, so a shared bucket never mixes cases up.
func content(t *testing.T, tail string) []byte {
	return []byte("synthetic " + t.Name() + " " + uuid.NewString() + " " + tail)
}

func digest(b []byte) string {
	sum := sha256.Sum256(b)
	return hex.EncodeToString(sum[:])
}

func read(t *testing.T, s port.ObjectStore, m matter.MatterID, sha string) []byte {
	t.Helper()
	rc, err := s.Open(context.Background(), m, sha)
	if err != nil {
		t.Fatalf("open: %v", err)
	}
	defer rc.Close()
	got, err := io.ReadAll(rc)
	if err != nil {
		t.Fatalf("read: %v", err)
	}
	return got
}

// Run executes the contract against fresh subjects from newSubject.
func Run(t *testing.T, newSubject Factory) {
	ctx := context.Background()

	t.Run("round trip and a repeated put return the same reference", func(t *testing.T) {
		s, m, data := newSubject(t), newMatter(t), []byte(nil)
		data = content(t, "")
		ref, err := s.Store.Put(ctx, m, bytes.NewReader(data), 1<<20)
		if err != nil || ref.Size != int64(len(data)) || ref.SHA256 != digest(data) {
			t.Fatalf("put: %+v %v", ref, err)
		}
		again, err := s.Store.Put(ctx, m, bytes.NewReader(data), 1<<20)
		if err != nil || again != ref {
			t.Fatalf("a repeated put must be a no-op with the same reference: %+v %v", again, err)
		}
		if got := read(t, s.Store, m, ref.SHA256); !bytes.Equal(got, data) {
			t.Fatalf("content differs: %q", got)
		}
	})

	t.Run("empty and larger content round trip", func(t *testing.T) {
		s, m := newSubject(t), newMatter(t)
		for name, data := range map[string][]byte{
			"empty": {},
			"1 MiB": append(content(t, ""), bytes.Repeat([]byte{0xA5}, 1<<20)...),
		} {
			ref, err := s.Store.Put(ctx, m, bytes.NewReader(data), 4<<20)
			if err != nil || ref.Size != int64(len(data)) || ref.SHA256 != digest(data) {
				t.Fatalf("%s put: %+v %v", name, ref, err)
			}
			if got := read(t, s.Store, m, ref.SHA256); !bytes.Equal(got, data) {
				t.Fatalf("%s: content differs", name)
			}
		}
	})

	t.Run("size limit: exactly the limit is stored, one byte more stores nothing", func(t *testing.T) {
		s, m := newSubject(t), newMatter(t)
		data := content(t, "")
		limit := int64(len(data))
		if _, err := s.Store.Put(ctx, m, bytes.NewReader(data), limit); err != nil {
			t.Fatalf("at the limit: %v", err)
		}
		over := append(append([]byte(nil), data...), '!')
		if _, err := s.Store.Put(ctx, m, bytes.NewReader(over), limit); !errors.Is(err, port.ErrObjectTooLarge) {
			t.Fatalf("over the limit: %v", err)
		}
		if _, err := s.Store.Open(ctx, m, digest(over)); !errors.Is(err, port.ErrObjectUnavailable) {
			t.Fatalf("a refused upload must leave nothing behind: %v", err)
		}
	})

	t.Run("a failing source is reported as unavailable and stores nothing", func(t *testing.T) {
		s, m := newSubject(t), newMatter(t)
		src := io.MultiReader(strings.NewReader("partial"), iotest.ErrReader(errors.New("connection reset")))
		if _, err := s.Store.Put(ctx, m, src, 1<<20); !errors.Is(err, port.ErrObjectUnavailable) {
			t.Fatalf("%v", err)
		}
		if _, err := s.Store.Open(ctx, m, digest([]byte("partial"))); !errors.Is(err, port.ErrObjectUnavailable) {
			t.Fatalf("a half-read upload must leave nothing behind: %v", err)
		}
	})

	t.Run("malformed and unknown digests are unavailable", func(t *testing.T) {
		s, m := newSubject(t), newMatter(t)
		for _, sha := range []string{
			"", "short", "../../etc/passwd", strings.Repeat("g", 64), strings.Repeat("A", 64), strings.Repeat("a", 65),
			strings.Repeat("a", 64), // well formed but never stored
		} {
			if _, err := s.Store.Open(ctx, m, sha); !errors.Is(err, port.ErrObjectUnavailable) {
				t.Errorf("%q: %v", sha, err)
			}
		}
	})

	t.Run("never-stored and lost objects are missing, not merely unavailable", func(t *testing.T) {
		s, m := newSubject(t), newMatter(t)
		if _, err := s.Store.Open(ctx, m, digest(content(t, "never stored"))); !errors.Is(err, port.ErrObjectMissing) {
			t.Fatalf("never stored: %v", err)
		}
		if s.Remove == nil {
			return
		}
		ref, err := s.Store.Put(ctx, m, bytes.NewReader(content(t, "to lose")), 1<<20)
		if err != nil {
			t.Fatal(err)
		}
		s.Remove(t, m, ref.SHA256)
		if _, err := s.Store.Open(ctx, m, ref.SHA256); !errors.Is(err, port.ErrObjectMissing) || !errors.Is(err, port.ErrObjectUnavailable) {
			t.Fatalf("a lost object must be missing (and still unavailable): %v", err)
		}
	})

	t.Run("content is addressed within a matter", func(t *testing.T) {
		s, a, b, data := newSubject(t), newMatter(t), newMatter(t), []byte(nil)
		data = content(t, "")
		ref, err := s.Store.Put(ctx, a, bytes.NewReader(data), 1<<20)
		if err != nil {
			t.Fatal(err)
		}
		if _, err := s.Store.Open(ctx, b, ref.SHA256); !errors.Is(err, port.ErrObjectUnavailable) {
			t.Fatalf("another matter must not read it by digest: %v", err)
		}
		refB, err := s.Store.Put(ctx, b, bytes.NewReader(data), 1<<20)
		if err != nil || refB != ref {
			t.Fatalf("%+v %v", refB, err)
		}
		if got := read(t, s.Store, b, ref.SHA256); !bytes.Equal(got, data) {
			t.Fatal("matter B cannot read its own copy")
		}
	})

	t.Run("concurrent puts of the same bytes agree", func(t *testing.T) {
		s, m := newSubject(t), newMatter(t)
		data := content(t, "")
		const n = 8
		refs := make([]port.ObjectRef, n)
		errs := make([]error, n)
		var wg sync.WaitGroup
		for i := range n {
			wg.Add(1)
			go func() {
				defer wg.Done()
				refs[i], errs[i] = s.Store.Put(ctx, m, bytes.NewReader(data), 1<<20)
			}()
		}
		wg.Wait()
		for i := range n {
			if errs[i] != nil || refs[i] != refs[0] {
				t.Fatalf("put %d: %+v %v", i, refs[i], errs[i])
			}
		}
		if got := read(t, s.Store, m, refs[0].SHA256); !bytes.Equal(got, data) {
			t.Fatal("content differs after concurrent puts")
		}
	})

	t.Run("damaged bytes are never read to completion", func(t *testing.T) {
		s, m := newSubject(t), newMatter(t)
		if s.Damage == nil {
			t.Skip("implementation cannot damage its own bytes")
		}
		data := content(t, "")
		ref, err := s.Store.Put(ctx, m, bytes.NewReader(data), 1<<20)
		if err != nil {
			t.Fatal(err)
		}
		s.Damage(t, m, ref.SHA256)
		rc, err := s.Store.Open(ctx, m, ref.SHA256)
		if err != nil {
			if !errors.Is(err, port.ErrObjectCorrupt) {
				t.Fatalf("open: %v", err)
			}
			return // refused up front is as good as failing mid-read
		}
		defer rc.Close()
		if _, err := io.ReadAll(rc); !errors.Is(err, port.ErrObjectUnavailable) {
			t.Fatalf("a damaged object must end the read with ErrObjectUnavailable: %v", err)
		} else if !errors.Is(err, port.ErrObjectCorrupt) {
			t.Fatalf("a damaged object must be reported as corrupt: %v", err)
		}
	})
}
