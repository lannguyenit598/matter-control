# ZCode implementation intake — 2026-10-30

Actual Local Codex. Read-only product-source inspection, returned-artifact hash checks and focused test execution. Branch `codex/unified-project-flow`, HEAD `20feedbf06c859a9806055d609f5b132fe8bb086`; dirty source preserved. No product-source fix, migration, credential read, cloud operation, runtime restart, commit or push. This is a bounded intake, not a comprehensive independent acceptance of the product.

## Outcome

ZCode has implemented real frontend material and backend corrective code. Cloud readiness remains LOCAL_CANDIDATE: adapter execution/adoption and durable application auth are incomplete. Returned evidence has two specific defects; do not accept all author PASS claims as independently established.

## Implemented source confirmed

| Area | Current implementation | Limit |
|---|---|---|
| Solid Glass | Theme/material/shadow tokens in globals.css; data-slot hooks on existing atoms and native Dialog | Later Liquid Glass supersedes some visual bytes; authenticated product/assistive-technology acceptance remains open |
| Liquid Glass | `lib/mc/glass.ts`, `molecules/glass-surface.tsx`, Dialog integration, displacement maps/registry, fallback tiers and CSS media overrides | Source and fallback tests confirmed; retained screenshots use a fixture with evaluated kernel, not authenticated production React integration |
| Audit metadata | RequestMeta context, middleware, audit service/store fields and HTTP tests | Declared X-Forwarded-For is not verified client identity; do not use it as a rate-limit or security boundary |
| Membership CAS | Row revision predicate, adapters and four callers passing `existing.Revision` | Full PostgreSQL regression was not rerun in this intake |
| Filing CAS | SaveFiling zero rows maps to ErrVersionConflict in PG/memory, contract regression exists | Full contract result remains author evidence |
| Checked integer conversion | Assessment SubjectEpoch uses int32Checked | Source confirmation only in this intake |
| Introspection cache | Config default now15s, negative input rejected,0 disables cache | Behavioral change: deployments omitting the variable can retain cached identity results for up to TTL; canonical dev overlay explicitly sets0s |
| B1 roles | Test-only profile, private schema, per-table grants and denial/positive tests | Not an adopted Supabase bootstrap or as-deployed grants. Test contains destructive fixture preamble; never run against retained/provider DB |
| B2 indexes | EXPLAIN verification harness and proposal SQL | No0009 migration exists in product migrations; index proposal is NOT applied |
| Cloud Run | Local container profile/evidence returned for build, readiness, idle SIGTERM | Not managed Cloud Run execution; loaded drain and actual provider IAM/network remain open |

The recent returns do not establish completion of the entire Eigenwelt roadmap. Current frontend feature directory inventory still has no dedicated playbook, intake, knowledge or saved-view modules; migrations end at0008. The older recommendation inventory remains useful history, not a freshly accepted full-product verdict.

## Still incomplete in current source

- No adopted Worker adapter/build configuration in frontend package; `adapter-poc.sh` installs packages but its launch/feature probes are comments and `RESULT_LINES_GO_HERE`. It is a scaffold, not an executable completed compatibility test.
- OIDC sessions and pending logins remain process Maps; pending transfers remain a WeakMap. The durable-session SQL is only a reference test, not production persistence/encryption/refresh coordination.
- Root redirect in next.config.ts still targets absent `/dashboard`.
- Supabase role/pooler/TLS/Data API negative verification, real R2, public-origin OIDC, managed deployment, provider restore and independent authenticated browser checks remain open.
- `createdReceipt` still checks receipt kind/hash without explicitly comparing stored Matter/Workspace scope to the current environment (historical A-01 service invariant finding). HTTP path fingerprint mitigation does not implement the missing service invariant.
- B3 rate limiter, B6 policy activation, B7 retention executor and B8/B9 live rotation/alerting are not completed by documentation/proposals.

## Returned artifact verification

| Packet | Matching members |
|---|---:|
| audit-fixes |3/4|
| SQL review fixes |6/6|
| Liquid Glass |9/9|
| Solid Glass |20/20|
| ADR006 readiness |12/12|
| Total |50/51|

The mismatch is `zcode-audit-fixes-20261030-r1/return.md`: expected4671bytes/`fbda3036af04e80b7bc17dc0c3865ccb74801ad2f3ba1ed8f3069380eafdd992`; actual4679bytes/`ed11be914cf44e124c94f040d191ed63a97e87462d2bd1652b7b24a0bfc8200f`. Refresh/disclose the author packet; this intake does not rewrite it. The audit R2 manifest is an inventory of output filenames without per-output hashes, so it is excluded from the50/51 result.

Retained Go JSON event streams were parsed directly:

- B1:55 test-level PASS,0FAIL,0SKIP.
- Later B1+audit roundtrip:58 test-level PASS,0FAIL,0SKIP.
- B2:1 test-level PASS,0FAIL,0SKIP.

These are independent parses of retained author evidence, not fresh PostgreSQL execution. The full backend642/708 claims each have only a35-byte summary log; the packet does not retain the raw full-suite events needed to independently recount those totals.

**Durable-state evidence correction required:** `durable-session-events.json` is not JSON events or PASS output. It contains `go: cannot find main module ... to create a module there, run: go mod init`. Therefore the claimed durable SQL PASS is NOT_ESTABLISHED from this delivered receipt. Retain the failed file and provide a new correctly executed attempt. Do not run go mod init at repository root.

Reference SQL additionally omits `idle_until` in its refresh eligibility predicate and its reference tests cover absolute expiry, not idle expiry. Resolving distributed refresh must also coordinate the real IdP refresh request; a CAS on storing results alone does not demonstrate single-use refresh-token safety.

## Checks actually rerun by Codex

1. From apps/frontend: `rtk proxy node node_modules/vitest/vitest.mjs run src/lib/mc/glass.test.ts src/components/molecules/glass-surface.test.tsx src/components/molecules/dialog.test.tsx` → exit0,3files/17tests PASS. These exercise math/fallback/dialog behavior; no real liquid-tier browser integration.
2. From apps/backend: `rtk proxy env -u MC_TEST_DATABASE_URL -u TEST_DATABASE_URL GOCACHE=/private/tmp/mc-codex-intake-go-cache go test -race -count=1 ./internal/config ./internal/adapter/inbound/productapi -run 'TestLoadProduct|TestSecurityAudit'` → exit0,both packages PASS. No PG fixture involved.

No full build/check, provider/IdP/browser/restore or complete system review was rerun. Full-suite author claims remain separately attributed.

## Next work

1. Correct the two evidence defects without rewriting failed/historical evidence.
2. Complete actual isolated adapter previews/probes, then adopt a reviewed adapter and implement durable auth/login/pending-attempt state with idle expiry and real refresh coordination tests.
3. Resolve A-01 under the backend owner's scope; finish deploy SQL and managed-provider verification once authorized.
4. Re-pin the resulting source for nonauthor review and authenticated product/browser acceptance. Current new source is untracked/uncommitted; HEAD has not advanced.

Proposed status: SOURCE_IMPLEMENTATION_CONFIRMED_PARTIAL / IN_REVIEW_WITH_VERIFICATION_BLOCKERS. Cloud: LOCAL_CANDIDATE, not deploy-ready. Skipped: source remediation, secrets, PostgreSQL/provider execution, browser/runtime lifecycle, commit/push. Risk: mutable live tree; matching evidence hashes do not bind every current source file to an author-tested revision.
