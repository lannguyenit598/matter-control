# Phase 0 execution record — MC-PO-DEPLOY-EXECUTION-20261104 (r1)

- Executor: actual ZCode session (GLM-5.3-Flash harness), per the PO-dispatched phase-gated
  deploy-execution prompt. Phase 0 = PO inputs; everything below was either executed by the
  agent where the PO explicitly authorized it, or is recorded verbatim from PO answers given
  in this session (chat, 2026-11-04 ~23:55 → 2026-11-05 ~00:05 Asia/Ho_Chi_Minh).
- Honesty rule intact: no deploy-ensured claim; Phase 1 (r2 re-review) still pending; nothing
  here closes W1–W8 or provider qualification.

## 1. PO decisions (verbatim from chat AskUserQuestion, 2026-11-04/05)

| Item | Decision |
|---|---|
| PD-1 Supabase plan | **Free** (manual pause-resume accepted per §8) |
| PD-2 Workers plan | **Free** — start Free; final decision AFTER W5 CPU observation |
| PD-3 people directory | **OFF** for pilot |
| PD-4 Metadata Quick Search | **OFF** (MC_SEARCH_CURSOR_KEY stays absent) |
| PD-5 ZITADEL | **new pilot instance** + admin MFA required; end-user MFA separate |
| PD-6 residency | **accepted for synthetic pilot**, explicitly NOT a residency exception |
| PD-7 first-release recovery | **retain-state forward-fix**; destructive drop/recreate stays forbidden without a separate explicit PO approval naming the exact resource |
| packet D7 numeric workload | **ACCEPTED as pilot defaults** — in-flight 10, concurrency 10, maxScale 3, pending 5 MiB (chat ratification 2026-11-05; the runbook register cell remains OPEN on the pinned bytes by design — bytes pinned for r2; this record + the eventual commit message are the ratification trail; flip the cell only in a post-r2 revision) |
| packet D2 budget | **alerts 1/5/10 USD, no hard cap** (create after billing link) |
| Provisioning method | **CLI auth — agent executes Phase 2** with PO-logged-in CLIs |

PD-8 (Supabase CA mount) remains probe-decided at runbook §4 step 1 — unchanged.

## 2. Operator env file

- Created `~/.mc-pilot/env.sh` verbatim from runbook §0 (non-secret identifiers only,
  mksecret/bindsecret helpers), dir `0700`, file `0600`; sources cleanly in zsh.
- Filled with verified/decided values: `GCP_PROJECT=mattercontrol-pilot` (created, §4 below),
  `R2_ACCOUNT=049fa5237a6a7f0a6659d009af1189c1` (from `wrangler whoami`).
- Still EMPTY (phase-owned): RELEASE_SHA, SA_RUN, SA_MIGRATE, SB_REF, SB_POOLER, CF_SUBDOMAIN,
  APP_ORIGIN, OIDC_ISSUER, OIDC_WEB_CLIENT_ID, OIDC_API_CLIENT_ID, ZITADEL_PROJECT_ID, OUT,
  IMAGE, API_URL. `MC_SRC=$HOME/mc-deploy` — worktree deliberately NOT created yet (needs the
  Phase 1 release SHA after the r2 PASS commit).

## 3. Tooling floor (runbook §0) — CLOSED

go 1.27.3 · node 24.22.1 · corepack 0.36.0 · pnpm 12.11.2 · wrangler 4.156.0 (repo pin, via
`apps/frontend/node_modules/.bin/wrangler`) · gcloud 576.0.0 (≥490) · jq 1.7.1 ·
openssl 4.1.0 on PATH + Homebrew openssl@3 5.9 (TLS probe possible, no LibreSSL) ·
docker 29.9.2 · **aws CLI 2.39.3 INSTALLED this session (brew)** · **supabase CLI 3.0.0
INSTALLED this session (brew)** · psql/pg_dump/pg_restore absent → container route (documented
in §0). Brew also reported unrelated untrusted taps (derailed/k9s, lbjlaq/antigravity-manager,
steipete/tap) — noted, not acted on.

## 4. Provider actions executed (empty resources only; commands + exits UTC+7)

| UTC time | Command | Result |
|---|---|---|
| 2026-11-04T17:00Z | `gcloud projects create mattercontrol-pilot` | SUCCESS — project created, cloudapis enabled; project number 258638029370 (describe below) |
| 2026-11-04T17:08Z | `gcloud projects describe mattercontrol-pilot` | projectId mattercontrol-pilot, projectNumber 258638029370, createTime 2026-11-04T17:08:49Z (active account lannguyenit598@gmail.com) |
| 2026-11-04T17:01Z | `gcloud billing projects link mattercontrol-pilot --billing-account=011DAF-C42C97-F11242` | **FAILED — IAM_PERMISSION_DENIED**: `billing.resourceAssociations.create` on billingAccounts/011DAF-C42C97-F11242 (exact named gap below) |
| 2026-11-04T16:58Z | `wrangler whoami` (read-only) | logged in as lannguyenit598@gmail.com, Account ID 049fa5237a6a7f0a6659d009af1189c1 — **OAuth token has NO R2 scope** (named risk for P3) |
| 2026-11-04T16:58Z | `gcloud billing accounts list` / `billing projects describe project-a46636c0-…` | active account sees 0 billing accounts; existing project "Star S Viet Nam Global Resoure" is billing-enabled under 011DAF-C42C97-F11242 |

## 5. Named gaps — the ONLY remaining Phase 0/2 human actions

1. **G-BILLING-LINK**: link `mattercontrol-pilot` to billing account `011DAF-C42C97-F11242`.
   Options: (a) in console (Billing → Account management → Link a project) with an account
   that has billing.resourceAssociations.create, or (b) `gcloud auth login` with the company
   account (`v-lannguyen@infinitepl.com`) and tell me — I re-run the one command. P4 stops
   until this lands (API enablement/AR/SAs need billing).
2. **SUPABASE LOGIN** (P2): `supabase login` (CLI installed) + tell me the org to create the
   pilot project in. I will then create the Singapore project + record ref/pooler/CA.
3. **ZITADEL PILOT INSTANCE** (P5): web signup on zitadel.cloud per PD-5 (new instance, admin
   MFA enrollment — human step), then give me the instance URL; app/redirect registration I
   can drive via API with a machine-user PAT (or you do it in console).
4. **CLOUDFLARE R2 SCOPE** (P3): current wrangler OAuth token lacks R2 scopes. Either
   `wrangler login --scopes-list`/re-auth with R2 scopes added, or create a bucket-scoped API
   token in the dashboard (the runbook already requires a bucket-scoped token for Object Read
   & Write) and put it in the password manager — I will use it for the bucket check.
5. **PHASE 1 (unchanged)**: paste
   `docs/implementation/handoffs/MC-OPENCODE-PILOT-DEPLOY-READINESS-REVIEW-R2-20261104-PROMPT.md`
   to OpenCode; no commit of the candidate until the r2 verdict.

## 6. Boundaries

No product traffic, no paid plan enabled (PD-1/PD-2 = Free), no destructive action, no secret
materialized outside the password-manager flow, rtk used as proxy, no refusal bypassed. The
candidate bytes on `codex/pilot-deploy-readiness-20261103` remain pinned at diff
`20d02870…` — untouched by Phase 0.

## 7. Ownership change (2026-11-05, PO in chat: "ok cloud để tôi tự làm")

Resource creation switches from agent-CLI to PO self-service (console) for: billing link,
Supabase project, ZITADEL instance/apps/users, R2 bucket + bucket-scoped token. Agent retains:
P2.1 provider probes, §3 DB bring-up via the `~/.pgpass` (0600) channel, CLI steps once access
exists (GCP APIs / Artifact Registry / 2 SAs / budget alerts 1-5-10 USD after billing link),
W1–W8 evidence recording. Exact resource names to use come from the pinned runbook (§0/§2–§5):
`R2_BUCKET=mattercontrol-pilot-objects` (private, APAC hint), `WORKER_NAME=mattercontrol-pilot`,
`GCP_REGION=asia-southeast1`, Supabase **Singapore, Free**, ZITADEL redirect
`${APP_ORIGIN}/api/auth/callback` (register apps exactly before first deploy), audience pin =
ZITADEL resource **project** id. Secrets go to the password manager ONLY — never chat/env.sh/git.

Companion guide for the self-service path written the same day:
`po-selfservice-guide.md` (this directory) — per-resource console steps with exact names from
the pinned runbook, secret channels (~/.pgpass, ~/.mc-pilot/* 0600 files), handback table, and
the app-registration timing rule (redirect registered exactly before first deploy). ZITADEL
flow cross-checked against current docs (quickstart, PKCE guide, users overview) 2026-11-05.

## 8. Phase 1 — candidate committed (2026-11-05)

- Trigger: OpenCode r2 verdict **PASS_WITH_LIMITATIONS**
  (`docs/reviews/pilot-deploy-readiness-opencode-review-20261104-r2/review.md`), which
  re-affirmed r1 FA1/2/3/5 on new pins, resolved FA4 (D7 = OPEN — PO with real citations),
  adopted both MINORs.
- Pin re-verification immediately before staging: tracked diff SHA-256 `20d02870…` +
  **21/21 per-file hashes EXACT match** (19 r1/recovered manifest + 2 fix-loop files).
  Staged set verified = exactly the 21 candidate paths, nothing else.
- Commit **`040441900b03b605bf45a8f087c2675ddaaf8944`** on `codex/pilot-deploy-readiness-20261103`
  (base 048776b): 21 files, +1709/−366; message cites the r2 verdict + full pins + provenance
  chain (fbb487eb → 164db6e8 → 20d02870) + NOT-claimed list. Worktree clean after commit.
- Mimosa PreToolUse git-gate: did not fire (consistent with the 2026-10-31 playbook
  observation). No refusal encountered, none bypassed.
- **RELEASE_SHA = `040441900b03b605bf45a8f087c2675ddaaf8944`** → `~/.mc-pilot/env.sh`
  (`RELEASE_SHA`) + MC_SRC worktree `~/mc-deploy` created detached at exactly this SHA, clean.
- Attribution: commit executed by the ZCode session executing MC-PO-DEPLOY-EXECUTION-20261104
  per PO dispatch (Phase 1 label "Codex commits" superseded by the PO's single-session
  execution choice); independent control = the r1+r2 actual-OpenCode verdicts bound to the
  pins. **NO push** (DEC-20261031-01); no deploy authorization implied; W1–W8 NOT_RUN;
  P1–P3 open proposals for separate assignments.
