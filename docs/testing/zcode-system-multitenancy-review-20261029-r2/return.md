# Return — MC-ZCODE-SYSTEM-MULTITENANCY-REVIEW-20261029-R2 (Phase A)

Task: the Phase A half of `MC-ZCODE-SYSTEM-REVIEW-THEN-SOLID-GLASS-IMPLEMENT-PROMPT.md`. Owner: actual ZCode (this session). Status: **PHASE_A_SEALED_WITH_VERIFICATION_BLOCKERS** — all executable audit work completed on a pinned, drift-free candidate; the remaining checks are precisely named below and do not block proceeding to Phase B research/plan per the combined prompt.

## Verdicts (headline first)

- **Tenant model:** the product implements **Workspace + Matter logical multi-tenancy on one shared schema**; identity is provisioned `(issuer, subject)`. There is **no organization/customer entity** — two independent firms on one deployment are separated only by operational convention. One person may hold many workspace/matter memberships; workspace OWNER does not read confidential matters without explicit membership.
- **End-to-end isolation:** **SUPPORTED_WITH_LIMITS** for the implemented workspace+matter model — central default-deny gate, in-transaction membership re-resolution, uniform hidden/role denials, matter-scoped composite FKs, actor-scoped receipts with current-access replay authorization, all re-verified by fresh-PG race contracts plus three new reviewer negative tests (cross-cell cursor, foreign-grid anchor, cross-matter idempotency).
- **Independent-firm SaaS suitability:** **NOT_SATISFIED as an organization-level SaaS** (missing org boundary/lifecycle, per-firm ops, retention executor; people directory must stay disabled on shared issuers). This bounds claims; it is not a P0 defect — P0 never promised org tenancy.
- **RMV-F01..04:** all four **independently reverified** on the corrected candidate: F01/F03 via fresh-PG HTTP tests (expectation presence 428/400 precedence; 101-answer bounded keyset history with truthful `total:null` + reachable oldest row + per-page ACL); F02/F04 via isolated corrected frontend tests (42/42 incl. cell-detail 8, answer-form 4). Remaining for *closure* (not for this audit): rendered second-user revocation / lost-response journeys on a runtime running the corrected binary.
- **Timing fixes:** mechanism-accepted with limits; my isolated rerun of the corrected review-list/upload-attempt suites passed once; one clean run is not a reliability proof (the author's ×8 repeat evidence remains theirs).

## Top items (full detail in findings.json / remediation-plan.md)

1. **SYR-F01 (P3, decision-required):** no organization/customer entity — decide the multi-firm tenancy stance before any multi-company claim.
2. **SYR-F02 (P3, defense-in-depth):** review-matrix storage invariants enforced only by the service (global supersedes FK, unscoped revision FK, no revision-existence CHECK). No API bypass reproduced; the Matter lock + server-side selection close the API path.
3. **SYR-F03 (P3, ops):** retention executor absent (TB-06 open; `purge_after` nullable by design).
4. **SYR-F04 (P3, deployment guardrail):** `MC_LOCAL_PEOPLE_DIRECTORY` (default false) enables same-issuer person discovery for workspace OWNERs — approved local scope; refuse it in production deployments until an org boundary exists.

## Authorship / independence

ZCode authored the W1 spine + FE baseline earlier (AUTHOR_REVIEW portions of this audit); the workbench/fidelity surfaces (Claude) and the RMV corrections (ZCode rework session) were reviewed as nonauthor byte reads with their own test reruns here. Final independent acceptance of those surfaces still belongs to a separate nonauthor reviewer; this audit does not self-approve them.

## Executed vs NOT_RUN

Executed (all on the isolated copy at /private/tmp/mc-sysrev-20261029-r2, bytes verified against the 512-file pin, zero drift at close): PG race contracts 64.4s PASS; service+HTTP race PASS; focused RMV-F01/F03 PG tests PASS; people-directory PG test PASS; 3 reviewer negative tests PASS; isolated frontend review+upload suites 42/42 PASS; fixture label-checked and removed; no secrets retained in this namespace.

NOT_RUN (exact unblock): (1) authenticated rendered journeys — needs a runtime running the corrected binary + source/build/DB identity handoff (retained :3000 does not qualify: its module graph predates the corrected backend); (2) second-user live revocation — needs two browser sessions with human-assisted login; (3) real R2 URL expiry/revocation — provider calls out of scope; (4) as-deployed DB role grants/migrator separation; (5) full `make check`/`pnpm check` reruns — my executed subset covers the isolation-critical packages; the author's full-gate receipts remain cited, not re-executed here.

## Next exact action
Proceed to Phase B (Solid Glass research + plan) consuming this sealed packet and the UI-consistency audit as mandatory inputs. Phase C edits remain gated on the frontend writer handoff; the audit findings stay open and unchanged by any visual work.
