# Security boundaries

Browser → Next.js BFF → Go API → PostgreSQL/private objects are separate trust boundaries.
Read and write authorization is based on current product memberships, never a supplied actor,
email match, visible selector or identity-provider role alone.

- OIDC Authorization Code + PKCE binds state/nonce to the login attempt. Cookies contain opaque
  handles, not OAuth tokens. The server validates return paths and rejects external destinations.
- Go authenticated introspection checks issuer, audience, activity and expiry. Unavailable
  identity infrastructure must not be treated as a valid identity. The positive cache is a
  load shield, not a guarantee of immediate issuer revocation.
- Hidden resources and absent resources have uniform not-found behavior. Active members without
  an operation's role receive a role refusal. Matter reads and commands recheck current authority.
- Durable BFF state is encrypted in PostgreSQL with a versioned key ring and serialized refresh
  claims. Memory mode is for local use and loses sessions on restart. Tokens/keys stay out of
  client bundles, localStorage, prompts and logs. Provider qualification is still required.
- Strong ETags/revisions and exact operation fingerprints protect stale writes and receipt replay.
  An UNKNOWN command is not a confirmed failure. Do not mint a replacement key to retry blindly.
- Use a non-owner runtime database role; run migrations separately. Private object access is
  mediated by authorized product endpoints. A deployed API must not use ephemeral filesystem
  storage as its document store.
- Runtime origins, TLS, secrets, MFA policy, workload limits, monitoring, retention and provider
  residency are operator/release gates. Local suites are not a security certification.

Configuration: [backend](../../apps/backend/docs/operations.md),
[BFF bindings](../../ops/adr006/README.md), [deployment](../deployment/README.md).
