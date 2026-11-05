# INT-A — OpenCode closeout review R1 (actual Antigravity R1 present)

**Task**: MC-002-INTA-QA-CLOSEOUT-R1 (MC-002-INTA QA closeout, R1 addendum window)
**Reviewer**: Actual OpenCode, independent nonauthor. Ran only read/hash/static inspection; **no runtime was executed, no source/config/dependency was edited, no commit**. New execution result: `NOT_RUN`. No provider/model/account change initiated. Commands run under the workstation rtk convention (a few trivial read-only helpers invoked directly).
**Workspace/branch/HEAD**: `/Users/nguyenvanlan/Documents/code/pet-projects/matter-control`, `codex/unified-project-flow`, HEAD verified `a62d838791ba188838c4ff00b7b6e265ac775056` (unchanged during review).
**Prompts followed**: `docs/implementation/handoffs/MC-002-INTA-OPENCODE-CLOSEOUT-REVIEW-PROMPT.md` + `docs/implementation/handoffs/MC-002-INTA-OPENCODE-R1-ADDENDUM-PROMPT.md`.
**Outputs**: this file (verified absent before creation) + new evidence subdirectory `docs/testing/inta-returns/qa/closeout-review-r1/r1-addendum/` ({inputs-pinned.json, checks-log.json, required36-coverage.json}). The `docs/testing/inta-returns/qa/closeout-review-r1/` directory was already occupied by an earlier incomplete OpenCode attempt (`review-inputs-addendum.json`, pinned 2026-10-26T07:45:00Z); it is preserved untouched and **not treated as my output**. Its discrepancies are recorded below, not adopted.
**Status produced**: `IN_REVIEW → CHANGES_REQUIRED (corrected-source rework before any new runtime cue)` — evidence corrections ACCEPTED; runner/evaluator/launcher SOURCES require narrow fixes. No formal PASS, no gate promotion, no runtime release.

---

## 1. Input manifest and pins (all read-only)

Codex addendum pins (`docs/testing/inta-closeout-continuation/r1-review-addendum.json`, recomputed `e972eee9a3017b0dfd8ebc66c5d136702a861d382a0b5d5ae3018491a435c9b6`) — **all 7 listed inputs verified byte-level**:

| Input | SHA-256 (live) | Bytes |
|---|---|---|
| docs/reviews/inta-fe-validation-r1-antigravity-return.md | `27a2a7e3a2de9f332c0562c95a3301ab67452d09925782f3813923da0755a555` | 14075 |
| docs/reviews/inta-fe-validation-r1-intake.md | `b3a677cda465a6631faff16b79f39d2f69f9217faaf93b70dac54d4060be238b` | 7780 |
| docs/testing/inta-returns/frontend/validation-r1-20261026/manifest.json | `677cd24f61bae83ace965aa24c7d4783ec53d38b67a8d0af8309b592f043a2bb` | 14502 |
| docs/testing/inta-fe-validation-r1-intake/checks.json | `fed373b858ffbab6de4c384655731a957e284a253fedac87fca8a26f87be5545` | 27157 |
| docs/testing/inta-fe-validation-r1-intake/execution.json | `7e8ca27bc9e1ec1672fe2afc75e1d8446ca508d857923e8161b285c8cc8fcc89` | 1090 |
| docs/testing/inta-fe-validation-r1-intake/additional-failclosed-probes.json | `82a23090ff60720a34c8a998e0a7f4e81e899d20c3120c998f03642479f439f5` | 2702 |
| docs/testing/inta-fe-validation-r1-intake/runner-language-probes.json | `55989161185d7c736130b7d9217570f44356c1f67f6a30eaadde115e657e6d72` | 776 |

Other verified pins: original 22-input manifest (`review-inputs.json`) **file untouched; 21/22 members still byte-match; 1/22 (`MC-002-INTA-QA-CLOSEOUT-R1.md`) changed under the documented, verified supersession pin** (`r1-current-context-supersession.json`: previous `a58d400f…` = original pin, current `20f0ae7e…` = live bytes, 3284 B) — authorized mutable task-context update, not silent drift. Original product packet `validation-20261026/manifest.json` `ab0aebf10e01…` verified; its 18 payloads re-hashed: **0 mismatch, 64321 B as claimed**. R1 packet manifest: **75 payloads, sum 98 873 B, 0 missing / 0 size / 0 sha mismatch** (matches owner claim 75 payloads/98 873 bytes). Runner sources recomputed: `guard-validator-r1.sh` `104abf3fd231…`, `guard_evaluator.py` `d018f68f969e…`, `selfcheck-r1.py` `f94321428029…`; scenario JSONs `be070bfc…`, `0a206d28…`, `0c57caf6…`; `guard-startup-subchecks-r1.json` `97f1eefc…`; errata `9cde7f93…`; credential scan R1 `e36b9c01772c…`.

**Prior-attempt discrepancies preserved (not inherited):** (a) prior OpenCode pin file recorded R1 return doc as `63d12ea9…` (07:45Z) vs live `27a2a7e3…` (=Codex-addendum pin, mtime 06:29:48Z) — unresolved provenance history; (b) its `credential-pattern-scan-r1.json` pin is malformed (62 hex) vs live 64-hex `e36b9c0177…`; (c) it cited a "pin-log" that does not exist in that directory. Advice: treat the prior file as a reservation record only.

Retained-variant identity: 22×3 files in R1 packet; `API_TOKEN_nonempty` stderr `12853f7e…` / stdout `95c5943c…` byte-equal in owner subcheck pins, intake packet, R1 export **and** in the original `/tmp/mc002-inta-fe-validation-20261026/output/guard-variants/API_TOKEN_nonempty/*` (originals preserved). No `observer.json` in any variant dir (consistent with "all 22 missing").

## 2. R1-C01..C04 — independent determinations (static read of pinned bytes; all CONFIRMED)

**R1-C01 `guard-validator-r1.sh` (P1) — CONFIRMED.**
- L215/218: metadata python does `import json` but calls `os.getpid()` → guarantees `NameError: name 'os' is not defined` (matches intake probe reproduction).
- L309/313–315: `timed_out=(false == 'true')` style interpolation puts the bare shell tokens `false`/`true` inside Python — `false` is not a Python name → `NameError: name 'false' is not defined` before the evaluator ever computes a verdict. Because `run_variant` is called inside `if !` (L356), `set -e` is suspended in its body, so the failing metadata/evaluator python steps do NOT abort; the script then reads a verdict from a file that was never written (`FileNotFoundError`) and returns 2 — i.e. **as written the corrected runner cannot execute a single variant as intended**.
- L167–173/244–248/281–285: `if ! lsof_out=$(lsof ...); then local lsof_exit=$?` observes the **negated** status (0 even when lsof exits 1), so every normal no-match is misclassified as `probe_error` with a wrong detail ("exit 0") — corroborated by the recorded isolated probe (`observed_status` printed `0` for a real exit 1). Also `pre_probe_err` is computed but **never fed** into the evaluator call, so a pre-probe error is silently ignored — the fail-closed intent is inverted on both sides.

**R1-C02 `guard_evaluator.py` (P1) — CONFIRMED (3 unsafe-PASS paths in exact code).**
- L67/74: only `listener_during is True` / `listener_after is True` are checked; `None` (unknown observation) bypasses both and the payload can still reach `PASS` (`VALID_COMPLETE_INPUT`) — no requirement of positive known-`False` evidence.
- L139: `isinstance(obs["requestCount"], int)` — `bool` is an int subclass, so `requestCount=false` passes; L149 `request_count != 0` compares `False == 0` → equal → no `POSITIVE_COUNTER`.
- L147: `result["observerCleanShutdown"] = bool(obs_data.get("cleanShutdown", False))` — nonempty string `"false"` is truthy → treated as clean shutdown.
These are exactly the 3 recorded in-process probe vectors (`additional-failclosed-probes.json`, expected-reject → observed PASS×3; statically reproduced by reading the code), and `selfcheck-r1.py` covers none of them (its 9 cases are pure-evaluator kwargs only). Minor additional edge: L133 `"error" in obs_data and obs_data["error"]` accepts empty-string error as no-error.

**R1-C03 `guard-validator-r1.sh` observer/ownership (P2) — CONFIRMED.**
- L81/L103: direct `open(path, 'w')` writes; **no temp+`os.replace`/fsync** — the return's "durable atomic flush" claim is not supported by source; write errors swallowed (L87–88) and exit 0.
- L127: `wait "$pid"` unbounded; observer exit code discarded; no verification that the pid still corresponds to the started observer before signaling; startup/pre-probe failure paths can leak a bound observer (no cleanup on early `return 1` from `start_observer`).
- Counts are written only at shutdown/error: positive request counts are never durably sampled during the monitor loop → "immediate abort on unexpected request" remains structurally incomplete.
- L48/L153/L192: `echo '[]' > results.json` and `rm -rf` on variant/state dirs conflict with per-attempt retention; on a rerun they would truncate/delete prior attempt evidence.

**R1-C04 launcher proposal `pre-listen-launcher-proposal.md` (P2) — CONFIRMED with corrections.**
- §2.1 imports `../src/guards.js`, but live harness `48cc03e` and harness-snapshot contain **`src/guards.ts` and no `guards.js`** (verified by tree search); no launcher/`harness-dev` source exists anywhere. On an installed Node the import would fail (`ERR_MODULE_NOT_FOUND` or a TS-loader dependency) **before** any guard executes — §2.2's "guaranteed never-listen on refusal" is unproven until the load path/loader is pinned on the installed Node.
- `env: process.env` (proposal line 62) violates the execution-handoff requirement that the child use an explicit clean env allowlist with no broad env spread (that requirement is in `MC-002-INTA-FE-VALIDATION-ANTIGRAVITY-PROMPT.md` L38, whose exact launch literal `rtk proxy <private installed next executable> dev -H 127.0.0.1 -p 18085 --webpack` the proposal's §3.3 mislabels as a frozen `inta-approved-contract.md` §2 literal — the frozen contract §2 contains no such literal; it defers exact argv selection to the installed CLI evidence. R1's provenance correction is right).
- spawn lifecycle: no `'error'` handler; signal re-raise via `process.kill(process.pid, signal)`; fixed spawn args not aligned with the §3.3 proposed command; direct raw-CLI bypass remains (correctly stated — no all-22-PASS/0-socket guarantee is claimed).
- Dependency plan (FEVAL-F05, `dependency-isolation-plan.md`): PIN APPEARS ADEQUATE AS A PLAN — verified live chain `harness-snapshot/node_modules → /tmp/mc002-inta-harness/node_modules → /private/tmp/mc002-inta-fe/node_modules` (matches retained `meta.json` `resolvedNextBin`), `product-snapshot/node_modules` is a real cloned directory. Gap: its preflight checks only the top-level realpath; nested symlinks under `.pnpm`/`.bin` are not proven private; the planned `cp -cR` copy keeps absolute nested links — add a nested-symlink enumeration check before any future run.

## 3. FEVAL-F01..F05 dispositions (independent)

| Finding | Disposition by this review |
|---|---|
| F01 | Historical correction ACCEPTED: 22 retained stdouts show `Ready in 178ms` (API_TOKEN/nonempty pinned) + exact refusal in stderr pinned → pre-listen listener is a documented NEXT 16.4.2 startup characteristic, `FAIL_OBSERVED_LISTENER` stands. Pre-listen proposal default-deferred: unimplemented and P2-defective (R1-C04). Runtime remains OPEN; never-listen cannot be waived. |
| F02 | ACCEPTED: all 22 `observer.json` absent preserved (`observerFileExists:false ×22`), zero-upstream `NOT_ESTABLISHED×22`, no backfilled 0s; observer source rewritten with SIGTERM/SIGINT handlers, but persistence/cleanup/ownership gaps remain (R1-C03). Note: `listenerObservedDuringBoot:false ×21` rows mean *not established in the deviation-marred original run*, not "no listener occurred". |
| F03 | ACCEPTED with caveat: 9 required fail-closed cases reproduce as pure-evaluator PASS (Codex reproduction verified in `selfcheck.stdout.txt`); exact-refusal/missing-file rules present in code. But the evaluator holds 3 unsafe-PASS paths (R1-C02) and the wrapped runner fails marshaling (R1-C01), and the selfcheck tests generated values never — **not source-closed**. |
| F04 | ACCEPTED documentary: all 17 errata entries re-verified against the authoritative original manifest (17/17 actual_manifest_sha256 match); original packet re-verified intact; asset counts 31 total / 18 JS / 15 static/chunks JS verified from `emitted-assets-inventory.json`; actual secret-value coverage still `NOT_ESTABLISHED`. |
| F05 | ACCEPTED documentary: symlink limitation disclosed with the real 2-hop chain; main plan OK; gap noted above (nested symlinks); zero dependency operations performed in R1. |

## 4. 36 required-row coverage

Machine-readable per-row review: `docs/testing/inta-returns/qa/closeout-review-r1/r1-addendum/required36-coverage.json` (36 rows: **33 PARTIAL / 3 INSUFFICIENT_EVIDENCE / 0 SUPPORTED / 0 FAIL**; every row records basis, evidence pins, reviewer-personal-runtime = NO, gaps and smallest follow-up). Basis summary: 23 stage-executed endpoint rows = OWNER_RUNTIME_EVIDENCE (attested, not independently re-derived clause-by-clause here); ENV/ISO rows mix OWNER_RUNTIME + CODEX_OPERATIONAL; ISO-02 is ARTIFACT_ONLY (18 test paths / 8 NFT traces / 31 assets verified as sealed artifacts); PRIV/ISO-03/CONF = INSUFFICIENT (actual-secret scan absent; PG final stop & graceful Next termination unobserved; conformance review not yet run). Deferred D-01..13, D-15 and blocked D-14 retained untouched with original IDs/hyphenation. Distinct counts preserved: 23 logical endpoint cases / 27 unique IDs / 26 Go access matches + T12 intentionally unreachable; T11c X stays **OUTCOME_UNKNOWN**. Historical Next termination `NOT_OBSERVED`, Go direct-wait `NOT_OBSERVED`, owned-PG final stop not executed.

## 5. One technical recommendation

**CHANGES_REQUIRED** (scoped source rework on the R1 validation tools; not a scope decision, not a runtime cue):

1. **R1-C01 (P1)** in `guard-validator-r1.sh`: fix metadata python (`import os` …); never interpolate unquoted bash booleans into Python (pass typed JSON via argv/file); capture real lsof exit via `lsof_out=$(lsof ...) || rc=$?` pattern at pre/sample/post probes (rc==1 → no match; other nonzero → PROBE_ERROR); feed pre-probe errors into the final evaluator `probe_error` path; classify a missing/failed verdict read as fail-closed, and do not rely on set -e inside `if !` function contexts; selfchecks must exercise the runner-produced marshaling path (actual generated values), not only pure evaluator kwargs.
2. **R1-C02 (P1)** in `guard_evaluator.py` + `selfcheck-r1.py`: require positive known-`False` listener evidence (`listener_during is False`/`listener_after is False`, unknown → fail closed as e.g. `LISTENER_UNKNOWN`); `requestCount` must be `isinstance(int) and not isinstance(bool)` else `MALFORMED_COUNTER`; `cleanShutdown` must satisfy `obs.get("cleanShutdown") is True` (no `bool()` coercion); tighten empty-string `error` acceptance; add the 3 recorded vectors as regression cases in the same evaluator test suite.
3. **R1-C03 (P2)**: atomic durable observer writes (temp + fsync + `os.replace`, and/or event-durable counts) so positive counts can trigger immediate abort; bounded observer waits with captured observer exit + start-command/owner-identity validation before any signal; trap-based cleanup on all early-return paths; per-attempt suffixed dirs and append-only results (no `rm -rf`/truncation of prior attempts).
4. **R1-C04 (P2)** in the launcher proposal (text-level, frozen sources untouched): pin the supported load path/loader on the installed Node (e.g. prebuilt `.js` adapter produced at generate-time, or documented type-stripping mode) proving import-time guard execution before any spawn; replace `env: process.env` with the same bounded allowlist as the runner contract; add spawn `'error'`/signal/exit-propagation handling; correct §3.3 provenance (the cited literal actually comes from the execution handoff `MC-002-INTA-FE-VALIDATION-ANTIGRAVITY-PROMPT.md` line-38, not the frozen contract §2) and keep the launch-contract amendment as an additive proposal awaiting nonauthor conformance disposition; extend the dependency plan with a nested-symlink/realpath privacy check.

After (1)-(4) plus a nonauthor conformance disposition of the launch contract, a **bounded new runtime attempt** with the corrected runner can be considered ready; the 36-case acceptance itself still requires the separately queued final review addendum (new guard/privacy/teardown returns), and the remaining open items (actual-secret scan, Next termination, same-PG stop, module-graph/dynamic/cache conformance, INT-CONF-01) are unchanged.

## 6. What was personally checked vs owner-only; limits

**Personally checked by OpenCode (read/hash/static):** all pins above; both runner sources read fully (R1-C01/C02/C03 line-verified); selfcheck source read; scenario/probe JSONs read and cross-checked against code paths; 17 errata entries re-verified against the authoritative manifest; 18-payload and 75-payload manifests re-hashed (0 mismatches); asset counts counted; guards.ts-vs-guards.js and node_modules symlink chains verified live; contract §2 and execution-handoff literal located and compared; checkpoint/36-row matrix counted; supersession pin verified; prior-attempt discrepancies enumerated; `/tmp` originals spot-hash-verified.

**Owner/Codex-only (not executed by this reviewer):** the historical 22-variant Next runs, the 9/9 selfcheck execution (Codex reproduction only recorded; reproduced by Codex under its own authority), all stage 1–7 runtime evidence, PG/migrate/teardown operations, actual-secret scan scope, product/build/test collection. **Formal 51-row ledger, MC002/STEP03B/auth/production/Cloudflare/cost/recovery gates remain unchanged.** This review cannot release runtime itself and does not approve product/security.

**Skipped:** every execution path forbidden by the prompts (any runner/evaluator/selfcheck execution, Next/observer/process/container start, Docker/SQL/HTTP/probe, private credentials, commit/push, provider/model switches), and no hidden mandatory re-runs were created.

**Exact blockers before any new runtime cue:** R1-C01..C04 fixes above + nonauthor launch-contract conformance disposition + separately pinned final review addendum per the base closeout prompt.

**Next action:** return this file + `docs/testing/inta-returns/qa/closeout-review-r1/r1-addendum/` to the human for Codex intake; Codex assigns the narrow source correction (owner Antigravity under the current assignment, with independent review after); no broad rewrite, no product-build/7-stage rerun, no mandatory Claude author loop.

*End of report — one residual risk: the prior OpenCode attempt's provenance discrepancies remain unresolved historical records; they do not affect the verified current-byte claims of this review.*
