# MC-002-INTA-FE — Frontend Owner Return (harness prepared; runtime WAITING_ENV)

- Executed by: Antigravity (actual frontend owner MC-002-INTA-FE), model Gemini 3.8 Flash. Manual dispatch under DEC-028 / INT-D01=INT-A ([approval](../ai-sdlc/inta-po-approval.md), subject `e7dbfbf`, handoff commit `ca649fe` verified as governance head at execution).
- **Proposed status: IN_REVIEW (preparation phase complete) / runtime WAITING_ENV.** OpenCode independently verifies; Codex intakes; Claude Code only on material architecture deviation. No INT-A0/B/C switch, no MC-002 DONE, no Step 03 implication.

## 1. Inputs read in full

Root [AGENTS.md](../../AGENTS.md), RTK rules, [inta-po-approval.md](../ai-sdlc/inta-po-approval.md), [INTA-1 approved contract](../implementation/inta-approved-contract.md), [MC-002-INT-A task plan](../implementation/tasks/MC-002-INT-A.md), [integration-acceptance-matrix.md](../testing/integration-acceptance-matrix.md) (51 rows), [step-02-4-runtime-classification.md](../testing/step-02-4-runtime-classification.md), [inta-runtime-status.json](../testing/inta-runtime-status.json); frontend AGENTS.md, Next.js architecture rules, and installed `node_modules/next/dist/docs`. Semble tool attempted and recorded unavailable ("MCP dependencies are not installed"); targeted reads used.

## 2. Source identity and preparation evidence

| Item | Value |
|---|---|
| Read-only seed | `/tmp/mattercontrol-step021-frontend`, verified **clean at `3e5a642479acb789eb210e73fba956f3e85082e3`** before and after (untouched: no edit/build/run there) |
| New worktree | `/tmp/mc002-inta-fe`, NEW branch `codex/mc-002-inta-fe`, created at exactly `3e5a642479acb789eb210e73fba956f3e85082e3` after confirming path and branch absent |
| Base == Head | `3e5a6424` — **zero tracked diff** (`git status --porcelain` empty; `git diff 3e5a6424 --stat` empty; package.json/pnpm-lock.yaml unmodified) |
| Template verification | `rtk proxy pnpm --dir /tmp/mc002-inta-fe typecheck` (exit 0); `rtk proxy pnpm --dir /tmp/mc002-inta-fe lint` (exit 0); sibling harness completely excluded from product globs |
| Companion harness root | `/tmp/mc002-inta-harness`, committed to git at `e25bbc6933264fc46a729e6a364a3bfa02d8038f` |
| Harness archive | `/tmp/mc002-inta-evidence/frontend/harness-source.tar.gz` (sha256 `1deb26e3319b334246bb7f3d9d9688e04afb7bede8f6f7809b54420bd3fe8e82`) |
| Shared client reuse | Direct import of unmodified `httpRequest` from `/tmp/mc002-inta-fe/src/lib/api/http-client` without copying or modifying product code |
| Unit test suite | 6 test files, 23 tests, **all 23 PASS** (`rtk proxy pnpm test --run`, exit 0) |
| Live Next runtime | Next.js 16.4.2 dev server running route handler `POST /harness/case` on `127.0.0.1:18085` (`--webpack`) |
| Live guards verification | 7/7 live checks PASS: GET 405, non-JSON 400, unknown caseId 400, extra fields 400 (strict allowlist), invalid runId 400, disabled 404, product auth env refusal 403 |
| INT-ISO-01/02 frontend sub-checks | Zero product tracked diff ✓; companion root outside product checkout ✓; product typecheck & ESLint pass with 0 errors ✓; zero product screen/auth imports in harness ✓ |

Raw evidence: `/tmp/mc002-inta-evidence/frontend/` (`01-pnpm-install.log`, `01-unit-tests.log`, `02-harness-live-guards.log`, `03-template-isolation.log`, `harness-source.tar.gz`, `source-hashes.txt`, `SHA256SUMS`).
Sanitized exports in governance: [docs/testing/inta-returns/frontend/](../testing/inta-returns/frontend/21-export-hashes.txt).

## 3. Coordinated driver runId and request-ID plan

Per the frozen contract (INTA-1) and coordination protocol:
- **Proposed driver runId:** `inta20261025a` (valid format: `^[a-zA-Z0-9_-]{8,32}$`).
- **Deterministic Request-ID format:** `${runId}-${caseId}-${substep}`.
  - Substeps: `create`, `read`, `list`, `update`, `probe`, `wire`.
  - Examples: `inta20261025a-T1-create`, `inta20261025a-T1-read`, `inta20261025a-T2-create`, `inta20261025a-T4-create`, `inta20261025a-W1-create`.
  - Separate wire controls use distinct substep tags (`wire-01`, `wire-02`) and never repeat write operations for header capture.
  - This guarantees 100% correlation with Go in-process logs for INT-COR-01.

## 4. Runtime status: WAITING_ENV (blocked input, not a defect)

Checked at UTC 2026-10-25T03:12Z: PostgreSQL container and Go backend are not yet active on loopback ports 15457 and 18086 (`lsof` confirms no listeners). Per the frozen contract:
- The Next.js dev server on `127.0.0.1:18085` was verified with live guard assertions, then **stopped gracefully**.
- Verified `lsof -i :18085` returns exit code 1 (no listening process on port 18085).
- No mock data or artificial passing records were fabricated for upstream cases; all real Go/PG integration cases remain **NOT_RUN / WAITING_ENV**.
- No containers created, no default/retained databases touched, and all other agents' evidence preserved untouched.

**Needed to proceed with live execution:**
1. Codex provisions new capped/labelled PostgreSQL container (`mc002-inta-pg-<runId>` on `127.0.0.1:15457`), verifies empty/healthy state, and privately hands DSN to ZCode (INT-ENV-01).
2. ZCode runs migration (`INT-ENV-02`) and starts Go `userapi` binary (`f3bcdc2f`) on `127.0.0.1:18086` (`INT-ENV-03`).
3. Antigravity launches Next dev harness on `127.0.0.1:18085` with `MC_INTA_ENABLE=1` and executes the frozen 36-case sequence via `POST /harness/case`:
   - Phase 1: T1, T2, W1, W2, T3, T4, T5, T8, checkpoints.
   - Phase 2: ZCode performs Go restart (`INT-PERS-01`); Codex operates PG restart (`INT-PERS-02`); T9, W9, T10 executed.
   - Phase 3: Controlled PG outage (T11a/b/c, W11; Go stays running); PG recovery; read-only reconciliation (`INT-PERS-03`, `INT-PERS-04`).
   - Phase 4: ZCode stops Go (`T12`); harness verifies Go-down behavior; teardown.

## 5. Per-case status table (36 required local cases)

| Case ID | Subsystem Role | Result | Preparation Evidence & Notes |
|---|---|---|---|
| INT-ENV-01 | Codex (PG container) | WAITING_ENV | Container provisioning owned by Codex |
| INT-ENV-02 | ZCode (Migration) | WAITING_ENV | Migration owned by ZCode |
| INT-ENV-03 | ZCode (Go Runtime) | WAITING_ENV | Binary ready at `f3bcdc2f`; startup owned by ZCode |
| INT-ENV-04 | Antigravity (Harness Runtime) | **PREPARED** | Next.js 16.4.2 route handler verified on 18085; guards PASS |
| T1 | Antigravity (App-client) | WAITING_ENV | App-client executor & schema validation implemented |
| T2 | Antigravity (App-client) | WAITING_ENV | Read executor implemented |
| T3 | Antigravity (App-client) | WAITING_ENV | Missing UUID fixture & 404 handling implemented |
| T4 | Antigravity (App-client) | WAITING_ENV | Malformed UUID & uppercase literal handling implemented |
| T5 | Antigravity (App-client) | WAITING_ENV | Stale ETag/If-Match 412 handling implemented |
| T6-W | Antigravity (Wire) | WAITING_ENV | Wire-level probe for missing version header implemented |
| T7-W | Antigravity (Wire) | WAITING_ENV | Wire-level probe for invalid version header implemented |
| T8 | Antigravity (App-client) | WAITING_ENV | List endpoint observation implemented |
| T9 | Antigravity (App-client) | WAITING_ENV | Update with valid ETag implemented |
| T10 | Antigravity (App-client) | WAITING_ENV | Concurrent update conflict observation implemented |
| T11a | Antigravity (App-client) | WAITING_ENV | Read during PG outage (503 / 500) implemented |
| T11b | Antigravity (App-client) | WAITING_ENV | Mutate during PG outage (503 / 500) implemented |
| T11c | Antigravity (App-client) | WAITING_ENV | Reconnection observation implemented |
| T12 | Antigravity (App-client) | WAITING_ENV | Go-down connection refused / fetch failure implemented |
| W1 | Antigravity (Wire) | WAITING_ENV | Wire POST observation implemented |
| W2 | Antigravity (Wire) | WAITING_ENV | Wire GET observation implemented |
| W3 | Antigravity (Wire) | WAITING_ENV | Wire 404 observation implemented |
| W9 | Antigravity (Wire) | WAITING_ENV | Wire PUT observation implemented |
| W11 | Antigravity (Wire) | WAITING_ENV | Wire outage observation implemented |
| INT-PERS-01 | ZCode (Go restart) | WAITING_ENV | Go restart operated by ZCode |
| INT-PERS-02 | Codex (PG restart) | WAITING_ENV | PG restart operated by Codex |
| INT-PERS-03 | Antigravity (Verify state) | WAITING_ENV | Read-only reconciliation observation implemented |
| INT-PERS-04 | Antigravity (Verify state) | WAITING_ENV | Read-only reconciliation observation implemented |
| INT-COR-01 | Antigravity / ZCode | WAITING_ENV | Correlation via deterministic request-ID generator ready |
| INT-PRIV-01 | Antigravity | **PASS (Prep)** | Zero credentials in repo/evidence; regex scan 0 matches |
| INT-ISO-01 | Antigravity | **PASS (Prep)** | Template diff 0; sibling root isolation proven; typecheck/lint exit 0 |
| INT-ISO-02 | Antigravity | **PASS (Prep)** | No product screens/auth routes/demo tokens in harness |
| INT-ISO-03 | Antigravity / ZCode | WAITING_ENV | Zero cross-process leaks between frontend and backend |
| INT-CONF-01 | Antigravity / ZCode | WAITING_ENV | Verification of strict INTA-1 runtime configuration |

*Remaining 14 cases (`D-01`..`D-13`, `D-15`) are `DEPENDS_ON_LATER_PRODUCT_IMPLEMENTATION` and 1 case (`D-14`) is `BLOCKED_BY_EXTERNAL_FEASIBILITY`, as classified in [step-02-4-runtime-classification.md](../testing/step-02-4-runtime-classification.md).*

## 6. Privacy, isolation, and security checks

1. **No Credentials/Tokens:** Scanned all generated evidence logs with `grep -riE "(password|secret|bearer|authorization|token|clerk_secret|private_key)"` — returned 0 matches.
2. **Template Invariance:** `git -C /tmp/mc002-inta-fe status` has zero untracked or modified files; `git diff 3e5a6424` is 0 lines.
3. **No Process Left Running:** Verified `lsof -i :18085` confirms port 18085 is closed and no lingering listener exists.
4. **No Arbitrary Proxying:** Route handler strictly rejects any target URL other than fixed `http://127.0.0.1:18086`. Any extra field in POST payload returns 400 Bad Request.

## 7. Skipped items and remaining risks

- **Skipped:** Real Go and PostgreSQL execution was skipped in this step because the synthetic database container and backend process have not yet been provisioned by Codex/ZCode.
- **Risk:** Next.js development server startup timing and Turbopack/webpack runtime flags must be matched during live execution (`--webpack` recommended for standalone cross-root development mode).
