# MC-P0-ZITADEL-CLOUD-E2E-R1 — runtime/auth checkpoint

Status: PARTIAL / BLOCKED_EMAIL_VERIFICATION. Actual Local Codex runtime owner; model exact build unavailable (system identifies GPT-6 family). This session did not author the primary source; earlier Local Codex source authorship exists, so this is not an independent source approval.

Repo and branch as assigned, base/head a62d838791ba188838c4ff00b7b6e265ac775056; dirty work preserved. Requirements: product auth, scoped permission/isolation, NFR-001/002/003. Reviewer: separate coordinator intake and independent reviewer, pending.

All six input pins match; 714 source entries and 102 R9 deliverables match SHA256 and bytes. Built backend and isolated public-source frontend using cached dependencies (Webpack production), both exit0. No primary source or env edits. Private key metadata and client match checked without export/hash.

Created only new DB `mc_cloud_ui_20261028t075805z` and new object root in the task-owned runtime directory. Existing product-test container identity/labels/loopback55442 and pg_isready verified; container has no Docker Health property, so no Docker healthcheck PASS is claimed. Existing DBs/volumes/IdP preserved. Seed maps A/B only, no memberships. Ledger records synthetic user IDs and actual listeners.

Local API health/readiness200; missing/bogus token401 unauthenticated; BFF signed-out session200 authenticated=false; missing/unbound callback307 to denied/invalid. Hosted login visibly reached through product sign-in, with human credentials pending. Runtime-ready is available; auth-slot-released is deliberately absent while this owner holds the slot.

Changed output scope: this task namespace only. Runtime/build/log artifacts live in the new private /tmp task directory (logs0600); frontend source snapshot contains pinned public files and a symlink to existing dependencies. Commands/inputs/auth-cases/resource-ledger retain evidence, versions and limits. Initial read-only preflight individual UTC times were not captured; session transcript preserves those tool actions.

Skipped so far: real-token audience/subject acceptance, A/B roles/isolation, refresh/expiry/logout, API outage and human acceptance; production/paid/provider-admin/Git actions. Risk: runtime readiness is not Cloud E2E PASS; sessions are process-memory only and are not durable recovery.

## Human login blocker — 2026-10-28T08:05:55.982683+00:00

Human reports that the synthetic account email has no usable mailbox, preventing receipt of the required verification code. This is user-reported evidence, not a successful login or independently observed current verification page. The former CUA task tab no longer exists. No new login flow was started; no email, password, MFA or provider policy was changed. Human/IdP account administrator must provide a usable verified synthetic account through the normal provider flow before Cloud E2E can continue.

Auth-changing/outage tests are paused and this owner releases the exclusive auth slot with the above blocker. Runtime processes are retained; no teardown. UI may consume readiness and this blocker receipt, but authenticated Cloud UI acceptance remains blocked. Runtime listener inventory was rechecked; see commands.json.

Skipped: real-token acceptance, A/B roles/isolation, real refresh/expiry/logout and outage. Risk: no Cloud E2E PASS; process-memory sessions remain non-durable.
