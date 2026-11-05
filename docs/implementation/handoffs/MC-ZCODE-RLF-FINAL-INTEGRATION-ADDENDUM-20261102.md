# MC-ZCODE-RLF-FINAL-INTEGRATION-ADDENDUM-20261102

Preparation status: PREPARED_NOT_DISPATCHED. This supplements the **same running** MC-ZCODE-REMAINING-LOCAL-FEATURES-20261102 assignment. Human delivery activates this addendum. Do not start another writer/session, restart planning, discard completed RLF work or stop at addendum intake.

Root `/Users/nguyenvanlan/Documents/code/pet-projects/matter-control`, branch `codex/unified-project-flow`, original source base `7bf198c103476f490ebbdf58b1bd563d0bba8a61`. Reconcile current dirty source and checkpoint before editing. Codex preparation inspected the live task/checkpoint read-only; it did not certify your evolving code or rerun your tests.

The five local features and role policies already approved remain the entire product scope. D-BF1 stays unchanged. No new P1/P2 capabilities, external provider, reminder, Office, AI, cloud, production deployment or paid service is added.

## 1. Complete integrated journeys, not just independent modules

Include these in RLF-08 and repair actual defects they reveal:

- Workspace OWNER publishes a playbook revision → Matter OWNER previews/applies the exact revision → created real work and dependencies appear in Work/Control Room/history; eligible dated records appear in My Agenda. Work created through a template follows ordinary Search authorization and indexing; publication never marks work complete/verified.
- Save an existing supported filter privately → leave/reload/restart → restore the same validated URL/filter/sort/density; a second user cannot enumerate/read/edit the saved view. Revoke access to the target and verify that applying it cannot disclose target data.
- Record Matter intake with an authorized document version → triage → explicitly convert once → reconcile the same command after an uncertain result → one resulting work record and durable request-to-work provenance. Confirm normal lists/Search/Agenda see only what their existing contracts permit.
- Draft guidance as EDITOR → publish as Matter OWNER → retain the immutable source/revision and display the appropriate contextual entry point; another Matter/user does not gain access. Referenced document promotion does not rewrite the old exact-version reference.
- Exercise stale CAS, two actors, forbidden/hidden resources, access loss, concurrent/replayed instantiation/conversion, and empty/partial/error states at the real FE → BFF → Go → store boundary.

Do not expand Quick Search's approved result groups merely to index new guidance/intake/playbook entities. Newly created ordinary work should work through the existing work group. A new search visibility contract requires a separate decision.

Use supported product UI/browser only when permitted. If unavailable, execute the available non-browser/API/contracts and prepare concrete UI steps; mark browser checks NOT_RUN. Never substitute a mock for independent or real-IdP acceptance.

## 2. Database readiness and recovery of the newly stored data

Reuse existing migration/sqlc/restore tooling. Do not create a parallel deployment framework.

- Test new migrations on both a fresh task-owned DB and a task-owned copy seeded at the pre-addition schema. Verify existing records/events/receipts/versions remain intact after upgrade. Do not edit an applied migration or down-migrate retained data.
- Run new feature queries with a realistic restricted runtime role and a separate migrator/owner role in the isolated fixture. Include precise SQL grants for new tables/sequences/schema as required. Do not grant superuser, DDL ownership or broad ALL PRIVILEGES to the runtime role to make tests pass.
- Verify needed foreign keys, uniqueness/idempotency constraints and indexes against actual list/lookup/cursor queries. Exercise a representative synthetic multi-Matter dataset and inspect query plans/row work; do not merely wrap unbounded per-Matter reads in one aggregate API and call it bounded.
- Extend the existing synthetic restore rehearsal to include Saved Views, playbook revisions/instantiation provenance, intake/conversion and guidance/publication/source links. Backup and restore DB plus relevant existing object references into a new owned target; compare persisted readback after a fresh application process. Missing/truncated/tampered artifacts must be detected or their exact unverified limit recorded.
- Check restore/script inventories for hard-coded table lists or row counts so new tables are not silently omitted. Do not run backup/restore against the user's paused retained DB/volumes.

This is local compatibility/recovery evidence, not production RPO/RTO, Supabase/R2 or deployment approval. Ordinary command receipts, audit events and their retention/immutability policies remain intact.

## 3. Every delivered feature must have a usable entry point

Provide one concise navigation map listing each actual route/button, visibility by role and its loading/empty/denied state. Keep new features contextual and progressively disclosed, not a wall of forms on the Matter landing.

Verify names rather than raw IDs, clear EN/VI labels, useful icons with accessible names, client timezone/DST helpers, searchable person/record selection, title links, compact/comfortable density, list search without full-document reload, Back/Forward and return-to context. Preserve forms/UNKNOWN attempts across locale/material changes. The sidebar's live locale fix remains intact.

Do not claim rendered/keyboard/touch/screen-reader or exact320/390px proof from source/jsdom/Storybook build alone. Record measured viewport and actual action when browser evidence is available.

## 4. History, Brief, authorization and resource limits must remain coherent

For each new event target kind and route, prove existing history and deterministic Brief reconstruction remain valid. Metadata-only publication/triage/view changes must not alter legal item state or become proof. Keep append-only events and exact as-of/cursor semantics.

Validate incoming bodies/filter definitions/cursors and explicit bounds using existing contracts/patterns. Make application and SQL scope agree before returning names/counts/previews. Enforce the approved per-user saved-filter privacy and Workspace/Matter playbook/intake/guidance roles at the server, not just by hiding buttons. Preserve OUTCOME_UNKNOWN as unresolved intent requiring original-key reconciliation.

Choose ordinary bounded implementation limits from current conventions and document/test them. Do not invent a new business retention policy or claim production workload guarantees. Request cancellation/timeouts must not turn an uncertain write into a false definite failure or trigger an automatic new-key retry.

## 5. Evidence timestamps and status correction

At addendum preparation, the clock tool reported **2026-11-02 16:40:54 UTC**. The current `docs/testing/zcode-remaining-local-features-20261102-r1/checkpoint.md` already contained headings `2026-11-02T21:15Z`, `22:10Z` and `23:15Z`, which are future times relative to that observation.

Verify whether these were local-time labels incorrectly suffixed Z or another recording error. Do not assume a conversion or invent execution times. Append an explicit provenance erratum referencing the original headings and actual retained command/tool receipts; preserve original text/logs. If the true timestamp cannot be established, label it NOT_ESTABLISHED. Use clock-derived ISO8601 UTC for subsequent receipts.

Checkpoint DONE labels mean author slice progress only. They do not close independent review, browser/human acceptance or whole-product completion. Source inspection, test execution and runtime results must retain separate fields.

## 6. Finish with an exact-source runnable handoff and independent-review delta

- Produce final backend and frontend gates once after the integrated source settles; rerun affected gates only when new edits/failures justify it. Include actual failures/skips and current source pins, not previous-candidate green claims.
- Prepare a minimal manual-start runbook for the exact final build/schema/config: prerequisites, existing commands, nonsecret configuration names/paths, ports, migration role, application role, health/login route, synthetic seed options, safe stop and recovery. Reuse/fix current runners where useful; do not add wrappers for their own sake. No secrets or automatic production provisioning.
- Prepare synthetic seed/fixture instructions for representative OWNER/EDITOR/VIEWER plus an independent verifier and populated lists; never create or modify real IdP users or bypass verification. A fake IdP is only a synthetic fixture.
- **Keep the retained FE/BE/DB/IdP stack stopped.** New task-owned isolated tests are governed by the original prompt; stop your test processes/fixtures at completion and retain their evidence/resource identities. Prepare the final build/run instructions without starting the user's manual environment.
- OpenCode's parallel review targets frozen commit7bf198c, not your new dirty candidate. Consume its actual findings if supplied, verify applicability and fix confirmed in-scope issues. Never inherit its baseline PASS as approval of the new features.
- Seal one final source manifest plus delta from7bf198c and a feature/risk-to-test matrix. Hand off the *completed* candidate and return to one nonauthor reviewer. Any prepared separate ZCode review task must remain separate from this author session; no self-awarded independence or duplicate writer.

Fold these checks into the current completion board and final report. Finish all safe independent work even when a specific human/provider/browser check is unavailable. No new per-wave permission questions, no commit/push/merge/deploy or whole-product DONE from this addendum. End with exact remaining blockers and the single next action for independent review.
