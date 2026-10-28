package mattercontrol

import (
	"bytes"
	"context"
	"crypto/sha256"
	"encoding/hex"
	"io"
	"sync"

	"github.com/example/userapi/internal/core/domain/matter"
	"github.com/example/userapi/internal/core/port"
)

// MemoryObjects is the in-memory port.ObjectStore used by the shared contract: content is
// addressed by digest within a matter, like the filesystem adapter.
type MemoryObjects struct {
	mu   sync.Mutex
	data map[string][]byte
}

var _ port.ObjectStore = (*MemoryObjects)(nil)

func NewMemoryObjects() *MemoryObjects { return &MemoryObjects{data: map[string][]byte{}} }

// Count is the number of distinct stored objects (test observation).
func (o *MemoryObjects) Count() int {
	o.mu.Lock()
	defer o.mu.Unlock()
	return len(o.data)
}

func (o *MemoryObjects) Put(_ context.Context, m matter.MatterID, r io.Reader, maxBytes int64) (port.ObjectRef, error) {
	b, err := io.ReadAll(io.LimitReader(r, maxBytes+1))
	if err != nil {
		return port.ObjectRef{}, err
	}
	if int64(len(b)) > maxBytes {
		return port.ObjectRef{}, port.ErrObjectTooLarge
	}
	sum := sha256.Sum256(b)
	ref := port.ObjectRef{SHA256: hex.EncodeToString(sum[:]), Size: int64(len(b))}
	o.mu.Lock()
	o.data[m.String()+"/"+ref.SHA256] = b
	o.mu.Unlock()
	return ref, nil
}

func (o *MemoryObjects) Open(_ context.Context, m matter.MatterID, sha string) (io.ReadCloser, error) {
	o.mu.Lock()
	b, ok := o.data[m.String()+"/"+sha]
	o.mu.Unlock()
	if !ok {
		return nil, port.ErrObjectUnavailable
	}
	return io.NopCloser(bytes.NewReader(b)), nil
}
