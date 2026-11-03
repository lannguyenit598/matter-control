# Operations

- [Local development](local-development.md): configure and run both applications.
- [Backend operations](../../apps/backend/docs/operations.md): configuration, lifecycle, limits,
  introspection, object storage and diagnostics.
- [BFF state and rotation](../../ops/adr006/README.md): durable storage, key ring and transfer leases.
- [Database roles](../../ops/adr006/db/README.md): migration/runtime/BFF separation.
- [Backup and restore](backup-restore.md): database/object boundary and synthetic rehearsal.
- [Pilot deployment](../deployment/pilot-deploy-runbook.md): smoke, monitoring and rollback.

Operate only resources you have identified and are authorized to control. Keep credentials and
raw diagnostics outside Git. Do not stop a shared listener or delete a volume to make a test pass.
