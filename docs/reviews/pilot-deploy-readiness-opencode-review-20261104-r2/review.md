# Independent re-review r2 — MC-ZCODE-PILOT-DEPLOY-READINESS-20261103 (post fix loop)

- Reviewer: **actual OpenCode** (OpenCode harness/GLM-5.3-Flash runtime), same non-author independent reviewer as r1.
  r1: `docs/reviews/pilot-deploy-readiness-opencode-review-20261104-r1/review.md`, verdict **CHANGES_REQUIRED**
  (FA4 blocking: D7 decision-register approval status invented a ratification; MINOR 1: D5 cite pointer;
  MINOR 2: scheduled-dump.sh argv wording).
- Candidate: actual ZCode's task `MC-ZCODE-PILOT-DEPLOY-READINESS-20261103`, worktree
  `/private/tmp/mc-zcode-pilot-deploy-readiness-20261103`, under `MC-PO-DEPLOY-EXECUTION-20261104`.
- r2 purpose: re-pin the changed bytes, verify the FA4 fix + the two MINOR fixes on the re-pinned bytes,
  confirm the other 19 candidate files unchanged, re-affirm the overall verdict.
- r2 dates (honest day-level): pins, content verification, gate G2-r2 and the post-gate re-pin were executed
  2026-11-04 (Asia/Ho_Chi_Minh); the rehearsal-regenerated temp artifact cleanup and final wrap-up checks ran
  early 2026-11-05 (day boundary crossed during the session). Second-level wall-clock times were not captured
  in this round's transcripts and are not invented here.
- **Overall verdict: PASS_WITH_LIMITATIONS** (r1 blocking finding resolved; verdict semantics unchanged: closes
  LOCAL-SOURCE review ONLY — see §6).

---

## §0 Identity, independence and pin re-verification (carries r1 §0 unchanged)

- I am **actual OpenCode**. I am not the candidate author (actual ZCode) and I authored no byte of the fix.
  The fix was applied by the author (fix-loop receipt:
  `/private/tmp/mc-pilot-deploy-readiness-20261103/receipts/fix-loop-r1-20261104.md` — a CLAIM set, cheaply
  corroborated below, never trusted as pins). No sandbox refusals were encountered in r2; none bypassed.
- **Pin re-verification result: EXACT MATCH on r2.** Re-derived from worktree bytes:
  - HEAD = `048776b3862ab384ab4e42356c46c0a320a93488`, branch = `codex/pilot-deploy-readiness-20261103`
    (unchanged from r1).
  - `git diff | shasum -a 256` = `20d02870f0457aa5449be23dbd3637df585339e0bc22204b821476bdb435f98c`
    — equal to the r2 pin supplied in the dispatch; belongs to the provenance chain
    intake `fbb487eb…` (SUPERSEDED) → recovered `164db6e8…` (r1; /tmp-loss recovery delta)
    → r2 `20d02870…` (FA4 fix loop, 2-file delta — intentional, bounded by the manifest below).
  - All 21 candidate file SHA-256 hashes recomputed from worktree bytes: **19 byte-identical to the r1 manifest**
    (dispatch prompt `MC-OPENCODE-PILOT-DEPLOY-READINESS-REVIEW-20261104-PROMPT.md`, recovered pins), and the
    2 changed files match the r2 claims **and genuinely differ from their r1 values** (not stale/r1 bytes).
  - `git status --porcelain` = exactly the 21 candidate paths (15 modified + 6 untracked entries covering
    the 21 files); nothing else added or removed by the fix loop.

## §1 Pins bound by the r2 review

| Pin | Value | Verified by |
|---|---|---|
| Base HEAD | `048776b3862ab384ab4e42356c46c0a320a93488` | `git rev-parse HEAD` (rechecked at r2) |
| Branch | `codex/pilot-deploy-readiness-20261103` | `git rev-parse --abbrev-ref HEAD` |
| Diff SHA-256 | `20d02870f0457aa5449be23dbd3637df585339e0bc22204b821476bdb435f98c` | `git diff \| shasum -a 256` |
| Worktree | `/private/tmp/mc-zcode-pilot-deploy-readiness-20261103` | — |
| Post-gate drift | none | full re-pin after G2-r2: HEAD/branch/diff-sha/status set and both changed hashes unchanged; `ops/backup/` contains only the two tracked candidate files |

21-file manifest (SHA-256 recomputed from r2 worktree bytes; “r1” column = r1 manifest value):

| # | Path | r2 sha256 | vs r1 |
|---|---|---|---|
| 1 | `apps/backend/.env.example` | `4f62411439baa680eea685d747a5ac96305b82d51b24e5d00944b8a3a6ece465` | identical |
| 2 | `apps/backend/docs/operations.md` | `9fe8a1073b3efc40ba4c03bce8a03e677a1ea3d94eb6a8b8ec5bad4a695bb98d` | identical |
| 3 | `apps/backend/internal/adapter/outbound/identity/zitadel/verifier.go` | `c43c1b917975bb208f61e196df60e04935e2791bda77d5e7425cfabb83ed82ca` | identical |
| 4 | `apps/backend/internal/adapter/outbound/identity/zitadel/verifier_test.go` | `d720ea2dd0fa02e02ad3c73ecfda39439b3ead584e58a7fbe94cc87c83d1b541` | identical |
| 5 | `apps/backend/internal/adapter/outbound/postgres/b1_least_privilege_test.go` | `2ad9a01f21ec60af9a0842adb518e1d9fc4c27792bab391049399a9091532f94` | identical |
| 6 | `apps/backend/internal/adapter/outbound/postgres/b1_operator_sequence_test.go` | `e2024b61095e13fa7bfdde623f59fa75b3878855a5ce2ca84d8c0390254bee67` | identical |
| 7 | `apps/backend/internal/adapter/outbound/postgres/tls_verify_full_test.go` | `4ac6e0078eac07fcadb71d74a470a757e93ed215a4c5a57c8e329ca6add63457` | identical |
| 8 | `apps/backend/internal/app/product_migrate_test.go` | `e7df280ed343736a42697c629b00a20f2807bdac1409bb91e4c4283e71acccb6` | identical |
| 9 | `docs/deployment/README.md` | `9d9ac3e67d6fb4e45c12495c9d5cda4a39b3efb55968978fd7facf35c2fa3e52` | identical |
| 10 | `docs/deployment/pilot-deploy-runbook.md` | `8fc623a855a9faa795ec8d0d7af9d349f3051bd1aa17fd8c5e5649132c0f32d2` | **changed** (r1 `f9a462359ac72bca2bcc613dd66a5e2cba1185ce94407bf05851c0407f5cf8b0`) |
| 11 | `docs/deployment/portability-cloud-validation-packet.md` | `3cec4ddf9809dc04141fd3fdbd2d3c73fcc02870951c688b5d08b300d16a33a6` | identical |
| 12 | `ops/adr006/db/README.md` | `88c3b64ff24d451a7faf805158947f849d3dde8b43a0add8f7456f89ab5fb120` | identical |
| 13 | `ops/adr006/db/b1-roles.sql` | `6c14e2325f9c7798acc0b0ae82cd7b073cc1ef5080155def6685d8abb700f92a` | identical |
| 14 | `ops/adr006/db/b1-runtime-grants.sql` | `c675aa7d8c6a689d5f3ad1a71a7fb5f99c18e614128d1284ba533b5a31d2dd89` | identical |
| 15 | `ops/backup/scheduled-dump.sh` | `a498357879acf387214c4ce571e8d16c60997b800d3ca593eb3573eba66bd872` | **changed** (r1 `8bb017c46af393c26c2382af6248c9c0bcbe16529acf94e3b20e894288e91de3`) |
| 16 | `ops/backup/scheduled-dump.test.sh` | `0d679e0b7f6d71eac742f661c58249a5f0d3d1e9b3fd214a20117e3bb3e0f62f` | identical |
| 17 | `ops/deploy/cloud-run/migrate-job.yaml` | `29da27fbca7750076eaaa44fd5f1bd17593b29d9409ddfebede46a426a026f34` | identical |
| 18 | `ops/deploy/cloud-run/service.yaml` | `cbf87b64e78c00d1f301f93a79c335d117a7a71df3120645333ec7f609452b4b` | identical |
| 19 | `ops/deploy/profiles.mjs` | `c2d4736cafeea1f402b742c4257ff04903222928e2a9be9d0dade8b5bd971bf7` | identical |
| 20 | `ops/deploy/profiles.test.mjs` | `b04a4c2fa6caab40f60058439585de4ac4e4c0c434d34ec5feb0c700d342ace0` | identical |
| 21 | `ops/deploy/worker/wrangler.vars.json` | `5c4ed2f98338c34c13349f478206078c2296eedbe56e52d34a837ce6ba898565` | identical |

**The r2 delta is exactly files #10 and #15.** On the 19 identical files, the r1 receipts (r1 §3/§4) attach to
identical bytes and carry over unchanged. Every verdict in §3 is bound to these r2 pins; the Phase 1 commit may
cite this review only with these pins (§6).

## §2 Inputs consulted and classification (carries r1 §2 rules, r2 subset)

Inputs: the r2 re-review dispatch (PO); the r1 review; the author fix-loop receipt; the evidence tree
(`/private/tmp/mc-pilot-deploy-readiness-20261103/`: `disposition.md`, `receipts/fix-loop-r1-20261104.md`); the
changed candidate bytes (runbook §2 register; `scheduled-dump.sh` header); coordination-repo records re-checked
at r2 (`docs/ai-sdlc/step-01-approval.md`, `docs/requirements/open-business-decisions.md`,
`docs/architecture/adr/ADR-007-portable-fe-be-deployment-profiles.md`).

Classification (r1 §2 unchanged): my pins are recomputation, not claims; the author's receipt statements and
evidence-side records are CLAIMS and were only cheaply corroborated; provider work remains
evaluated-in-provider / NOT_RUN; local behavior where recomputed is REPRODUCED by me.

## §3 r2 delta verification

### FA4 (r1 blocking) — RESOLVED

`docs/deployment/pilot-deploy-runbook.md` §2 register, packet D7 approval-status cell now reads (line 150,
exact bytes):

> `OPEN — PO (packet D7: accept as pilot defaults or set from measured workload; numeric workload deferred to Step 02 by step-01-approval 2026-10-24; OBD-09 values remain OPEN; values PO-owned per ADR-007 Decision item 5)`

This is the r1 required change verbatim: no ratification is claimed on the row that requires PO input, and the
fact that the numeric values remain *proposed defaults, not from a workload study* is preserved via citations.
All three citations re-verified on current coordination-repo bytes (2026-11-04):

1. `docs/ai-sdlc/step-01-approval.md:15` — “Hoãn chốt các con số sang Step 02” (the deferral is real).
2. `docs/requirements/open-business-decisions.md:95` — OBD-09: numeric workload deferral APPROVED_BY_PO
   2026-10-24; “Workload values and feasibility remain OPEN”.
3. `docs/architecture/adr/ADR-007-…md:22` — Decision item 5: numeric values are proposed defaults,
   PO-owned (“the Product Owner owns these numbers (decision D7)”).
   The remaining r1 FA4 consults (step-01-approval line 33; packet erratum lines 5–9) stand from r1 on files
   I had no reason to expect changed and whose r1 verdict text cited them accurately.

Alignment: `disposition.md` Z6 (line 82) now records D7 OPEN with the same deferral; a dated
“Correction 2026-11-04 (post r1 independent review, FA4)” section (line 151) accurately describes the error,
the deferral record, the D5 pointer fix, the argv wording fix, the two adopted MINORs and the not-adopted
P1–P3. The fix-loop receipt is internally consistent with my recomputation (edit list, commands, exits, pins).

### MINOR 1 — ADOPTED (D5 cite pointer)

Packet D5 approval-status cell now reads (line 148, exact bytes):

> `ACK — consistent with ADR-007 Decision item 6 (transport boundary; asymmetry remains a PO security/cost decision); no new approval sought here`

Target confirmed at `ADR-007…md:23` (Decision item 6, “Transport boundary is the application boundary…”);
substance unchanged (application-boundary posture, `invoker-iam-disabled` on the service only) — consistent.

### MINOR 2 — ADOPTED (scheduled-dump.sh argv wording)

The false sentence credentials reach the tools “never on the command line via argv (psql DSN only)” is gone
(grep count 0 on r2 bytes). Header `ops/backup/scheduled-dump.sh` lines 16–20 now state, exact bytes:

> `#        Supplied by the scheduler from a secret store; never written to disk by`
> `#        this script. Argv truth (r1 review): the DSN, including any embedded password, reaches pg_dump as ONE argv element and is briefly visible in the same user's process table; prefer a PGPASSWORD-style env credential with a passwordless DSN where practical.`

(“Argv truth (r1 review)” is an accurate attribution — the finding originated in the r1 review.)
**Honest method note:** r1 bytes were not retained, so “comment-only, no behavior change” is not proven by a
byte-pair comparison of two retained files. It is bound here by: (a) the 21-file manifest — the r2 delta is
exactly files #10/#15 and nothing else; (b) the replaced sentence lies entirely inside the header comment
block, with `bash -n` clean and no trailing whitespace in either edited file; (c) G2-r2 (§4) reproduced all
rehearsal checks green on the r2 bytes — no behavior-signature change vs the bytes r1 exercised; (d) the
functional hunks visible in `git diff` for `scheduled-dump.sh` are the r1-reviewed candidate behavior vs base
(schema validation, `SCHEMA_ARGS`, retention, listing), unchanged in substance by r2.

### No other candidate change

Files #1–#9, #11–#14, #16–#21 are byte-identical to the r1 pins (§1). r2 therefore introduces no new review
surface beyond §3.

## §4 Local gate receipts (r2)

| # | Gate | Result | Classification |
|---|---|---|---|
| G2-r2 | `bash ops/backup/scheduled-dump.test.sh` (worktree cwd) | “RESULT: all scheduled-dump rehearsal checks passed”, exit 0 — refusal checks (incl. duplicate schema), restore into a NEW target, retention pruning with checksum sidecars, hex-password URL round-trip; task-owned pg17 container destroyed on exit. 2026-11-04 | REPRODUCED by reviewer on r2 bytes |

Carried over unchanged (r1 §4, byte-identical files): G1 renderer tests (12/12), G3 constrained-admin PG17
sequence, G4 ZITADEL verifier tests, G5 migrate identity tests, G6 TLS verify-full paths — REPRODUCED in r1
on identical bytes; not re-run in r2 (out of the r2 delta; re-running was optional and declined).

G2-r2 artifact note: the rehearsal regenerates `/tmp/wp5-bad.out` (its literal path; proposal P3 not adopted —
honest disclosure). I measured it at 43 bytes with 0 credential-pattern matches (`postgresql://`, `pgpass`);
content is only the refusal line “MC_BACKUP_SCHEMA: duplicate schema 'mcapp'”. Removed post-run (2026-11-05);
no stray artifacts inside the worktree (`ops/backup/` contains only the two tracked files; status set unchanged
post-gate). Environment same host as r1 §4; the disposable pg17 image digest was not re-verified this round
(out of delta scope).

## §5 Boundaries honored during r2 (carries r1 §5)

- Candidate worktree strictly read-only: no writes by me; pins byte-stable pre/post gate (§0/§1).
- Coordination checkout (/Users/nguyenvanlan/Documents/code/pet-projects/matter-control): additions by me only
  under `docs/reviews/pilot-deploy-readiness-opencode-review-20261104-r1/`, the r1 pointer
  `docs/implementation/tasks/MC-OPENCODE-PILOT-DEPLOY-READINESS-REVIEW-20261104.md`, and this r2 review file.
  All other checkout entries (total 48 porcelain entries at the 2026-11-05 check) pre-existed
  (in-flight Pre-flight delta, prior tasks/reviews) and were not touched; no tracked file modified by me.
- No commits, merges, or pushes; no deploy execution; no provider calls — W1–W8 remain NOT_RUN by me
  (verbatim with the candidate's labels); no cost/plan approvals.
- Credentials: r2 introduced none; the rehearsal's synthetic users lived and died inside its disposable
  container. Nothing entered git, logs, screenshots or this report. No refusals bypassed.
- Workstation note unchanged (rtk exists; review/test commands ran directly in shell; not a portable
  dependency; results unaffected).

## §6 Verdict, scope, skipped checks, remaining risks

**Overall verdict: PASS_WITH_LIMITATIONS.** The r1 blocking item (FA4) is resolved exactly as required on the
re-pinned bytes; both r1 MINORs are adopted; the rest of the candidate is byte-identical to what r1 reviewed
and stands on r1's receipts. FAIL/WAITING conditions from r1 no longer apply.

Scope, unchanged from r1: this closes **LOCAL-SOURCE review only**. It does not authorize commits, merges,
image builds, deployable artifacts, provider-side execution (W1–W8 NOT_RUN until separately authorized
qualification), costs/billing, PD-1..PD-8 PO items, or release approval. The candidate commit under
`MC-PO-DEPLOY-EXECUTION-20261104` Phase 1 is a separate subsequent action; it may cite this review only
together with the §1 pins — any byte drift beyond files #10/#15 as pinned above invalidates it. This
reviewer made no commit.

Limitations (why not plain PASS):
1. Provider work W1–W8 NOT_RUN; static/local evidence never proves production behavior, provider PG
   differences, edge/IAM routing, budgets or a $0 bill.
2. Optional proposals not adopted (remain open for separate assignments): P1 renderer YAML-parse pass;
   P2 PGPASSWORD/argv-stripped-DSN credential transport (behavior change); P3 rehearsal mktemp hygiene.
   The r2 header comment truthfully documents the argv exposure that P2 would reduce; the operator should
   read it as an operational note, not as a solved problem.
3. OBD-09 numeric workload remains OPEN/PO-owned by design — the corrected register now preserves that truth;
   it is correct, not a defect, and the numbers still require Step 02 / PO action.

Skipped checks (deliberate): Go/renderer suites not re-run (no r2 delta; byte-identical pins; r1 receipts
attach); pg17 image digest not re-verified this round; provider/cost/plan gates out of scope; sunstar
workspace input pins still not re-derived (r1 stance); no full `go test ./...` sweep (r1 stance); and no
byte-pair proof of “comment-only” for scheduled-dump.sh (r1 bytes not retained — bounded instead by manifest,
syntax checks and G2-r2, see §3 MINOR 2; residual assurance gap accepted and disclosed).

Remaining risks: (1) real-provider differences can invalidate local says-so until W1–W8 run; (2) numeric
defaults are memory/DB-connection arithmetic, not measured workload — preserved in the corrected register
and must survive exactly that way into any acceptance record; (3) renderer structural asserts without a
YAML-parse pass (P1) can miss template defects; (4) argv DSN exposure stands for operators until P2; (5)
the rehearsal's `/tmp/wp5-bad.out` literal path (P3) recurs on every full run — adopted today as a
disclosed nit, not a defect.

End of r2 review. Evidence trail: shell transcripts of this session (pins, checks, G2-r2, cleanups),
day-dated as stated in the header; keyed artifacts under §1/§2/§4.
