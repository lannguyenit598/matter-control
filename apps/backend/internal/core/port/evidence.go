package port

import (
	"context"
	"errors"
	"fmt"
	"io"
	"time"

	"leonx.me/matter-control/internal/core/domain/matter"
)

// ---------- ObjectStore (local stored bytes) ----------

// ErrObjectTooLarge reports an upload above the configured limit; nothing is stored.
var ErrObjectTooLarge = errors.New("object exceeds the configured size limit")

// ErrObjectUnavailable reports content that cannot be read (missing, corrupt, store down). The
// boundary surfaces it as unavailable content, never as an empty document or a false version.
var ErrObjectUnavailable = errors.New("object content is unavailable")

// ErrObjectMissing and ErrObjectCorrupt say WHY content is unavailable when the store knows: the
// bytes a recorded version points to are not there, or no longer match their digest. Unlike a store
// that is merely down, both mean the record and its bytes disagree, an integrity incident an
// operator must hear about. They wrap ErrObjectUnavailable, so `errors.Is(err, ErrObjectUnavailable)`
// and the retryable 503 the boundary answers with stay exactly as before.
var (
	ErrObjectMissing = fmt.Errorf("%w: no stored bytes for this digest", ErrObjectUnavailable)
	ErrObjectCorrupt = fmt.Errorf("%w: stored bytes do not match their digest", ErrObjectUnavailable)
)

// ObjectRef identifies stored content by its SHA-256 and size.
type ObjectRef struct {
	SHA256 string
	Size   int64
}

// ObjectStore keeps document bytes outside the database. Content is addressed by SHA-256 within
// a matter and never overwritten, so a Put is idempotent and an orphan after a failed write is
// harmless. Open verifies the checksum while reading.
type ObjectStore interface {
	Put(ctx context.Context, m matter.MatterID, r io.Reader, maxBytes int64) (ObjectRef, error)
	Open(ctx context.Context, m matter.MatterID, sha256 string) (io.ReadCloser, error)
}

// ---------- Inbound: W3 documents, criteria, evidence, review ----------

type CreateDocumentCmd struct {
	ActorID        string
	MatterID       string
	IdempotencyKey string
	RequestHash    string
	Name           string
}

// AddVersionCmd adds an immutable version. Content was already stored (Ref); the version never
// becomes current by being added.
type AddVersionCmd struct {
	ActorID        string
	MatterID       string
	DocumentID     string
	IdempotencyKey string
	RequestHash    string
	Filename       string
	MediaType      string
	Ref            ObjectRef
}

// UploadVersionCmd streams new content in as the next version of a document. The service
// authorizes the write BEFORE reading the body, stores it (at most MaxBytes), then records the
// version. RequestHash covers the request metadata; the content digest is folded in by the
// service so one key can never stand for two different contents.
type UploadVersionCmd struct {
	ActorID        string
	MatterID       string
	DocumentID     string
	IdempotencyKey string
	RequestHash    string
	Filename       string
	MediaType      string
	Body           io.Reader
	MaxBytes       int64
}

// PromoteVersionCmd makes one exact version current. ExpectedCurrentVersionID is the guard on
// the pointer (empty for the first promotion); ImpactToken binds the acknowledgement to this
// exact target, expected current version and document revision.
type PromoteVersionCmd struct {
	ActorID                  string
	MatterID                 string
	DocumentID               string
	TargetVersionID          string
	ExpectedCurrentVersionID string
	ExpectedRevision         int64
	Reason                   string
	ImpactToken              string
}

type RecordSignatureCmd struct {
	ActorID  string
	MatterID string
	Version  string
	Signer   string
	SignedAt string // RFC 3339 with offset
}

type CriterionInput struct {
	Title       string
	Description string
	Mandatory   bool
	Rule        string // NONE | CURRENT_AUTHORITATIVE | FIXED
	DocumentID  string // required for CURRENT_AUTHORITATIVE
	FixedID     string // required for FIXED
	ValidDays   int    // validity of an accepted proof; 0 = unbounded
}

type CreateCriterionCmd struct {
	ActorID   string
	MatterID  string
	SubjectID string
	Criterion CriterionInput
}

// ReviseCriterionCmd replaces the criterion's definition under revision CAS with a reason.
// Existing claims and assessments stop counting (they pinned the old revision).
type ReviseCriterionCmd struct {
	ActorID          string
	MatterID         string
	CriterionID      string
	ExpectedRevision int64
	Reason           string
	Retire           bool
	Criterion        CriterionInput
}

// SetApplicabilityCmd declares a subject's verification NOT_REQUIRED (with a reason) or REQUIRED
// again. OWNER only; NOT_REQUIRED only with no applicable mandatory criterion and no open dispute.
type SetApplicabilityCmd struct {
	ActorID          string
	MatterID         string
	SubjectID        string
	ExpectedRevision int64
	NotRequired      bool
	Reason           string
}

type SubmitEvidenceCmd struct {
	ActorID        string
	MatterID       string
	IdempotencyKey string
	RequestHash    string
	VersionID      string // exact document version, or...
	Reference      string // ...an external reference
	Description    string
	ValidFrom      string // RFC 3339 with offset; empty = now
	ValidUntil     string // RFC 3339 with offset; empty = unbounded
	// Claims offer this evidence for these criteria (current revision of each).
	Claims []string
}

type AddClaimCmd struct {
	ActorID     string
	MatterID    string
	EvidenceID  string
	CriterionID string
}

type WithdrawEvidenceCmd struct {
	ActorID    string
	MatterID   string
	EvidenceID string
	Reason     string
}

// AssessCmd records an ACCEPT/REJECT on one claim. The caller states the subject proof epoch and
// the document version it assessed, so a decision about stale proof is refused.
type AssessCmd struct {
	ActorID              string
	MatterID             string
	ClaimID              string
	ExpectedSubjectEpoch int64
	Verdict              string
	Rationale            string
	AssessedVersionID    string
	// ValidDays bounds how long an acceptance counts; 0 = until the evidence's own validity ends.
	ValidDays int
	// ExpectedAssessmentID binds the review intent to the assessment the reviewer actually
	// saw. nil = the precondition is missing (428); a pointer to "" explicitly expects a
	// first review. A mismatch under the matter lock is a stale 412: an intervening verdict
	// is never silently superseded (F02).
	ExpectedAssessmentID *string
}

type RevokeAssessmentCmd struct {
	ActorID      string
	MatterID     string
	AssessmentID string
	Reason       string
}

type RaiseDisputeCmd struct {
	ActorID      string
	MatterID     string
	AssessmentID string
	Reason       string
}

type ResolveDisputeCmd struct {
	ActorID    string
	MatterID   string
	DisputeID  string
	Resolution string
}

type DesignateVerifierCmd struct {
	ActorID  string
	MatterID string
	UserID   string
	Revoke   bool
}

type DocumentQuery struct {
	ActorID    string
	MatterID   string
	DocumentID string
	// PromoteTo asks for the impact of promoting this version (preview).
	PromoteTo string
}

type VersionContentQuery struct {
	ActorID   string
	MatterID  string
	VersionID string
}

type SubjectQuery struct {
	ActorID   string
	MatterID  string
	SubjectID string
}

// EvidenceService defines the W3 use cases.
type EvidenceService interface {
	CreateDocument(ctx context.Context, cmd CreateDocumentCmd) (matter.CreatedResult, error)
	AddVersion(ctx context.Context, cmd AddVersionCmd) (matter.CreatedResult, error)
	UploadVersion(ctx context.Context, cmd UploadVersionCmd) (matter.CreatedResult, error)
	PromoteVersion(ctx context.Context, cmd PromoteVersionCmd) (matter.DocumentDetail, error)
	RecordSignature(ctx context.Context, cmd RecordSignatureCmd) (matter.DocumentDetail, error)

	CreateCriterion(ctx context.Context, cmd CreateCriterionCmd) (matter.ProofChecklist, error)
	ReviseCriterion(ctx context.Context, cmd ReviseCriterionCmd) (matter.ProofChecklist, error)
	SetApplicability(ctx context.Context, cmd SetApplicabilityCmd) (matter.ProofChecklist, error)

	SubmitEvidence(ctx context.Context, cmd SubmitEvidenceCmd) (matter.CreatedResult, error)
	AddClaim(ctx context.Context, cmd AddClaimCmd) (matter.ProofChecklist, error)
	WithdrawEvidence(ctx context.Context, cmd WithdrawEvidenceCmd) (matter.ProofChecklist, error)

	Assess(ctx context.Context, cmd AssessCmd) (matter.ProofChecklist, error)
	RevokeAssessment(ctx context.Context, cmd RevokeAssessmentCmd) (matter.ProofChecklist, error)
	RaiseDispute(ctx context.Context, cmd RaiseDisputeCmd) (matter.ProofChecklist, error)
	ResolveDispute(ctx context.Context, cmd ResolveDisputeCmd) (matter.ProofChecklist, error)

	DesignateVerifier(ctx context.Context, cmd DesignateVerifierCmd) ([]matter.ActorID, error)

	ListDocuments(ctx context.Context, q MatterListQuery) ([]matter.Document, error)
	GetDocument(ctx context.Context, q DocumentQuery) (matter.DocumentDetail, error)
	// OpenVersion authorizes the read and streams the exact bytes of one version.
	OpenVersion(ctx context.Context, q VersionContentQuery) (matter.DocumentVersion, io.ReadCloser, error)
	ProofChecklist(ctx context.Context, q SubjectQuery) (matter.ProofChecklist, error)
	Verifiers(ctx context.Context, q MatterListQuery) ([]matter.ActorID, error)
	// ListEvidence returns every piece of evidence of the matter (withdrawn included, marked).
	ListEvidence(ctx context.Context, q MatterListQuery) ([]matter.Evidence, error)
}

// ---------- Outbound: evidence writes inside the locked matter transaction ----------

// EvidenceTx is implemented by the MatterTx of storage adapters. Rows are insert-only except the
// documented updates: the document's current pointer (CAS), a criterion (CAS), evidence
// withdrawal, assessment supersession/revocation and dispute resolution.
type EvidenceTx interface {
	InsertDocument(ctx context.Context, d matter.Document) error
	SaveDocument(ctx context.Context, d matter.Document, expectedRevision int64) error
	InsertVersion(ctx context.Context, v matter.DocumentVersion) error
	InsertSignature(ctx context.Context, s matter.SignatureObservation) error
	InsertCriterion(ctx context.Context, c matter.Criterion) error
	SaveCriterion(ctx context.Context, c matter.Criterion, expectedRevision int64) error
	InsertEvidence(ctx context.Context, e matter.Evidence) error
	WithdrawEvidence(ctx context.Context, id matter.EvidenceID, at time.Time) error
	InsertClaim(ctx context.Context, k matter.Claim) error
	InsertAssessment(ctx context.Context, a matter.Assessment) error
	SupersedeAssessment(ctx context.Context, id, by matter.AssessmentID) error
	RevokeAssessment(ctx context.Context, id matter.AssessmentID, at time.Time, by matter.ActorID, reason string) error
	InsertDispute(ctx context.Context, d matter.Dispute) error
	ResolveDispute(ctx context.Context, id matter.DisputeID, at time.Time, by matter.ActorID, resolution string) error
	SetVerifier(ctx context.Context, user matter.ActorID, active bool, by matter.ActorID, at time.Time) error
}
