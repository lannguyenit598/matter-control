# MC-PO-DEPLOY-EXECUTION-20261104 — one-prompt deploy execution (agent + PO, phase-gated)

Purpose: ONE dispatch prompt that takes the MatterControl pilot from the current
`LOCAL_CANDIDATE / IN_REVIEW_WITH_VERIFICATION_BLOCKERS` state to a FIRST DEPLOY attempt — by
EXECUTING the already-verified runbook, not by re-writing code. Honesty rule inherited from the
candidate: nothing here can "guarantee" deploy; this prompt GUARANTEES that every step that CAN
be closed by an agent + PO is closed in the right order, and every step that needs a real
provider/account/decision STOPS loudly with exactly what is missing.

Executor: one agent session (ZCode or Codex) with PO participation at the marked **[PO]** gates.
Canonical procedure: `docs/deployment/pilot-deploy-runbook.md` (branch
`codex/pilot-deploy-readiness-20261103`, base `048776b`). This prompt drives phases; the runbook
holds the exact commands. Do not duplicate or rewrite either.

## Hard rules (all phases)

- Synthetic data only. No real legal data. No $0/SLA/production claim.
- Never bypass a refusal (permission/Mimosa/sandbox/org-policy). Record and stop or route around.
- Destructive actions (drop project/database/key) FORBIDDEN without a separate explicit PO
  approval naming the exact resource (PD-7).
- No paid plan / billing change without an explicit PO "yes" at the decision gate (PD-1/PD-2).
- Every provider command runs with `ON_ERROR_STOP=1`-equivalent strictness; a partial run is a
  failure. Record command + exit + UTC timestamp per step (no secrets, no tokens in logs).
- Candidate bytes are pinned by the recovered manifest
  (`/private/tmp/mc-pilot-deploy-readiness-20261103/receipts/recovery-20261104.md`); verify pins
  before any phase that builds/deploys from them; drift → STOP and re-verify with the author.

## Phase 0 — PO inputs (BLOCKING; the agent cannot invent any of these) — [PO]

The PO fills this table in the operator env file (runbook §0). The agent proceeds ONLY with the
phases whose inputs are complete; missing inputs = that phase stops with the named gap.

| # | Input | Decides | Fill at |
|---|---|---|---|
| 1 | Cloudflare account + workers.dev subdomain + R2 bucket created + bucket-scoped token (Object Read & Write, single bucket) in password manager | FE/BFF hosting | P3 |
| 2 | GCP project (billing linked) + billing account id | BE hosting, budget alert D2 | P4 |
| 3 | Supabase project (Singapore) created + ref + session-pooler host + CA + admin connection | DB | P2 |
| 4 | ZITADEL pilot instance + web app (PKCE) + API app (private_key_jwt) + users A/B/C subs | Auth | P5 |
| 5 | PD-1 Supabase plan (Free ⇒ accept manual pause-resume) | P2 | PD-1 |
| 6 | PD-2 Workers plan (decide AFTER W5 CPU observation — default: start Free, upgrade only on evidence) | P5 | PD-2 |
| 7 | PD-3 people directory (default OFF) + PD-4 Search (default OFF) | P7/P8 | PD-3/4 |
| 8 | PD-5 ZITADEL instance/MFA + PD-6 residency acknowledgement | P5 | PD-5/6 |
| 9 | Review status: OpenCode verdict on the pinned candidate | gate for commit/first traffic | Phase 1 |

## Phase 1 — close the candidate (process gate; runs in PARALLEL with Phases 2–3 provisioning)

1. Human pastes `MC-OPENCODE-PILOT-DEPLOY-READINESS-REVIEW-20261104-PROMPT.md` to OpenCode.
   OpenCode §0/§1 confirmation → status IN_REVIEW; verdict returns.
2. PASS / PASS_WITH_LIMITATIONS → Codex commits the pinned bytes to
   `codex/pilot-deploy-readiness-20261103` (commit message references the verdict + pins) and
   records the release SHA. CHANGES_REQUIRED → loop back to ZCode with the findings; this prompt
   resumes at Phase 1 after the fix loop.
3. No first deploy traffic before this phase completes. (Provisioning below is safe to do in
   parallel: it creates EMPTY resources and runs no product traffic.)

## Phase 2 — provisioning (agent executes with PO's authorized CLI sessions; runbook §§0.1–0.3)

- Supabase (P2): record version/encoding/ICU/admin-role probe (P2.1) → STOP if PG < 16 or ICU = 0.
- Cloudflare (P3): private bucket settings verified; token scope-checked; `$APP_ORIGIN` recorded
  (the origin is now FINAL — it feeds P5 before any deploy).
- GCP (P4): enable APIs, Artifact Registry, two SAs (PI-02), per-secret IAM pattern from the
  runbook; org-policy probe for `run.managed.requireInvokerIam` (W3 pre-check) → if restricted,
  record and continue (the ingress decision lands at P8 with the PO).
- ZITADEL (P5): apps + redirect URI `${APP_ORIGIN}/api/auth/callback` registered EXACTLY BEFORE
  first deploy; audience pin = ZITADEL project id; MFA per PD-5.

## Phase 3 — DB bring-up (runbook §3 verbatim; W1/W2 execution)

1. §3 steps 1–6 ON_ERROR_STOP=1 as the project admin (bootstrap → hex passwords → migrate as
   mc_migrator with NO DSN search_path → runtime grants → bff-state + ownership → bff grants).
2. §3 step 7 SHOW probes through the session pooler (W1/W2 evidence). STOP conditions: any probe
   error → halt, diagnose retained state, fix forward (no destructive recreate without PD-7
   approval naming the resource).
3. TLS probe (§4 step 1) decides PD-8 (CA mount or not); record in the release note.

## Phase 4 — images, secrets, deploy (runbook §§4–5; W3/W4 execution)

1. amd64 image (buildx or Cloud Build) → digest pinned → values JSON → renderer (fresh OUT dir;
   optional keys only per PD-4/PD-8) → per-secret IAM (PI-02 negative check included).
2. migrate job → service (`invoker-iam-disabled` already in the template) → `$API_URL/healthz`
   external probe.
3. Worker: render worker profile → `wrangler deploy --var …` (flags from the renderer) → secrets
   (ring persisted in the password manager FIRST) → login-redirect capture (307 + S256 + state +
   nonce).

## Phase 5 — qualification (W5–W8) and smoke (runbook §6)

- W5 CPU observation decides PD-2 (Free vs Paid) BEFORE the 25 MiB uploads are treated as
  supported. W6 identity flow incl. revocation/TTL. W7 R2 byte-equality. W8 browser rows.
- §6 smoke rows executed verbatim as pass/fail records. Any mismatch between observed behavior
  and the §6 expectation = a finding, not a test to loosen.

## Phase 6 — after first deploy

- Keep previous revision/version until smoke passes (§9); `latest`-secret rollback limits apply.
- Backup: first operator-run `scheduled-dump.sh` with `MC_BACKUP_SCHEMA=mcapp,mc_bff` + the
  restore check (§7); record the summary line.
- Monitoring minimums (§8); budget alert per D2.

## Exit criteria of THIS prompt

"First deploy attempted with every locally-closable gate closed, every provider gate either
PASSED with evidence or STOPPED with the exact named missing input/decision, and the candidate
reviewed + committed." NOT an exit criterion: production-readiness, real data, SLA, $0.

## If something fails

Record command + exit + log excerpt (redacted) → classify: (a) source defect → back to the
candidate branch as a reviewed fix; (b) provider/state issue → fix forward per phase stop
conditions; (c) missing PO input/decision → add it to the Phase 0 table and stop that phase. Do
not improvise destructive recovery; do not lower TLS; do not guess audiences; do not touch the
coordination checkout's in-flight files.
