package port

import (
	"context"
	"errors"
	"time"
)

// Identity verification ports (W1). The HTTP boundary authenticates the bearer
// through the TokenVerifier, resolves (issuer, subject) to a product user with the
// IdentityResolver, and only then invokes use cases with the resulting trusted
// ActorID. Core never sees raw tokens.
//
// Error contract:
//   - TokenVerifier.Verify returns ErrUnauthenticated for missing/invalid/inactive
//     tokens and ErrUnavailable when the verifier itself cannot be reached
//     (fail-closed: an outage is never mapped to a denial of an unknown quality).
//   - IdentityResolver.Resolve returns ErrUnknownIdentity for an unknown
//     (issuer, subject) pair: provisioning is explicit, never implicit. The HTTP
//     boundary maps it to the uniform 403 body. Storage failures wrap
//     ErrUnavailable.
var ErrUnknownIdentity = errors.New("identity is not provisioned")

// VerifiedToken is the normalized result of bearer verification. Only fields the
// product actually relies on are exposed; username/email claims are deliberately
// absent because they are never trusted for authorization.
type VerifiedToken struct {
	Active    bool
	Issuer    string
	Subject   string
	ExpiresAt time.Time
	Audience  []string
}

// TokenVerifier verifies an OAuth bearer token out of band (authenticated
// introspection for the local ZITADEL profile). Implementations may cache results
// briefly; a cached result never creates a revocation guarantee because every
// membership/role decision re-runs inside the transaction/read path.
type TokenVerifier interface {
	Verify(ctx context.Context, bearer string) (VerifiedToken, error)
}

// IdentityResolver maps a verified (issuer, subject) pair to the product user id.
// Lookup only: unknown identities are refused (explicit provisioning, never
// implicit user creation).
type IdentityResolver interface {
	Resolve(ctx context.Context, issuer, subject string) (ActorID string, err error)
}

type PersonOption struct {
	UserID      string `json:"userId"`
	DisplayName string `json:"displayName"`
}

// LocalPeopleDirectory is local/dev only; production needs an organization boundary.
type LocalPeopleDirectory interface {
	SearchWorkspacePeople(ctx context.Context, workspaceID, actorID, name string) ([]PersonOption, error)
}
