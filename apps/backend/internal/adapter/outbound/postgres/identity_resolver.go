package postgres

import (
	"context"
	"errors"
	"fmt"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"

	"github.com/example/userapi/internal/adapter/outbound/postgres/mcsqlc"
	"github.com/example/userapi/internal/core/port"
)

// IdentityResolver maps a verified (issuer, subject) to the product user id. Lookup
// only: provisioning is explicit, so an unknown pair is port.ErrUnknownIdentity and
// nothing is ever inserted here.
type IdentityResolver struct{ pool *pgxpool.Pool }

var _ port.IdentityResolver = (*IdentityResolver)(nil)

// NewIdentityResolver builds a resolver over the product database pool.
func NewIdentityResolver(pool *pgxpool.Pool) *IdentityResolver { return &IdentityResolver{pool: pool} }

// Resolve implements port.IdentityResolver.
func (r *IdentityResolver) Resolve(ctx context.Context, issuer, subject string) (string, error) {
	id, err := mcsqlc.New(r.pool).ResolveUserIdentity(ctx, mcsqlc.ResolveUserIdentityParams{IdpIssuer: issuer, IdpSubject: subject})
	if errors.Is(err, pgx.ErrNoRows) {
		return "", port.ErrUnknownIdentity
	}
	if err != nil {
		return "", fmt.Errorf("resolve identity: %w", mapMatterError(err))
	}
	return id, nil
}
