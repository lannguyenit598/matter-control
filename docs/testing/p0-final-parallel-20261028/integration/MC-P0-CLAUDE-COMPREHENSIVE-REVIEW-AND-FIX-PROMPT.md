# MC-P0 — comprehensive source review and fix pass

## Objective

You are actual Claude Code. Perform one disciplined review-and-fix pass over the
current MatterControl P0 candidate in:

`/Users/nguyenvanlan/Documents/code/pet-projects/matter-control`

The goal is to find and correct all **confirmed source-level defects** reachable
by this checkout's backend/frontend checks, contract review and Design R9
non-browser semantics. This is not a rewrite, release task or a new feature
wave. Fix the root cause once, add a regression, and leave external evidence
gates honestly open.

## Safe start

1. Read root `AGENTS.md`, `/Users/nguyenvanlan/.codex/RTK.md`, both component
   `AGENTS.md` files and rules matching every file you touch.
2. Record current branch, HEAD, `git status --short`, and a source manifest of
   `apps/backend` + `apps/frontend`. The current committed base is
   `2d410816cd9a9b2664ec388a98aa8f5fdb8f00cc`; the candidate also contains the
   three uncommitted draft/access-loss files. Do not assume an older manifest or
   review still pins current bytes.
3. If source changes while you work or an active writer overlaps your target,
   stop and return the exact files/hashes; do not overwrite another writer.
4. Preserve all existing dirty and untracked material. Do not reset, stash,
   clean, switch branch, stage, commit, push, merge, deploy, change provider
   settings, read credentials, or alter ZITADEL Cloud.

## Required inputs

Read these in full before diagnosis:

- `docs/implementation/tasks/MC-P0-CODEX-PRIMARY-REMEDIATION-20261028.md`
- `docs/implementation/p0-zcode-execution/local-contract.md` (current revision)
- `docs/implementation/p0-zcode-execution/final-return.md`
- `docs/design/p0-handoff-r9/return.md` and its manifest
- `docs/testing/p0-final-parallel-20261028/review/return.md` and `findings.json`
- `docs/testing/p0-final-parallel-20261028/integration/` current source
  manifests/deltas and the Claude hardening returns/prompts

Treat historic author statements as context only; current source, tests and
current contract are authoritative.

## Review coverage

Work in this order. Search callers before changing shared code.

### A. Baseline integrity and executable defects

- Run the smallest existing checks that establish baseline health. For frontend,
  run `pnpm check` and `pnpm build`; run Storybook only if a shared visual
  component changes. For backend, run `make sqlc-check`, formatting/tidy/lint and
  the relevant Go tests; use PostgreSQL fixtures only when their task ownership,
  identity and isolation are revalidated without revealing DSNs.
- Fix every deterministic compile, type, lint, format, test or build failure.
- Record an environment restriction distinctly from a product failure. Do not
  bypass host restrictions by exposing a service or changing global settings.

### B. Contract, state, authorization and error review

Trace all current P0 operation paths touched by W1–W7:

- request/DTO/schema validation; role, workspace and Matter authorization;
  idempotency/receipt and `OUTCOME_UNKNOWN` recovery;
- CAS/precondition mappings; 401/403/404/409/412/428 and unavailable behavior;
- five independent state axes, proof/assessment epoch semantics, filing package
  and signature applicability guards, and non-mutating refusals;
- import group atomicity, replay/content identity, provenance and imported
  verification claims; Status Brief replay at an effective instant;
- restore checker assertions and fail-closed corruption/missing-object handling.

Start from prior advisory findings but re-evaluate them against current bytes:

- revision-less legacy Filing Brief replay must not display invented revision
  facts or silently produce a plausible state;
- Matter route identifiers must be safely encoded consistently;
- R9 access-loss/form-intent behaviour must purge only when the page scope is
  lost and retain drafts on a denied sub-resource. Document any unavoidable
  whole-tab purge limitation rather than pretending it is per-Matter.

### C. Frontend composition and R9 non-browser semantics

Review routes, feature repositories/actions and shared components for:

- server/client boundaries, session-first fail-closed reads and safe internal
  redirects;
- no raw backend fetch in components, no unvalidated external input, no unstable
  client-generated retry identity;
- Draft/selection/pending-attempt purge and re-grant behaviour;
- locale/time-zone display preserving legal wire values, static UI copy only,
  accessible semantic labels/errors/empty states;
- current source alignment with R9 states, causal navigation, target-version
  versus expected-current separation, and history/provenance pagination.

Do not invent browser results. Visual geometry, keyboard/touch/screen-reader and
AC-137 remain separately verifiable only with the authorized browser/human flow.

## Fix protocol

For every confirmed defect:

1. State requirement/contract/R9 reference and affected callers.
2. Make a focused reproducing test go red where feasible.
3. Apply the smallest root-cause correction, preserving existing error handling
   and data compatibility.
4. Run the focused regression, then the impacted component gate.

Do not fix ambiguous business-policy questions by guessing. Mark those
`DECISION_REQUIRED` with exact source evidence. Do not turn an advisory into a
feature or broad refactor.

## Outputs

After confirming the output directory is absent, create only:

`docs/testing/p0-final-parallel-20261028/claude-comprehensive-review-r1/`

Required files:

- `return.md` — identity/tool/model, base/current hashes, findings and
  dispositions, changed paths, requirement mapping, checks run, skips and risk.
- `findings.json` — stable finding IDs/severity/status, including no-finding
  areas examined.
- `source-manifest.json` and `source-delta.json` — exact post-fix bytes/delta.
- `checks.json` — full command, start/end UTC, exit, count and any fixture
  disposition; never include credentials, tokens, DSNs or personal data.

No self-awarded `DONE`, release, production, MC-002 closure, browser/a11y,
ZITADEL login, Cloudflare/cost or AC-137 result. Request an independent review
of the exact final manifest after the pass.
