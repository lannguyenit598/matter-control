package objectstore_test

import (
	"context"
	"errors"
	"io"
	"net/http"
	"net/http/httptest"
	"strconv"
	"strings"
	"sync"
	"testing"

	"leonx.me/matter-control/internal/adapter/outbound/objectstore"
	"leonx.me/matter-control/internal/core/domain/matter"
	"leonx.me/matter-control/internal/core/port"
)

const bucket = "mc-docs"

// fakeS3 is a path-style S3 endpoint holding objects in memory; it records what the adapter sent.
type fakeS3 struct {
	mu       sync.Mutex
	objects  map[string][]byte
	puts     int
	heads    int
	failWith int // when non-zero, every request answers this status
	lastPut  http.Header
}

func newFake(t *testing.T) (*fakeS3, *objectstore.R2) {
	t.Helper()
	f := &fakeS3{objects: map[string][]byte{}}
	srv := httptest.NewServer(f)
	t.Cleanup(srv.Close)
	r, err := objectstore.NewR2(objectstore.R2Config{
		Endpoint: srv.URL, Bucket: bucket, AccessKeyID: "AKID", SecretAccessKey: "secret",
	})
	if err != nil {
		t.Fatal(err)
	}
	return f, r
}

func (f *fakeS3) ServeHTTP(w http.ResponseWriter, r *http.Request) {
	f.mu.Lock()
	defer f.mu.Unlock()
	if f.failWith != 0 {
		w.WriteHeader(f.failWith)
		return
	}
	key := strings.TrimPrefix(r.URL.Path, "/"+bucket+"/")
	switch r.Method {
	case http.MethodHead:
		f.heads++
		b, ok := f.objects[key]
		if !ok {
			w.WriteHeader(http.StatusNotFound) // a HEAD has no body, so no error code to carry
			return
		}
		w.Header().Set("Content-Length", strconv.Itoa(len(b)))
	case http.MethodPut:
		f.puts++
		f.lastPut = r.Header.Clone()
		b, _ := io.ReadAll(r.Body)
		f.objects[key] = b
		w.WriteHeader(http.StatusOK)
	case http.MethodGet:
		b, ok := f.objects[key]
		if !ok {
			w.Header().Set("Content-Type", "application/xml")
			w.WriteHeader(http.StatusNotFound)
			_, _ = io.WriteString(w, `<Error><Code>NoSuchKey</Code><Message>missing</Message></Error>`)
			return
		}
		_, _ = w.Write(b)
	}
}

func TestR2_StoresUnderTheLocalLayoutWithItsDigestAndNeverTwice(t *testing.T) {
	f, s := newFake(t)
	ctx, m := context.Background(), mid(t)
	ref, err := s.Put(ctx, m, strings.NewReader("synthetic content"), 1024)
	if err != nil || ref.Size != 17 || len(ref.SHA256) != 64 {
		t.Fatalf("%+v %v", ref, err)
	}
	key := m.String() + "/" + ref.SHA256[:2] + "/" + ref.SHA256
	if string(f.objects[key]) != "synthetic content" {
		t.Fatalf("key layout must match the local directory (so it can be copied): %v", f.objects)
	}
	if f.lastPut.Get("X-Amz-Checksum-Sha256") == "" || f.lastPut.Get("Authorization") == "" {
		t.Fatalf("upload must carry its SHA-256 and be signed: %v", f.lastPut)
	}
	again, err := s.Put(ctx, m, strings.NewReader("synthetic content"), 1024)
	if err != nil || again != ref || f.puts != 1 {
		t.Fatalf("same bytes, same reference, no second upload: %+v %v puts=%d", again, err, f.puts)
	}
}

func TestR2_ReplacesAnObjectOfTheWrongSizeUnderTheKey(t *testing.T) {
	f, s := newFake(t)
	ctx, m := context.Background(), mid(t)
	ref, _ := s.Put(ctx, m, strings.NewReader("original"), 1024)
	key := m.String() + "/" + ref.SHA256[:2] + "/" + ref.SHA256
	f.objects[key] = []byte("trunc")
	if _, err := s.Put(ctx, m, strings.NewReader("original"), 1024); err != nil || f.puts != 2 {
		t.Fatalf("a damaged earlier write is repaired: %v puts=%d", err, f.puts)
	}
	if string(f.objects[key]) != "original" {
		t.Fatalf("%q", f.objects[key])
	}
}

func TestR2_TooLargeStoresNothingAndDoesNotCallOut(t *testing.T) {
	f, s := newFake(t)
	if _, err := s.Put(context.Background(), mid(t), strings.NewReader("0123456789"), 5); !errors.Is(err, port.ErrObjectTooLarge) {
		t.Fatalf("%v", err)
	}
	if f.puts != 0 || f.heads != 0 || len(f.objects) != 0 {
		t.Fatalf("puts=%d heads=%d objects=%d", f.puts, f.heads, len(f.objects))
	}
}

func TestR2_OpenVerifiesTheDigestAndTreatsMissingAsUnavailable(t *testing.T) {
	f, s := newFake(t)
	ctx, m := context.Background(), mid(t)
	ref, _ := s.Put(ctx, m, strings.NewReader("original"), 1024)

	rc, err := s.Open(ctx, m, ref.SHA256)
	if err != nil {
		t.Fatal(err)
	}
	got, err := io.ReadAll(rc)
	_ = rc.Close()
	if err != nil || string(got) != "original" {
		t.Fatalf("%q %v", got, err)
	}

	f.objects[m.String()+"/"+ref.SHA256[:2]+"/"+ref.SHA256] = []byte("tampered")
	rc, err = s.Open(ctx, m, ref.SHA256)
	if err != nil {
		t.Fatal(err)
	}
	defer rc.Close()
	if _, err := io.ReadAll(rc); !errors.Is(err, port.ErrObjectUnavailable) {
		t.Fatalf("a replaced object must not be read to completion: %v", err)
	}

	gets := f.heads
	for _, bad := range []string{"", "../../etc/passwd", strings.Repeat("g", 64)} {
		if _, err := s.Open(ctx, m, bad); !errors.Is(err, port.ErrObjectUnavailable) {
			t.Fatalf("%q: %v", bad, err)
		}
	}
	if _, err := s.Open(ctx, m, strings.Repeat("a", 64)); !errors.Is(err, port.ErrObjectUnavailable) {
		t.Fatalf("missing object: %v", err)
	}
	if f.heads != gets {
		t.Fatal("a malformed digest must not reach the bucket")
	}
}

func TestR2_ContentIsAddressedWithinAMatter(t *testing.T) {
	_, s := newFake(t)
	ctx := context.Background()
	ref, _ := s.Put(ctx, mid(t), strings.NewReader("x"), 10)
	other, _ := matter.NewMatterID("01a17c8f-15d0-72c3-b52a-4753f11dae7b")
	if _, err := s.Open(ctx, other, ref.SHA256); !errors.Is(err, port.ErrObjectUnavailable) {
		t.Fatalf("%v", err)
	}
}

func TestR2_ProviderFailuresAreUnavailableNeverSuccess(t *testing.T) {
	for _, status := range []int{http.StatusForbidden, http.StatusServiceUnavailable} {
		f, s := newFake(t)
		f.failWith = status
		ctx, m := context.Background(), mid(t)
		if _, err := s.Put(ctx, m, strings.NewReader("x"), 10); !errors.Is(err, port.ErrObjectUnavailable) {
			t.Fatalf("put %d: %v", status, err)
		}
		if _, err := s.Open(ctx, m, strings.Repeat("a", 64)); !errors.Is(err, port.ErrObjectUnavailable) {
			t.Fatalf("open %d: %v", status, err)
		}
	}
}

func TestNewR2_RequiresEverySetting(t *testing.T) {
	full := objectstore.R2Config{Endpoint: "https://a.r2.cloudflarestorage.com", Bucket: "b", AccessKeyID: "k", SecretAccessKey: "s"}
	for name, mutate := range map[string]func(*objectstore.R2Config){
		"endpoint": func(c *objectstore.R2Config) { c.Endpoint = "" },
		"bucket":   func(c *objectstore.R2Config) { c.Bucket = "" },
		"key id":   func(c *objectstore.R2Config) { c.AccessKeyID = "" },
		"secret":   func(c *objectstore.R2Config) { c.SecretAccessKey = "" },
	} {
		c := full
		mutate(&c)
		if _, err := objectstore.NewR2(c); err == nil {
			t.Errorf("%s: expected an error", name)
		}
	}
	if _, err := objectstore.NewR2(full); err != nil {
		t.Fatal(err)
	}
}
