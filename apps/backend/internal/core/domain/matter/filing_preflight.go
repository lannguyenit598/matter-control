package matter

// Filing Package Pre-flight (MC-PREFLIGHT-01): the read-model projection of one filing's proof
// readiness. It shares the stage guard's proof-sufficiency predicate (ProofGapsOf, design D-20)
// so the panel can never disagree with DecideAdvance, and it claims proof readiness only — stage
// legality, references, submitted versions and terminal state remain the command's business.

import (
	"sort"
	"time"
)

// PreflightRowKind says where a checklist row comes from: a real criterion, the missing
// package declaration itself, or the filing-level signature requirement. Non-criterion rows
// have no criterion id: nothing is ever fabricated to fill one.
type PreflightRowKind string

const (
	PreflightKindCriterion            PreflightRowKind = "CRITERION"
	PreflightKindMissingPackage       PreflightRowKind = "MISSING_PACKAGE"
	PreflightKindSignatureRequirement PreflightRowKind = "SIGNATURE_REQUIREMENT"
)

// PreflightState projects a row's current proof fact. It introduces no lifecycle of its own:
// every value is read off EvaluateVerification's statuses or the recorded OWNER decisions.
type PreflightState string

const (
	PreflightSatisfied   PreflightState = "SATISFIED"
	PreflightUnsatisfied PreflightState = "UNSATISFIED"
	PreflightWaived      PreflightState = "WAIVED"
	PreflightDisputed    PreflightState = "DISPUTED"
	PreflightPending     PreflightState = "PENDING_ASSESSMENT"
)

// PreflightLink points at a real record of the same matter. Reserved for the wire contract
// (design §6-C3): the v1 client builds its internal links from the row identity it already
// has, so the domain leaves it unset rather than guessing a target.
type PreflightLink struct {
	Kind string // "evidence" | "workItem"
	ID   string
}

// PreflightRow is one checklist line. Titles and rationales are recorded data travelling
// verbatim; all display copy (including the cause text) is the client's, per locale.
type PreflightRow struct {
	Kind            PreflightRowKind
	CriterionID     CriterionID // empty unless Kind is CRITERION
	Purpose         CriterionPurpose
	Title           string // the criterion's own title (empty on non-criterion rows)
	Mandatory       bool
	State           PreflightState
	Blocking        bool
	Reason          CriterionReason // machine reason of an unsatisfied criterion (empty otherwise)
	Waived          bool
	WaiverRationale string // verbatim OWNER rationale; empty when none is recorded
	Link            *PreflightLink
}

// FilingPreflight is the proof-readiness read model of one filing at an instant.
type FilingPreflight struct {
	FilingID             NodeID
	SubjectID            NodeID
	Stage                FilingStage
	ProofRequired        bool
	SignatureNotRequired bool
	Rows                 []PreflightRow
	Ready                bool // no blocking row: the shared proof predicate passes
	AsOf                 time.Time
	Revision             int64 // the snapshot revision the model was read at
}

// PreflightOf projects the filing's proof readiness at asOf. Rows are deterministic projections
// of EvaluateVerification's statuses, the shared ProofGapsOf predicate and the recorded OWNER
// waiver; Ready is true exactly when that predicate is empty, matching the guard (PF-AC-06).
func PreflightOf(f Filing, it WorkItem, set EvidenceSet, asOf time.Time) FilingPreflight {
	gaps := ProofGapsOf(f, it, set, asOf)
	res := EvaluateVerification(it, set, asOf)
	p := FilingPreflight{
		FilingID:             f.ItemID,
		SubjectID:            it.ID,
		Stage:                f.Stage,
		ProofRequired:        it.ProofRequired,
		SignatureNotRequired: f.SignatureNotRequired,
		Ready:                gaps.Empty(),
		AsOf:                 asOf,
	}
	if gaps.PackageUndeclared {
		p.Rows = append(p.Rows, PreflightRow{
			Kind: PreflightKindMissingPackage, Purpose: PurposePackage,
			State: PreflightUnsatisfied, Blocking: true,
		})
	}
	for _, c := range res.Criteria {
		switch c.Criterion.EffectivePurpose() {
		case PurposePackage:
			p.Rows = append(p.Rows, criterionRow(c, PurposePackage))
		case PurposeSignature:
			p.Rows = append(p.Rows, criterionRow(c, PurposeSignature))
		case PurposeOutcome:
			row := criterionRow(c, PurposeOutcome)
			row.Blocking = false // BF-01: the authority's decision never gates submission
			p.Rows = append(p.Rows, row)
		}
	}
	// A retired SIGNATURE criterion reads as the OWNER's waiver (the guard's everDeclared path):
	// shown, not silent, so the missing signature requirement is explained.
	for _, c := range set.Criteria {
		if c.SubjectID == it.ID && c.Retired && c.EffectivePurpose() == PurposeSignature {
			p.Rows = append(p.Rows, PreflightRow{
				Kind: PreflightKindCriterion, CriterionID: c.ID, Purpose: PurposeSignature,
				Title: c.Title, Mandatory: c.Mandatory, State: PreflightWaived, Waived: true,
			})
		}
	}
	// The filing-level signature requirement: a recorded no-signature decision waives it;
	// an undeclared signature on a proof-required filing is a blocking gap; a no-proof
	// filing's signature is checked against the versions named at submission time (command
	// input), so it is shown without claiming a result.
	switch {
	case f.SignatureNotRequired:
		p.Rows = append(p.Rows, PreflightRow{
			Kind: PreflightKindSignatureRequirement, Purpose: PurposeSignature,
			State: PreflightWaived, Waived: true, WaiverRationale: f.SignatureNotRequiredReason,
		})
	case gaps.SigUndeclared:
		p.Rows = append(p.Rows, PreflightRow{
			Kind: PreflightKindSignatureRequirement, Purpose: PurposeSignature,
			State: PreflightUnsatisfied, Blocking: true,
		})
	case !it.ProofRequired:
		p.Rows = append(p.Rows, PreflightRow{
			Kind: PreflightKindSignatureRequirement, Purpose: PurposeSignature,
			State: PreflightUnsatisfied,
		})
	}
	sort.SliceStable(p.Rows, func(i, j int) bool { return p.Rows[i].CriterionID < p.Rows[j].CriterionID })
	return p
}

// criterionRow projects one evaluated criterion. Blocking follows the guard's predicate
// exactly: a mandatory non-outcome criterion that is not satisfied — nothing else.
func criterionRow(c CriterionStatus, purpose CriterionPurpose) PreflightRow {
	row := PreflightRow{
		Kind: PreflightKindCriterion, CriterionID: c.Criterion.ID, Purpose: purpose,
		Title: c.Criterion.Title, Mandatory: c.Criterion.Mandatory,
	}
	switch {
	case c.Satisfied:
		row.State = PreflightSatisfied
	case c.Reason == CriterionDisputed:
		row.State, row.Reason = PreflightDisputed, c.Reason
	case c.Reason == CriterionPending:
		row.State, row.Reason = PreflightPending, c.Reason
	default:
		row.State, row.Reason = PreflightUnsatisfied, c.Reason
	}
	row.Blocking = purpose != PurposeOutcome && c.Criterion.Mandatory && !c.Satisfied
	return row
}
