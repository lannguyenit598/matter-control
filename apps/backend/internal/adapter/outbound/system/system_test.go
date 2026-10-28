package system_test

import (
	"testing"
	"time"

	"github.com/example/userapi/internal/adapter/outbound/system"
)

// PostgreSQL stores timestamptz at microsecond precision: truncate the clock beforehand so
// creation responses match subsequent reads (ETags/time comparisons remain consistent).
func TestClock_IsUTCWithMicrosecondPrecision(t *testing.T) {
	for range 1000 {
		now := system.Clock{}.Now()
		if now.Location() != time.UTC {
			t.Fatalf("location = %v, want UTC", now.Location())
		}
		if now.Nanosecond()%1000 != 0 {
			t.Fatalf("%v has sub-microsecond precision", now)
		}
	}
}
