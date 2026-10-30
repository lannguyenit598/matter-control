package postgres

// Local NFR-006 measurement: 50- and 200-item matters, 30 timed repetitions per read, p50/p95 and
// error counts, with the environment recorded. Service level against a real PostgreSQL (no HTTP, no
// browser, no network), on this workstation: it is evidence of the workload, not a budget or an SLA.
// Inert unless MC_PERF_OUT names the result file.

import (
	"encoding/json"
	"fmt"
	"os"
	"runtime"
	"sort"
	"testing"
	"time"

	"leonx.me/matter-control/internal/adapter/outbound/repotest/mattercontrol"
)

func TestPerf_LocalWorkloads(t *testing.T) {
	out := os.Getenv("MC_PERF_OUT")
	if out == "" {
		t.Skip("MC_PERF_OUT not set; performance measurement is inert")
	}
	type stat struct {
		Read                       string
		Items, Reps, Errors        int
		P50ms, P95ms, MinMs, MaxMs float64
	}
	var stats []stat
	for _, items := range []int{50, 200} {
		reads := mattercontrol.NewPerfWorkload(t, func(t *testing.T) mattercontrol.Bundle {
			b, _ := newProductStore(t)
			return b
		}, items)
		for _, r := range reads {
			for i := 0; i < 3; i++ { // warm-up, not counted
				_ = r.Run()
			}
			var ms []float64
			errs := 0
			for i := 0; i < 30; i++ {
				start := time.Now()
				if err := r.Run(); err != nil {
					errs++
					continue
				}
				ms = append(ms, float64(time.Since(start).Microseconds())/1000)
			}
			sort.Float64s(ms)
			s := stat{Read: r.Name, Items: items, Reps: 30, Errors: errs}
			if len(ms) > 0 {
				s.P50ms, s.P95ms = ms[len(ms)*50/100], ms[(len(ms)*95+99)/100-1]
				s.MinMs, s.MaxMs = ms[0], ms[len(ms)-1]
			}
			stats = append(stats, s)
			t.Logf("%-22s items=%3d p50=%.1fms p95=%.1fms errors=%d", r.Name, items, s.P50ms, s.P95ms, errs)
		}
	}
	b, _ := json.MarshalIndent(map[string]any{
		"scope": "service level against PostgreSQL 17 on one workstation; no HTTP/browser/network; not a budget or SLA",
		"env":   map[string]any{"go": runtime.Version(), "os": runtime.GOOS, "arch": runtime.GOARCH, "cpus": runtime.NumCPU(), "postgres": "postgres:17.10-alpine (docker)"},
		"stats": stats, "generatedAt": time.Now().UTC().Format(time.RFC3339), "note": fmt.Sprintf("%d repetitions after 3 warm-ups", 30),
	}, "", " ") // skip: plain values always marshal
	if err := os.WriteFile(out, b, 0o600); err != nil { //nolint:gosec // operator-chosen evidence path for a measurement run
		t.Fatal(err)
	}
}
