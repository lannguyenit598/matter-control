// Package system provides adapters for system dependencies: the clock and ID generator.
// Ports make core tests fully deterministic.
package system

import (
	"time"

	"github.com/google/uuid"

	"github.com/example/userapi/internal/core/port"
)

// Clock returns UTC time truncated to microseconds to match PostgreSQL precision.
type Clock struct{}

var _ port.Clock = Clock{}

func (Clock) Now() time.Time { return time.Now().UTC().Truncate(time.Microsecond) }

// RecordIDv7 generates UUIDv7 ids for MatterControl records (graph nodes, history
// events, receipts, security-audit rows). The id
// stays an opaque string; the core validates it as a canonical UUID when a typed identity needs it.
type RecordIDv7 struct{}

var _ port.RecordIDGenerator = RecordIDv7{}

func (RecordIDv7) NewRecordID() string {
	return uuid.Must(uuid.NewV7()).String()
}
