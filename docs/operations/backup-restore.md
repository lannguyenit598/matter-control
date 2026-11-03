# Backup and restore

Back up the product PostgreSQL database and private object bytes as one recoverable application
boundary. Preserve exact-version references, histories, receipts and access state; copying only
current document files is insufficient. BFF encryption keys and durable-session policy require
separate protected operator handling; never put them in evidence or the repository.

[The pilot runbook](../deployment/pilot-deploy-runbook.md) defines the deployment procedure and
retention decisions. [The scheduled dump script](../../ops/backup/scheduled-dump.sh) is an
operator building block, not evidence that backups are scheduled or recoverable.

[The synthetic rehearsal](../../ops/p0-local/restore-rehearsal/run.sh) works only with identified,
task-labelled, separate test containers and new database/object targets. Supply its private
`MC_TESTENV` file and explicit owned source/target containers; do not reuse a live application
DSN. It refuses existing targets and checks restored content and negative cases. Logs go to
its fresh temporary output directory unless `MC_RR_OUT` is explicitly supplied. Keep raw output
private until inspected/redacted; successful execution is local evidence only.

No production RPO/RTO, new-feature restore acceptance or provider recovery guarantee follows
from the source import. Run and review recovery for the actual selected environment before release.
