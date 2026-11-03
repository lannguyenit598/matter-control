# MatterControl — repository instructions

## Product and scope

MatterControl coordinates high-stakes legal work. A Requirement is a condition to satisfy; an
Action is work to perform. Completion, proof verification, dependencies, timing and attention
are independent. Preserve explicit Matter membership and uniform hidden-resource denials.
The implemented contract is [docs/api/contract.md](docs/api/contract.md); the product vocabulary
is [GLOSSARY.md](GLOSSARY.md). Do not infer release approval from source or local tests.

## Work safely

Read the nearest app instructions before changing code. Preserve dirty files and other writers'
work. Use isolated worktrees for parallel changes. Never reset, stash, clean or rewrite history
without explicit authorization. Commit, merge, push, provisioning and deployment are separate
permissions. Do not claim that an external engineering tool ran without actual invocation.

Use synthetic data. Never commit private keys, tokens, database credentials, runtime state,
build outputs or raw sensitive logs. Unknown write outcomes require the existing receipt and
same-key reconciliation flow; do not resend with a new key merely to discover the result.

## Documentation and verification

Keep one canonical document per subject; link instead of copying. See [docs/README.md](docs/README.md).
Update the application contract when wire behavior changes and operator docs when configuration
changes. Historical prompts, tasks and evidence belong in the coordination archive, not the
product tree. Keep concise test results with the PR; raw logs are CI artifacts.

Backend checks are defined in `apps/backend/AGENTS.md`; frontend checks in
`apps/frontend/AGENTS.md`. Report commands actually run and distinguish source, local runtime,
browser, real-provider and production proof. Do not mark skipped checks as passing.

On workstations configured with RTK, prefix shell commands with `rtk` or `rtk proxy`. Use Semble
first for semantic exploration when available; record unavailability before targeted fallback.
Use Context7 for current library/framework/SDK/CLI documentation questions. Repository-specific
rules override generic skill advice; direct user instructions take precedence.
