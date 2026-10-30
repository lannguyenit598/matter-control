package objectstore_test

import (
	"bytes"
	"context"
	"errors"
	"io"
	"os"
	"path/filepath"
	"strings"
	"testing"

	"leonx.me/matter-control/internal/adapter/outbound/objectstore"
	"leonx.me/matter-control/internal/core/domain/matter"
	"leonx.me/matter-control/internal/core/port"
)

func mid(t *testing.T) matter.MatterID {
	t.Helper()
	id, err := matter.NewMatterID("01a17c8f-15d0-72c3-b52a-4753f11dae7a")
	if err != nil {
		t.Fatal(err)
	}
	return id
}

func TestPutOpen_RoundTripIdempotentAndLimited(t *testing.T) {
	dir := t.TempDir()
	s, err := objectstore.New(filepath.Join(dir, "objects"))
	if err != nil {
		t.Fatal(err)
	}
	t.Cleanup(func() { _ = s.Close() })
	ctx, m := context.Background(), mid(t)

	ref, err := s.Put(ctx, m, strings.NewReader("synthetic content"), 1024)
	if err != nil || ref.Size != 17 || len(ref.SHA256) != 64 {
		t.Fatalf("%+v %v", ref, err)
	}
	again, err := s.Put(ctx, m, strings.NewReader("synthetic content"), 1024)
	if err != nil || again != ref {
		t.Fatalf("same bytes, same reference: %+v %v", again, err)
	}
	rc, err := s.Open(ctx, m, ref.SHA256)
	if err != nil {
		t.Fatal(err)
	}
	got, err := io.ReadAll(rc)
	_ = rc.Close()
	if err != nil || string(got) != "synthetic content" {
		t.Fatalf("%q %v", got, err)
	}

	if _, err := s.Put(ctx, m, strings.NewReader("0123456789"), 5); !errors.Is(err, port.ErrObjectTooLarge) {
		t.Fatalf("too large: %v", err)
	}
	tmp, _ := os.ReadDir(filepath.Join(dir, "objects", m.String(), "tmp"))
	if len(tmp) != 0 {
		t.Fatalf("a refused upload leaves no temp file: %v", tmp)
	}

	for _, bad := range []string{"", "../../etc/passwd", strings.Repeat("g", 64), strings.Repeat("a", 64)} {
		if _, err := s.Open(ctx, m, bad); !errors.Is(err, port.ErrObjectUnavailable) {
			t.Fatalf("%q: %v", bad, err)
		}
	}
}

func TestOpen_CorruptionIsUnavailableNotServed(t *testing.T) {
	dir := t.TempDir()
	s, err := objectstore.New(dir)
	if err != nil {
		t.Fatal(err)
	}
	t.Cleanup(func() { _ = s.Close() })
	ctx, m := context.Background(), mid(t)
	ref, err := s.Put(ctx, m, bytes.NewReader([]byte("original")), 1024)
	if err != nil {
		t.Fatal(err)
	}
	p := filepath.Join(dir, m.String(), ref.SHA256[:2], ref.SHA256)
	if err := os.WriteFile(p, []byte("tampered"), 0o600); err != nil {
		t.Fatal(err)
	}
	rc, err := s.Open(ctx, m, ref.SHA256)
	if err != nil {
		t.Fatal(err)
	}
	defer rc.Close()
	if _, err := io.ReadAll(rc); !errors.Is(err, port.ErrObjectUnavailable) {
		t.Fatalf("a corrupted object must not be read to completion: %v", err)
	}
}

func TestOpen_OtherMatterCannotReadByDigest(t *testing.T) {
	s, err := objectstore.New(t.TempDir())
	if err != nil {
		t.Fatal(err)
	}
	t.Cleanup(func() { _ = s.Close() })
	ctx := context.Background()
	ref, _ := s.Put(ctx, mid(t), strings.NewReader("x"), 10)
	other, _ := matter.NewMatterID("01a17c8f-15d0-72c3-b52a-4753f11dae7b")
	if _, err := s.Open(ctx, other, ref.SHA256); !errors.Is(err, port.ErrObjectUnavailable) {
		t.Fatalf("content is addressed within a matter: %v", err)
	}
}
