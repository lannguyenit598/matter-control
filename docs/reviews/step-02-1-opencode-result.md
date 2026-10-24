# MC-002-VERIFY-021 — Actual OpenCode Independent QA, Document/Evidence Review

## Verdict

**PASS_WITH_LIMITATIONS** — scoped to Step 02.1 Task G: review of the exactly supplied snapshots only. The packet is internally consistent, materially honest, and free of the overclaims I was asked to hunt for. The dangerous recipes in the verbatim Antigravity report are explicitly rejected in `frontend-audit.md` and are **not** present in either executable handoff. This verdict is document-review PASS for what has been recorded; it is not evidence that any owner build/runtime/integration PoC ran — all of those remain NOT_RUN by record, and I make no replay claim.

## Actual limits of this review

- No tools, shell, network, file access, or subagents were used. I verified only textual/numeric cross-consistency **within** the supplied snapshots. I cannot confirm repository state, base `2000d94`, that cited artifact files (`00.stdout`, `synthetic.dump`, manifests, handoff files) exist on disk, or that `docs/testing/step-02-1/*.json` files match what is embedded here.
- I did not recompute any hash, digest, md5, or exit code myself; all arithmetic below (35350 = 7·5050, sequence 101, timing sums) is hand-checking against recorded values.
- Evidence is self-reported by the executing party (Codex-authored scripts capturing its own outputs). Self-computed SHA256 is integrity inventory, not authenticity — the procedure already says this, and I confirm the caveat is present and correct.
- Original provenance of the verbatim Antigravity report (conversation `36d93b38…`, snapshot byte count 58203, "fourteen snapshots") is not independently attestable from the packet.
- No architecture, PO, cost, or Cloudflare production approval is expressed or implied.

## Restore drill — safety, exits, integrity assertions (checked, no defect found)

Cross-checking `step-02-restore-drill.py` against `restore-evidence.json` and `step-02-poc-validation.md`:

- **Isolation fails closed**: unique token-name containers with pre-existing-name refusal; `--network none`, no port bindings, no `Mounts`, tmpfs-only at `/var/lib/postgresql`, 256MB/1CPU — all asserted in code and visible in recorded `inspect` outputs (commands 04, 15, 26, 29, 30, 33). Trust auth warning is retained in logs (27/31.stderr), not hidden, and the procedure correctly confines it to these containers.
- **Exit/assertion chain consistent**: corrupt `pg_restore --list` exit 1 with archive-error stderr (cmd 13); restore in `--single-transaction --exit-on-error` exit 0 (cmd 20); CHECK block output `DO` + md5 `09dfcf31…` + `101` (cmd 21) matching source baseline (cmd 09); three negative inserts exit 3 with FK/CHECK/PK errors (cmds 22–24) and matching server logs (31.stderr); source retains both markers ("2", cmd 25); fixture sum 35350 and post-backup-marker omission all consistent.
- **Timings additive**: restore-only 0.04121s == cmd 20 elapsed; whole invocation 10.713s == 14:19:57.488→14:20:08.202; recovery-to-validated-read 1.16291s plausibly spans target create→checks.
- **Cleanup honest**: label-verified stops only, no volume/prune operations recorded, stopped-state asserted, `--time` deprecation warning preserved.
- **RPO/RTO framing is exactly right**: `backup_cadence: one manual dump; not scheduled`, RPO24h **NOT_DEMONSTRATED**, RTO8h met only for this tiny tooling rehearsal, single post-backup write acknowledged as lost data — no cadence-vs-RTO conflation and no production claim. Missing product recovery coverage (W1-scale data, blob, history/access, global roles, DR, POC-02-07) is explicitly NOT_RUN in all three documents.

Findings on this area: only word-level nits (F2/F3 below).

## Agent recovery correction

- Earlier "signature failure / damaged install" conclusions are **correctly superseded** by `host-provenance.json`: deep/strict codesign + `spctl` accepted for both apps, notarized; ZCode authority (Beijing Knowledge Atlas, 8A5X4JJ39T), Antigravity authority (Google LLC, EQHXZ8M8AV). `agy` spctl exit 3 ("valid code but not an app") is correctly interpreted — the audit does not miscall it an invalid signature. No reinstall, bypass, or login/global change is recorded or instructed.
- ZCode direct invocation remains a **real FAIL** (exit 1, missing packaged `zcode-builtin.json`), recorded as such; no backend work is claimed. Antigravity's successful ACK and source-audit run are recorded with the honest caveat that CLI JSON does not attest the *effective* model/effort.
- Residual provenance limit: no official release-page checksum comparison was performed (correctly, since locally generated checksums don't count), so provenance rests on Developer ID signing + notarization only.

## Verbatim Antigravity report — overclaims and Codex dispositions

All dispositions in `frontend-audit.md` are accurate against the raw report:

- `rm -rf` workdir + shallow-clone-latest + old-checkout recipe — **REJECTED** in the audit and absent from `MC-002-ANTIGRAVITY-PROMPT.md`, which instead requires verifying paths don't exist and failing rather than deleting/resetting. ✔ Safe.
- "Zero dependency writes after install" and tee-without-pipefail — **REJECTED**; the manual prompt mandates honest dependency-write reporting and `pipefail` with tee. ✔
- SSR "10–20 ms" measured-CPU claim — **UNSUPPORTED**, not adopted; the manual prompt requires correcting the claim. Residual F4: the bare "10 ms CPU per request" figure also floats in the preserved report with no packet source; it is correctly preserved verbatim and nowhere adopted.
- Regex-proves-ID-mismatch, healthz-alone-proves-schema, static-export-inherently-leaks — all flagged NOT_ESTABLISHED / REJECTED / OVERSTATED, and the prompt requires inspecting real route/schema/lock sources rather than accepting them. ✔
- Stale "code signing verification failed" claim — superseded by fresh host evidence without instructing reinstall. ✔
- The integration gap (`/tasks` vs `/api/v1/users`, fail-closed `resolveSession()`, missing session bridge) is consistently stated in report, audit, and prompt, with explicit bans on aliasing endpoints, wildcard auth, or inventing a Task API. ✔

## Manual prompts — safe executable scope and status honesty

Both prompts: pinned origin+SHA with fail-closed worktree creation, no default Compose DB, explicit `MIGRATE_ON_START=false`/`DATABASE_URL`, rtk prefixes, no global installs/volume pruning/security bypasses/login, stop-only-owned-processes, return-exact-logs gates, `IN_REVIEW` only with evidence (else `BLOCKED`), reviewer OpenCode, no Step 02/DONE claims. Statuses (`PREPARED / WAITING_MANUAL_DISPATCH`, `SOURCE_AUDIT_RETURNED / RUNTIME_POC_NOT_RUN`) match the recorded facts. No adopted defect. Every owner PoC (backend install/build/test/container, frontend install/lint/build/Storybook/E2E, Next→Go→PG integration) is NOT_RUN everywhere it should be.

## Findings

| # | Severity | Path | Finding / correction |
|---|---|---|---|
| F1 | Low | `docs/testing/step-02-1/antigravity-execution.json`; `backend-audit.md`; `frontend-audit.md` | Execution record captures only exit/elapsed/packet-path; no stdout/stderr/usage of the 63.66s audit run. Version claims "CLI1.4.7" and "CLI0.17.0 help succeeds" have no raw output in supplied snapshots. Correction: append raw CLI stdout/stderr and version-ack artifacts to the probe/execution records. |
| F2 | Low | `docs/deployment/local-backup-restore.md` §9 | Says "retain stopped containers and tmpfs data until they are no longer needed" — tmpfs data ceases to exist at stop and was discarded after evidence capture (as the evidence honestly records). Correction: reword to "retain archive/logs/IDs first; tmpfs data ceases to exist at container stop." |
| F3 | Low | `docs/testing/step-02-restore-drill.py` | (a) The readiness-poll loop's subprocess attempts are not captured in the report command log (only the confirming `pg_isready` via `run()`), so the record is not command-exhaustive. (b) The restored target is mutated post-assert by the `sequence-check` insert, so a later re-verify would not see the pure restored point. Correction: annotate both exclusions in the report JSON or evidence doc; make the sequence probe a rolled-back transaction. |
| F4 | Info | `docs/reviews/step-02-1-antigravity-result.md` §7 | Unsourced "10 ms CPU per request" Workers figure preserved verbatim; correctly unadopted. Correction: none required beyond the existing UNSUPPORTED disposition; do not cite it as evidence anywhere. |
| F5 | Info | `step-02-poc-validation.md` restore row | SHA256 of the archive is locally computed inventory only (doc says so); independent authenticity impossible at this stage. No correction; keep as stated limitation. |

## Required next step

Record this review (verdict, limits, F1–F5) in `docs/testing/step-02-poc-validation.md`'s "Independent review" section with actual return evidence so it is a completed review rather than PENDING. This review does not clear the Quality Gate: MC-002 remains **OWNER_VALIDATION_BLOCKED / WAITING_REMAINING_APPROVALS** — the manual ZCode and Antigravity packets still await dispatch, and all owner build/runtime/integration PoCs and the product restore POC-02-07 are NOT_RUN.

**Skipped / remaining risk:** no tool-based verification of file existence, git state, digests, or disk artifacts; no runtime replay of anything; verbatim report and conversation provenance trusted as presented; Cloudflare/cost questions untouched by design. Residual risk is limited to the Low findings above and evidence-completeness items F1/F3, none of which undermine the recorded PASS_LOCAL_TOOLING_DRILL scope at W1-unrelated, synthetic, isolated scale.
