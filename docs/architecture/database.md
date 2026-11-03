# PostgreSQL model and migrations

The executable schema is the ordered [Goose migrations](../../apps/backend/internal/adapter/outbound/postgres/migrations_mattercontrol).
Typed queries are generated from [sqlc input](../../apps/backend/internal/adapter/outbound/postgres/queries_mattercontrol);
never hand-edit generated `mcsqlc` files. `make sqlc-check` compares generated output without
rewriting source. This document summarizes the model; it does not duplicate every column.

- Identity and scope: users map issuer/subject to internal identity; workspaces, Matters and
  explicit memberships determine current access. Workspace ownership is not implicit Matter access.
- Work: graph nodes, Requirements/Actions, prerequisite edges, workstreams, parties, milestones
  and context records. Revision CAS and the Matter lock protect command serialization.
- Proof: documents, exact versions, criteria and their purposes, evidence claims, assessments,
  epochs and disputes. Filing details/cycles/submissions/observations retain their own history.
- Operations: command receipts, domain events, security audit, review matrices, import identity
  and deterministic brief replay. History is not reconstructed from current names alone.
- Local extensions: 0013 Saved Views, 0014 playbooks/revisions/instances, 0015 intake, 0016
  guidance documents/revisions. Saved Views are the explicitly deletable private filter rows.

Runtime authorization is application-enforced; the schema/role profile is additional protection,
not a claim of universal row-level tenant isolation. Do not expose the private schemas through
Supabase's Data API. Use the [least-privilege role profile](../../ops/adr006/db/README.md), a separate
migration identity and a dedicated BFF identity. The BFF state table is provisioned by
[operator SQL](../../ops/adr006/bff-state.sql), separately from product migrations.

Never edit an applied migration. One retained local manual-testing database applied an earlier
uncommitted 0016 draft without guidance-title uniqueness. Its version number alone cannot prove
schema equality. Preserve that database; compare constraints and reconcile explicitly before
reuse. New fixtures must migrate from the final source. No reset is implied by this import.

Recovery must cover database rows, object bytes and the intended BFF/session policy together;
see [backup and restore](../operations/backup-restore.md).
