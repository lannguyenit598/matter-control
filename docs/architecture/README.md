# Application architecture

This summary describes source imported from coordination commit `6172f234be5a25393cddffaf841cc0370b587334`.
It replaces the old packet-only architecture entry point; it does not approve a production release.

## Runtime boundaries

The browser uses the Next.js application. Its server-side BFF owns OIDC login/callback/logout,
opaque session cookies, protected Server Actions and per-user REST calls. OAuth tokens remain
server-side. The Go `mcapi` verifies bearer tokens through the configured ZITADEL issuer and
resolves `(issuer, subject)` to an explicitly provisioned product user. PostgreSQL stores legal
records, receipts and history; private filesystem or R2 adapters store document bytes.

Frontend code uses App Router composition, feature modules and domain-free shared Atomic UI.
Backend dependencies point inward: domain → ports → services → adapters → composition root.
Only the composition root wires adapters; domain/core do not import HTTP or database packages.

## Legal state and commands

Work includes Requirements and Actions, with distinct execution, verification, dependency,
timing and attention axes. Filings extend Actions with stage/cycle/outcome facts. Documents
have immutable versions and a separately guarded current pointer. Proof claims require an
independent authorized verifier; uploads and publication do not establish legal verification.

Matter-scoped commands validate current membership/policy inside their transaction, use revision
CAS where specified, record events and complete the Matter fence. Receipted operations preserve
same-key/same-payload outcomes. An uncertain response remains UNKNOWN until reconciled; retries
must follow [the contract](../api/contract.md). Read snapshots recheck access and use repeatable-read
PostgreSQL transactions. Workspace commands have their own guarded workspace transaction.

## Current supporting modules

Control Room, next actions, proof gaps and status briefs derive operational views from source
records/events. Search is authorized metadata search with opaque encrypted cursors. Focus uses
a browser-local state machine plus eligibility reads and has no legal mutation. Agenda lists
recorded due dates. Saved Views are private filters. Playbooks apply immutable revisions
atomically; intake conversion and guidance publication retain their own guarded commands.

See [database](database.md), [security](security.md), [API](../api/contract.md),
[ADR-006](adr/ADR-006-workers-cloud-run-supabase-r2-topology.md) and
[ADR-007](adr/ADR-007-portable-fe-be-deployment-profiles.md).
