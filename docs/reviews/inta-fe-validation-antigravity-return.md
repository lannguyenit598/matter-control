# INT-A — Frontend Validation Return

**Task ID**: MC-002-INTA-FE-VALIDATION  
**Executor / Identity**: Actual Antigravity (Gemini 3.8 Flash High / preflight Claude Opus 4.6 Thinking), Google provider, macOS workstation  
**Coordination Branch**: `codex/unified-project-flow`  
**Base Revision**: `a62d838791ba188838c4ff00b7b6e265ac775056`  
**Status**: `IN_REVIEW / FE_VALIDATION_RETURNED`  
**Independent Reviewer**: Actual OpenCode (independent verification pending; no author self-approval)  
**Requirements Traced**: NFR-002, INT-ENV-05, INT-ENV-07, INT-ISO-01, INT-ISO-02, INT-ISO-03, INT-PRIV-01  

---

## 1. Identity, Authority and Scope Boundary

Following the direct Product Owner instruction of 2026-10-26, frontend execution for MC-002-INTA-FE-VALIDATION was assigned to Antigravity, while Codex retains backend, PostgreSQL, orchestration, and privacy governance.

This return reports execution of the two authorized validation workstreams under existing INT-A local scope:
1. **INT-ENV-05 Missing Guard Startup Negatives**: 11 forbidden keys × 2 variants (nonempty synthetic sentinel and empty value) = 22 subchecks in a clean isolated sandbox.
2. **INT-ISO-02 / INT-ENV-07 Product Module Exclusion**: Vitest default test collection and production build in an isolated exact product snapshot with private dependency clone, verifying complete absence of harness routes, modules, and traces in product artifacts.

No full backend/frontend implementation, high-fidelity UI, production deploy, or Step 03 transition is claimed. Historical Next termination remains `TERMINATION_NOT_OBSERVED`. None of the canonical 51 integration rows is marked PASS; all 51 rows remain governed by independent OpenCode QA.

---

## 2. Preflight and Baseline Integrity Verification

Before creating sandbox resources, Antigravity verified:
- **Product Source**: `/tmp/mc002-inta-fe` clean at `3e5a642479acb789eb210e73fba956f3e85082e3` (verified via `git rev-parse HEAD` and `git status --porcelain`).
- **Harness Source**: `/tmp/mc002-inta-harness` clean at `48cc03e949d66fc47a7d304413621eb79804e6c1` (verified via `git rev-parse HEAD` and `git status --porcelain`).
- **Original Ledger State**: `/tmp/mc002-inta-state-intamvnmoems3pd` has exactly 59 files, counter 27, 23 true assertions, `STAGE_7_COMPLETED`, 7 stage markers, checkpoint A baseline v1 / current v2, checkpoint B retained, User X outcome `OUTCOME_UNKNOWN`. All 59 SHA-256 hashes match `05-ledger-after.sha256` byte-for-byte.
- **Historical Processes**: Go PID 98134, Next PID 88444, and Next PID 88453 all verified ABSENT.
- **Loopback Ports**: Ports 18085 and 18086 verified UNBOUND before test execution.
- **New Path Absence**: `/tmp/mc002-inta-fe-validation-20261026`, `/tmp/mc002-inta-evidence/frontend/validation-20261026`, and `docs/testing/inta-returns/frontend/validation-20261026` were verified completely absent prior to creation.

---

## 3. Part A: INT-ENV-05 Missing Guard Startup Negatives (22 Subchecks)

### 3.1 Execution Model and Runner Design
- **Sandbox Root**: `/tmp/mc002-inta-fe-validation-20261026/harness-snapshot` (pure tracked snapshot from `48cc03e`, with private symlinked dependencies).
- **Environment Allowlist**: `PATH` (clean local tool directory only), `HOME=/tmp/mc002-inta-fe-validation-20261026/home` (empty), `NODE_ENV=development`, `MC_INTA_ENABLE=1`, `MC_INTA_GO_BASE_URL=http://127.0.0.1:18086`, `MC_INTA_STATE_DIR` (isolated per variant). Exactly one forbidden key injected per variant.
- **Working Directory**: `cd /tmp/mc002-inta-fe-validation-20261026/harness-snapshot`
- **Command**: `env -i [ALLOWLIST_ENV] ./node_modules/.bin/next dev -H 127.0.0.1 -p 18085 --webpack`
- **Synthetic HTTP Observer**: Dedicated Python HTTP server listening on `127.0.0.1:18086` during each variant execution.
- **Runner Self-Check**: Executed prior to test run (`runner/selfcheck.sh`), validating accounting, observer request counting, timeout handling, and port-free detection without Next dependencies.

### 3.2 Detailed Variant Results (22 / 22 PASS)

| Key | Variant | Value Tested | Exit Code | Expected Refusal Found | Observer HTTP Calls | Port 18085 After Exit | Transient Listener During Boot | Verdict |
|---|---|---|---|---|---|---|---|---|
| `API_TOKEN` | nonempty | `INTA_GUARD_SENTINEL` | 1 | YES | 0 | CLOSED (unbound) | Observed (~200ms) | **PASS** |
| `API_TOKEN` | empty | `""` | 1 | YES | 0 | CLOSED (unbound) | Not observed | **PASS** |
| `API_BASE_URL` | nonempty | `INTA_GUARD_SENTINEL` | 1 | YES | 0 | CLOSED (unbound) | Not observed | **PASS** |
| `API_BASE_URL` | empty | `""` | 1 | YES | 0 | CLOSED (unbound) | Not observed | **PASS** |
| `AUTH_ALLOW_ANONYMOUS` | nonempty | `INTA_GUARD_SENTINEL` | 1 | YES | 0 | CLOSED (unbound) | Not observed | **PASS** |
| `AUTH_ALLOW_ANONYMOUS` | empty | `""` | 1 | YES | 0 | CLOSED (unbound) | Not observed | **PASS** |
| `API_TIMEOUT_MS` | nonempty | `INTA_GUARD_SENTINEL` | 1 | YES | 0 | CLOSED (unbound) | Not observed | **PASS** |
| `API_TIMEOUT_MS` | empty | `""` | 1 | YES | 0 | CLOSED (unbound) | Not observed | **PASS** |
| `AUTH_SECRET` | nonempty | `INTA_GUARD_SENTINEL` | 1 | YES | 0 | CLOSED (unbound) | Not observed | **PASS** |
| `AUTH_SECRET` | empty | `""` | 1 | YES | 0 | CLOSED (unbound) | Not observed | **PASS** |
| `NEXTAUTH_SECRET` | nonempty | `INTA_GUARD_SENTINEL` | 1 | YES | 0 | CLOSED (unbound) | Not observed | **PASS** |
| `NEXTAUTH_SECRET` | empty | `""` | 1 | YES | 0 | CLOSED (unbound) | Not observed | **PASS** |
| `CLERK_SECRET_KEY` | nonempty | `INTA_GUARD_SENTINEL` | 1 | YES | 0 | CLOSED (unbound) | Not observed | **PASS** |
| `CLERK_SECRET_KEY` | empty | `""` | 1 | YES | 0 | CLOSED (unbound) | Not observed | **PASS** |
| `SESSION_SECRET` | nonempty | `INTA_GUARD_SENTINEL` | 1 | YES | 0 | CLOSED (unbound) | Not observed | **PASS** |
| `SESSION_SECRET` | empty | `""` | 1 | YES | 0 | CLOSED (unbound) | Not observed | **PASS** |
| `COOKIE_SECRET` | nonempty | `INTA_GUARD_SENTINEL` | 1 | YES | 0 | CLOSED (unbound) | Not observed | **PASS** |
| `COOKIE_SECRET` | empty | `""` | 1 | YES | 0 | CLOSED (unbound) | Not observed | **PASS** |
| `DATABASE_URL` | nonempty | `INTA_GUARD_SENTINEL` | 1 | YES | 0 | CLOSED (unbound) | Not observed | **PASS** |
| `DATABASE_URL` | empty | `""` | 1 | YES | 0 | CLOSED (unbound) | Not observed | **PASS** |
| `JWT_SECRET` | nonempty | `INTA_GUARD_SENTINEL` | 1 | YES | 0 | CLOSED (unbound) | Not observed | **PASS** |
| `JWT_SECRET` | empty | `""` | 1 | YES | 0 | CLOSED (unbound) | Not observed | **PASS** |

### 3.3 Technical Characterization: Next.js 16.4.2 CLI Port Binding Behavior
Detailed inspection of Next.js 16.4.2 runtime source (`node_modules/next/dist/server/lib/start-server.js` line 430) reveals that `next dev` calls `server.listen(port, hostname)` concurrently with loading `next.config.ts`. When `validateHarnessStartup(process.env)` throws in `next.config.ts`, the catch block at line 427 invokes `process.exit(1)`, immediately terminating the process and tearing down the socket.
- In all 22 cases, the process exited with numeric code 1 within ~200–400ms.
- Port 18085 remained completely closed and unbound after process exit.
- Synthetic HTTP observer at `127.0.0.1:18086` registered **0** calls across all 22 subchecks.
- Both nonempty sentinels and empty strings triggered the refusal, proving the source claim that existence of the key (including empty value) refuses execution.

---

## 4. Part B: INT-ISO-02 / INT-ENV-07 Product Module Exclusion

### 4.1 Execution Model
- **Product Snapshot**: `/tmp/mc002-inta-fe-validation-20261026/product-snapshot` (pure tracked snapshot of `3e5a642`, 323 files, with private cloned `node_modules` via APFS copy-on-write `cp -cR`).
- **Dependencies**: Verified already-installed pinned dependencies; `COREPACK_ENABLE_NETWORK=0` enforced to prevent any remote package downloads.
- **Environment**: Explicit clean synthetic environment (`NODE_ENV=production`, `API_MODE=demo`).

### 4.2 Test Collection Analysis (`pnpm exec vitest list --filesOnly --json`)
- **Exit Code**: 0 (completed in 382ms).
- **Collected Test Files**: Exactly 18 test files collected:
  - `src/components/atoms/button.test.tsx`
  - `src/components/organisms/data-table.test.tsx`
  - `src/components/molecules/confirmation-dialog.test.tsx`
  - `src/components/molecules/dialog.test.tsx`
  - `src/components/molecules/form-field.test.tsx`
  - `src/components/molecules/pagination.test.tsx`
  - `src/components/molecules/search-input.test.tsx`
  - `src/lib/auth.test.ts`
  - `src/lib/env.test.ts`
  - `src/features/tasks/actions.test.ts`
  - `src/features/tasks/schemas.test.ts`
  - `src/lib/api/backend.test.ts`
  - `src/lib/api/http-client.test.ts`
  - `src/features/tasks/services/demo-task-repository.test.ts`
  - `src/features/tasks/services/rest-task-repository.test.ts`
  - `src/features/tasks/components/task-filters.test.tsx`
  - `src/features/tasks/components/task-form-dialog.test.tsx`
  - `src/features/tasks/components/task-form.test.tsx`
- **Harness Test File Pollution**: **0** harness test files collected. All 18 files reside strictly within `product-snapshot/src/`.

### 4.3 Production Build Analysis (`pnpm build`)
- **Bundler**: Next.js 16.4.2 (Turbopack bundler per product `package.json`).
- **Exit Code**: 0 (compilation 2.2s, TypeScript validation 2.0s, page generation 245ms).
- **Emitted Routes**:
  - `/_global-error`
  - `/_not-found`
  - `/dashboard`
  - `/favicon.ico`
  - `/tasks`
- **Harness Route Detection**: **0** harness routes detected. `/harness/case` is completely absent from `routes-manifest.json`, `app-path-routes-manifest.json`, and `prerender-manifest.json`.
- **Node File Trace (NFT) Analysis**: All 8 `.nft.json` trace files inspected. Exactly **0** trace entries reference `mc002-inta-harness`, `tools/inta-harness`, or harness source modules.
- **Emitted Bundle Inventory**: 31 emitted static JS chunks inventoried with SHA-256 hashes. Exhaustive string scanning across all emitted files for prohibited tokens (`/harness/case`, `@harness/mc002-inta-harness`, `mc002-inta-harness`, `app/harness/case`, `MC_INTA_ENABLE`) yielded **0** hits.

---

## 5. Artifact and Evidence Verification

### 5.1 Byte-for-Byte Raw vs Export Matching
Raw evidence assembled under `/tmp/mc002-inta-evidence/frontend/validation-20261026/` was copied to governance export path `docs/testing/inta-returns/frontend/validation-20261026/`.
Verification command `diff -r "$RAW_DIR" "$EXPORT_DIR"` exited with code 0 (byte-for-byte identical).

### 5.2 Payload Manifest (`manifest.json`)
The export manifest contains 18 payload files totaling 64,321 bytes (excluding `manifest.json` itself):
1. `app-path-routes-manifest.json` (340 bytes, SHA-256: `63b8417c880816cf63110298a8767e7215273b57aa4c45da3cffdf1c805a5a1f`)
2. `app-paths-manifest.json` (172 bytes, SHA-256: `a937a00ff0eeb6100572e90f6e612ebbf96b27076ea286c05ef1e031eb5c179c`)
3. `build-manifest.json` (1,784 bytes, SHA-256: `0121a57e335272a5ba826e7bb4113e33c7f92025170efee7f88421b6d19488a0`)
4. `credential-pattern-scan.json` (697 bytes, SHA-256: `d9426f49463c2cbccf8ea55562d98c25dbcb248be4a1f043e0618ff9a7c366e8`)
5. `emitted-assets-inventory.json` (4,524 bytes, SHA-256: `f569f14371dd380299f1fa443f80ea19e078ea4e4fa441864506c10b7713f02e`)
6. `guard-startup-subchecks.json` (10,511 bytes, SHA-256: `f47ae5b41097bb3206be6ec0b2b8e3905cb36779427e16ce637cfd02cb002b88`)
7. `nft-traces-summary.json` (1,157 bytes, SHA-256: `d9aa5231c5040a43aa3729e2f694e82df4328b073010b91f6187ce6ec86be1aa`)
8. `pnpm-build.stderr.log` (13 bytes, SHA-256: `955d564cf909d78d22dfb2b2b1fbab776f8742562d64f0b784b1666ff7c9b0e1`)
9. `pnpm-build.stdout.log` (822 bytes, SHA-256: `ebcc247f6a73c4f2bb7f55f2b876fc6d8333fb22f77174db2bbbe85935c1ba38`)
10. `prerender-manifest.json` (1,343 bytes, SHA-256: `57962c45ee7ca0d8fb8dd4b6113b28b789e24ff762143438260c609c18e47c1b`)
11. `product-exclusion-report.json` (6,255 bytes, SHA-256: `f997cb65e903a4b9148d888cf3be27b233939eb9fcf785bc0b2c1f93f932f9c8`)
12. `resource-and-process-disposition.json` (1,496 bytes, SHA-256: `b0010c7e29cf474fe7b469446dbe6eebfc22c06155554f67d363717df3ee0c05`)
13. `routes-manifest.json` (2,929 bytes, SHA-256: `58448b111516fecf54ec82243d6796c0032b498e9803bba5b8ec5a7a7261947b`)
14. `runner-scripts/guard-validator.sh` (8,898 bytes, SHA-256: `4ae0367ea8a462846cb4bfab481ff2484fc6ea9399dfebaa6e8a49c25f483d98`)
15. `runner-scripts/product-exclusion-validator.sh` (9,531 bytes, SHA-256: `c4a457a419fc79b29dd62faad2257bb3a52f9b87c7fc73871ce38f6534e62678`)
16. `runner-scripts/selfcheck.sh` (3,522 bytes, SHA-256: `2b8ea37cf215b24476a6cf389658ec35fe4d6eb2aeb513813ff94db100bf2748`)
17. `vitest-list.stderr.log` (0 bytes, SHA-256: `e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855`)
18. `vitest-list.stdout.json` (2,325 bytes, SHA-256: `3b3eb7ec5eb7c0a66d03f0b2f7411fb264f3d2f95fb6168efd3886d267dd38e7`)

### 5.3 Privacy and Credential Scanning
Automated scanning of all 18 payload files against credential patterns (private keys, bearer tokens, connection strings, sensitive assignments) found **0** matches. Key names and synthetic test sentinel `INTA_GUARD_SENTINEL` are verified non-sensitive test constants.

---

## 6. Completed, Skipped, and Remaining Risks

### Completed
- [x] Preflight checks: clean git status on product `3e5a642` and harness `48cc03e`, 59 ledger file hashes match byte-for-byte, Go 98134 and Next 88444/88453 verified absent, ports 18085/18086 verified unbound.
- [x] INT-ENV-05: 22 startup subchecks executed (11 forbidden keys × 2 variants), all 22 PASS with finite nonzero exit 1, key-name refusal message, 0 observer HTTP calls, and port 18085 closed after exit.
- [x] INT-ISO-02 / INT-ENV-07: Vitest list executed (18 product tests collected, 0 harness files); Next 16 Turbopack build executed (exit 0, 5 product routes, 0 harness routes, 8 NFT traces clean, 0 harness tokens across 31 emitted assets).
- [x] Privacy scan: 0 credential pattern hits across all payload files.
- [x] Process and resource hygiene: 0 lingering sandbox processes, Codex-owned PostgreSQL container untouched and healthy.
- [x] Evidence assembly: raw evidence and export directory match byte-for-byte with complete manifest.

### Skipped (Per Scoped Authorization)
- Product test execution / E2E suites / Storybook build.
- Hosted CI execution.
- Repeat-read dynamic cache network probe (pending separate assignment).
- Actual-secret scan of backend configuration files (Codex-owned).
- Modification of canonical 51-row acceptance ledger or promotion to DONE.

### Remaining Risks & Limitations
- **Historical Next Termination**: Historical exit of Next 88444/88453 remains `TERMINATION_NOT_OBSERVED` per Codex disposition. This fresh isolated validation does not alter or repair historical teardown evidence.
- **Next.js CLI Transient Port Binding**: Next.js 16.4.2 CLI binds port 18085 briefly during process initialization before evaluating `next.config.ts`. Although the process immediately exits with code 1 and releases the port with 0 requests served, this framework bootstrap behavior is explicitly documented for OpenCode review.
- **Retained Container**: Container `mc002-inta-pg-intamvnmoems3pd` remains running and healthy; its lifecycle and final teardown remain Codex responsibilities.

---

## 7. Submission and Next Action

**Proposed Status**: `IN_REVIEW / FE_VALIDATION_RETURNED`  
**Next Action**: Local Codex intakes returned evidence; OpenCode independently reviews new evidence against INT-ENV-05 and INT-ISO-02 / INT-ENV-07. No git commit, push, or provider settings change performed.
