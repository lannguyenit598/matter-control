package matter_test

// Filing Package Pre-flight (MC-PREFLIGHT-01, design §4/§6): the read model shares the guard's
// proof-sufficiency predicate (D-20) so Ready can never disagree with DecideAdvance's proof
// refusal, and never claims more than proof readiness (stage legality etc. stay outside).

import (
	"errors"
	"strings"
	"testing"

	"leonx.me/matter-control/internal/core/domain/matter"
)

// preflightCase is one truth-table cell: the same fixture runs through both the read model and
// the guard, and the two answers must agree (guard-alignment pin, PF-AC-06).
type preflightCase struct {
	name  string
	f     func() matter.Filing
	it    func() matter.WorkItem
	set   func() matter.EvidenceSet
	ready bool
	// refuseCode is the DecideAdvance refusal expected from the PROOF gaps alone ("" = none);
	// the guard may still refuse for non-proof reasons, which the negative control covers.
	refuseCode string
	// blocking asserts the exact set of blocking row kinds+ids ("kind:id" or "kind"), order-free.
	blocking []string
}

func preflightBlockingRows(p matter.FilingPreflight) []string {
	var out []string
	for _, r := range p.Rows {
		if !r.Blocking {
			continue
		}
		if r.Kind == matter.PreflightKindCriterion {
			out = append(out, string(r.Kind)+":"+string(r.CriterionID))
		} else {
			out = append(out, string(r.Kind))
		}
	}
	return out
}

func sameMembers(a, b []string) bool {
	if len(a) != len(b) {
		return false
	}
	seen := map[string]int{}
	for _, s := range a {
		seen[s]++
	}
	for _, s := range b {
		seen[s]--
		if seen[s] < 0 {
			return false
		}
	}
	return true
}

func TestPreflightTruthTableMatchesGuard(t *testing.T) {
	satisfied := func() matter.FilingPreflight { // helper assertion per case below
		return matter.FilingPreflight{}
	}
	_ = satisfied
	cases := []preflightCase{
		{
			name: "verified package and signature criteria are proof-ready; outcome never blocks",
			f:    func() matter.Filing { return filingAt(matter.StageSignature) },
			it:   func() matter.WorkItem { return filingItem(true) },
			set:  proofRequiredSet,
			// Ready despite the OUTCOME criterion being satisfied here; an unaccepted outcome
			// must behave the same, so the negative-variant case below keeps OUT unaccepted.
			ready:      true,
			refuseCode: "",
			blocking:   nil,
		},
		{
			name: "declared but unsatisfied package plus undeclared signature refuse together",
			f:    func() matter.Filing { return filingAt(matter.StageSignature) },
			it:   func() matter.WorkItem { return filingItem(true) },
			set: func() matter.EvidenceSet {
				pkg := purposeCriterion("PKG", matter.PurposePackage)
				return withVersion(setOf([]matter.Criterion{pkg}, nil, nil, nil))
			},
			ready:      false,
			refuseCode: "guard-failed",
			blocking:   []string{"CRITERION:PKG", "SIGNATURE_REQUIREMENT"},
		},
		{
			name: "an undeclared package is never ready (Z-F-01) and names the package gate alone",
			f:    func() matter.Filing { return filingAt(matter.StageSignature) },
			it:   func() matter.WorkItem { return filingItem(true) },
			set: func() matter.EvidenceSet {
				return withVersion(setOf(nil, nil, nil, nil))
			},
			ready:      false,
			refuseCode: "package-criteria-required",
			blocking:   []string{"MISSING_PACKAGE", "SIGNATURE_REQUIREMENT"},
		},
		{
			name: "an unsatisfied mandatory signature criterion blocks on its own row",
			f:    func() matter.Filing { return filingAt(matter.StageSignature) },
			it:   func() matter.WorkItem { return filingItem(true) },
			set: func() matter.EvidenceSet {
				pkg, sig := purposeCriterion("PKG", matter.PurposePackage), purposeCriterion("SIG", matter.PurposeSignature)
				pev, pk, pa := acceptedFor("1", pkg)
				return withVersion(setOf([]matter.Criterion{pkg, sig}, []matter.Evidence{pev}, []matter.Claim{pk}, []matter.Assessment{pa}))
			},
			ready:      false,
			refuseCode: "guard-failed",
			blocking:   []string{"CRITERION:SIG"},
		},
		{
			name: "the OWNER no-signature decision waives the signature requirement (RULE-012)",
			f: func() matter.Filing {
				f := filingAt(matter.StageSignature)
				f.SignatureNotRequired, f.SignatureNotRequiredReason = true, "the authority requires none"
				return f
			},
			it: func() matter.WorkItem { return filingItem(true) },
			set: func() matter.EvidenceSet {
				pkg := purposeCriterion("PKG", matter.PurposePackage)
				pev, pk, pa := acceptedFor("1", pkg)
				return withVersion(setOf([]matter.Criterion{pkg}, []matter.Evidence{pev}, []matter.Claim{pk}, []matter.Assessment{pa}))
			},
			ready:      true,
			refuseCode: "",
			blocking:   nil,
		},
		{
			name: "a no-proof filing needs no declared package; its signature is shown, not claimed",
			f:    func() matter.Filing { return filingAt(matter.StageSignature) },
			it:   func() matter.WorkItem { return filingItem(false) },
			set:  func() matter.EvidenceSet { return withVersion(setOf(nil, nil, nil, nil)) },
			// The signature-on-submitted-versions fact depends on the command input, so the row
			// is informational (non-blocking) and Ready reflects the proof predicate only.
			ready:      true,
			refuseCode: "",
			blocking:   nil,
		},
		{
			name: "a retired SIGNATURE criterion reads as the OWNER's waiver, not a gap",
			f:    func() matter.Filing { return filingAt(matter.StageSignature) },
			it:   func() matter.WorkItem { return filingItem(true) },
			set: func() matter.EvidenceSet {
				pkg, sig := purposeCriterion("PKG", matter.PurposePackage), purposeCriterion("SIG", matter.PurposeSignature)
				sig.Retired = true
				pev, pk, pa := acceptedFor("1", pkg)
				return withVersion(setOf([]matter.Criterion{pkg, sig}, []matter.Evidence{pev}, []matter.Claim{pk}, []matter.Assessment{pa}))
			},
			ready:      true,
			refuseCode: "",
			blocking:   nil,
		},
		{
			name: "only an outcome criterion declared still lacks a package (BF-01 isolation)",
			f:    func() matter.Filing { return filingAt(matter.StageSignature) },
			it:   func() matter.WorkItem { return filingItem(true) },
			set: func() matter.EvidenceSet {
				out := purposeCriterion("OUT", matter.PurposeOutcome)
				return withVersion(setOf([]matter.Criterion{out}, nil, nil, nil))
			},
			ready:      false,
			refuseCode: "package-criteria-required",
			blocking:   []string{"MISSING_PACKAGE", "SIGNATURE_REQUIREMENT"},
		},
	}

	for _, tc := range cases {
		t.Run(tc.name, func(t *testing.T) {
			f, it, set := tc.f(), tc.it(), tc.set()
			got := matter.PreflightOf(f, it, set, now)
			if got.Ready != tc.ready {
				t.Fatalf("Ready = %v, want %v; rows %+v", got.Ready, tc.ready, got.Rows)
			}
			if bl := preflightBlockingRows(got); !sameMembers(bl, tc.blocking) {
				t.Fatalf("blocking rows = %v, want %v", bl, tc.blocking)
			}
			// Guard-alignment pin: the guard's proof refusal exists exactly when not Ready, and
			// its code matches the documented comparator mapping.
			_, err := matter.DecideAdvance(f, it, set, matter.FilingSet{}, submitInput())
			var rej *matter.RejectedError
			refused := errors.As(err, &rej)
			if tc.ready {
				if refused && proofRefusalCode(rej.Code) != "" {
					t.Fatalf("Ready but guard refused on proof: code=%s msg=%q", rej.Code, rej.Message)
				}
				return
			}
			if !refused {
				t.Fatalf("not Ready but the guard accepted the advance")
			}
			if proofRefusalCode(rej.Code) == "" {
				t.Fatalf("guard refused for a non-proof reason where a proof gap was expected: code=%s msg=%q", rej.Code, rej.Message)
			}
			if tc.refuseCode != "" && rej.Code != tc.refuseCode {
				t.Fatalf("refusal code = %s, want %s (msg=%q)", rej.Code, tc.refuseCode, rej.Message)
			}
		})
	}
}

// proofRefusalCode maps a guard refusal to the shared predicate: the three codes the proof gaps
// produce ("" for every non-proof refusal — stage legality, references, versions, terminal).
func proofRefusalCode(code string) string {
	switch code {
	case "package-criteria-required", "signature-criteria-required", "guard-failed":
		return code
	}
	return ""
}

// D-20 negative control: proof-ready does not mean submittable. A fully verified filing with an
// empty reference is refused for a non-proof reason while the panel truthfully says proof-ready.
func TestPreflightReadyDoesNotClaimFullSubmittability(t *testing.T) {
	f, it, set := filingAt(matter.StageSignature), filingItem(true), proofRequiredSet()
	if p := matter.PreflightOf(f, it, set, now); !p.Ready {
		t.Fatalf("a fully verified filing is proof-ready: %+v", p)
	}
	in := submitInput()
	in.Reference = ""
	_, err := matter.DecideAdvance(f, it, set, matter.FilingSet{}, in)
	var rej *matter.RejectedError
	if !asRejected(err, &rej) || rej.Code != "reference-required" {
		t.Fatalf("the guard must still refuse a missing reference: %v", err)
	}
	if !strings.Contains(rej.Message, "reference") {
		t.Fatalf("the refusal names the reference gap: %q", rej.Message)
	}
}

// Rows are projections: an unsatisfied mandatory package criterion carries its machine reason,
// and the OWNER waiver carries the retained rationale verbatim (D-22: data, not UI copy).
func TestPreflightRowProjections(t *testing.T) {
	t.Run("unsatisfied criterion carries its machine reason", func(t *testing.T) {
		pkg := purposeCriterion("PKG", matter.PurposePackage)
		got := matter.PreflightOf(filingAt(matter.StageSignature), filingItem(true), withVersion(setOf([]matter.Criterion{pkg}, nil, nil, nil)), now)
		var row *matter.PreflightRow
		for i := range got.Rows {
			if got.Rows[i].CriterionID == "PKG" {
				row = &got.Rows[i]
			}
		}
		if row == nil || row.State != matter.PreflightUnsatisfied || row.Reason != matter.CriterionMissing || !row.Blocking || !row.Mandatory {
			t.Fatalf("unsatisfied mandatory package row: %+v", row)
		}
		if row.Purpose != matter.PurposePackage {
			t.Fatalf("row purpose: %q", row.Purpose)
		}
	})
	t.Run("waiver rationale travels verbatim", func(t *testing.T) {
		f := filingAt(matter.StageSignature)
		f.SignatureNotRequired, f.SignatureNotRequiredReason = true, "external filing is countersigned by the authority"
		got := matter.PreflightOf(f, filingItem(true), withVersion(setOf(nil, nil, nil, nil)), now)
		waived := false
		for _, r := range got.Rows {
			if r.Kind == matter.PreflightKindSignatureRequirement && r.Waived {
				waived = true
				if r.State != matter.PreflightWaived || r.Blocking || r.WaiverRationale != f.SignatureNotRequiredReason {
					t.Fatalf("waiver row: %+v", r)
				}
			}
		}
		if !waived {
			t.Fatalf("expected a WAIVED signature row: %+v", got.Rows)
		}
	})
	t.Run("a disputed acceptance reads DISPUTED and still blocks like the guard", func(t *testing.T) {
		pkg := purposeCriterion("PKG", matter.PurposePackage)
		ev, k := proof("1", pkg, u1, u1)
		a := accept("1", k, u2, 0, nil)
		set := withVersion(setOf([]matter.Criterion{pkg}, []matter.Evidence{ev}, []matter.Claim{k}, []matter.Assessment{a}))
		set.Disputes = []matter.Dispute{{ID: "X1", AssessmentID: a.ID, RaisedBy: u1, Reason: "forged"}}
		got := matter.PreflightOf(filingAt(matter.StageSignature), filingItem(true), set, now)
		if got.Ready {
			t.Fatalf("a disputed mandatory criterion is not proof-ready: %+v", got.Rows)
		}
		var row *matter.PreflightRow
		for i := range got.Rows {
			if got.Rows[i].CriterionID == "PKG" {
				row = &got.Rows[i]
			}
		}
		if row == nil || row.State != matter.PreflightDisputed || row.Reason != matter.CriterionDisputed || !row.Blocking {
			t.Fatalf("disputed package row: %+v", row)
		}
		// Guard-alignment: the same fixture refuses the advance on the shared predicate.
		if _, err := matter.DecideAdvance(filingAt(matter.StageSignature), filingItem(true), set, matter.FilingSet{}, submitInput()); err == nil {
			t.Fatal("the guard must refuse the disputed package too")
		}
	})
}
