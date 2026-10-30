# MC-ZCODE-ADR006-CLOUD-READINESS

Owner: actual ZCode (direct handoff 2026-10-30, prompt `docs/implementation/handoffs/MC-ZCODE-ADR006-CLOUD-READINESS-IMPLEMENT-PROMPT.md` + mandatory addendum `MC-ZCODE-ADR006-ZERO-TRUST-B1-B9-ADDENDUM.md`). Status: **LOCAL_CANDIDATE (stage 1) — IN_REVIEW_WITH_VERIFICATION_BLOCKERS**. Requirements: ADR-006 gates + B1–B9 zero-trust rows. Priority: pilot blockers first (B1, B2, §4 durable state, §5 container profile).

Base: branch `codex/unified-project-flow`, HEAD `20feedbf…` + dirty tree (preserved). Evidence: `docs/testing/zcode-adr006-cloud-readiness-20261030-r1/` — return.md, readiness-matrix.md, zero-trust-b1-b9.md, adapter-comparison.md + adapter-poc.sh (prepared), durable-state-design.md, cloud-run-profile.md, ci-cd-and-runbook.md, cloud-validation-approval-packet.md, three raw event logs, outputs-manifest.json.

Executed: B1 least-privilege profile (55/55 contracts-under-runtime-role + denials, fixture-verified); B2 measured index evidence (review history 54×, matter list 4×; migration 0009 drafted NOT applied); §4 durable-session SQL semantics verified (atomic rotation/fail-closed) + design on Supabase PG; §5 container verified (build/migrate/healthz/readyz/SIGTERM graceful); §3 research pinned (OpenNext 1.20.14 Next≥16.4.1 / vinext 1.4.0) with prepared PoC script (executed comparison NOT_RUN); §8 CI/runbook templates; §9 cost/residency + approval packet; stale `/dashboard` redirect + session-Map leads re-verified.

Blockers: adapter PoC execution + §4 frontend implementation (writer handoff-gated); provider verifications (authorized stage); PO decisions (invocation model, $0 interpretation, residency, adapter adoption, B3/B7 numbers). No cloud resource created or changed; no commit/push.
