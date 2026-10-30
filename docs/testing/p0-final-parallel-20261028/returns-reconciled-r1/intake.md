# MC-P0-RETURNS-RECONCILIATION-R1

Owner: actual Local Codex, priority P0 integration. Status: IN_REVIEW_WITH_VERIFICATION_BLOCKERS. Scope: intake OpenCode post-RV001 review and Claude runtime R2, establish current candidate/lifecycle identity, prepare bounded next reviews. This turn changes only new coordination artifacts; source, original returns and live resources are preserved. Reviewer: OpenCode for new source/evidence, human/authorized browser for rendered outcomes.

## Verified packets

HEAD remains `2d410816cd9a9b2664ec388a98aa8f5fdb8f00cc`. OpenCode output manifest SHA256 `a734e3f21a9a039dd9e020dbb4977476af42f6b9320243de06b5284d8abbba27`:4 listed payload hashes match (bytes are unspecified/null in that manifest). Claude output manifest SHA256 `d77db579700027ebecf1610cd2aa9c8d750ee65dd7db9c5916dbc5d8478ad26f`:46/46 payload bytes+hashes match. Counts exclude each manifest itself. This validates retained payload integrity, not all claims inside them.

Current candidate: `../local-admin-medusa-r1/source-manifest.json`, SHA256 `f43738bf6c1779811259a15160ab4445c1627997a1fdb2c33ec887f921401028`;721/721 current selected files match. Compared to original RV001719 manifest:18 existing files modified,2 added,0 removed,all frontend. The two steps are the4-path CSS-build correction (2 modified+2 added), followed by16 presentation modifications. Backend and the four RV001 helper/test files are byte-identical to the reviewed719 candidate. Review scope does not automatically expand to the20 new paths.

## Dispositions

| Item | Intake disposition |
| --- | --- |
| RV-001 | Retain OpenCode `CLOSED_SOURCE_ONLY` / `PASS_SOURCE_ONLY_WITH_LIMITATIONS` for the reviewed fix. Current helper/test hashes remain identical. Browser Back-link verification remains unobserved. |
| CR-001 | Review supports current observable error mapping; OR1-002 comment precision remains a P3 note. |
| CR-002 | DECISION_REQUIRED; no browser-payload persistence, server-slot extension or waiver selected. |
| OR1-001 | P3 caller-tripwire weakness remains open; current31sites/15files/1partial is reviewer evidence, not a guarantee that its regex catches every future syntax. |
| OR1-005 | Missing f9cbbdf4 pre-fix manifest remains LINEAGE_UNPROVEN. Existing f596b7c6→de8424ea entry-level comparison corroborates four-file lineage; do not fabricate the missing whole artifact. |
| OR1-006 | Old selection-rule wording omits three symlink-directory aliases. Their target SKILL.md files are covered. Record as selection metadata limitation; manifests are inventories of selected regular-file contents, not symlink topology certification. |
| Claude R2 restore | Retain AUTHOR_RUNTIME_VERIFICATION / PASS_LOCAL_SYNTHETIC, pending independent evidence review.54Matters/34tables/3objects,source marker1/restored0,negative checks are evidenced in retained exports. Current backend and restore scripts are unchanged since that run, so subsequent CSS/presentation edits do not require an automatic restore rerun. Frontend/IdP/production recovery is not covered. |
| Claude21HTTP cases | Retain scoped negative/preflight results on its pinned719 snapshot and own8084/3104 runtime; these are not hosted human login or browser acceptance. |
| R2-CSS-02 | Reproduced and author-corrected by Codex; fixed compiled CSS and served CSS verified in local-ui-css-fix return, new UI build verified in local-admin-medusa-r1. Independent closure still pending. |
| Source drift | Identified author: Codex, under the subsequent urgent local-run/CSS/UI instructions. These were known purposeful changes, not anonymous edits. Freeze/manifest coordination was incomplete; preserve Claude's original drift receipt and scope each result to its pins. |
| Dependency deviation | Retain Claude's admitted pnpm11 snapshot/symlink install deviation. Codex also had a separate sandbox pnpm native worker fail DNS/store linking; its worker was stopped and official frozen-lockfile install restored links. Later full check/build/Storybook/peers/audit passed. Do not erase either incident or claim installs were absent. |

OpenCode chronology limit: checks.json states observed close15:36:39Z, close to the subsequent source changes; C4 records the full member verification at open, while C12 lists packet/HEAD checks rather than an explicit second full-member output. The return claims full opening/closing member matching. Preserve that claim as reviewer-reported; request the closing member receipt/timestamp in follow-up rather than upgrading the claim to independently reconstructed telemetry. Current RV001 unchanged-byte confirmation supports the narrow closure independently of this chronology question.

## Current running instance and corrected blockers

Codex owns viewer frontend3000/API8081. Current frontend is the isolated `/private/tmp/mc-local-login-cij0dm22/frontend-medusa-r1` snapshot, parent72013, started2026-10-28T15:54:20.820003Z; runtime.json records source hash and commands. API listener49105 and database `mc_local_login_20261028t15261793175979z`/object root stay unchanged. This turn freshly observed login HTTP200 and API health OK. Old R1 retained-runtime lines and Claude's stopped8084/3104 stack are historical, not current ownership cues.

PO confirmed synthetic A `396984919567415686` has a verified usable account and supplied an authenticated Workspaces screenshot. Therefore A's blanket BLOCKED_EMAIL_VERIFICATION is superseded by HUMAN_CONFIRMED_ACCOUNT_READY / HUMAN_OBSERVED_SIGNED_IN_SHELL on the earlier live build. This is not automated proof of audience/refresh/roles or the latest presentation. Synthetic B verification remains unknown. No provider email/MFA policy changed.

Browser tooling remains independently blocked: Local Codex Work browser disabled; Claude reports cmux onboarding/Screen Recording incomplete. Neither is repaired or bypassed by this intake. Human may keep using the live app. Claude may use its public URLs for non-disruptive verification after tooling is available; lifecycle ownership is NOT transferred, so it must not stop/restart this viewer, install dependencies, copy cookies, or borrow the human's browser session. Role/revoke/outage/logout tests require an isolated fixture/session and coordinated slot.

## Next tasks

1. OpenCode: review20-path frontend build/UI delta and independently assess Claude46-payload restore/negative evidence. Use current721 pins, no full-source restart or mandatory restore rerun. Reconcile chronology/provenance notes explicitly.
2. Claude: consume the running-instance update; recheck permitted browser capability, then authenticated/browser cases with human-controlled login. If browser remains unavailable, return exact capability blocker and complete non-browser mapping, without another alternate-port login stack or restore loop.
3. PO: CR-002 remains a separate choice. A/B isolation, refresh/logout, full rendered/a11y/Golden Workflows and AC-137 still require actual evidence. No MC-002/release completion follows from these returns.

New prompts are prepared in this namespace; not dispatched/executed by their creation. No source fix, credential read, Docker/lifecycle action, commit/push or external provider call was performed in this intake.
