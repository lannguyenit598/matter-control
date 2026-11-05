# MC-ZCODE-PILOT-DEPLOY-READINESS-20261103 — RE-REVIEW r2 (manual delivery to OpenCode)

You are **actual OpenCode**, the same non-author independent reviewer that produced
`docs/reviews/pilot-deploy-readiness-opencode-review-20261104-r1/review.md` (verdict:
**CHANGES_REQUIRED** — FA4 D7 decision-register blocking finding + two MINOR fixes). This is
round 2 (r2): the author (actual ZCode) applied the required change and the two MINOR fixes.
Your r2 job: re-pin the changed bytes from the worktree, verify the FA4 fix and the two MINOR
fixes on the re-pinned bytes, spot-check that no other candidate source changed, and re-affirm
(or change) the overall verdict. Your r1 §0 identity/independence rules, §2
claims-vs-reproduction classification and §5 boundaries carry over unchanged.

## What changed since r1 (author-declared; verify from bytes, never trust)

Product tree — exactly 2 files, both inside the r1 allowed-path set:

1. `docs/deployment/pilot-deploy-runbook.md` §2 decision register:
   - packet D7 approval-status cell: "ACK — ratified with OBD-02..11 (2026-10-24)" →
     "OPEN — PO (packet D7: accept as pilot defaults or set from measured workload; numeric
     workload deferred to Step 02 by step-01-approval 2026-10-24; OBD-09 values remain OPEN;
     values PO-owned per ADR-007 Decision item 5)". This is your FA4 required change; the
     citations are the same records you consulted in r1 (verify them again).
   - packet D5 approval-status cell: "ADR-007 §6" → "ADR-007 Decision item 6 (transport
     boundary; asymmetry remains a PO security/cost decision)" (your MINOR 1).
2. `ops/backup/scheduled-dump.sh` header comment (MC_BACKUP_DSN block only): the false
   "never on the command line via argv (psql DSN only)" claim replaced with truthful argv
   wording — the DSN (including any embedded password) reaches pg_dump as ONE argv element,
   briefly visible in the same user's process table; a PGPASSWORD-style env credential with a
   passwordless DSN noted as the lower-exposure alternative. Comment-only; no behavior change
   (your MINOR 2). The P2 behavior change was NOT adopted (see below).

Evidence tree (outside the product tree; not code):

- `/private/tmp/mc-pilot-deploy-readiness-20261103/disposition.md`: Z6 row aligned (D7 OPEN)
  + dated section "Correction 2026-11-04 (post r1 independent review, FA4)" appended.
- New author receipt: `/private/tmp/mc-pilot-deploy-readiness-20261103/receipts/fix-loop-r1-20261104.md`
  (edit list, commands, exits, timestamps, new pins).

NOT adopted (r1 §6 optional proposals, recorded for separate assignments): P1 YAML-parse
renderer pass; P2 PGPASSWORD/argv-stripped-DSN behavior change; P3 rehearsal mktemp hygiene.

## r2 pins (re-derive from bytes; any drift → STOP and report, do not review stale bytes)

- Base HEAD `048776b3862ab384ab4e42356c46c0a320a93488`, branch
  `codex/pilot-deploy-readiness-20261103`, worktree
  `/private/tmp/mc-zcode-pilot-deploy-readiness-20261103` — unchanged from r1.
- Tracked diff SHA-256 (`git diff | shasum -a 256`):
  `20d02870f0457aa5449be23dbd3637df585339e0bc22204b821476bdb435f98c`
- The two changed files:
  - `docs/deployment/pilot-deploy-runbook.md` =
    `8fc623a855a9faa795ec8d0d7af9d349f3051bd1aa17fd8c5e5649132c0f32d2`
  - `ops/backup/scheduled-dump.sh` =
    `a498357879acf387214c4ce571e8d16c60997b800d3ca593eb3573eba66bd872`
- The other 19 candidate files MUST still match the per-file manifest in the r1 dispatch
  prompt (`MC-OPENCODE-PILOT-DEPLOY-READINESS-REVIEW-20261104-PROMPT.md` — recovered pins,
  including the 3 recovery-delta files). Mismatch → STOP.
- Provenance chain (intentional deltas, not drift): intake diff `fbb487eb…` → recovered diff
  `164db6e8…` (post /tmp-loss recovery, 3-file delta, `recovery-20261104.md`) → r2 diff
  `20d02870…` (the FA4 fix loop, 2-file delta, this prompt).

## Author-side receipts from the fix loop (CLAIMS; re-run at your discretion)

- `bash ops/backup/scheduled-dump.test.sh`: "RESULT: all scheduled-dump rehearsal checks
  passed" — 24 checks incl. schema-selection refusals, restore into a NEW target, hex-password
  URL round-trip; task-owned pg17 container destroyed on exit; 2026-11-04T16:49Z.
- No Go/renderer sources touched → gofmt / vet / renderer suites unaffected (no re-run
  required by the delta; re-run if you want them on the re-pinned bytes).
- Trailing-whitespace check on both edited files: clean.

## r2 scope and verdict semantics

- IN scope: FA4 fix correctness on the re-pinned bytes (D7 cell truthful with real citations;
  D5 pointer; dump-script wording truthful); confirmation that the 19 other files are
  byte-identical to r1 pins; overall verdict re-affirmed on the NEW pins.
- OUT of scope (unchanged from r1): commit/merge/push authorization; deploy execution;
  provider work W1–W8 (NOT_RUN); cost/plan approvals; PD-1..PD-8; release approval. A
  PASS / PASS_WITH_LIMITATIONS here closes LOCAL-SOURCE review only; the candidate commit is
  a separate subsequent action under MC-PO-DEPLOY-EXECUTION-20261104 Phase 1, whose commit
  message will cite YOUR r2 verdict + the pins above.
- Boundaries identical to r1 §5: candidate worktree strictly read-only; the coordination
  checkout's in-flight Pre-flight delta untouched; no commits/pushes; no provider calls;
  synthetic credentials only; no refusals bypassed.
- Return: record your r2 verdict (recommended location
  `docs/reviews/pilot-deploy-readiness-opencode-review-20261104-r2/review.md`) with your own
  re-derived pins inline, so the Phase 1 commit can bind to them.
