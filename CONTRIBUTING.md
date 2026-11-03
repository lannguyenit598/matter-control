# Contributing and integration policy

`main` is the maintained product tree. Application code, tests, migrations, configuration
examples, CI, current API/architecture and operator documentation belong here. Do not commit
real credentials, machine/runtime state, cache directories, `.orig` backups or build outputs.

Development prompts, handoffs, task/workboard ledgers, raw review/evidence packets, research and
prototype iterations remain on `codex/unified-project-flow` (or a dedicated archive), not on
`main`. Keep technical app instructions required by lint/agent checks; they are contributor
rules, not task history.

## Bring changes from the coordination branch

Start a new integration branch from current `main` in an isolated worktree. Inspect the exact
source commit and use an explicit path allowlist for application, CI, operator code and selected
current documents. Check deletions and omitted dependencies, update links, then run both app
checks and relevant builds. Review the result against `main` before merging.

Do not merge the entire coordination branch: that would reintroduce excluded dossiers. Do not
use `.gitignore` as a way to remove already tracked files. Prefer future product changes on
short-lived branches based on `main`; keep process evidence elsewhere.

Historical attribution and the baseline source revision are recorded in
[the integration record](docs/release/integration.md). A curated import intentionally does not
make the full coordination history an ancestor of `main`; archive commits remain on that branch.
A local merge does not push or deploy anything. Production gates remain separate.
