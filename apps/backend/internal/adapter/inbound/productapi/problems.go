package productapi

import (
	"context"
	"encoding/json"
	"errors"
	"net/http"

	"github.com/labstack/echo/v5"

	"leonx.me/matter-control/internal/core/domain"
	"leonx.me/matter-control/internal/core/domain/matter"
	"leonx.me/matter-control/internal/core/port"
)

const problemContentType = "application/problem+json"

// problem is the RFC 9457 body. Type is a stable product URN; Retryable is the documented
// per-problem hint pending the product retry convention (contract §3, INT-D09).
type problem struct {
	Type      string       `json:"type"`
	Title     string       `json:"title"`
	Status    int          `json:"status"`
	Detail    string       `json:"detail,omitempty"`
	Instance  string       `json:"instance,omitempty"`
	Retryable bool         `json:"retryable"`
	Errors    []fieldError `json:"errors,omitempty"`
	// Rejection extensions (urn:mc:rejected): the stable domain code, what the caller may do
	// instead, the failed dependency gates and, for a refused cycle, its path.
	Code         string           `json:"code,omitempty"`
	Alternatives []string         `json:"alternatives,omitempty"`
	Gates        []gateReasonBody `json:"gates,omitempty"`
	Path         []string         `json:"path,omitempty"`
}

type fieldError struct {
	Field   string `json:"field"`
	Message string `json:"message"`
}

// StatusClientClosedRequest follows the nginx convention used by the native API.
const StatusClientClosedRequest = 499

func mk(status int, code, title, detail string, retryable bool) problem {
	return problem{Type: "urn:mc:" + code, Title: title, Status: status, Detail: detail, Retryable: retryable}
}

// toProblem is the single error table (contract §3 precedence is enforced by the order
// in which the boundary produces errors; this maps what it produced). Bodies are fixed:
// inaccessible, nonexistent and kind-mismatched resources are indistinguishable.
func toProblem(ctx context.Context, err error) problem {
	var ve *domain.ValidationError
	var rej *matter.RejectedError
	var role matter.InvalidRoleError
	switch {
	case errors.Is(err, context.Canceled) || (ctx != nil && ctx.Err() == context.Canceled):
		return problem{Type: "urn:mc:client-closed-request", Title: "Client Closed Request", Status: StatusClientClosedRequest}
	case errors.Is(err, errMalformed):
		return mk(http.StatusBadRequest, "malformed-body", "Bad Request", "the request body is malformed", false)
	case errors.Is(err, port.ErrSheetInvalid):
		return mk(http.StatusBadRequest, "bad-request", "Bad Request", "spreadsheet cannot be read; check the format, required columns and upload limits", false)
	case errors.Is(err, errBadRequest):
		return mk(http.StatusBadRequest, "bad-request", "Bad Request", err.Error(), false)
	case errors.Is(err, errUnsupportedMedia):
		return mk(http.StatusUnsupportedMediaType, "unsupported-media-type", "Unsupported Media Type", "content type must be application/json", false)
	case errors.Is(err, port.ErrUnauthenticated):
		return mk(http.StatusUnauthorized, "unauthenticated", "Unauthorized", "authentication is required", false)
	case errors.Is(err, port.ErrUnknownIdentity), errors.Is(err, port.ErrForbidden):
		return mk(http.StatusForbidden, "forbidden", "Forbidden", "the operation is not permitted", false)
	case errors.Is(err, port.ErrLastOwner):
		p := mk(http.StatusForbidden, "last-owner", "Forbidden", "the last active owner cannot be removed; transfer ownership first", false)
		return p
	case errors.Is(err, port.ErrNotFound):
		return mk(http.StatusNotFound, "not-found", "Not Found", "resource not found", false)
	case errors.Is(err, port.ErrPreconditionNotApplicable):
		return mk(http.StatusBadRequest, "precondition-not-applicable", "Bad Request", "If-Match is not applicable to this operation", false)
	case errors.Is(err, port.ErrPreconditionRequired):
		return mk(http.StatusPreconditionRequired, "precondition-required", "Precondition Required", "a required precondition is missing (If-Match, or the expected-state field this command names)", false)
	case errors.Is(err, port.ErrPreconditionFailed), errors.Is(err, port.ErrVersionConflict):
		return mk(http.StatusPreconditionFailed, "precondition-failed", "Precondition Failed", "the resource changed; re-read and retry", false)
	case errors.Is(err, port.ErrIdempotencyKeyReuse), errors.Is(err, matter.ErrSnapshotKind):
		return mk(http.StatusUnprocessableEntity, "idempotency-key-reuse", "Unprocessable Entity", "the idempotency key was used for a different command", false)
	case errors.Is(err, matter.ErrKeyExpired):
		return mk(http.StatusUnprocessableEntity, "idempotency-key-expired", "Unprocessable Entity", "the idempotency key is outside its permitted age", false)
	case errors.As(err, &rej):
		// A guarded domain refusal: nothing was mutated, and the body says why and what is allowed.
		p := mk(http.StatusConflict, "rejected", "Conflict", rej.Message, false)
		p.Code = rej.Code
		for _, a := range rej.Alternatives {
			p.Alternatives = append(p.Alternatives, string(a))
		}
		p.Gates = gateReasonBodies(rej.Gates)
		for _, n := range rej.Path {
			p.Path = append(p.Path, n.String())
		}
		return p
	case errors.As(err, &role):
		p := mk(http.StatusUnprocessableEntity, "validation", "Unprocessable Entity", "request failed validation", false)
		p.Errors = []fieldError{{Field: "role", Message: "must be a valid role"}}
		return p
	case errors.As(err, &ve):
		p := mk(http.StatusUnprocessableEntity, "validation", "Unprocessable Entity", "request failed validation", false)
		for _, f := range ve.Fields {
			p.Errors = append(p.Errors, fieldError{Field: f.Field, Message: f.Message})
		}
		return p
	case errors.Is(err, matter.ErrBoundaryDue):
		return mk(http.StatusServiceUnavailable, "boundary-due", "Service Unavailable", "a pending temporal boundary must be processed first", true)
	case errors.Is(err, port.ErrOutcomeUnknown):
		// Never asserts a rollback; the client reads back with the same key or an authorized re-read.
		return mk(http.StatusServiceUnavailable, "outcome-unknown", "Service Unavailable", "the outcome of the command is unknown; no rollback is asserted; do not resubmit with a new key", false)
	case errors.Is(err, port.ErrObjectTooLarge):
		return mk(http.StatusRequestEntityTooLarge, "payload-too-large", "Payload Too Large", "the upload exceeds the configured size limit; nothing was stored", false)
	case errors.Is(err, port.ErrInvalidBriefWindow):
		return mk(http.StatusBadRequest, "invalid-window", "Bad Request", "the window must satisfy t1 <= t2 <= the read boundary; no report was produced", false)
	case errors.Is(err, port.ErrBriefUnreconstructable):
		return mk(http.StatusInternalServerError, "brief-unreconstructable", "Internal Server Error", "the history needed to rebuild the work state at t2 is missing or corrupt; no brief was produced", false)
	case errors.Is(err, port.ErrObjectUnavailable):
		return mk(http.StatusServiceUnavailable, "content-unavailable", "Service Unavailable", "the document content is not available right now", true)
	case errors.Is(err, context.DeadlineExceeded), errors.Is(err, port.ErrUnavailable):
		return mk(http.StatusServiceUnavailable, "unavailable", "Service Unavailable", "service temporarily unavailable", true)
	}
	if code := echo.StatusCode(err); code != 0 && code < 500 {
		return problem{Type: "urn:mc:http-" + http.StatusText(code), Title: http.StatusText(code), Status: code}
	}
	return mk(http.StatusInternalServerError, "internal", "Internal Server Error", "", false)
}

var (
	errBadRequest       = errors.New("bad request")
	errUnsupportedMedia = errors.New("unsupported media type")
)

func writeProblem(c *echo.Context, p problem) error {
	p.Instance = c.Request().URL.Path
	body, err := json.Marshal(p)
	if err != nil {
		return c.NoContent(http.StatusInternalServerError)
	}
	return c.Blob(p.Status, problemContentType, body)
}
