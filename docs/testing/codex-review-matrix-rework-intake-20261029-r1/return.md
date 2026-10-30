# MC-REVIEW-MATRIX-ZCODE-REWORK — Codex intake

Actual Local Codex, 2026-10-29. Rework received from actual ZCode. Candidate HEAD 20feedbf06c859a9806055d609f5b132fe8bb086; 26 working-tree source/test/docs members pinned by the author's final-source-manifest.csv all match at intake, in the private copied candidate, and at close. No shared source, runtime, database or writer checkpoint changed. This is bounded nonauthor intake of ZCode corrections, not full independent feature/release acceptance.

## Disposition

SOURCE_REWORK_RECEIVED / IN_REVIEW_WITH_VERIFICATION_BLOCKERS. F01 presence guard, F02 original CAS intent, F03 reachable bounded history and F04 protected-surface access-loss clearing are reflected in current source and focused tests. Do not repeat the rework merely because the earlier implementation inventory predated the final return. The earlier statement that final logs were missing/empty is superseded by this received packet.

| Finding | Current evidence | Remaining acceptance |
|---|---|---|
| F01 expected answer presence | DTO/port pointer; post-authorization nil→428; explicit empty remains valid; actual current HTTP/service tests passed | Fresh nonauthor PG/final adversarial rereview |
| F02 UNKNOWN command fidelity | Hidden CAS fields captured in the existing frozen intent; cell-scoped draft; props-refresh/remount tests passed | Controlled rendered lost-response/replay path |
| F03 truthful history | Bounded keyset memory/PG source, limit+1, total:null, nextCursor; backend HTTP/service/memory traversal and frontend continuation tests passed | Fresh PG regression and rendered >100-row traversal |
| F04 known-denial clearing | Optional shared access-loss callback, grid provider and scoped draft purge; detail/denial component tests passed | Rendered second-user revocation and full-grid clearing |

## Checks executed by this intake

Private snapshot path in inputs.json; every 26 manifest member copied byte-identically. Direct installed Vitest: review feature plus upload-attempt tests,7files/42tests PASS. The command also named two nonexistent shared test paths; those contributed no tests and are not claimed as coverage. Go race JSON tests: core/service + productapi + memory repotest,313 pass events/0fail/0skip across3packages. Counts parsed from actual events in results.json, not inferred from RTK summary. PostgreSQL package and full make check NOT_RUN; real-R2/provider variables and PG DSN were not supplied.

First Go attempt failed during setup because the shared build cache was sandbox-unavailable. Retained failed output; retry used a new snapshot-owned GOCACHE and passed. No dependency download/install, shared-source modification, live .next build or retained-resource lifecycle. Source pins remain unchanged at close.

## Author evidence consumed, not independently rerun

Author make-check log shows passing package results/lint and a separate count summary of640 tests in20packages. Author frontend log shows78files/707tests pass. Both production build logs contain completed routes and compiled CSS guard success (1Turbopack/2Webpack assets). These are author receipts, not new runtime/PG/build proof from this intake. Timing-test source now waits until intentionally disabled controls become enabled; before/after repeat logs are retained. This addresses the observed click race, not a universal flake-free guarantee.

## Evidence qualifications

- Literal author pnpm check failed at format:check on two non-source Mimosa hook-state files. Later split unit/agent/source-format checks passed; never summarize the original whole command as PASS. Do not edit tool-owned state or widen formatting exclusions silently.
- Fixture-and-cleanup prose claims zero occurrences of port51977 anywhere in evidence, but that same document contains the port. This is a benign provenance erratum, not evidence of a password leak; no actual private credential read or secret scan was performed by this intake.
- The log summary “640 pass in20packages” does not independently prove every integration test ran with zero skips. Keep PG execution attributed to the author's fixture record until reviewer-owned raw event/PG results exist.
- The history total:null/nextCursor change is documented and supported by current consumers, but final compatibility/security review remains part of the focused rereview.

## Next action

The separate system/multi-tenancy review session should consume this corrected26-file packet and this intake before auditing review isolation. Perform nonauthor affected PG/adversarial checks on its own pinned snapshot; retain authorship overlap declarations. Operator/browser checks follow an actual runtime-source/database handoff: the author explicitly says the retained API is not the corrected binary. Do not assume live uptake, restart by port or replay business mutations on the retained login DB.

The long implementation session can continue nonoverlapping roadmap work, preserving these corrected bytes and open verification gates. No F01..04 final independent closure, MC-002/P0 DONE, release or production/multi-tenant verdict granted.

Skipped: fresh PostgreSQL/full make-check/build/browser/IdP runs, tool-state formatting changes and commit/push. Risks: recorded implementation tests do not prove live uptake, second-user access loss or exactly-once recovery under a real lost response.
