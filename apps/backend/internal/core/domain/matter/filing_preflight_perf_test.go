package matter_test

// MC-PREFLIGHT-01 PF-AC-11: the read model is computed on read, so its cost is the cost of
// PreflightOf on a realistic filing: roughly 100 criteria (mandatory package and signature
// criteria with accepted proof, plus outcome criteria), evaluated per call.

import (
	"fmt"
	"testing"
	"time"

	"leonx.me/matter-control/internal/core/domain/matter"
)

func BenchmarkPreflightOf100Criteria(b *testing.B) {
	f := filingAt(matter.StageSignature)
	it := filingItem(true)
	var crits []matter.Criterion
	var evs []matter.Evidence
	var claims []matter.Claim
	var assess []matter.Assessment
	for i := 0; i < 60; i++ { // mandatory PACKAGE criteria, accepted
		c := purposeCriterion(fmt.Sprintf("PKG%02d", i), matter.PurposePackage)
		ev, k, a := acceptedFor(fmt.Sprintf("e%d", i), c)
		crits, evs, claims, assess = append(crits, c), append(evs, ev), append(claims, k), append(assess, a)
	}
	for i := 0; i < 30; i++ { // mandatory SIGNATURE criteria, accepted
		c := purposeCriterion(fmt.Sprintf("SIG%02d", i), matter.PurposeSignature)
		ev, k, a := acceptedFor(fmt.Sprintf("f%d", i), c)
		crits, evs, claims, assess = append(crits, c), append(evs, ev), append(claims, k), append(assess, a)
	}
	for i := 0; i < 10; i++ { // OUTCOME criteria, claimed but unassessed (never blocking)
		c := purposeCriterion(fmt.Sprintf("OUT%02d", i), matter.PurposeOutcome)
		ev, k := proof(fmt.Sprintf("g%d", i), c, u1, u1)
		crits, evs, claims = append(crits, c), append(evs, ev), append(claims, k)
	}
	set := withVersion(setOf(crits, evs, claims, assess))
	asOf := time.Now()

	b.ReportAllocs()
	for b.Loop() {
		if p := matter.PreflightOf(f, it, set, asOf); !p.Ready {
			b.Fatal("the fully accepted fixture must be proof-ready")
		}
	}
}
