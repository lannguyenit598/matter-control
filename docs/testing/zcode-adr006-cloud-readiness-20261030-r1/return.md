# Return — MC-ZCODE-ADR006-CLOUD-READINESS (LOCAL_CANDIDATE stage)

Actual ZCode session (combined assignment; model account:zai-start-plan/GLM-5.3-Flash). 2026-10-30. Branch `codex/unified-project-flow`, HEAD `20feedbf…` unchanged, nothing committed; dirty work and other writers' bytes preserved; the mandatory B1–B9 addendum consumed and folded in. **No cloud resource created, no deploy, no IAM/DNS/secret/IdP/billing change, no retained-DB use, no real R2.** Stage: **LOCAL_CANDIDATE** (stage 1 of the ADR-006 promotion gates).

## Executed this session (fresh receipts)

| Item | Evidence |
|---|---|
| B1 least-privilege DB roles (pilot blocker) | `b1_least_privilege_test.go` on the labelled fixture: profile roles + private schema `mcapp`, migrations run AS migrator, **55 PASS / 0 FAIL** — full spine/W4/review contracts under the restricted runtime role; denials proven (DDL/TRUNCATE/append-only mutation/trigger-disable/role-assume/self-escalation); contract-derived DELETE grants discovered empirically (`b1-least-privilege-events.json`) |
| B2 index/plan evidence | extended harness: **ReviewHistoryCell 1.194→0.022 ms (~54×)** with the history keyset index (fixes the `review_answers_cell` ordering gap the addendum flagged); ListMattersOfActor 4× at 4.8k rows; parity + scale-1 counter-evidence recorded (`b2-index-plan-events.json`) |
| §4 durable session/pending state | design on Supabase PG (consistency argument vs KV/DO) + **SQL semantics PASS_SCOPED**: atomic rotation (1 winner of 10 concurrent), stale-generation replay refused, destroyed/expired fail-closed (`durable_session_reference_test.go`, `durable-session-events.json`) |
| §5 Cloud Run container | image built (distroless nonroot, sha 879a262f…), migrate-then-serve verified, **healthz/readyz 200** on 0.0.0.0:8080, **SIGTERM graceful exit 0 in 0.17 s**; config guards (K_SERVICE/fs, key-file parse) exercised (`cloud-run-profile.md`) |
| §6 Supabase readiness | B1 profile doubles as the role/schema answer (private schema = Data-API-deny-by-construction); pooler/pgx + managed grants = NOT_RUN (provider gate) |
| §3 adapter comparison | pinned research (2026-10-29): OpenNext 1.20.14 (Next ≥16.4.1 supported), vinext 1.4.0 (React 19.3.1 match); interim guidance OpenNext-led; **executed workerd PoC NOT_RUN** — reproducible `adapter-poc.sh` prepared with the full feature checklist |
| §8/§9 | CI/CD + runbook delta templates (`ci-cd-and-runbook.md`); cost model (every component), residency map (edge/R2 `apac`/ZITADEL outside Singapore), **cloud-validation-approval-packet.md** with staged resources/decisions |
| Inventory reconciliations | stale `/`→`/dashboard` redirect confirmed (route absent); session Map + transfer WeakMap confirmed at `session-store.ts:27`; CI = backend.yml+frontend.yml only |

## Stage disposition

**LOCAL_CANDIDATE — not READY_FOR_SCOPED_CLOUD_VALIDATION.** The gap to stage 2 is exactly: (a) executed adapter PoC on workerd (`adapter-poc.sh`), (b) Workers-side durable-state implementation (handoff-gated) + security review, (c) independent review of B1/B2/§4 evidence. Everything else in the packet is decision material for the PO, not local work.

## Blockers (prioritized, separated)

1. Local: adapter PoC execution; §4 frontend implementation behind the writer handoff; stale redirect fix (same handoff); in-flight SIGTERM drain under real load.
2. Provider verification (authorized stage): Supabase grants/pooler/Data-API negative, R2 SigV4 suite, Cloud Run deploy/IAM/domain, IdP readback, backup/restore rehearsal.
3. PO decisions: invocation model, strict-$0 interpretation (pause/overage risk is structural), residency scope (ZITADEL region, edge, R2 `apac`), adapter adoption, B3/B7 numeric policies (TB-06 stays open), B6 posture.
4. Independent acceptance: security review (§4 + Worker BFF), non-author verification of the B1/B2 tests and this packet.

## Skipped and risks

Skipped: any cloud/account action; §3 PoC execution (budget — script prepared); §7 transfer flow (depends on §1); retention purge function (B7 activation-gated); Storybook/other-session runtime issues (separate tasks). Risks: B1/B2 bind to the local fixture (managed Supabase behavior may differ); the durable-session SQL is design-verification, not the production implementation; free-tier numbers are dated public allowances, not entitlements; the A-01 backend receipt fix remains with the backend owner (untouched here). Resource disposition: all fixtures/containers/scratch removed after label checks; nothing retained.

Next exact action for the human: (1) hand the frontend auth/session + next.config paths to this task so §4 implementation and the adapter PoC can complete, or assign them to the session that will run `adapter-poc.sh`; (2) review `cloud-validation-approval-packet.md` and either authorize stage-2 resources or keep stage 1 open; (3) name the operator for the approval packet.
