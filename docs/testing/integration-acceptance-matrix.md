# Integration Acceptance Matrix — MC-002 Step02.3 (INT-A candidate)

- **Author:** OpenCode (actual, independent QA), task MC-002-INT-QA-PLAN. Packet-only authorship, 2026-10-25. Governance base `e377568ac47f8f1b88e3875a8f13d7e57fc30667`; backend `52b60a4` (C01-NATIVE accepted, PASS_WITH_LIMITATIONS); frontend `3e5a642`.
- **Status:** DRAFT_MATRIX / WAITING_PO (INT-D01 selection) / **every row RESULT=NOT_RUN**. This matrix is authored forward instruction, not execution evidence; no value below is a test result.
- **Result vocabulary.** Rows may later become PASS, FAIL, BLOCKED or OUTCOME_UNKNOWN only on actual executed evidence. A document review, an owner narrative, `curl`/process exit 0, or a `200` from the harness endpoint itself never sets any row to PASS.
- **Golden boundary rule.** A full transport PASS in Sections A–E sets nothing in Section F. C01-PRODUCT remains OPEN. Transport PASS proves only local Next-runtime (development server) transport compatibility: never authentication, authorization, Workspace/Matter isolation, production build/start, Cloudflare behavior or cost.
- **Applicability.** Sections A–E apply only if the PO selects INT-A with explicit approval of the harness endpoint (INT-D01). If INT-A0 or INT-C is selected, Sections A–E must be re-authored and this input is not applicable as-is. Section F is DEFERRED for every option.
- **Sources of expectations.** Transport rows cite the accepted native contract at `52b60a4` and the C01 closure record. Deferred rows cite the PO-approved permission matrix and CANDIDATE API/security conventions, always marked CANDIDATE. No contract was manufactured.
- **Ownership.** Owners execute; OpenCode verifies independently; Claude reviews conformance (INT-CONF-01). No agent self-approves.
- **No database substitute.** Persistence rows use the real owned disposable PostgreSQL of INT-ENV-01/02 only. No mock, in-memory or shared database is permitted.

## 1. Common fixture set (FIX-SET; exact literals pinned at ARCH-FINAL)

- `runId` matched `[A-Za-z0-9]{8,32}`; every case sends `X-Request-Id: mc-int-<runId>-<caseId>-<seq>` (≤128 chars, `[A-Za-z0-9._-]`).
- Synthetic emails on a reserved test TLD and synthetic names, run-unique; literal forms pinned at ARCH-FINAL; never real names, emails or legal data.
- Owned disposable PostgreSQL (INT-ENV-01), native `migrate` at `52b60a4` (INT-ENV-02), Go operated unchanged (INT-ENV-03), harness per INT-ENV-04/05, driver per INT-ENV-06.
- Envelope fields and bounds per proposal §5.4; app-client classification per proposal §5.5.

## 2. Section A — Environment and isolation preconditions (APPLICABLE if INT-A selected)

| ID | Object | Trace | Fixture/preconditions | Exact action | Expected assertion and evidence | Owner | Reviewer | RESULT |
|---|---|---|---|---|---|---|---|---|
| INT-ENV-01 | Disposable PostgreSQL | NFR-002; DEC-023 H5 | name availability pre-checked | create a new owned, labelled, capped PostgreSQL container, loopback only; storage is its own writable layer or a new dedicated named volume (choice documented); verify names unused and DB empty | recorded command/exit/UTC; no reuse, overwrite or prune of any existing resource | Codex | OpenCode | NOT_RUN |
| INT-ENV-02 | Schema migration | NFR-002; NFR-012 | INT-ENV-01 done | run native `migrate` at `52b60a4` against the owned DB only | exit 0; schema applied; no other artifact changed; argv/exit/UTC recorded | Codex, ZCode (operate) | OpenCode | NOT_RUN |
| INT-ENV-03 | Go server operated | C01-NATIVE at `52b60a4`; NFR-003 | clean backend checkout, head `52b60a4` | start loopback; API docs routes disabled; no trusted proxies; record start/stop | `git diff` vs `52b60a4` empty; running process is the committed head; zero backend change | ZCode | OpenCode; Claude (conformance) | NOT_RUN |
| INT-ENV-04 | Harness root and endpoint | NFR-002; proposal §5 | frontend branch from `3e5a642`, pinned deps only, no lockfile change | build `integration/next-harness/` (name confirmed by Antigravity): one harness-only POST Route Handler; Zod allowlist (runId/caseId/refId); loopback-literal Go base URL re-checked every call; method allowlist; harness envelope `Cache-Control: no-store`; client calls pass `cache: 'no-store'` | other methods and unknown caseIds rejected; caller-supplied input is limited to the Zod-validated `refId`, used exclusively as a fixed path parameter of the fixed route template (only for cases that require a record); no other caller-supplied value becomes method/URL/path/header/body (not a proxy); dependencies unchanged | Antigravity | OpenCode | NOT_RUN |
| INT-ENV-05 | Harness refusal, default-off | NFR-002; proposal §11 | local env control | (a) call endpoint with opt-in flag absent; (b) attempt run with `NODE_ENV=production`; (c) attempt run with each listed product auth/bypass variable set (`API_MODE`, `AUTH_ALLOW_ANONYMOUS`, `API_TOKEN` and the Antigravity-confirmed list) | (a) returns 404 with no outbound call; (b)/(c) refuses to run; harness absent from product build, default tests and CI; not importable from `src/`; per-attempt evidence recorded | Antigravity | OpenCode | NOT_RUN |
| INT-ENV-06 | Driver | proposal §5.3/§5.4 | harness ready | run driver: fixed case table only; one upstream request per case; store bounded envelopes | no caller-defined routing; envelope set complete for executed cases; exactly one request per case ID (no silent retry) | Antigravity | OpenCode | NOT_RUN |
| INT-ENV-07 | Next runtime checks | proposal §5.6 | pinned Next development server | confirm: cross-root import compiles under harness-only config; documented loopback binding; product TS/lint/test glob pickup; handler dynamic; no fetch result caching/reuse | compliance or reported deviation (never worked around); `nextVersion` present in envelope | Antigravity | OpenCode | NOT_RUN |

## 3. Section B — Transport, app-client mode (all rows inside the harness Next runtime; unmodified `httpRequest`)

All expectations are the accepted native contract at `52b60a4`. A false success or false empty result on any outage row is FAIL, never passable by any workaround.

| ID | Trace | Fixture/preconditions | Exact action | Expected assertion and evidence | Owner | Reviewer | RESULT |
|---|---|---|---|---|---|---|---|
| T1 | native POST /users; NFR-003 | FIX-SET; user A | POST create A via harness client path | outcome `value`; schema-passing body: lowercase UUIDv7 `id`, normalized email/name, `version` 1, RFC 3339 UTC times with 0–6 fraction digits; classification `success`; no ApiError; envelope(requestId, startedAt, latencyMs) | Antigravity + ZCode | OpenCode | NOT_RUN |
| T2 | native GET /users/{id} | T1 done | GET A via client path | body equals T1 body field-for-field; classification `success` | Antigravity | OpenCode | NOT_RUN |
| T3 | native 404; NFR-002 | FIX-SET | GET valid, never-created UUIDv7 | `ApiError` 404, code `NOT_FOUND`, RFC 9457 body in `details`; details contain no other record's data | Antigravity | OpenCode | NOT_RUN |
| T4 | native ID canonicalization | fixed malformed and uppercase literal IDs pinned at ARCH-FINAL | GET those IDs | 404, code `NOT_FOUND` | Antigravity | OpenCode | NOT_RUN |
| T5 | native validation | FIX-SET | POST with empty `name` | 422, code `VALIDATION_ERROR`, details present; subsequent GET A unchanged (`version` 1) | Antigravity | OpenCode | NOT_RUN |
| T8 | native duplicate email | T1 done | POST with A's email and a different name | 409, code `HTTP_ERROR` (per client status mapping), details body present; afterwards GET A shows unchanged `version` | Antigravity | OpenCode | NOT_RUN |
| T9 | native PATCH + If-Match | T1 done | PATCH A, `If-Match: "1"`, fresh name different from current | 200; body `version` 2; name applied; classification `success` | Antigravity | OpenCode | NOT_RUN |
| T10 | native 412, no partial write | T9 done | PATCH A, stale `If-Match: "1"`, another different name | 412; then client GET A shows `version` 2 and the T9 name; no partial write, state unchanged | Antigravity | OpenCode | NOT_RUN |
| T11a | C01 503 unavailable during DB outage | PG stopped (same container stop, identity recorded by Codex) | client GET A | `ApiError` 503, client `code` `HTTP_ERROR`, harness `classification` `unavailable` per proposal §5.5; `details.type` = `/problems/unavailable`; `details.retryAfter` = 1; `details.detail` equals the C01-golden 503 detail pinned at ARCH-FINAL (INT-QA-01); no invented text | Antigravity, Codex | OpenCode | NOT_RUN |
| T11b | C01 503 on write | same outage state | client PATCH A with current `If-Match` and a different name | `ApiError` 503, same unavailable assertions; no committed and no not-committed outcome is inferred from the 503 alone (native unknown-write rule); after-recovery reconciliation is read-only via INT-PERS-04 and records the actual state; a strict no-change assertion is permitted only if the selected fixture causally verifies the DB was stopped before the write | Antigravity | OpenCode | NOT_RUN |
| T11c | C01 503 on create | same outage state | client POST new run-unique user X | `ApiError` 503 unavailable, same assertions; outcome recorded OUTCOME_UNKNOWN pending INT-PERS-04 | Antigravity | OpenCode | NOT_RUN |
| T12 | client transport failure | Go stopped | client GET A | `ApiError` code `NETWORK_ERROR`, status 0; classification unavailable; never success or empty; no driver retry | Antigravity | OpenCode | NOT_RUN |

## 4. Section C — Transport, wire mode (runtime `fetch` in the same handler; fixed case definitions)

Header evidence is attributed only to the request ID that produced it. No wire request repeats an app-client POST or PATCH.

| ID | Trace | Fixture/preconditions | Exact action | Expected assertion and evidence | Owner | Reviewer | RESULT |
|---|---|---|---|---|---|---|---|
| W1 | native POST headers; NFR-002 | FIX-SET; user B created only here | wire POST user B (distinct email/name; own request ID) | 201; allowlisted headers: `content-type` JSON, `Location: /api/v1/users/<B id>`, `ETag: "1"`, `x-request-id` echo; body parsed; evidence applies to B only | Antigravity | OpenCode | NOT_RUN |
| W2 | native Opt header | T1 done | wire GET A | `ETag` equals `"<current version>"`; request-ID echo | Antigravity | OpenCode | NOT_RUN |
| W3 | native problem media type | never-created UUIDv7 | wire GET that id | 404; `application/problem+json`; request-ID echo; no other record's data | Antigravity | OpenCode | NOT_RUN |
| T6-W | native 400 | FIX-SET | wire POST malformed JSON bytes with JSON Content-Type | 400; `application/problem+json`; request-ID echo | Antigravity | OpenCode | NOT_RUN |
| T7-W | native 415; Fetch-standard content-type gap | FIX-SET | wire POST valid JSON bytes as `Uint8Array` body without Content-Type | 415; `application/problem+json`; sent headers recorded as constructed; any non-415 is recorded as a finding, never worked around | Antigravity | OpenCode | NOT_RUN |
| W9 | native ETag after update | T9 done | wire GET A | `ETag: "2"`; request-ID echo | Antigravity | OpenCode | NOT_RUN |
| W11 | C01 503 wire shape | PG stopped | wire GET A | 503; `application/problem+json`; request-ID echo; a `Retry-After` header is NOT asserted (product convention deferred to D-11) | Antigravity | OpenCode | NOT_RUN |

## 5. Section D — Real persistence, restart and outage reconciliation

| ID | Trace | Fixture/preconditions | Exact action | Expected assertion and evidence | Owner | Reviewer | RESULT |
|---|---|---|---|---|---|---|---|
| INT-PERS-01 | NFR-003; proposal §6 | T1/T2 done and executed before T9/T10 mutate A; no mutation of A between the last recorded T1/T2 state and this restart (immediate pre-restart checkpoint) | restart Go against the same DB; client GET A | 200 with identical `id`, `version` and timestamps as the checkpointed T1/T2 state; a post-T9 `version` 2 is never compared against `version` 1; envelope evidence | Codex, Antigravity | OpenCode | NOT_RUN |
| INT-PERS-02 | NFR-003; NFR-014 (local) | INT-PERS-01 done, still before any mutation of A; no mutation between the checkpoint and the stop/start | stop then start the SAME PostgreSQL container, no remove, no recreate; Codex records container ID and storage identity before/after | GET A again unchanged against the same checkpointed state; identity equality recorded; any data loss is FAIL | Codex, Antigravity | OpenCode | NOT_RUN |
| INT-PERS-03 | C01 recovery behavior | T11a/W11 state; then PG restarted | client GET A without any Go restart | 200 (recovery); no Go restart occurred; classification `success` | Antigravity | OpenCode | NOT_RUN |
| INT-PERS-04 | NFR-009; proposal §7 unknown-write rule | T11b/T11c OUTCOME_UNKNOWN open; recovery done | reconcile by read-only GET of A only; no re-POST, no retry, no new key, no list or SQL scope expansion of user X | actual committed state of A recorded (reconciling the T11b PATCH outcome); the T11c POST of user X stays OUTCOME_UNKNOWN and unresolved (a 503 on a non-GET implies nothing about commit; a 201 or 409 on any re-post would never prove behavior); the driver/UI records no failed and no success outcome for the unknown write; product receipt-based reconciliation deferred to D-09 (G-3) | Antigravity | OpenCode | NOT_RUN |

## 6. Section E — Correlation, privacy, no-retry, artifact isolation, teardown, conformance

| ID | Trace | Fixture/preconditions | Exact action | Expected assertion and evidence | Owner | Reviewer | RESULT |
|---|---|---|---|---|---|---|---|
| INT-COR-01 | native X-Request-Id; NFR-008 observability | T1/T2/T8/T9 executed | locate retained Go access-log lines carrying those case request IDs (path-only logs) | each ID found in one Go log line; if the pinned template does not log the ID, record NOT-OBSERVABLE as a limitation — this does not block transport acceptance but is reported | Antigravity, Codex | OpenCode | NOT_RUN |
| INT-PRIV-01 | NFR-002; proposal §8 | envelopes and logs retained | scan retained Go and Next application logs only for T1/W1/T8/T9/T11c synthetic emails/names; scan every retained artifact including envelopes for credential/DSN/password/token values | synthetic body markers absent from Go and Next application logs only (bounded synthetic response bodies retained inside envelopes are permitted); credential/DSN/password/token values absent from every artifact including envelopes; envelope bodies ≤16 KiB with truncation flagged and a truncated body cannot satisfy any body assertion; synthetic data only; scoped evidence only, no general privacy guarantee claimed | Codex | OpenCode | NOT_RUN |
| INT-ISO-01 | C01 preservation; NFR-002 | sections A–D executed | compute diffs: backend vs `52b60a4`; `src/` vs `3e5a642`; shared client; dependencies/lockfile | all diffs empty; additionally Go holds no CORS configuration (server-to-server scope, no browser) | ZCode, Antigravity | OpenCode; Claude (conformance) | NOT_RUN |
| INT-ISO-02 | proposal §11 production exclusion | product build runnable locally | inspect product build/test/CI output for harness modules; confirm harness not importable from `src/` and not in product globs (cross-checked with INT-ENV-07 result) | no harness module in product artifacts; deviations reported, not silently fixed | Antigravity | OpenCode | NOT_RUN |
| INT-ISO-03 | proposal §6/§11 teardown | all owned resources running | stop only owned processes/containers (Next harness, Go, PostgreSQL); verify no owned listeners remain; no deletion or prune of others' resources; retain evidence (argv, exits, UTC, redacted configs, owned-resource list, DB/storage identity) | zero owned listeners; evidence retained; retention-vs-removal follows Codex governance after this milestone | Codex | OpenCode | NOT_RUN |
| INT-CONF-01 | task plan MC-002-INT-ARCH-CHECK | Sections A–E executed | Claude reviews executed evidence against the approved ARCH-FINAL contract | per-boundary conformance or variance disposition; new material variances return to the PO; not PO approval, not product/cost closure | Claude | OpenCode | NOT_RUN |

## 7. Section F — Deferred product gates (ALL DEFERRED; fixtures described only, not constructed now)

**No INT-A pass in any section satisfies any row here.** C01-PRODUCT stays OPEN after a full transport PASS. Future fixtures: FIX-D-AUTH = the future PO-approved identity-provider and per-user access-token mechanism selected under G-1/INT-D02; this matrix selects no identity provider, token format or token lifetime now, and any optional test-issuer/signature fixture (proposal §2 INT-B wording, only if ever approved) validates mechanism plumbing only and can never close product authentication or authorization; FIX-D-ISOL = ≥2 synthetic principals, ≥2 workspaces, ≥4 matters with mixed roles (VIEWER, EDITOR, Matter OWNER, and a Workspace OWNER without explicit Matter membership) plus one externally triggered mid-test revocation.

| ID | Future case | Trace | Future fixture | Future action | Expected (CANDIDATE where marked) | Gate/prerequisite | Future owner | RESULT |
|---|---|---|---|---|---|---|---|---|
| D-01 | Missing authentication | NFR-001; TB-04 | FIX-D-AUTH | request without credentials | CANDIDATE 401 `/problems/unauthenticated` | G-1; INT-D02 | ZCode | NOT_RUN |
| D-02 | Invalid/expired credentials | NFR-001 | FIX-D-AUTH | wrong-signature token; expired token | CANDIDATE 401, externally identical for both; no claim trusted | G-1; INT-D02 | ZCode | NOT_RUN |
| D-03 | Valid authenticated request | INT-D02 | FIX-D-AUTH | authenticated call | CANDIDATE success yielding subject only; never proof of authorization | G-1 | ZCode | NOT_RUN |
| D-04 | Workspace isolation | NFR-001/002; AC-135; AC-118 | FIX-D-ISOL | WS-A member attempts WS-B matter by id, all retrieval and command paths | uniform 404, externally indistinguishable from nonexistent; no title/count/metadata leak (CANDIDATE `/problems/not-found`) | G-2 | ZCode | NOT_RUN |
| D-05 | Matter isolation | NFR-001; AC-158 | FIX-D-ISOL | M-A member attempts M-B in same workspace | uniform 404; active workspace membership AND explicit Matter membership required; Workspace OWNER no implicit access | G-2 | ZCode | NOT_RUN |
| D-06 | Insufficient role | NFR-001; permission matrix; AC-134; AC-140 | FIX-D-ISOL | VIEWER write; EDITOR attempts OWNER-only ops; undeclared verifier and self-verification attempts | CANDIDATE 403 with no domain change and denied-access audit | G-2 | ZCode | NOT_RUN |
| D-07 | Revocation mid-access | NFR-001; permission-matrix revocation row; AC-147 | FIX-D-ISOL | externally revoke membership, then next read/export/bulk/action | current-rights recheck; stale grant denied (uniform 404); no cached UI outcome survives | G-2 | ZCode, Antigravity | NOT_RUN |
| D-08 | Workspace OWNER vs confidential Matter | AC-118; AC-158 | FIX-D-ISOL | Workspace OWNER without explicit membership reads and replays against that matter | denied everywhere, including idempotent replay path (receipt never returned) | G-2; G-3 | ZCode | NOT_RUN |
| D-09 | Idempotency and unknown outcome | NFR-003/009; AC-153 | product slice with receipts | same-key resubmit; key reuse with different hash; aged key; `GET /operations/{key}` | CANDIDATE: replay stored response + `Idempotent-Replayed: true`; 422 reuse; 422/410 expired; 200/410/404 as-of semantics | G-3 | ZCode | NOT_RUN |
| D-10 | Product CAS strictness | candidate API §1.1; AC-131 | product slice | missing If-Match on CAS-scoped endpoint; If-Match on scope-none endpoint; stale revision | CANDIDATE 428 / 400 precondition-not-applicable / 412 + currentRevision | G-2/G-3 | ZCode | NOT_RUN |
| D-11 | Product error and retry conventions | INT-D09; NFR-008/009 | product error catalogue | command 503 and unavailable handling | CANDIDATE units/range of retryAfter, Retry-After header decision, catalogue-wide type URIs; outcome-unknown documented | G-5 | Claude proposes; PO decides | NOT_RUN |
| D-12 | Frontend session and per-user cache | NFR-001/008; AC-156 | product frontend slice | check every Server Action/Route Handler/data boundary; inspect cached responses | auth at every boundary; tokens server-side; no cached response served across users; unavailable never rendered as false empty/ready | G-6 | Antigravity | NOT_RUN |
| D-13 | CORS/origin product policy | NFR-001/002; G-1/G-6 | browser runtime | untrusted origin requests | CANDIDATE: only defined origins served; no browser bypass of backend authorization | G-1/G-6 | Antigravity, ZCode | NOT_RUN |
| D-14 | Production hosting and cost | INT-D04..D08; NFR-006/014 | production topology evidence | adapter behavior, compute limits, full-lifecycle bill | explicit: cannot be satisfied by any local transport PASS; paid/production activation needs PO approval | G-7/G-8 | Codex; PO | NOT_RUN |
| D-15 | Audit append-only | NFR-004; permission matrix | product slice with history | attempts to edit/delete prior Event History by any role | denied; corrections append with attribution | G-2 | ZCode | NOT_RUN |

## 8. Maintenance and limits of this matrix

- Authored by OpenCode from the supplied Step02.3 packet only; the exact golden 503 `detail` string, reserved email TLD, harness root name and case-ID literal lists are pinned at ARCH-FINAL (see review finding INT-QA-01) and then bound to this matrix without changing row semantics.
- Row additions or removals, and any applicability switch between INT-A / INT-A0 / INT-C, require a recorded review by OpenCode and Claude; no silent edits.
- This file itself, when stored at `docs/testing/integration-acceptance-matrix.md`, is an authored matrix, not execution results: every RESULT above is NOT_RUN and no execution evidence exists at authorship time.
- Pre-dispatch prerequisites recorded 2026-10-25: (a) the exact app-client success `value` field wording (proposal §5.4) and (b) the validated-`refId` scope wording of INT-ENV-04 require explicit ARCH-FINAL clarification in Claude's proposal before owner dispatch; this note makes no claim that the proposal text has been amended.
