// Package port defines the hexagon's ports.
//
//   - Inbound (driving): operations the outside world can request from the application.
//     The HTTP adapter calls these.
//   - Outbound (driven): capabilities the application needs from the outside world.
//     Database, clock, and ID generator adapters implement these interfaces.
//
// Interfaces belong to core (the consumer), not adapters (the implementation).
package port

import "time"

// Clock supplies the current time so core logic stays deterministic under test.
type Clock interface {
	Now() time.Time
}
