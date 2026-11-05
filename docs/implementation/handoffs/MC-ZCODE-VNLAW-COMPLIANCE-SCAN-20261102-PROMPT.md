# MC-ZCODE-VNLAW-COMPLIANCE-SCAN-20261102 — VN-law compliance feature scan (read-only)

## 1. Assignment

Scan **all product features** of this repo for Vietnamese-law compliance exposure using the installed skill `vn-law-check` (audit pháp lý website/app theo Luật BVDLCN 91/2025, NĐ 356/2025, Luật ANM 116/2025 + NĐ 333/2026, Luật GDTD 20/2023, Luật AI 134/2025, NĐ 142/2026). Deliver a report. **Read-only: do not modify or delete any existing code, config or document.** Your only writable outputs are the report namespace (§5).

Root: `/Users/nguyenvanlan/Documents/code/pet-projects/matter-control`, branch `codex/unified-project-flow`. This is an audit, not an implementation task: no fixes, no refactors, no doc edits, no commits.

## 2. Method (follow the skill's own process)

1. Invoke skill `vn-law-check` explicitly. Start from its `references/00-triage.md`.
2. Triage by scanning surfaces under `apps/frontend` and `apps/backend` (script `scripts/scan.sh <dir>` is read-only; if the tool hook refuses executing the script, replicate its signal greps inline — FORM/TRACKING/COMMERCE/AUTH/AI/FOREIGN_HOST — and record the refusal).
3. **Re-verify every script hit by hand.** The script greps blindly: hits inside `storybook-static/`, `pnpm-lock.yaml`, `.agents/` are build/dev artifacts, not app behavior. Determine the triage level from real signals only (auth, forms, data processing, AI, commerce, hosting).
4. Apply the checklists the level requires (level 3 → 01–08; non-applicable domains get one-line reasoning, not empty tables).
5. Map findings to **concrete product features and schema**, not generic advice: accounts/ZITADEL, workspaces/matters, documents/evidence (R2 object store), filings/approvals, review matrix, agenda, saved views, playbooks, intake, guidance, audit logs (`security_audit_events`), retention (`purge_after`/TB-06), export, hosting (Cloud Run `asia-southeast1`, Cloudflare Workers/R2, Supabase).
6. Cite legal instruments by exact number only where the checklist provides them; anything unverified stays `CHƯA XÁC MINH` — never invent article numbers or fine amounts.
7. Frame severity against the actual deployment status (LOCAL_CANDIDATE, no production users): 🔴 = must-close gate before serving real users; not a claim that a violation is occurring today.

## 3. Report format

Follow `examples/sample-audit-report.md` **Mẫu B** (full): header (date, triage result with signal evidence, applied checklists), overview table, 🔴/🟡/🟢 sections with `file:line` evidence + legal basis + recommendation, ⚪ domains grouped in one line with reasons, penalty reference (checklist 08, capped wording), and the mandatory closing "Giới hạn & khuyến nghị" per `DISCLAIMER.md` (AI-generated preliminary review, not legal advice; verify texts at thuvienphapluat.vn / vbpl.vn; consult a lawyer).

## 4. Evidence discipline

- Every finding cites repo evidence `file:line` from the actual tree, plus the legal instrument from the checklist.
- Record the commands run (all read-only: `find`/`grep`/`ls`/`sed -n`) in `commands.log` with UTC timestamps.
- Synthetic data only; never copy legal matter data, secrets or credentials into the report. Do not open `ops/p0-local/` secret files; cite their existence only.
- If a needed fact is not determinable from the repo (ZITADEL instance policy, Supabase project region, operator entity form), record it as an explicit open question instead of guessing.

## 5. Outputs (new files only)

- `docs/testing/vn-law-compliance-scan-20261102-r1/report.md`
- `docs/testing/vn-law-compliance-scan-20261102-r1/commands.log`
- Status vocabulary: `SCAN_RETURNED_IN_REVIEW` with open-question list; no DONE, no fixes claimed.
