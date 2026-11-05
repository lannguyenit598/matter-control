package mattercontrol

// Filing Package Pre-flight (MC-PREFLIGHT-01) contract: one authorized snapshot per read, the
// shared guard predicate as the readiness answer, and the uniform hidden denial. Runs on memory
// and PostgreSQL like every other store contract.

import (
	"errors"
	"testing"

	"leonx.me/matter-control/internal/core/domain/matter"
	"leonx.me/matter-control/internal/core/port"
)

// SuitePreflight runs the Pre-flight read-model contracts.
func SuitePreflight(t *testing.T, newBundle Factory) {
	t.Helper()
	t.Run("preflight read model over a real filing", func(t *testing.T) { preflightReadModel(t, newBundle) })
	t.Run("preflight denial is the uniform hidden denial", func(t *testing.T) { preflightDenial(t, newBundle) })
}

func hasBlockingKind(p matter.FilingPreflight, kind matter.PreflightRowKind) bool {
	for _, r := range p.Rows {
		if r.Blocking && r.Kind == kind {
			return true
		}
	}
	return false
}

func preflightRevision(t *testing.T, e *w2Env, f filingFx) int64 {
	t.Helper()
	d, err := e.fil.GetFiling(e.ctx, port.FilingQuery{ActorID: e.editor.String(), MatterID: e.m.String(), FilingID: f.filingID.String()})
	if err != nil {
		t.Fatal(err)
	}
	return d.View.Item.Revision
}

func preflightReadModel(t *testing.T, newBundle Factory) {
	e := newW2Env(t, newBundle)
	f := e.newFiling(true)
	read := func() matter.FilingPreflight {
		t.Helper()
		p, err := e.fil.Preflight(e.ctx, port.FilingQuery{ActorID: e.editor.String(), MatterID: e.m.String(), FilingID: f.filingID.String()})
		if err != nil {
			t.Fatalf("preflight: %v", err)
		}
		return p
	}

	// Nothing declared: the missing package and the signature requirement are both blocking gaps.
	p := read()
	if p.Ready {
		t.Fatalf("a filing with nothing declared is not proof-ready: %+v", p.Rows)
	}
	if !hasBlockingKind(p, matter.PreflightKindMissingPackage) || !hasBlockingKind(p, matter.PreflightKindSignatureRequirement) {
		t.Fatalf("expected the package and signature gaps: %+v", p.Rows)
	}
	if p.AsOf.IsZero() || p.FilingID.String() != f.filingID.String() {
		t.Fatalf("the read model carries its identity and as-of instant: %+v", p)
	}

	// Declared and independently accepted package; the signature gap remains.
	f.declarePackage()
	p = read()
	if p.Ready || hasBlockingKind(p, matter.PreflightKindMissingPackage) || !hasBlockingKind(p, matter.PreflightKindSignatureRequirement) {
		t.Fatalf("a declared package leaves only the signature gap: ready=%v rows=%+v", p.Ready, p.Rows)
	}

	// The OWNER no-signature decision waives the signature requirement (RULE-012): proof-ready,
	// with the retained rationale travelling verbatim.
	if _, err := e.fil.SetSignatureApplicability(e.ctx, port.SetFilingSignatureApplicabilityCmd{
		ActorID: e.owner.String(), MatterID: e.m.String(), FilingID: f.filingID.String(),
		ExpectedRevision: preflightRevision(t, e, f), SignatureNotRequired: true, Reason: "the authority requires none",
	}); err != nil {
		t.Fatalf("set signature applicability: %v", err)
	}
	p = read()
	if !p.Ready {
		t.Fatalf("a waived signature makes the filing proof-ready: rows=%+v", p.Rows)
	}
	waived := false
	for _, r := range p.Rows {
		if r.Kind == matter.PreflightKindSignatureRequirement && r.Waived && r.State == matter.PreflightWaived && r.WaiverRationale == "the authority requires none" {
			waived = true
		}
	}
	if !waived {
		t.Fatalf("expected the verbatim waiver row: %+v", p.Rows)
	}

	// A newly declared mandatory criterion without proof blocks on its own row again.
	e.criterion(f.filingID, port.CriterionInput{Title: "Additional certificate", Mandatory: true, Rule: "NONE"})
	p = read()
	if p.Ready || !hasBlockingKind(p, matter.PreflightKindCriterion) {
		t.Fatalf("a declared unproven criterion blocks on its criterion row: rows=%+v", p.Rows)
	}
}

func preflightDenial(t *testing.T, newBundle Factory) {
	e := newW2Env(t, newBundle)
	f := e.newFiling(true)

	// Every member reads, VIEWER included: the panel is a read-only view.
	if _, err := e.fil.Preflight(e.ctx, port.FilingQuery{ActorID: e.viewer.String(), MatterID: e.m.String(), FilingID: f.filingID.String()}); err != nil {
		t.Fatalf("viewer reads the panel: %v", err)
	}
	// A non-member gets the uniform hidden denial — the same answer as a missing filing, so
	// existence is never revealed (GLOSSARY: hidden denial; design D-21).
	if _, err := e.fil.Preflight(e.ctx, port.FilingQuery{ActorID: e.out.String(), MatterID: e.m.String(), FilingID: f.filingID.String()}); !errors.Is(err, port.ErrNotFound) {
		t.Fatalf("outsider gets the hidden denial: %v", err)
	}
	// A member asking for a work item that is not a filing is equally a hidden denial.
	req := e.requirement("Unrelated requirement")
	if _, err := e.fil.Preflight(e.ctx, port.FilingQuery{ActorID: e.editor.String(), MatterID: e.m.String(), FilingID: req.ID.String()}); !errors.Is(err, port.ErrNotFound) {
		t.Fatalf("a non-filing work item gets the hidden denial: %v", err)
	}
}
