package port

import "errors"

// Use-case outcome errors shared by all aggregates. These belong to the application layer,
// not domain: "not found" and "concurrent modification" are read/write outcomes,
// not business rules. Add context by wrapping, for example
// fmt.Errorf("user %s: %w", id, port.ErrNotFound); compare with errors.Is.
// Repositories return bare sentinels; services add context.
var (
	ErrNotFound = errors.New("not found")
	// ErrVersionConflict means the record changed since it was read (optimistic locking).
	ErrVersionConflict = errors.New("version conflict")
	// ErrUnavailable means storage is temporarily unreachable or busy (connection failure,
	// administrator termination, statement timeout, pool exhaustion, lock/deadlock conditions).
	// It maps to a retryable HTTP 503. A failed write's outcome is unknown, never "not applied".
	ErrUnavailable = errors.New("service temporarily unavailable")
	// ErrForbidden means the caller is an active member of the matter but the role lacks
	// the operation (use-case outcome, not a business rule).
	ErrForbidden = errors.New("forbidden")
	// ErrIdempotencyKeyReuse means the same (actor, idempotency key) pair was presented
	// with a different command fingerprint. The stored outcome of the earlier command is
	// never returned in this case.
	ErrIdempotencyKeyReuse = errors.New("idempotency key already used for a different command")
	// ErrOutcomeUnknown means a command reached its commit point but the acknowledgement
	// was lost: the command may or may not have committed. Callers must never treat this
	// as proof of rollback and must retry with the SAME idempotency key.
	ErrOutcomeUnknown = errors.New("command outcome unknown")
	// ErrUnauthenticated means no valid verified principal is present (missing, invalid
	// or inactive bearer). It maps to HTTP 401 and never to a resource-specific body.
	ErrUnauthenticated = errors.New("unauthenticated")
	// ErrPreconditionRequired means a CAS-scoped write arrived without the required
	// If-Match precondition. It maps to HTTP 428.
	ErrPreconditionRequired = errors.New("precondition required")
	// ErrPreconditionFailed means the supplied expected revision does not match the
	// current resource revision. It maps to HTTP 412 with the current revision in the
	// problem extensions.
	ErrPreconditionFailed = errors.New("precondition failed")
	// ErrPreconditionNotApplicable means a precondition header was supplied on an
	// endpoint whose CAS scope is none. It maps to HTTP 400.
	ErrPreconditionNotApplicable = errors.New("precondition not applicable")
	// ErrLastOwner means a membership revocation would remove the last active OWNER
	// without a prior transfer. It maps to HTTP 403 with the last-owner problem code;
	// the remedy is transferring ownership first.
	ErrLastOwner = errors.New("last active owner cannot be removed without transfer")
)

// ErrBriefUnreconstructable means the history needed to rebuild the work state at the brief's
// as-of instant is missing or corrupt, so no correct brief can be produced. It is never
// silently skipped: the caller gets this error instead of a misleading success.
var ErrBriefUnreconstructable = errors.New("brief cannot be reconstructed from history")

// ErrInvalidBriefWindow means the brief window is reversed or ends after the read boundary.
var ErrInvalidBriefWindow = errors.New("invalid brief window")
