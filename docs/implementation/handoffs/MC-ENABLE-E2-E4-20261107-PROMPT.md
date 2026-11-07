# MC-ENABLE-E2-E4-20261107 — Dispatch prompt (enablement: stub-IdP browser login E-2 + fault-injection E-4)

Task ID: MC-ENABLE-E2-E4-20261107
Purpose: close the two unowned enablement gaps that block the **D-1(b) populated walkthrough env** — which in turn unblocks: the D-23 on-dialog final contrast measure, the V-01..V-14 populated-UI checklist, the usability dataset M1–M5 + T10 replay, and the pending G1 positive two-actor browser path.
Executor: PO routing (proposed actual ZCode; enablement was historically a Codex intake item — either is fine, record actual identity). This is enablement/ops work, not product feature work.

## 0. Mode

- Changes allowed ONLY in: enablement scripts, local IdP/ops configuration for the **loopback-only local env**, docs/runbooks, and your evidence dir. NO product code changes (`apps/backend`, `apps/frontend` product sources stay untouched). No commits without the task-scoped authority note below; no secrets in git (ops/p0-local secrets stay 0600 and untracked, per existing practice).
- Commit authority: pre-authorized task-scoped for scripts/docs/ops-config of this task only.
- Loopback-only constraint is absolute: nothing listens on a non-loopback interface; synthetic data only.

## 1. Discovery first (do not skip)

Read before designing — these artefacts already exist:

1. **CO-17 enablement minifix**: scripts + stub IdP + smoke `readyz 200/401/200/401` (`417fa...`/`ed23be3` era — find under `docs/testing/` + `scripts/`), teardown completed then.
2. **US-PREP r1**: dataset M1–M5 + T10 replay case + scripts A–F + thresholds (`docs/testing/usability-prep-20261101-r1/`) — the walkthrough this env serves.
3. **ops/p0-local ZITADEL bootstrap notes** (v4.16.0, issuer `http://localhost:8080` pinned, loopback-only, web app 396855005899980803, users mc-alice/mc-bob) + known gaps: ZITADEL authorize rejects the configured redirect_uri; callback pinned `:3000`.
4. **UX audit 2026-10-30 blocker 3** ("NO populated local path": demo 503s product data; authorize redirect_uri; callback pin) — the authoritative problem statement.

## 2. Deliverables

### E-2 — stub-IdP browser login (the core gap)
- Goal: a real-browser login path against the local IdP that lands in the populated app (login → authorize → callback → session cookie → product data renders), reproducible from one documented command/script.
- Fix what blocks it (all loopback-local, all recorded): redirect_uri registration vs the configured callback host/port, callback port pinning, any UI/server env needed (`API_MODE`, seed data switch). Prefer fixing configuration/registration over adding code; if a code change turns out unavoidable, STOP that piece and report it as a decision request instead.
- Verify with a scripted browser run (Playwright `channel:'chrome'`): login both seeded users (mc-alice/mc-bob), screenshot populated surfaces, record timings; keep the smoke `readyz` sequence green.

### E-4 — fault-injection hooks
- Scripts to, from one command each: stop/restart the API cleanly; inject added latency / 5xx on the product API path (loopback proxy or server-side switch — pick the smallest mechanism the stack already supports); restore normal. Each fault script must have an obvious inverse; nothing persists after teardown.
- Demonstrate each fault once with evidence (what the UI/API shows during the fault) — this feeds the usability scripts' fault steps.

### Runbook + handoff
- Update the enablement/walkthrough runbook section (find the CO-17/US-PREP runbook location during discovery): one "walkthrough env up" procedure, one "down" procedure, prerequisites, and the D-1(b) unblock note.
- Evidence: `docs/testing/mc-enable-e2-e4-20261107-r1/` (`return.md` + `evidence/` + `commands/`), register section appended (re-read before insert).

## 3. Gates

- End-to-end walkthrough smoke: fresh env up → browser login (both users) → populated surface screenshot → fault-inject (one fault) → restore → env down → **ports/processes/containers all clean** (nothing left running).
- Repeat the full cycle once from the runbook alone (cold start) — the runbook must be sufficient without session memory.
- Existing smoke suites that touched these paths (readyz sequence) stay green.

## 4. Runtime rules

`rtk` prefix on every shell command; no `sed`/`perl -i` (Mimosa); no `timeout` cmd; `openssl rand` for secrets generation if needed (never commit them); shell vars do not persist between Bash calls; Semble-first for code exploration; check ports (`:3000`, `:8080`, `:6006`) before starting anything; never kill processes you did not start.

## 5. Return

Task ID · actual agent identity · changed files (scripts/docs/ops-config only) · what the browser path now proves vs still does NOT prove (explicitly: populated app ≠ production behavior) · tests run/NOT_RUN · risks · proposed next status. End with skipped + remaining risk. Do NOT claim: IdP hardening, production readiness, or that D-1(b) measures are done — they become RUNNABLE, not done.
