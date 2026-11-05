# MC-002-BE — R01/R02 Returned-Evidence Closure

Codex PM/DevOps intake,2026-10-24; governance base74fbdec9a661f4dcfd68fb835c20106c7fc5f421, branch task/MC-002-solution-architecture. Actual execution owner: ZCode, according to the user handoff and retained evidence. GLM5.3Flash/model identity is owner-reported; this validation does not independently attest the manual session model. Independent reviewer: actual OpenCode. No new build/test/DB execution or source change by Codex.

## Integrity and recorded behavior

[Owner handoff and manifest](../testing/step-02-backend-recheck/README.md), [Codex checks](../testing/step-02-backend-recheck-review/checks.json), [read-only resource state](../testing/step-02-backend-recheck-review/host-state.json), [exact review packet manifest](../testing/step-02-backend-recheck-review/opencode-input-manifest.json). Original18 files in /tmp/mc002be-recheck match governance exports byte-for-byte;17 payload hashes match40-sha256.txt and that hash-list file itself matches its original. The README is the additional owner report, not a self-hashed payload. Hash equality proves integrity consistency, not authorship or runtime authenticity.

| Finding | Direct verification | Actual independent disposition |
|---|---|---|
| R01 per-test skips | Parsed all880 JSON lines;205 unique named terminal pass events,0fail/0namedskip,11packagepass. Counts include named parent tests and subtests; not205 claimed independent leaf cases. Postgres43pass. Five package-level skip events have no Test and corresponding no-test-files output. Empty stderr; metadata exit0, UTC15:40:29→15:40:39 | Actual OpenCode R01 PASS / CLOSED |
| R02 invalid-config pairs | Four separate argv/UTC/exit/stdout/stderr groups; all exit1, watchdog not fired. c1 postgres without DSN, c2 bogus storage and c3 bogus log level errors on stderr; c4 migrate without DSN emits JSON error on stdout. Metadata removes inherited DB variables; c2 deliberately adds the harmless invalid literal | Actual OpenCode R02 PASS / CLOSED |
| Source/binary | Both backend worktrees clean at d024e3ec9dd96abf9ada1d7516f1b2f0e8cba67b; binary SHA256ff973fb7883c16898e5cfef6bb4e80df0252abc17ff5235c52fdc7ebabd9ad03 unchanged | No source implementation/rebuild inferred |
| Fixture/resource scope | New loopback15456 fixture captured with512MiB/1CPU/128pids and pre-assignment target verification. Host inspection sees exact new container stopped/exited0; old review container's start/finish timestamps match prior inventory; no listeners15456/18091 | Later read-only state corroborates disposition; not a replay of the original tests or complete proof of no historical mutation |
| Evidence privacy | No secret-shaped DSN in exports; two postgres URI occurrences in17 payloads are invalid literal and REDACTED form. Common token patterns absent. Exact fixture-value scan is owner-asserted; Codex did not read container Config.Env or audit whole workstation | No credential/env dump or external secret transport introduced by this intake |

## Scope retained

The R01/R02 runtime work was performed by ZCode, not Codex or OpenCode. Their original prior evidence gaps are historical; this is a new explicitly captured run. No proof is inferred for C01 product503 unavailable mapping, MatterControl authorization/idempotency/transaction graph, integration, Cloudflare adapters/quotas, production, full recovery or cost. Existing Claude C01 disposition remains an implementation obligation under unchanged approved contracts; no ADR/product-policy waiver or code fix.

Actual independent review: **PASS_WITH_LIMITATIONS; R01 PASS/CLOSED, R02 PASS/CLOSED**. OpenCode session ses_e91610e71ffeC42yXslkK7ke8v, exit0/outcome succeeded. Actual exported provider/model is recorded in the execution artifact. [Verbatim return](step-02-backend-r01-r02-opencode.md), [metadata](../testing/step-02-backend-recheck-review/opencode-execution.json). No tools, runtime replay or reviewer hash recomputation. MC-002-BE remains IN_REVIEW for characterization; no full product conformance or MC-002 DONE. The focused handoff has been executed and returned; no further R01/R02 owner rerun is needed absent a new defect.

Skipped: runtime replay and unrelated feasibility/product work. Remaining risks: C01, compatible API/auth seam and Step02 architecture/production/cost gates remain open. The raw review's general no-residual-process wording is bounded by the exact captured ports and container state, not a whole-host process audit; incidental CFO/Pillar wording introduces no new role or gate.


Evidence file integrity, JSON decoding/event counts and four expected error messages were independently checked locally by Codex. This is artifact verification, not execution of the tests. Model identity of the manual ZCode run and exact fixture-secret scan remain owner assertions. Local architecture/product inputs and source stayed unchanged; no credentials or global settings were read/modified for this closure.
