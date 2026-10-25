# MC-002-INTA-FE — frontend return intake and disposition

Codex actual read-only intake, 2026-10-25. Governance base `a1448e4828f61cb6d794b2549f09e2394228b721`, branch `task/MC-002-solution-architecture`. Authority DEC-028 / frozen INTA-1. Requirements: NFR-001/002/003/008/009 and the original 51 integration IDs; no product policy change. Owner implementation: actual manual Antigravity IDE, Gemini 3.8 Flash per human-returned report (model identity owner-reported). Independent reviewer: actual OpenCode.

**Disposition: REWORK_REQUIRED before upstream execution.** Original [owner return](inta-frontend-return.md), exports and archive are retained unchanged. [OpenCode source review](inta-frontend-opencode-source-review.md) returns CHANGES_REQUIRED. No material architectural deviation was identified; routine owner implementation/evidence correction remains inside INT-A. No Claude review or new PO scope choice is needed for these fixes.

## Verified integrity and qualified preparation evidence

- Template seed and new template checkout remain clean at `3e5a642479acb789eb210e73fba956f3e85082e3`. Companion `/tmp/mc002-inta-harness` is clean at `e25bbc6933264fc46a729e6a364a3bfa02d8038f`.
- Five export payload hashes verify; four exported payloads match their retained raw originals byte-for-byte. All 17 source-manifest entries verify; all 21 non-AppleDouble archive payloads match the companion source. Original tar (including AppleDouble metadata) is retained, 11077 bytes, SHA256 `1deb26e3319b334246bb7f3d9d9688e04afb7bede8f6f7809b54420bd3fe8e82`.
- Installed package metadata: Next 16.4.2, React 19.3.1, TypeScript 5.9.3, ESLint 9.39.5. Version metadata corrections are documentary, no upgrade.
- Owner stdout shows 23 unit passes across 6 files; no Codex rerun. Camel-case mock fixtures reproduce the source mistake, so green mocks do not establish compatibility with native Go JSON. Retained stdout has no UTC/exit wrapper.
- Seven HTTP guard responses were captured. Printed expected-status labels are not computed verdicts; two negative inputs confound runId validation with the intended failure. Zero-upstream calls were not measured. The isolation log is an owner-authored narrative excerpt, not a raw command transcript.
- The alleged 36-case table contains 33 recognized IDs, missing INT-ENV-05/06/07, with several incorrect descriptions. Proposed runId `inta20261025a` is syntactically valid; the documented request-ID plan differs from source and lacks restart uniqueness. Driver source is absent.
- The human-supplied execution transcript contains cleanup by `lsof -ti :18085 | xargs kill -9`. Whether any unrelated process was killed is unknown. The claim of graceful owned cleanup is unproven; future execution must stop only recorded owned processes.

See [integrity checks](../testing/inta-frontend-intake/integrity-checks.json) and [return qualifications](../testing/inta-frontend-intake/return-qualifications.json). Byte equality does not validate the claims inside a log. Unrelated governance-root node_modules and MC-003A/.mimosa paths are preserved and excluded.

## Actual independent source review

OpenCode session `ses_e8ee93b62ffeIfh87PcEY6Jutw`, configured model `opencode/glm-5.3-flash-free`, 2026-10-25T03:24:39Z to 03:27:19Z, exit 0, 160.073 seconds. Packet: 27 snapshots / 104590 bytes; all tools denied. [Execution](../testing/inta-frontend-intake/opencode-execution.json), packet manifest/compressed input, JSONL, stderr and sanitized session metadata are retained. This is source/evidence review only, not runtime QA.

| Finding | Required owner correction |
|---|---|
| INTA-FE-R01 | Native timestamps must be created_at/updated_at; fix mocked fixtures as well |
| INTA-FE-R02 | Add the missing harness-local driver: explicit phases, assertions, runId collision refusal, retained envelopes, exactly one attempt per substep |
| INTA-FE-R03 | Request IDs unique across restart, hot reload and switching runIds |
| INTA-FE-R04 | Contract outcome vocabulary/classification and measured source/runtime identity |
| INTA-FE-R05 | Byte-accurate 16 KiB retention on every body/error surface, Unicode-safe, no unbounded duplicate details |
| INTA-FE-R06 | Per-case required/forbidden refId validation before dispatch; 400/zero upstream; mandatory T5/T8 readbacks |
| INTA-FE-R07 | Refuse unsafe startup before listen, enumerate audited product-env key names, no reflected env values |
| INTA-FE-R08 | Isolated guard checks with computed assertions/UTC/exits, owned-PID cleanup evidence |
| INTA-FE-R09 | Correct case inventory/descriptions/version/cleanup/preparation claims in a new return |
| INTA-FE-R10 | Bounded wire execution and minor cleanup; disposition individually, no unrelated redesign |

R01/R02/R03/R06 block upstream cases; R04/R05/R07 must also be fixed before an evidence-producing run. R08/R09 are required evidence corrections. R10 is non-blocking; a fixed local timeout is the smallest bounded wire remedy. Keep abort as a contract vocabulary value without inventing a new caller control; its unavailable execution path can be stated explicitly. No review finding authorizes product/source/lockfile changes or relaxes INTA-1.

## Dependencies and next status

[Antigravity R1 manual prompt](../implementation/handoffs/MC-002-INTA-FE-REWORK-PROMPT.md) is READY / NOT_DISPATCHED until human delivery and owner acknowledgement. Owner owns companion source/tests/driver and new R1 return/evidence only. Codex does not patch owner code. Backend preparation remains IN_REVIEW / WAITING_ENV at unchanged 52b60a4; preserve the existing binary and do not repeat native baselines.

Codex holds new PG provisioning/private DSN until frontend R1 is returned and reviewed. Then proceed to verified empty/healthy new ENV, ZCode migrate/start, coordinated frozen phases and independent OpenCode runtime QA. Current [ledger](../testing/inta-runtime-status.json): 36 required, 14 deferred, 1 blocked; all 51 NOT_RUN, zero PASS/FAIL. Preparation sub-evidence does not close a full runtime row. MC-002, C01-PRODUCT, product identity/isolation, Cloudflare/cost and full recovery remain OPEN.

Skipped: source changes, unit/guard/baseline replay, binary launch, PG/container provisioning, upstream HTTP, runtime QA, production build/deployment and MC-003A changes. Remaining risk: cross-root/runtime feasibility and all 36 runtime acceptance cases are still unproven.
