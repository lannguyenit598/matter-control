# MC-OPENCODE-WAVE2-CODEX-CANDIDATE-REVIEW-20261101 — Independent Review Return

Date: 2026-11-01. Reviewer: actual OpenCode / non-author (independent QA). Model: Gemini 3.8 Flash (High) via Antigravity harness. Workspace: `/Users/nguyenvanlan/Documents/code/pet-projects/matter-control`, branch `codex/unified-project-flow`.

Status: **INDEPENDENT_REVIEW_COMPLETE_WITH_BLOCKERS**.
G2, G3, G4, G5, G6 are **CLOSED_INDEPENDENTLY_VERIFIED**.
G1 and G7 are **SOURCE_VERIFIED / BROWSER_SMOKE_BLOCKED**.
No automatic CLOSED_VERIFIED for Wave 2 as a whole, no MC-002 DONE, and no release/deploy claim. Returned to Local Codex for intake.

---

## 1. Candidate Source & Commit Identity

- **Base commit declared:** `64b9e0315e210953d7a7eaeacc0643b269a14ad9`
- **Current repository HEAD:** `978d8fc694a47e9beee528076bcf1af9473997e3`
- **Commit origin & patch verification:**
  - In the handoff, commit was reported rejected by automatic approval review. Prior to this independent review session, operator Lan Nguyen committed the staged candidate as commit `978d8fc694a47e9beee528076bcf1af9473997e3` (message: *"Complete Wave 2 preflight, filing proof mapping and action announcements"*).
  - OpenCode verified the commit tree diff against base `64b9e0315e210953d7a7eaeacc0643b269a14ad9`:
    `git diff 64b9e0315e210953d7a7eaeacc0643b269a14ad9 978d8fc694a47e9beee528076bcf1af9473997e3 | shasum -a 256`
    yields sha256 `60f018eb3dcf7cc25bf2e6921ef319f9d69fec7c85e9a5ee6ed62433f8a6fd01`.
  - This matches byte-for-byte the author's declared `docs/testing/mc-p1-fix-wave-2-20261101-r1/codex-takeover/candidate-source.patch` (38,271 bytes, sha256 `60f018eb3dcf7cc25bf2e6921ef319f9d69fec7c85e9a5ee6ed62433f8a6fd01`).

### Tested Source Sets

Two distinct source sets were evaluated:
1. **Source Set A (Combined primary working tree):** Pinned HEAD `978d8fc` plus the pre-existing authorized unstaged Pane/list/UI edits (`layout.tsx`, `globals.css`, `bottom-nav.*`, `command-palette.*`, `search-input.*`, `task-choice.tsx`, `evidence-basis.tsx`, `review-filters.tsx`, etc.).
2. **Source Set B (HEAD / 16-path staged candidate):** HEAD `978d8fc` itself (which represents base `64b9e03` + `candidate-source.patch`). In this set, `apps/frontend/src/app/(app)/layout.tsx` is exactly 3,603 bytes (sha256 `a5086b5382e118116b84551119c7316e35b757eed0092340b4d5f6b420168c44`), containing strictly the `ActionAnnouncer` wrapper and import, without any unstaged navigation/rim additions.

---

## 2. Per-Unit Independent Verification (G1 through G7)

### G1: OV-F1-01 — D-9 SIGNATURE criterion contracts and UI support
- **Source Inspection:**
  - `apps/frontend/src/features/proof/schemas.ts`: `criterionPurposeSchema` includes `"SIGNATURE"`, and `checklistSchema` includes `signature: proofPartSchema`.
  - `apps/frontend/src/features/proof/components/proof-panel.tsx`: Renders the Signature axis rows and offers `"SIGNATURE"` in the purpose selection dropdown (`What does it prove?`).
- **Schema & UI Red/Green Reproduction:**
  - Pre-G1 code: Fails with `ZodError: Invalid option: expected one of "PACKAGE"|"OUTCOME" at path criteria.1.purpose`.
  - Corrected code: `pnpm --dir apps/frontend test src/features/proof/components/d9-signature-ui.test.tsx` -> **3/3 PASS** (110ms).
  - Existing proof panel suite: `proof-ui.test.tsx` -> **15/15 PASS**.
- **Backend HTTP Flow:**
  - `apps/backend/internal/adapter/outbound/repotest/mattercontrol/contract_w4.go` (lines 184–238) and `internal/adapter/inbound/productapi/filing_server_test.go` (lines 184–231) verify that a proof-required filing requires both PACKAGE and SIGNATURE criteria to be accepted by an independent verifier before `SUBMISSION` is permitted, while the `OUTCOME` axis stays pending.
- **Browser Gate:**
  - Actual Filing submission through the UI is **BLOCKED_NOT_RUN**. The official browser is disabled in Work settings. Unit/DOM simulations do not substitute for an authenticated UI smoke test.
- **Verdict:** **SOURCE_PASS_BROWSER_BLOCKED** (Finding disposition: `FIXED_PENDING_VERIFY`).

---

### G2: OV-R8-01 — Release preflight probeFactory readers & content scan
- **Source Inspection:**
  - `apps/frontend/scripts/release-preflight.mjs`:
    - Tracked-files reader (line 112): `probeFactory((rel) => readFile(join(root, rel), 'utf8').catch(() => null))`
    - Artifact directories reader (line 132): `probeFactory((rel) => readFile(join(dir, rel), 'utf8').catch(() => null))`
    - Both callbacks now return the raw file content string, allowing `probeFactory` to derive `name`/`key` internally.
- **Unit & Integration Tests:**
  - `node apps/frontend/scripts/release-preflight.test.mjs` -> **5/5 PASS** (7.5ms).
  - `node apps/frontend/scripts/release-preflight-integration.test.mjs` -> **4/4 PASS** (340ms).
- **Independent Synthetic Plant Verification:**
  - OpenCode ran isolated CLI synthetic plants for both artifact-only and git-tracked modes:
    1. *Artifact plant:* Normally-named files (`normal-key.txt` with PEM block, `sentinel.txt` with `MC-RELEASE-SENTINEL`, and `.env.local` with `API_KEY=PLANTED_SECRET_VALUE_DO_NOT_ECHO_98765`).
       - Result: Exit code 1, exactly 3 findings reported. No `TypeError`. The secret key name `API_KEY` was reported; the secret value was **0 times echoed**.
    2. *Git-tracked plant:* Fresh temporary Git repository with tracked `tracked-pem.dat`, `tracked-sentinel.txt`, and `.env.staging`.
       - Result: Exit code 1, exactly 3 findings reported. No `TypeError`. The secret value was **0 times echoed**.
  - Full repository scan: `node apps/frontend/scripts/release-preflight.mjs` -> `release preflight: clean (tracked files)` (exit 0).
- **Verdict:** **CLOSED_INDEPENDENTLY_VERIFIED** (Finding disposition: `FIXED_VERIFIED`).

---

### G3: OV-F1-02 — SIGNATURE purpose survival on event replay
- **Source Inspection:**
  - `apps/backend/internal/core/service/brief_proof.go` (lines 218–226):
    ```go
    func purposeOf(raw string) matter.CriterionPurpose {
        switch matter.CriterionPurpose(raw) {
        case matter.PurposeOutcome:
            return matter.PurposeOutcome
        case matter.PurposeSignature:
            return matter.PurposeSignature
        }
        return matter.PurposePackage
    }
    ```
    `case matter.PurposeSignature` explicitly returns `PurposeSignature`. Legacy events with empty string or older purposes fall back to `PurposePackage`.
- **Regression Execution:**
  - `cd apps/backend && go test -v ./internal/core/service -run 'TestReplayBrief_.*'` -> **12/12 PASS** (0.424s).
  - `TestReplayBrief_PurposeOfKeepsSignature` explicitly exercises `""`, `"PACKAGE"`, `"SIGNATURE"`, and `"OUTCOME"`. Pre-fix behavior (mapping `SIGNATURE` to `PACKAGE` and inflating package counts) is prevented.
- **Verdict:** **CLOSED_INDEPENDENTLY_VERIFIED** (Finding disposition: `FIXED_VERIFIED`).

---

### G4: OV-F1-03 — Migration 0011 Up/Down data-safe downgrade
- **Source Inspection:**
  - `apps/backend/internal/adapter/outbound/postgres/migrations_mattercontrol/0011_criterion_purpose_signature.sql`:
    - Up: widens `CHECK (purpose IN ('PACKAGE', 'SIGNATURE', 'OUTCOME'))`.
    - Down: `UPDATE criteria SET purpose = 'PACKAGE' WHERE purpose = 'SIGNATURE';` before restoring `CHECK (purpose IN ('PACKAGE', 'OUTCOME'))`.
- **Independent Execution on Disposable Owned Fixture:**
  - Spun up independent disposable PostgreSQL 18.6-alpine container (`mc-opencode-g4-fixture`) on `127.0.0.1:55449`.
  - Executed: `MC_TEST_DATABASE_URL="postgres://postgres:opencode_synthetic_pass@127.0.0.1:55449/postgres?sslmode=disable" go test -v -count=1 ./internal/adapter/outbound/postgres -run TestCriterionPurposeMigration0011DownIsDataSafe`
  - Output: `=== RUN TestCriterionPurposeMigration0011DownIsDataSafe` -> `--- PASS: (0.23s)`.
  - Disposable fixture was cleanly stopped and removed immediately after verification.
  - No existing manual/QA container (`mc-codex-manual-20261101` on 55441 or `mc-p0-claude-pg` on 55440) was used or altered.
- **Documented Downgrade Validation:**
  - Verified that Down mapping `SIGNATURE` to `PACKAGE` preserves rows, claims, and relations while preventing PostgreSQL check constraint violation `23514`. This is validated as a documented conservative lossy downgrade, not a lossless reversal of the original `SIGNATURE` purpose label.
- **Verdict:** **CLOSED_INDEPENDENTLY_VERIFIED** (Finding disposition: `FIXED_VERIFIED`).

---

### G5: OV-R12-01 — Scheduled-dump retention prune loop
- **Source Inspection:**
  - `ops/backup/scheduled-dump.sh` (lines 52–57):
    ```bash
    PRUNED=0
    while IFS= read -r old; do
      [ -n "$old" ] || continue
      rm -f -- "$old" "$old.sha256"
      PRUNED=$((PRUNED + 1))
    done < <(ls -1t "$MC_BACKUP_DIR"/mcapi-*.dump 2>/dev/null | tail -n +$((RETAIN + 1)))
    ```
    Replaced the broken quoted command substitution `for old in "$(ls ...)"` with process substitution line-by-line reading.
- **Probe Execution:**
  - Executed `bash docs/testing/mc-p1-fix-wave-2-20261101-r1/commands/g5-dump-prune-probe.sh`:
    - Case 1 (4 old + 1 new, `RETAIN=2`): exactly 2 dumps and 2 sidecars retained; reported `pruned:3` (PASS).
    - Case 2 (empty directory, `RETAIN=2`): exactly 1 dump retained; reported `pruned:0` (PASS).
    - Output: `G5 PROBE: ALL PASS` (exit 0).
- **Caveat:**
  - This probe uses fake `pg_dump` and `pg_restore` wrappers. Script retention counting and deletion mechanics are verified, but real cloud job execution and provider storage reliability are not established by this local fake-tool test.
- **Verdict:** **CLOSED_INDEPENDENTLY_VERIFIED** (Finding disposition: `FIXED_VERIFIED`).

---

### G6: OV-F1-04 — Combined package & signature refusal and localized copy
- **Source Inspection:**
  - `apps/backend/internal/core/domain/matter/filing.go`: `StageSubmission` and `StageResponse` both evaluate package and signature readiness under D-9 rules. When both package criteria are unmet and signature criteria are undeclared, they return a unified refusal:
    `package criteria are not satisfied: ...; signature criteria are not declared: add a SIGNATURE-purpose criterion for the filing's signatures`.
- **Test Execution:**
  - Backend domain suite: `cd apps/backend && go test -v ./internal/core/domain/matter` -> **33/33 PASS** (0.102s), including `TestSubmissionRefusalNamesPackageAndMissingSignatureTogether`, `TestSubmissionStillRefusedByAnUnsatisfiedPackageCriterion`, and `TestSignatureCriteriaWaivedByTheOwnerDecision`.
  - Frontend guard copy: `pnpm --dir apps/frontend test src/features/filings/components/filing-guard-copy.test.tsx` -> **4/4 PASS** (12ms), verifying OpenDesign localized copy without leaking technical error codes.
- **Verdict:** **CLOSED_INDEPENDENTLY_VERIFIED** (Finding disposition: `FIXED_VERIFIED`).

---

### G7: F8/P-09 — Persistent shell action announcer & caller integrations
- **Source Inspection:**
  - `apps/frontend/src/components/organisms/action-announcer.tsx`:
    - Mounts a persistent polite/atomic region: `aria-live="polite"`, `aria-atomic="true"`, `role="status"`, `className="sr-only"`.
    - Starts empty (`current === null`).
    - Updates DOM on successive identical messages via incremented `sequence` key on wrapper span (`<span key={current.sequence}>`).
    - Uses fixed EN/VI copy; `UNKNOWN` is never called Saved. CAS-only `outcome-unknown` explicitly warns: *"Outcome not confirmed. Do not resend. Reload the current state."*
    - No raw server error details or record data relayed to the global region.
    - Preserves local live feedback outside shell (`useShellAnnouncements()` is false -> `live={true}`); suppresses duplicate dialog announcements inside shell (`doneAnnounced`, `live={!shellAnnouncements}`).
  - Wired into: `apps/frontend/src/app/(app)/layout.tsx`, `intent-form.tsx`, `confirm-action-button.tsx`, `inline-edit.tsx`, `form-dialog.tsx`, `alert.tsx`.
- **Vitest Suites:**
  - `action-announcer.test.tsx` -> **6/6 PASS** (131ms).
  - `form-dialog.test.tsx` -> **5/5 PASS** (117ms).
  - `intent-attempt.test.tsx` -> **8/8 PASS** (185ms).
  - `recovery.test.tsx` -> **8/8 PASS** (214ms).
  - `page.test.tsx` (work item page) -> **8/8 PASS** (185ms).
- **Assistive Technology Gate:**
  - Actual screen-reader audio smoke is **BLOCKED_NOT_RUN**. The official browser and audio/AT inspection are disabled in Work settings. DOM assertions and focus retention are verified; spoken synthesis in diverse screen readers remains pending external browser smoke.
- **Verdict:** **SOURCE_PASS_SR_BLOCKED** (Finding disposition: `FIXED_PENDING_VERIFY`).

---

## 3. Full Component Gates Run by OpenCode

| Gate | Target / Command | Result |
|---|---|---|
| **Primary Frontend Suite** | `pnpm --dir apps/frontend test` | **PASS**: 858 passed, 12 skipped (106 test files, 13.73s). Skipped tests are durable PostgreSQL paths requiring a live DB. |
| **Agent Config Check** | `pnpm --dir apps/frontend run agents:check` | **PASS**: 17 skills, 3 scoped rules verified. |
| **Source Formatting** | `prettier --check src/**/*.{ts,tsx} scripts/**/*.{js,mjs}` | **CLEAN**: All matched product files use Prettier style. |
| **Backend Generated Queries** | `cd apps/backend && make sqlc-check` | **PASS**: Clean diff, generated queries match schema. |
| **Backend Code Formatting** | `cd apps/backend && gofmt -l .` | **CLEAN**: 0 unformatted files. |
| **Backend Module Tidy** | `cd apps/backend && go mod tidy -diff` | **CLEAN**: No module differences. |
| **Backend Linter** | `cd apps/backend && golangci-lint run ./...` | **CLEAN**: 0 issues reported. |
| **Preflight Git-Tracked Scan** | `node apps/frontend/scripts/release-preflight.mjs` | **CLEAN**: 0 forbidden findings on all tracked files. |

---

## 4. Unresolved Gates & Remaining Risks

1. **Browser Smoke Gates (G1 Filing submission & G7 screen-reader audio):**
   - Remained **BLOCKED_NOT_RUN** because the official browser is disabled in Work settings. No headless browser or bypass was used per policy. When the approved browser is enabled, these two items require separate verified runs.
2. **Commit Authority Gate:**
   - History mutation was not executed by an agent in this session. The commit `978d8fc` was created by the operator Lan Nguyen prior to this review. Staged patch continuity is verified.
3. **Infrastructure / Deployment Boundaries:**
   - Existing manual runtimes (`:3000`, `:8081`), Zitadel IdP (`:8080`), and retained PostgreSQL containers were untouched. G4 was validated exclusively on an ephemeral fixture on port 55449.
   - G5 fake-tool probe proves script logic, not cloud backup job SLAs or provider reliability.

---

## 5. Disposition & Next Actions

- Updated independent findings register:
  - **OV-R8-01 (G2):** `FIXED_VERIFIED` -> `CLOSED_INDEPENDENTLY_VERIFIED`
  - **OV-F1-02 (G3):** `FIXED_VERIFIED` -> `CLOSED_INDEPENDENTLY_VERIFIED`
  - **OV-F1-03 (G4):** `FIXED_VERIFIED` -> `CLOSED_INDEPENDENTLY_VERIFIED`
  - **OV-R12-01 (G5):** `FIXED_VERIFIED` -> `CLOSED_INDEPENDENTLY_VERIFIED`
  - **OV-F1-04 (G6):** `FIXED_VERIFIED` -> `CLOSED_INDEPENDENTLY_VERIFIED`
  - **OV-F1-01 (G1):** `FIXED_PENDING_VERIFY` (Source verified; browser smoke blocked)
  - **F8 / P-09 (G7):** `FIXED_PENDING_VERIFY` (Source verified; screen-reader smoke blocked)
- The review package is ready for Local Codex intake.
