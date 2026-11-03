# Backend architecture

The current architecture is documented once at [the application overview](../../../docs/architecture/README.md),
with [database](../../../docs/architecture/database.md), [security](../../../docs/architecture/security.md)
and [application contract](../../../docs/api/contract.md) companions.

The Go package layout and dependency rules remain in [AGENTS.md](../AGENTS.md); HTTP routes and
configuration are in [api.md](api.md) and [operations.md](operations.md). Executable migrations,
queries and tests take precedence over old template/BE-01-only architecture prose.
