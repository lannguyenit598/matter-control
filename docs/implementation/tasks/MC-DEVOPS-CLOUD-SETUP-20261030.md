# MC-DEVOPS-CLOUD-SETUP-20261030

- Owner: actual Codex (DevOps/Cloud per AGENTS.md) with a named human deployer. Prepared by actual Claude Code (Solution Architect) at direct PO request, 2026-10-30. Status: **READY_NOT_DISPATCHED**; default mode PREP, EXECUTE only under a PO-confirmed cloud authorization record.
- Priority: P0. Requirements: ADR-006 gates (Workers + Cloud Run `asia-southeast1` + Supabase `ap-southeast-1` + private R2 + ZITADEL), ADR-007 profiles, ADR-004 approved decisions, B1–B9, PI-02/03.
- Scope: phases 1–11 — accounts/budget guardrails; ZITADEL origin registration; Supabase TLS/Data API/roles/BFF schema; R2 bucket + scoped token; Artifact Registry, separate migrator/runtime service accounts, Secret Manager, linux/amd64 image by digest; migrate job; Cloud Run deploy; Worker secrets/vars/deploy with upload-size dry-run; synthetic A/B smoke and negative tests; monitoring, backup and keep-alive; release record, rollback, teardown. No source edits.
- Dependencies: `MC-ZCODE-DEPLOY-READINESS-FINISH-20261030` returned and intaken (role SQL, migration 0010, migrator SA split, release preflight, runbook); clean reviewed commit SHA (PO/Codex decide; DevOps does not commit); PO decisions D1–D3, D6–D7 recorded.
- Inputs / full prompt: `docs/implementation/handoffs/MC-DEVOPS-CLOUD-SETUP-GCP-SUPABASE-CLOUDFLARE-20261030-PROMPT.md`.
- Outputs: `docs/testing/devops-cloud-setup-20261030-r1/` (prep-report, phase-log, negative-tests, smoke-results, monitoring-and-backup, release-record, teardown-plan, return) plus `docs/deployment/cloud-authorization-record-<date>.md` and `cloud-inputs-<date>.md`.
- Acceptance: per-phase exit gates in the prompt; all negative tests PASS; no secret in chat/git/logs/evidence; every created resource listed with public ID; rollback and teardown ready.
- Reviewer: independent non-author (OpenCode for the 6 provider-only cases); PO retains cloud/policy/release decisions. DevOps evidence is not independent PASS.
- Completion evidence: none yet. Not DONE / DEPLOYED / `$0`.
