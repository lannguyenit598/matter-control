package system_test

import (
	"testing"

	"github.com/example/userapi/internal/adapter/outbound/system"
)

// The record-ID capability generates canonical UUIDv7 strings and never the legacy
// domain.UserID type.
func TestRecordIDv7_CanonicalUUIDv7Strings(t *testing.T) {
	g := system.RecordIDv7{}
	seen := make(map[string]struct{}, 1000)
	prev := ""
	for range 1000 {
		id := g.NewRecordID()
		if len(id) != 36 || id[14] != '7' {
			t.Fatalf("not a uuidv7 string: %q", id)
		}
		if v := id[19]; v != '8' && v != '9' && v != 'a' && v != 'b' {
			t.Fatalf("variant nibble = %c (%s)", v, id)
		}
		if _, dup := seen[id]; dup {
			t.Fatalf("duplicate id %s", id)
		}
		seen[id] = struct{}{}
		if id <= prev {
			t.Fatalf("ids not monotonic: %s after %s", id, prev)
		}
		prev = id
	}
}
