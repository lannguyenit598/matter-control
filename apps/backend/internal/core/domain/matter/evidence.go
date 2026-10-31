package matter

import (
	"sort"
	"time"
)

// DocumentID, VersionID, CriterionID, EvidenceID, ClaimID, AssessmentID, DisputeID identify
// the W3 records. Every one lives inside exactly one matter.
type (
	DocumentID   string
	VersionID    string
	CriterionID  string
	EvidenceID   string
	ClaimID      string
	AssessmentID string
	DisputeID    string
)

func (id DocumentID) String() string   { return string(id) }
func (id VersionID) String() string    { return string(id) }
func (id CriterionID) String() string  { return string(id) }
func (id EvidenceID) String() string   { return string(id) }
func (id ClaimID) String() string      { return string(id) }
func (id AssessmentID) String() string { return string(id) }
func (id DisputeID) String() string    { return string(id) }

// Document is a stable identity whose content lives in immutable versions. Upload never
// promotes: exactly one version is current, chosen explicitly by an OWNER (RULE-011).
type Document struct {
	ID               DocumentID
	MatterID         MatterID
	Name             string
	CurrentVersionID *VersionID
	Revision         int64
}

// DocumentVersion is an immutable version: content is addressed by its SHA-256 and never
// overwritten. Predecessor links the lineage.
type DocumentVersion struct {
	ID          VersionID
	MatterID    MatterID
	DocumentID  DocumentID
	No          int
	Predecessor *VersionID
	Filename    string
	MediaType   string
	SHA256      string
	SizeBytes   int64
	UploadedBy  ActorID
	UploadedAt  time.Time
}

// SignatureObservation records that a named signer's signature was observed on one exact
// version. Completeness of signatures is a separate observation, never inferred from the
// current-version pointer or from an upload (RULE-011).
type SignatureObservation struct {
	ID         string
	MatterID   MatterID
	VersionID  VersionID
	Signer     string
	SignedAt   time.Time
	ObservedBy ActorID
	RecordedAt time.Time
}

// VersionRule says which document version a criterion's proof must be about.
type VersionRule string

const (
	// VersionNone: the proof need not reference a document version (an external reference or
	// observation can satisfy it).
	VersionNone VersionRule = "NONE"
	// VersionCurrent: the assessed version must be the document's CURRENT authoritative
	// version; promotion invalidates satisfaction pending review of the new version.
	VersionCurrent VersionRule = "CURRENT_AUTHORITATIVE"
	// VersionFixed: the assessed version must be one exact version; promotion does not
	// affect it.
	VersionFixed VersionRule = "FIXED"
)

func (r VersionRule) Valid() bool {
	return r == VersionNone || r == VersionCurrent || r == VersionFixed
}

// CriterionPurpose says what a criterion proves. PACKAGE criteria (the default, and the only
// reading of every legacy row) are the readiness gates that must hold before a filing is
// submitted; OUTCOME criteria are the authority's decision, accepted independently after the
// fact (BF-01). Nothing infers a purpose from a title: an unspecified purpose is PACKAGE, which
// can only keep a gate closed, never open one.
type CriterionPurpose string

const (
	PurposePackage CriterionPurpose = "PACKAGE"
	PurposeOutcome CriterionPurpose = "OUTCOME"
)

func (p CriterionPurpose) Valid() bool { return p == PurposePackage || p == PurposeOutcome }

// Criterion is one evidence requirement of a subject: what must be shown, distinct from any
// proof. Revision changes whenever the criterion changes; claims pin the revision they were
// made against, so a revision invalidates stale assessments (FR-006).
type Criterion struct {
	ID          CriterionID
	MatterID    MatterID
	SubjectID   NodeID
	Title       string
	Description string
	Mandatory   bool
	// Purpose is fixed at creation; the empty value reads as PACKAGE.
	Purpose    CriterionPurpose
	Rule       VersionRule
	DocumentID *DocumentID
	FixedID    *VersionID
	// ValidFor is the validity of an accepted proof after assessment; zero means unbounded.
	ValidFor time.Duration
	Retired  bool
	Revision int64
}

// Outcome verification of a filing, as shown next to its (package-driven) verification state.
const (
	OutcomeNotTracked  = "NOT_TRACKED"  // the filing has no independent outcome verification (proofRequired=false)
	OutcomeNotDeclared = "NOT_DECLARED" // outcome verification is required but no OUTCOME criterion is declared
	OutcomePending     = "PENDING"      // declared, not yet accepted by an independent verifier
	OutcomeAccepted    = "ACCEPTED"     // every mandatory OUTCOME criterion is accepted
)

// OutcomeVerification says whether the authority's outcome has been independently verified. A
// filing whose package criteria are all accepted can read VERIFIED while no outcome criterion
// exists; this is the separate, honest answer for the outcome (BF-01).
func OutcomeVerification(item WorkItem, set EvidenceSet, asOf time.Time) string {
	if !item.ProofRequired {
		return OutcomeNotTracked
	}
	res := EvaluateVerification(item, set, asOf)
	switch {
	case !res.Outcome.Declared():
		return OutcomeNotDeclared
	case res.Outcome.Ready():
		return OutcomeAccepted
	}
	return OutcomePending
}

// EffectivePurpose reads an unspecified (legacy) purpose as PACKAGE.
func (c Criterion) EffectivePurpose() CriterionPurpose {
	if c.Purpose == PurposeOutcome {
		return PurposeOutcome
	}
	return PurposePackage
}

// EvidenceKind says what the proof points at.
type EvidenceKind string

const (
	EvidenceDocumentVersion EvidenceKind = "DOCUMENT_VERSION"
	EvidenceExternal        EvidenceKind = "EXTERNAL_REFERENCE"
)

// Evidence is supplied proof: immutable after submission and never verified by existing.
type Evidence struct {
	ID          EvidenceID
	MatterID    MatterID
	Kind        EvidenceKind
	VersionID   *VersionID
	Reference   string
	Description string
	SubmittedBy ActorID
	SubmittedAt time.Time
	ValidFrom   time.Time
	ValidUntil  *time.Time
	WithdrawnAt *time.Time
}

// Claim offers one evidence item for one criterion revision. It is the only link between proof
// and a criterion: accepting an evidence item for C1 says nothing about C2.
type Claim struct {
	ID                ClaimID
	MatterID          MatterID
	EvidenceID        EvidenceID
	CriterionID       CriterionID
	CriterionRev      int64
	ClaimedBy         ActorID
	ClaimedAt         time.Time
	EvidenceSubmitter ActorID
}

// Verdict is a reviewer's decision on one claim.
type Verdict string

const (
	VerdictAccepted Verdict = "ACCEPTED"
	VerdictRejected Verdict = "REJECTED"
)

// Assessment is one reviewer decision on one claim in one subject proof epoch. Only the current
// (non-superseded, non-revoked) assessment of a claim can satisfy; history is never rewritten.
type Assessment struct {
	ID                AssessmentID
	MatterID          MatterID
	ClaimID           ClaimID
	SubjectID         NodeID
	SubjectEpoch      int64
	Verdict           Verdict
	Reviewer          ActorID
	Rationale         string
	AssessedVersionID *VersionID
	EffectiveUntil    *time.Time
	RecordedAt        time.Time
	SupersededBy      *AssessmentID
	RevokedAt         *time.Time
	RevokedBy         *ActorID
	RevokedReason     string
	EvidenceSubmitter ActorID
	Claimant          ActorID
}

// Dispute challenges an accepted assessment; while unresolved the subject is DISPUTED.
type Dispute struct {
	ID           DisputeID
	MatterID     MatterID
	AssessmentID AssessmentID
	RaisedBy     ActorID
	Reason       string
	RaisedAt     time.Time
	ResolvedAt   *time.Time
	ResolvedBy   *ActorID
	Resolution   string
}

// EvidenceSet is everything the verification rules read, loaded in the same snapshot as the
// work graph.
type EvidenceSet struct {
	Documents   []Document
	Versions    []DocumentVersion
	Signatures  []SignatureObservation
	Criteria    []Criterion
	Evidence    []Evidence
	Claims      []Claim
	Assessments []Assessment
	Disputes    []Dispute
	// Verifiers are the matter's designated verifier user ids (ACTIVE designations).
	Verifiers []ActorID
}

func (s EvidenceSet) document(id DocumentID) (Document, bool) {
	for _, d := range s.Documents {
		if d.ID == id {
			return d, true
		}
	}
	return Document{}, false
}

func (s EvidenceSet) evidence(id EvidenceID) (Evidence, bool) {
	for _, e := range s.Evidence {
		if e.ID == id {
			return e, true
		}
	}
	return Evidence{}, false
}

// IsVerifier reports an active verifier designation.
func (s EvidenceSet) IsVerifier(a ActorID) bool {
	for _, v := range s.Verifiers {
		if v == a {
			return true
		}
	}
	return false
}

// ---------- criterion status and subject aggregate ----------

// CriterionReason explains why a criterion is not satisfied right now.
type CriterionReason string

const (
	CriterionMissing      CriterionReason = "MISSING"            // no evidence claimed for the current revision
	CriterionPending      CriterionReason = "PENDING_REVIEW"     // claimed, not yet assessed
	CriterionRejected     CriterionReason = "REJECTED"           // the current assessment rejected it
	CriterionExpired      CriterionReason = "EXPIRED"            // accepted proof is past its validity
	CriterionWithdrawn    CriterionReason = "WITHDRAWN"          // the evidence was withdrawn
	CriterionStaleVersion CriterionReason = "VERSION_SUPERSEDED" // accepted on a version that is no longer the required one
	CriterionRevoked      CriterionReason = "REVOKED"            // acceptance revoked by a reviewer
	CriterionDisputed     CriterionReason = "DISPUTED"           // an open dispute on the accepting assessment
	CriterionNotYetValid  CriterionReason = "NOT_YET_VALID"      // before valid-from
	CriterionOldEpoch     CriterionReason = "OLD_EPOCH"          // only accepted in an earlier proof epoch
)

// CriterionStatus is the checklist line for one criterion of a subject.
type CriterionStatus struct {
	Criterion Criterion
	Satisfied bool
	Reason    CriterionReason // empty when satisfied
	// Claims lists the claims on the current revision (empty means a visible gap).
	Claims []ClaimStatus
}

// ClaimStatus is one claim with its current verdict, for the proof checklist.
type ClaimStatus struct {
	Claim      Claim
	Current    *Assessment
	Disputed   bool
	Reason     CriterionReason
	Satisfying bool
}

// ProofPart summarises the criteria of one purpose: how many are declared, how many of the
// mandatory ones are satisfied right now.
type ProofPart struct {
	Total, Mandatory, Satisfied int
}

// Declared reports at least one active criterion of this purpose.
func (p ProofPart) Declared() bool { return p.Total > 0 }

// Ready reports every mandatory criterion satisfied; false when none is mandatory, so an
// undeclared outcome is never an accepted outcome.
func (p ProofPart) Ready() bool { return p.Mandatory > 0 && p.Satisfied == p.Mandatory }

// VerificationResult is the derived verification of one subject at an explicit instant. State is
// the aggregate over all mandatory criteria; Package and Outcome split it so that package
// readiness is never shown as an accepted authority outcome.
type VerificationResult struct {
	State    VerificationState
	Criteria []CriterionStatus
	Package  ProofPart
	Outcome  ProofPart
}

// EvaluateVerification derives the subject aggregate from its criteria and proof at asOf
// (state-semantics precedence): an unresolved dispute -> DISPUTED; explicit applicability
// NOT_REQUIRED -> NOT_REQUIRED; every mandatory criterion satisfied -> VERIFIED; some ->
// PARTIALLY_VERIFIED; none, or no criteria at all -> UNVERIFIED (never a vacuous VERIFIED).
// Nothing here reads the stored verification state: it is always recomputed from inputs, so
// expiry takes effect at its instant even if no command has run since.
func EvaluateVerification(item WorkItem, set EvidenceSet, asOf time.Time) VerificationResult {
	var criteria []CriterionStatus
	for _, c := range set.Criteria {
		if c.SubjectID == item.ID && !c.Retired {
			criteria = append(criteria, criterionStatus(c, item, set, asOf))
		}
	}
	sort.Slice(criteria, func(i, j int) bool { return criteria[i].Criterion.ID < criteria[j].Criterion.ID })
	res := VerificationResult{Criteria: criteria}
	for _, c := range criteria {
		part := &res.Package
		if c.Criterion.EffectivePurpose() == PurposeOutcome {
			part = &res.Outcome
		}
		part.Total++
		if c.Criterion.Mandatory {
			part.Mandatory++
			if c.Satisfied {
				part.Satisfied++
			}
		}
	}
	if !item.ProofRequired {
		return res // no proof requirement: no verification state at all
	}
	disputed := false
	for _, c := range criteria {
		for _, cl := range c.Claims {
			disputed = disputed || cl.Disputed
		}
	}
	mandatory, satisfied := 0, 0
	for _, c := range criteria {
		if c.Criterion.Mandatory {
			mandatory++
			if c.Satisfied {
				satisfied++
			}
		}
	}
	switch {
	case disputed:
		res.State = VerificationDisputed
	case item.Applicability == VerificationNotApplicable:
		res.State = VerificationNotRequired
	case mandatory > 0 && satisfied == mandatory:
		res.State = VerificationVerified
	case satisfied > 0:
		res.State = VerificationPartiallyVerified
	default:
		res.State = VerificationUnverified
	}
	return res
}

func criterionStatus(c Criterion, item WorkItem, set EvidenceSet, asOf time.Time) CriterionStatus {
	st := CriterionStatus{Criterion: c, Reason: CriterionMissing}
	best := CriterionMissing
	rank := func(r CriterionReason) int {
		switch r {
		case CriterionMissing:
			return 0
		case CriterionOldEpoch:
			return 1
		case CriterionWithdrawn:
			return 2
		case CriterionRevoked:
			return 3
		case CriterionRejected:
			return 4
		case CriterionNotYetValid, CriterionExpired, CriterionStaleVersion:
			return 5
		case CriterionPending:
			return 6
		case CriterionDisputed:
			return 7
		}
		return 0
	}
	for _, k := range set.Claims {
		if k.CriterionID != c.ID || k.CriterionRev != c.Revision {
			continue // a claim on an older revision never counts (criteria revision invalidates)
		}
		cs := claimStatus(k, c, item, set, asOf)
		st.Claims = append(st.Claims, cs)
		if cs.Satisfying {
			st.Satisfied, st.Reason = true, ""
		}
		if !st.Satisfied && rank(cs.Reason) >= rank(best) {
			best = cs.Reason
		}
	}
	sort.Slice(st.Claims, func(i, j int) bool { return st.Claims[i].Claim.ID < st.Claims[j].Claim.ID })
	if !st.Satisfied {
		st.Reason = best
	}
	return st
}

func claimStatus(k Claim, c Criterion, item WorkItem, set EvidenceSet, asOf time.Time) ClaimStatus {
	cs := ClaimStatus{Claim: k, Reason: CriterionPending}
	ev, ok := set.evidence(k.EvidenceID)
	if !ok {
		cs.Reason = CriterionMissing
		return cs
	}
	var cur *Assessment
	var older bool
	for i := range set.Assessments {
		a := &set.Assessments[i]
		if a.ClaimID != k.ID || a.SupersededBy != nil {
			continue
		}
		if a.SubjectEpoch != item.ProofEpoch {
			older = true // accepted/rejected in an earlier epoch: historical only
			continue
		}
		cur = a
	}
	cs.Current = cur
	// F01: an open dispute on the current same-epoch assessment keeps its aggregation
	// precedence even when the evidence was withdrawn or the acceptance was revoked —
	// the challenge is unresolved and the subject must still read DISPUTED. Old-epoch
	// assessments never block (cur is nil for them). Withdrawal/revocation still end
	// satisfaction; history and the dispute itself are retained.
	if cur != nil {
		for _, d := range set.Disputes {
			if d.AssessmentID == cur.ID && d.ResolvedAt == nil {
				cs.Disputed = true
			}
		}
	}
	if ev.WithdrawnAt != nil {
		if cs.Disputed {
			cs.Reason = CriterionDisputed
		} else {
			cs.Reason = CriterionWithdrawn
		}
		return cs
	}
	if cur == nil {
		if older {
			cs.Reason = CriterionOldEpoch
		}
		return cs
	}
	if cur.RevokedAt != nil {
		if cs.Disputed {
			cs.Reason = CriterionDisputed
		} else {
			cs.Reason = CriterionRevoked
		}
		return cs
	}
	for _, d := range set.Disputes {
		if d.AssessmentID == cur.ID && d.ResolvedAt == nil {
			cs.Disputed = true
		}
	}
	if cur.Verdict == VerdictRejected {
		cs.Reason = CriterionRejected
		return cs
	}
	// ACCEPTED: valid only inside its half-open validity window, and only for the right version.
	if asOf.Before(ev.ValidFrom) {
		cs.Reason = CriterionNotYetValid
		return cs
	}
	if (ev.ValidUntil != nil && !asOf.Before(*ev.ValidUntil)) || (cur.EffectiveUntil != nil && !asOf.Before(*cur.EffectiveUntil)) {
		cs.Reason = CriterionExpired
		return cs
	}
	switch c.Rule {
	case VersionCurrent:
		doc, ok := set.document(derefDoc(c.DocumentID))
		if !ok || doc.CurrentVersionID == nil || cur.AssessedVersionID == nil || *cur.AssessedVersionID != *doc.CurrentVersionID {
			cs.Reason = CriterionStaleVersion
			return cs
		}
	case VersionFixed:
		if c.FixedID == nil || cur.AssessedVersionID == nil || *cur.AssessedVersionID != *c.FixedID {
			cs.Reason = CriterionStaleVersion
			return cs
		}
	}
	if cs.Disputed {
		cs.Reason = CriterionDisputed
		return cs
	}
	cs.Satisfying, cs.Reason = true, ""
	return cs
}

func derefDoc(id *DocumentID) DocumentID {
	if id == nil {
		return ""
	}
	return *id
}

// NextExpiry returns the earliest future instant at which a currently satisfying acceptance
// stops satisfying, so a store can schedule re-evaluation; ok is false when none exists.
func NextExpiry(items []WorkItem, set EvidenceSet, asOf time.Time) (time.Time, bool) {
	var best time.Time
	found := false
	consider := func(t *time.Time) {
		if t != nil && t.After(asOf) && (!found || t.Before(best)) {
			best, found = *t, true
		}
	}
	for _, it := range items {
		for _, c := range EvaluateVerification(it, set, asOf).Criteria {
			for _, cl := range c.Claims {
				if !cl.Satisfying {
					continue
				}
				if ev, ok := set.evidence(cl.Claim.EvidenceID); ok {
					consider(ev.ValidUntil)
				}
				consider(cl.Current.EffectiveUntil)
			}
		}
	}
	return best, found
}

// ---------- independence (RULE-006) ----------

// ReviewDecision explains a refused review so the boundary can answer precisely.
type ReviewDecision struct {
	Allowed bool
	Code    string // not-verifier | role | self-evidence | self-claim | self-dispute
}

// DecideReview applies the independence rules for an assessment, a revocation of acceptance or
// a dispute resolution: the reviewer must be a designated verifier holding EDITOR/OWNER, must
// not have submitted the evidence, and must not have offered it for this criterion. Matter
// OWNER status alone is not verifier authority; a one-member matter simply stays pending.
func DecideReview(reviewer ActorID, role MatterRole, set EvidenceSet, k Claim) ReviewDecision {
	switch {
	case !set.IsVerifier(reviewer):
		return ReviewDecision{Code: "not-verifier"}
	case role != MatterRoleOwner && role != MatterRoleEditor:
		return ReviewDecision{Code: "role"}
	case reviewer == k.EvidenceSubmitter:
		return ReviewDecision{Code: "self-evidence"}
	case reviewer == k.ClaimedBy:
		return ReviewDecision{Code: "self-claim"}
	}
	return ReviewDecision{Allowed: true}
}

// ---------- documents ----------

// PromotionImpact lists, for one proposed promotion, which criteria's satisfaction will be
// invalidated pending review and which fixed-version criteria stay untouched (RULE-007).
type PromotionImpact struct {
	// Invalidated are the CURRENT_AUTHORITATIVE criteria of this document that currently have an
	// accepted claim on the old current version.
	Invalidated []CriterionID
	// Unaffected are the FIXED criteria referencing a version of this document.
	Unaffected []CriterionID
}

// ImpactOfPromotion computes the promotion impact against the current evidence set.
func ImpactOfPromotion(doc Document, set EvidenceSet) PromotionImpact {
	var out PromotionImpact
	for _, c := range set.Criteria {
		if c.Retired {
			continue
		}
		switch {
		case c.Rule == VersionCurrent && c.DocumentID != nil && *c.DocumentID == doc.ID:
			out.Invalidated = append(out.Invalidated, c.ID)
		case c.Rule == VersionFixed && c.FixedID != nil:
			for _, v := range set.Versions {
				if v.ID == *c.FixedID && v.DocumentID == doc.ID {
					out.Unaffected = append(out.Unaffected, c.ID)
				}
			}
		}
	}
	sort.Slice(out.Invalidated, func(i, j int) bool { return out.Invalidated[i] < out.Invalidated[j] })
	sort.Slice(out.Unaffected, func(i, j int) bool { return out.Unaffected[i] < out.Unaffected[j] })
	return out
}
