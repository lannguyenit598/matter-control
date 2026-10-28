package mattercontrol_test

import (
	"sync"
	"testing"
	"time"

	"github.com/example/userapi/internal/adapter/outbound/repotest/mattercontrol"
	"github.com/example/userapi/internal/adapter/outbound/sheet"
)

// The shared spine contract runs against the in-memory double first: it must pass the
// same suite as the PostgreSQL adapter. The double's clock is monotonic but arbitrary.
func TestSuite_MemoryStore(t *testing.T) {
	mattercontrol.Suite(t, func(t *testing.T) mattercontrol.Bundle {
		base := time.Date(2026, 10, 25, 12, 0, 0, 0, time.UTC)
		n := 0
		store := mattercontrol.NewMemoryStore(func() time.Time {
			n++
			return base.Add(time.Duration(n) * time.Second)
		})
		return mattercontrol.Bundle{Store: store, World: mattercontrol.NewMemoryWorld(store)}
	})
}

// The W1 contract runs against the same in-memory double.
func TestSuiteW1_MemoryStore(t *testing.T) {
	mattercontrol.SuiteW1(t, func(t *testing.T) mattercontrol.Bundle {
		base := time.Date(2026, 10, 25, 12, 0, 0, 0, time.UTC)
		n := 0
		store := mattercontrol.NewMemoryStore(func() time.Time {
			n++
			return base.Add(time.Duration(n) * time.Second)
		})
		return mattercontrol.Bundle{Store: store, World: mattercontrol.NewMemoryWorld(store)}
	})
}

// The W2 work-graph contract runs against the same in-memory double.
func TestSuiteW2_MemoryStore(t *testing.T) {
	mattercontrol.SuiteW2(t, func(t *testing.T) mattercontrol.Bundle {
		base := time.Now().UTC().Add(-time.Minute)
		n := 0
		store := mattercontrol.NewMemoryStore(func() time.Time {
			n++
			return base.Add(time.Duration(n) * time.Millisecond)
		})
		return mattercontrol.Bundle{Store: store, World: mattercontrol.NewMemoryWorld(store)}
	})
}

// The W3 documents/proof contract runs against the same in-memory double.
func TestSuiteW3_MemoryStore(t *testing.T) {
	mattercontrol.SuiteW3(t, func(t *testing.T) mattercontrol.Bundle {
		base := time.Now().UTC().Add(-time.Minute)
		n := 0
		store := mattercontrol.NewMemoryStore(func() time.Time {
			n++
			return base.Add(time.Duration(n) * time.Millisecond)
		})
		return mattercontrol.Bundle{Store: store, World: mattercontrol.NewMemoryWorld(store)}
	})
}

// The W4 regulatory-filing contract runs against the same in-memory double.
func TestSuiteW4_MemoryStore(t *testing.T) {
	mattercontrol.SuiteW4(t, func(t *testing.T) mattercontrol.Bundle {
		base := time.Now().UTC().Add(-time.Minute)
		n := 0
		store := mattercontrol.NewMemoryStore(func() time.Time {
			n++
			return base.Add(time.Duration(n) * time.Millisecond)
		})
		return mattercontrol.Bundle{Store: store, World: mattercontrol.NewMemoryWorld(store)}
	})
}

// The W5 Control Room / context contract runs against the same in-memory double.
func TestSuiteW5_MemoryStore(t *testing.T) {
	mattercontrol.SuiteW5(t, func(t *testing.T) mattercontrol.Bundle {
		base := time.Now().UTC().Add(-time.Minute)
		n := 0
		store := mattercontrol.NewMemoryStore(func() time.Time {
			n++
			return base.Add(time.Duration(n) * time.Millisecond)
		})
		return mattercontrol.Bundle{Store: store, World: mattercontrol.NewMemoryWorld(store)}
	})
}

// The postrun QA regressions (F01..F03) run against the same in-memory double.
func TestSuiteW7QA_MemoryStore(t *testing.T) {
	mattercontrol.SuiteW7QA(t, func(t *testing.T) mattercontrol.Bundle {
		base := time.Now().UTC().Add(-time.Minute)
		n := 0
		store := mattercontrol.NewMemoryStore(func() time.Time {
			n++
			return base.Add(time.Duration(n) * time.Millisecond)
		})
		return mattercontrol.Bundle{Store: store, World: mattercontrol.NewMemoryWorld(store)}
	})
}

// The W6 import contract runs against the same in-memory double.
func TestSuiteW6_MemoryStore(t *testing.T) {
	mattercontrol.SuiteW6(t, func(t *testing.T) mattercontrol.Bundle {
		base := time.Now().UTC().Add(-time.Minute)
		n := 0
		var mu sync.Mutex
		store := mattercontrol.NewMemoryStore(func() time.Time {
			mu.Lock()
			defer mu.Unlock()
			n++
			return base.Add(time.Duration(n) * time.Millisecond)
		})
		return mattercontrol.Bundle{Store: store, World: mattercontrol.NewMemoryWorld(store)}
	}, sheet.Codec{})
}

// The original Golden Workflow ledgers (AC-161..163) run against the same in-memory double.
func TestSuiteGW_MemoryStore(t *testing.T) {
	mattercontrol.SuiteGW(t, func(t *testing.T) mattercontrol.Bundle {
		base := time.Now().UTC().Add(-time.Minute)
		n := 0
		store := mattercontrol.NewMemoryStore(func() time.Time {
			n++
			return base.Add(time.Duration(n) * time.Millisecond)
		})
		return mattercontrol.Bundle{Store: store, World: mattercontrol.NewMemoryWorld(store)}
	})
}
