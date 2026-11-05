# INT-A — bounded privacy scan and owned teardown return

Task: MC-002-INTA-PRIVACY-TEARDOWN. Actual executor: Local Codex with RTK, Python standard library and Docker CLI. Requirements: INT-PRIV-01, INT-ISO-03 and source/ledger preservation. Human delivered the exact Part P/T prompt in this chat; that is the execution cue, superseding its prepared label for this run. Independent reviewer: actual OpenCode, not invoked by this task.

Repository `/Users/nguyenvanlan/Documents/code/pet-projects/matter-control`, branch `codex/unified-project-flow`; base/head `a62d838791ba188838c4ff00b7b6e265ac775056`, unchanged. No stage, commit, merge or push. Proposed status: **IN_REVIEW / PRIVACY_TEARDOWN_EVIDENCE_RETURNED**.

## Part P — PARTIAL, zero actual fixture-secret matches in scanned scope

- Inventory: **1,153 files / 5,944,102 bytes**, plus **315 expanded archive entries / 3,469,483 expanded bytes**. All initially scanned artifacts remained byte-identical through teardown.
- The scanner used only the approved private `backend.env`, verified owned regular file `0600` under directory `0700`. A nonexecuting bounded parser selected exactly one DATABASE_URL and validated loopback port 15457 and expected user/database. No source/eval, environment dump, Config.Env, SQL, authentication or other credential source was used.
- DSN/password and encoded/decoded password forms existed only in the scan process memory. **Zero match events**. No secret value, matching context, password hash or private file content was exported. Private inode/mode/size/mtime metadata remained unchanged; no private-file digest was generated.
- The same matcher passed four synthetic checks before the credential read. Scan window: `2026-10-26T08:46:30.616339+00:00` to `2026-10-26T08:46:30.821494+00:00`. The scan returned exit **3**, explicitly meaning PARTIAL coverage, not a detected leak.
- Coverage gap: selected raw `/tmp/mc002-inta-evidence/qa` is absent. Governance QA outputs and existing intake copies were included; no raw QA history was fabricated. The result is not a full privacy PASS.
- Separate pattern scan counted seven credential-URL candidates and zero private-key headers. These are pattern candidates (including synthetic/redacted source examples), not seven actual fixture-secret leaks; no claim is made that every unrelated credential is absent.
- Expanded application-log check covers **55 Go/Next stream files**: **0 fixture-name and 0 fixture-email hits**, derived from all eight nonempty fixture names and five run-specific emails. Twenty fixed malformed/missing UUID control occurrences are recorded separately; the earlier narrower filename selection counted four control occurrences. Do not report zero control literals or confuse allowed synthetic envelope bodies with application logs.

The scan is time-scoped and covers only the known fixture DSN/password representations. New evidence requires supplemental scanning. It does not detect all possible credentials, arbitrary transformations or secrets from excluded provider/dependency/private paths.

## Part T — PASS_SCOPED, exact owned PG stopped and retained

Dependency disposition combined accepted stage7 evidence, completed Go/Next runtime ownership, current source-only Antigravity/OpenCode task boundaries, current project thread snapshot and fresh connection/PID/listener checks. No other active local project runtime task or established connection on 15457 was observed. No SQL/session query was used; these are point-in-time observations. Future work must not assume this fixture remains running.

Immediately revalidated exact container:

- ID `04552c273cb6be564d8c1deab7498c9f3f0b522e6dc84c1ac5163134ab85bd01`, name `mc002-inta-pg-intamvnmoems3pd`.
- Original image `sha256:77f585114c32fbca283dc835b0596f4e52b51b4c6662d7810b2f4084f60a1873`; Codex/run/task labels; volume `mc002-inta-data-intamvnmoems3pd` at `/var/lib/postgresql`.
- Original StartedAt, 512 MiB / 1 CPU / 128 PID limits and `127.0.0.1:15457` publication configuration matched. A synthetic eight-mutation selfcheck verified that the same identity gate rejects wrong ID/name/image/labels/ports/caps/mount/signal.

One lifecycle command, start `2026-10-26T08:51:19.654422+00:00`, end `2026-10-26T08:51:20.006646+00:00`, exit **0**:

```text
rtk proxy docker stop --timeout=-1 04552c273cb6be564d8c1deab7498c9f3f0b522e6dc84c1ac5163134ab85bd01
```

Docker daemon timeout `-1` prevents its normal SIGKILL escalation; only the owned CLI wait was bounded to 30 seconds. It returned normally; no timeout, retry or forcekill occurred. This behavior was checked against [official Docker stop documentation](https://docs.docker.com/reference/cli/docker/container/stop/#timeout) through Context7 before execution. The image-configured graceful stop signal was retained.

Post-stop selected metadata: **Status `exited`, Running false, container ExitCode 0**, FinishedAt `2026-10-26T08:51:19.809934924Z`. Container and same volume/image/labels/caps/port configuration remain retained. No restart/remove/prune/volume deletion or other container operation. Fresh lsof observations show no listener/established connection on **15457, 18085, 18086**. Historical Go/Next PIDs 98134/88444/88453 are absent and were never signaled.

Default sandbox denied Docker socket/ps metadata access. The official `require_escalated` route permitted selected reads and the single owned stop; no automatic approval rejection, alternate context or bypass occurred. Both initial denial and authorized observations remain in evidence.

## Preservation and independent acceptance

Twenty-five preservation checks passed: **all 59 ledger entries match the accepted stage7 manifest before/after**, three source checkouts remain clean at backend `52b60a4617081c41b949f2242e1784238c170f75`, template `3e5a642479acb789eb210e73fba956f3e85082e3`, harness `48cc03e949d66fc47a7d304413621eb79804e6c1`; governance HEAD unchanged. No fixture records, counters, envelopes, intents, A/B/X state or source were modified.

This scoped PG teardown is not full INT-ISO-03 conformance. Go direct wait status remains NOT_OBSERVED; Next historical termination remains TERMINATION_NOT_OBSERVED. Container exit 0 does not supply either missing process exit. T11c OUTCOME_UNKNOWN, historical raw-CLI FAIL, 51 formal NOT_RUN results (36 required / 14 product deferred / one external blocked), final QA and all architecture/product/auth/security/Cloudflare/cost/recovery/production gates remain unchanged. No MC-002 DONE or Step 03B authorization follows.

## Deliverables and next action

Raw evidence: `/tmp/mc002-inta-evidence/environment/privacy-teardown-20261026`.
[Governance export and manifest](../testing/inta-returns/environment/privacy-teardown-20261026/manifest.json) contains scanner and gate programs, explicit inventory and artifact/member hashes, synthetic checks, privacy/marker/pattern results, command metadata/stdout/stderr, dependency disposition, before/after resources and preservation checks. Manifest excludes itself; final delivery checks establish raw/export byte equality and matching pins. No private file is copied. Tool versions are in execution-metadata.json and docker-version.json.

Only the two authorized new evidence directories and this new report were written. Existing status/task/source/evidence files remain intact. Next: Codex coordination intake and actual OpenCode review of this evidence with its explicit PARTIAL limit; R3 source review remains a separate pending task. No external payload transmission was performed. Raw QA absence must be dispositioned before any complete privacy acceptance; later FE/runtime evidence needs a supplemental scan.

Skipped: Go/Next/driver execution, HTTP/SQL probes, unrelated credentials, production, provider calls, forcekill/removal/restart, source changes and commit. Remaining risk: privacy coverage is incomplete and historical Go/Next termination evidence cannot be reconstructed by this cleanup.
