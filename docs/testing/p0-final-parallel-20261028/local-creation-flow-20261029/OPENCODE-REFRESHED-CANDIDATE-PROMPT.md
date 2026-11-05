# MatterControl — refreshed candidate source review

Prepared handoff only, not dispatched. When the human assigns this prompt to actual OpenCode, review the current local candidate as an independent nonauthor. Identify actual tool/version/provider/model without changing them. Do not reuse your historical R2 verdict as acceptance of the new tree.

Root: `/Users/nguyenvanlan/Documents/code/pet-projects/matter-control`.
Branch: `codex/unified-project-flow`.
Expected HEAD: `20feedbf06c859a9806055d609f5b132fe8bb086`.
Input namespace: `docs/testing/p0-final-parallel-20261028/local-creation-flow-20261029/`.
Candidate manifest: `source-manifest.json`, SHA-256 `975b108323ad3a3f821472414fc778504a7d2f9bf7a163c0450f1eb8dac8f165`.

Mode: READ_HASH_STATIC_ONLY, with focused pure tests permitted through installed local tool entries after source inspection. No install/relink/pnpm exec, reviewed runtime lifecycle, Docker/SQL, IdP/browser/private reads, provider/model changes, messaging, staging/commit/push, old-artifact rewrite or source edits. No authorization for sending private credentials/legal records. If your configured approval mechanism refuses an action, keep it refused and report the specific blocker; do not switch host/tool/context to evade it.

First verify HEAD and all 675 manifest entries (bytes+hash). Recheck before closing. On drift return NEEDS_INPUT_REFRESH; never silently regenerate pins. Selection differs from prior 724/721 manifests: current nonignored regular backend/frontend/root-workflow files; 65 old selected paths were removed by the newer legacy-stack deletion, and additions/changes are explicit in source-delta.json. Hash the named source-delta/return/review inputs in your own input record; do not invent missing historical baselines.

Read the new return, external-intake.json and browser-observations.json; PM/BA proposal/reviews in `docs/design/creation-flow-ux-r1/`; relevant approved rules/permissions and the manifest-selected source needed for these scopes:

1. Directory changes: default-off local flag, OWNER-only reads, same provisioned issuer, literal name search, 20-result bound, active membership exclusions, no authorization leakage and unchanged command CAS. Inspect the named sqlc query, generated output, service, API handlers and tests. PostgreSQL execution is out of scope; cite author evidence honestly.
2. Creation flow: shared Requirement/Action panel, controlled exclusive disclosure retaining both form instances; no state/type/permission coupling; canonical Requirement/Document/Filing success routes; truthful empty/prerequisite actions. Review scoped draft bindings for Workspace/Matter/Requirement and their remount tests. Check callers and preserve unknown-outcome/error handling.
3. Claude integration: retained `fc09bec` CR-002 shared persistence/upload logic and `20feedb` configuration/migration/in-flight/boundary guard. Look for regressions from remaining Codex hunks in three shared Go files and document-forms.tsx. No new rate-limit or protocol decision. Do not call CR-002 independently accepted just because its source is committed or author tests pass.
4. Historical R2: preserve old 20-path PASS/retained-restore PASS and NEEDS_INPUT_REFRESH on their own bytes. Assess material new deltas and avoid relabeling previous audit history. New browser evidence is author-run, observed B display identity only; it is not A/B isolation, full IdP acceptance, independent UX or a fresh restore.

Focus tests, if useful: actual installed Vitest entry with creation-reload, intent-attempt, upload-attempt, work-creation-panel and relevant action/picker tests. No fake browser success, authentication stubs as runtime proof or packages installed to make a test run. Keep tests you personally ran distinct from 506 author tests/build and make-check citations. Full PG/restore/browser/release remains out of scope.

Only output to a new absent directory `docs/testing/p0-final-parallel-20261028/review/opencode-current-candidate-r3/`: return.md, inputs.json, checks.json, findings.json and an outputs-manifest that excludes itself. If occupied, stop for collision resolution; do not overwrite or write into earlier namespaces.

Return separate source verdicts for directory, creation/client recovery and backend/Claude integration; preserve runtime/independent/human limitations. Each real finding needs severity, exact path/line, trigger/impact and smallest correction. End with skipped work, remaining risk and exact next action. Do not mark MC-002, CR-002 runtime, product security, cost, restore or release DONE.
