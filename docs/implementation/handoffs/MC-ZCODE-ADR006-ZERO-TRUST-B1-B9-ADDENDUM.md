# ADR-006 readiness — B1–B9 zero-trust workstream

Consume this addendum as part of `MC-ZCODE-ADR006-CLOUD-READINESS-IMPLEMENT-PROMPT.md`. Resume its existing checkpoint. Preserve the Workers→Cloud Run→Supabase/private-R2 topology and its local-only implementation/cloud-approval boundary. All nine rows must have an evidence-backed disposition; none is automatically accepted solely because it is called zero trust.

This addendum authorizes repository artifacts/local synthetic tests within the readiness assignment and actual writer handoff. It does not authorize live grants/migrations, account policy, secret rotation, device enrollment, cloud schedulers, billing or external alerts. Keep unrelated active source writers intact. No second implementation session for these paths.

## Preparation facts to reverify

On2026-10-30, inspected migrations0001..0008 contain trigger guards but no role-grant profile. Existing primary/unique indexes are real indexes: do not count only CREATE INDEX statements. Specific secondary indexes include `matters_next_boundary`, event/criteria/dependency indexes and `review_answers_cell(grid_id,version_id,question_id,id)`. The latter is not ordered by the new history key `(answered_at,id)`.

`command_receipts.purge_after` remains nullable and normal receipt/receipt-Matter mutation is blocked by append-only triggers. The application has in-flight concurrency admission, not an independently verified per-actor/time rate limiter. These are current source facts, not account/runtime measurements.

## B1 — Actual least-privilege database roles (pilot blocker)

Prepare explicit migrator/schema-owner, runtime and narrowly separated maintenance roles using the actual query/column/table inventory. Runtime must not be database/table/schema owner, superuser, BYPASSRLS, CREATEROLE or a member able to assume the owner. Restrict schema/database CREATE, function execution, TRUNCATE and replication/trigger-bypass powers. Revoke unwanted PUBLIC/anon/authenticated/Data API privileges according to the selected Supabase schema profile; include default privileges for objects created by future migrations.

Grant the exact DML each table needs, not blanket SELECT/INSERT/UPDATE/DELETE on all tables. Append-only legal events, receipts and evidence/version/review history generally need read/append only; application UPDATE/DELETE should remain denied where the contract forbids them. Inspect trigger-function reads, RETURNING, sequences and cross-table constraints so valid transactions still work. Do not globally grant EXECUTE on every function or allow unreviewed SECURITY DEFINER escalation.

Run full representative contracts under the restricted runtime login on a fresh owned local PG fixture, not only as postgres/schema owner. Include negative DDL, TRUNCATE, trigger disable, forbidden UPDATE/DELETE, unexpected schema/function execution and positive allowed-command tests. Prove the runtime cannot turn off the guard before calling a trigger meaningful defense. Provider-role behavior remains a separate Supabase validation gate.

Deliver SQL/profile, privilege matrix and repeatable tests. New source can be prepared locally; do not change grants on retained or hosted databases.

## B2 — Query-driven indexes and bounded availability

Review actual queries/plans and existing primary/unique/secondary indexes before proposing additions. Candidate access paths include matters by(workspace_id,id), memberships by(user_id,status,parent_id), and answer history equality predicates followed by(answered_at DESC,id DESC). Choose column order/partial predicate from actual predicates and ordering, not from table names alone.

Use realistic synthetic multi-workspace distributions and EXPLAIN(ANALYZE,BUFFERS), with fresh statistics and before/after plans. A seq scan on a tiny fixture is not itself a defect; “every count will seq-scan” is a hypothesis to measure. Verify cursor correctness and write/storage overhead. Avoid redundant indexes already covered by an existing key.

Prepare additive migration(s) after inventorying the latest migration number. Do not edit applied0001/0008 or assume0009 is free. Select transactional versus concurrent-index rollout from the migration tool's actual capabilities; account for failed/invalid index recovery. Run in disposable fixtures only. Live schema changes require the named deployment/migration action to be approved; drafting and testing a migration is not executing production DDL.

Deliver index/plan evidence and expected rollout lock/storage impact. Keep per-tenant scale/noisy-neighbor claims bounded to measured workloads.

## B3 — Rate admission distinct from concurrency

Keep the existing in-flight cap and503 contract. Define a separate per-time admission policy for authenticated actor/tenant and an appropriate pre-auth edge/IP shield. Use identity claims only after verification; trust forwarded IP headers only from the declared proxy path. Test spoofed headers, shared NAT, actor switching and direct API access. An edge-only limiter is ineffective if an unprotected direct API endpoint bypasses it.

For multi-instance deployment, specify where counters/atomicity live and what occurs on counter failure, restart or partition. An in-memory counter is a local shield, not a guaranteed global quota. Do not add Redis, paid WAF or another managed store without documenting topology/cost and permission implications. Reuse the selected available runtime primitives only where semantics actually fit.

Time-based rejection uses a documented429/Retry-After response; preserve idempotency/UNKNOWN behavior and never mark a refused request as committed. State the failure policy and test it without introducing auth bypass. Numeric quotas/burst/counter retention are proposed profile inputs, not implicit PO-approved production limits. Prepare code/config/tests for supported policy, and gate activation of unresolved numbers/cloud controls on the narrow decision.

## B4 — Encryption in transit on ADR-006, not a new topology

Document every hop: browser→Worker, Worker→Cloud Run, Go→Supabase, Go→R2, both services→ZITADEL and backup/control-plane paths. Require authenticated HTTPS/TLS with hostname validation on actual external endpoints and secure cookies/public origins. Inspect trusted proxy/forwarded-proto handling and prevent plaintext or mixed-origin fallback.

Cloud Run terminates incoming TLS and passes HTTP/h2c to the container under its managed networking contract. Go listening with HTTP inside Cloud Run is not alone a missing-encryption finding. Do not insert application TLS just to remove HTTP from local code. Verify the exact managed deployment configuration and external HTTPS behavior after authorization.

mTLS is an optional distinct threat-model/identity decision, not a universal prerequisite and not a synonym for Google IAM invocation auth or Cloudflare service tokens. Do not switch to self-hosting/Cloudflare Zero Trust, enable WARP or weaken IAM to solve this addendum. Prepare any optional proposal and its Worker compatibility/cost separately.

## B5 — At-rest protection and key boundary

Correct the premise “Postgres and object store are not encrypted” by separating local fixture disks, managed Supabase/R2 protection, application-level sensitive state and copied artifacts. Official provider documentation describes Supabase database/backups and R2 objects as encrypted at rest; verify the actual service/plan/resource scope rather than treating provider statements as account-specific proof.

Inventory databases, objects/versions, pending transfer content, OIDC tokens, secret files, dumps, exports, CI artifacts/logs, local temporary files and backup copies. Document keys/access/rotation/recovery and provider/operator trust boundaries. Durable access/refresh-token storage still needs the application security design; provider disk encryption alone does not protect tokens from an authorized DB reader.

Do not add custom encryption to all legal documents blindly: evaluate integrity/version hashes, streaming, content access, metadata, search and restore/key-loss implications first. New CMEK/SSE-C/KMS services or application encryption policy need a concrete requirement/cost decision. Protect locally produced backup/export files and keys through the approved mechanism; do not claim a local file is encrypted because its mode is0600 or its directory uses a cloud provider name.

## B6 — MFA and optional device posture

Prepare an IdP policy checklist for ordinary users versus privileged operators, MFA enrollment/recovery/break-glass, session/step-up requirements and audit evidence. Check whether trusted token/session claims expose the required assurance and whether the app must enforce step-up for any approved sensitive action. “Only IdP configuration” must not hide a required application assurance check.

Device posture is a separate managed-access/enterprise policy: document whether it is actually in the pilot threat model. FileVault/OS/EDR checks require supported enrollment, tooling, user/privacy consent, license and exception/recovery procedures. Do not assume Cloudflare WARP/posture is selected by ADR-006 or free/available; do not install/enroll or change ZITADEL tenant MFA in this local task.

Test any application assurance validation with synthetic claims, but mark real IdP policy/effective enforcement as NOT_RUN until authorized readback/browser checks. Never bypass MFA/email verification to produce a passing test. Collect the smallest actual PO/operator policy decision, not secrets or verification codes.

## B7 — Receipt retention and maintenance without opening a delete bypass

Keep TB-06 open until actual receipt retention, retry/reconciliation window, legal audit retention and backup/restore policy are resolved. These are distinct data classes. Check retention against maximum admissible key age, retry/command duration and clock allowance so deletion cannot permit an old key to create a second effect. Preserve the applicable strict inequality/margin requirements from current approved contracts.

Design a bounded purge that cannot be invoked by the ordinary runtime. Do not give the app trigger-disable/owner privileges, globally disable triggers, trust an app-settable session flag as purge authority, or delete append-only legal history under a receipt-maintenance label. A dedicated narrowly reviewed maintenance path may remove only eligible approved receipt rows and receipt-scope associations atomically with an attributable non-sensitive maintenance audit. If SECURITY DEFINER is chosen, explicitly lock search_path/owner/arguments/EXECUTE grants and prove adversarial misuse is denied.

Plan how immutable purge_after is computed on new receipts and how historical rows would be handled under a separately approved backfill. Test boundary times, active/UNKNOWN attempts, receipt-Matter associations/FKs, concurrent retry versus purge, batch bounds, interruption and replay after purge/restore. A restored old backup must not silently resurrect command eligibility.

You may prepare the design, disabled-by-default maintenance artifacts and tests with synthetic retention values. Production values, live deletions/backfill, scheduler resources and activation remain decision/deployment gated. Do not claim data minimization completed from an unused purge function or delete retained data to pass a gate.

## B8 — Credential/key rotation and revocation

Inventory ZITADEL private-key JWT/API credentials, durable-session encryption keys, DB roles/passwords, R2 credentials, Cloudflare tokens, Google/CI identities and any proposed service tokens. Record owner, secret-store location/name (no values), scope, identifiers, expiry/revocation path and dependency order. A0600 file mode is access control, not a rotation policy.

Define scheduled and compromise-driven rotation, bounded old/new overlap, verifier/provider key update, rollback, cache invalidation/session behavior and final revocation confirmation. Prefer short-lived workload identity where supported. Choose explicit proposed intervals from requirements/provider behavior; do not fabricate a universally correct rotation number or silently activate it.

Prepare commands/runbook and local mocked/provider-independent tests; actual credential generation, rotation, IAM or IdP changes require the scoped operator action. Never print keys, diff secrets or embed them in evidence. Test failure/rollback so a partial rotation cannot strand the pilot or leave an indefinitely valid leaked key.

## B9 — Minimum pilot detection and operational response

Inventory real OTel/logger/audit instrumentation and export behavior; an emitted audit event is not a monitored alert. Define a minimum pilot set for repeated auth failure/denial, rate rejection/abuse, DB saturation/deadlock, API unavailability, object failure, quota/cost limits and backup/restore failure. Include owner, proposed threshold/window, false-positive considerations, dashboard/query, runbook and acknowledgement/escalation destination.

Preserve privacy/cardinality boundaries: no raw token, body, legal content, per-user name or unsalted identifier in alerts/metric labels. Security audit detail stays authorized; monitoring data must not become an alternate cross-tenant search surface. Avoid interpreting every legitimate403 as an attack.

Prepare configuration/rules and a local synthetic trigger→observable result check. Actual notification destinations, channels, paid log sinks, retention and enabling provider alerts remain operator approval items; do not send test alerts/messages under this prompt. Broader anomaly/ML detection can stay later scope, but do not defer all basic failure detection simply because a capability roadmap says “later”.

## Output and promotion

Add `zero-trust-b1-b9.md/json` to the current readiness evidence: exact ID, source state, local artifacts/tests, provider-managed fact versus verified configuration, remaining decision/action, owner and pilot/release impact. Cross-link grant tests, index plans, rate policy, TLS/at-rest map, MFA/posture checklist, purge design, rotation runbook and monitoring rules. Prefix findings so B-IDs cannot be confused with audit A-IDs or RMV findings.

Keep provider evidence dated with exact references. Starting points inspected through Context7 on2026-10-30:

- https://docs.cloud.google.com/run/docs/container-contract
- https://docs.cloud.google.com/run/docs/securing/security
- https://supabase.com/security
- https://developers.cloudflare.com/r2/reference/data-security/

Recheck current official behavior when implementing; no framework/version/account compatibility is implied by these pointers.

Continue all actionable local work before returning. End with B1–B9 status plus the master readiness gate status; leave numeric policies/cloud checks pending where genuinely unresolved. No global assertion “zero trust compliant” follows from a completed checklist, provider encryption documentation or passing unit tests.
