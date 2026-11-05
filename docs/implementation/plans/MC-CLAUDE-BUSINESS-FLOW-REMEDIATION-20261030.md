# Plan / checkpoint — MC-CLAUDE-BUSINESS-FLOW-REMEDIATION-20261030

Actual Claude Code (Sonnet 5.5), branch `codex/unified-project-flow`, HEAD `0de3e5d` (= review HEAD; no drift). Pre-work pin: `docs/testing/claude-business-flow-remediation-20261030-r1/source-pin-before.json`. Single continuous plan; update the table at each checkpoint.

## Source-writer handoff
Codex finished Liquid/dark UI (dirty frontend files kept as-is, built upon). OpenCode QA artifacts under `docs/testing/opencode-*` untouched. No competing writer observed.

## Decisions (small contract deltas)
- D-BF1 criterion `purpose` ∈ {`PACKAGE`,`OUTCOME`}, immutable after creation, column `criteria.purpose NOT NULL DEFAULT 'PACKAGE'` (forward migration 0009). Legacy rows and unknown/absent values = `PACKAGE`, which keeps gating submission (never loosens a gate, never guessed from titles). `OUTCOME` only on a filing with outcome verification (proofRequired=true). Submission/Response guard checks PACKAGE criteria only. Aggregate verification stays over all mandatory criteria; the checklist/filing DTO adds a package/outcome split so "package ready" is never shown as "outcome accepted". Open decision for PO: should APPROVAL require a declared OUTCOME criterion for proofRequired filings (not enforced here: would change in-flight filings).
- D-BF2 proofRequired=false filing: label "No independent outcome verification state"; package/signature gates and checklist stay reachable.

## Progress
| Group | Status |
|---|---|
| A BF-01/02 | source+tests done (domain, service, HTTP DTO, PG migration 0009 + sqlc, GW suites, FE proof panel/filing form); docs/api + HTTP test pending |
| B BF-03/04 | source+tests done (`lib/mc/local-time.ts`, `LocalDateTimeField`, SearchPicker for dependency + filing Requirement via `searchWorkItemsAction`) |
| C BF-06/07 | source+tests done (root/login → /my-actions; Matter landing = Control Room brief + Members behind disclosure; tabs grouped with More) |
| D BF-05/08 | source+tests done (`GET /me/reviews`, `GET /matters`, SuiteBF memory+PG, HTTP tests, /my-reviews and /matters pages) |
| E BF-09/10 | source+tests done (WorkNow lead, primary transition, disclosures; brief window in device zone, targetLabel, readable changes) |
| Final gates / return | done: `pnpm check`, build, build:webpack, build:worker, Storybook, `make check` + PG counts, return.md; browser NOT_RUN |

| GL-FORM addendum | applied (appearance patch; GlassSurface stable tree fix, red→green); rendered checks NOT_RUN |
