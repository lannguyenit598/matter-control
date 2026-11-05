# MC-002 — Local Backup/Restore Procedure

Owner: Codex DevOps; independent verifier: OpenCode. Authority: H5/DEC-023, W1/local RPO24h/RTO8h targets DEC-024 and Step02.1 Task F. Status: PROCEDURE_PREPARED; execution evidence is recorded separately. This procedure is a synthetic PostgreSQL tooling drill, not restoration of MatterControl schemas, documents, proof, history or permissions that have not been implemented. It does not substitute for either owner PoC.

## Bounds and preconditions

Use the already identified local Docker Unix socket only; never a remote/default database. Resolve the Docker Official postgres18.6-alpine image to its repository digest and record the local image ID. Create two new uniquely named task-labelled containers: source and target. Refuse any existing matching name. Use no host port, `--network none`, resource limits and a tmpfs mount at `/var/lib/postgresql`; no named/anonymous volume or existing bind mount. Local initialization trust authentication is confined to these network-isolated synthetic containers; do not reuse it for application or production configuration. No credentials or real legal data enter evidence.

1. Record UTC and monotonic start; confirm local endpoint, source/target identities and image digest.
2. Start new source with tmpfs, create database `mc021_source` and schema `drill`; insert a small deterministic synthetic record set plus marker `pre_backup`. Record expected values, row counts and hashes.
3. With source writes paused, run `pg_dump -U postgres -d mc021_source --format=custom --no-owner --no-acl`. Capture archive bytes, exit, warnings, size, SHA256 and start/end timestamps. A self-computed hash is an integrity inventory, not independent authenticity verification.
4. Insert marker `post_backup` after the dump to prove the restore represents a backup point, rather than the latest source. Preserve the source and query it again later.
5. Read the archive through `pg_restore --list`; reject empty/corrupt input before restoration. Test a deliberately corrupt COPY of the archive with `--list`, requiring a nonzero exit; never overwrite the original archive.
6. Start a separate new target container and create empty database `mc021_restore`. Verify emptiness. Feed the archive to `pg_restore -U postgres --dbname=mc021_restore --single-transaction --exit-on-error --no-owner --no-acl`. Do not use `--clean`, drop existing databases or overwrite source.
7. With `psql -v ON_ERROR_STOP=1`, assert deterministic row content/count/hash, pre-backup marker present, post-backup marker absent, PK/FK/CHECK constraints and sequence continuity. Capture a missing-reference negative insert in a rolled-back transaction, expecting nonzero exit. Check source still contains both markers.
8. Measure provisioning, restore-only and end-to-end recovery-to-validated-read times independently. Record observed recovery point, known omitted writes, actual backup cadence and operator steps. One manual dump provides no evidence of an enforced daily cadence or production RPO24h guarantee; a local elapsed time below8h only meets this rehearsal's time target at this tiny dataset size.
9. Retain archive, SQL fixture, logs, image/source/target IDs and evidence manifest first. Stop only the two exact containers whose labels/IDs match this invocation; retain their stopped-container metadata. Do not delete any volume, prune Docker or touch pre-existing resources. Tmpfs data ceases to exist at container stop. Report cleanup truthfully.

Reference command invocations use `rtk proxy docker --host unix:///Users/nguyenvanlan/.docker/run/docker.sock …`, with `docker exec` invoking the image's matching PostgreSQL18 tools. This machine endpoint is recorded evidence, not a portable dependency. Commands run by Python use argv arrays rather than shell substitution; outputs are checked before advancing.

## Acceptance and limitations

The drill passes only if backup/list/restore/query exits and assertions match, corrupted-copy rejection occurs, source remains distinct and both owned containers stop. Any unexpected target/label/mount fails closed. OpenCode must review exact evidence and limitations before independent PASS is recorded. A completed tooling drill is separate from POC-02-07 full DB/blob/history/access recovery; that remains NOT_RUN until owner outputs and actual data/object models exist.

Official sources consulted via Context7 then primary pages on2026-10-24: [pg_dump18](https://www.postgresql.org/docs/18/app-pgdump.html), [pg_restore18](https://www.postgresql.org/docs/18/app-pgrestore.html), [Docker Official PostgreSQL image](https://hub.docker.com/_/postgres). Custom archives are consumed by pg_restore; transaction/error-stop options avoid accepting a partial restore. Only this run's synthetic archive is trusted for execution.
