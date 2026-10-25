# MatterControl API, Auth and Runtime Decision Analysis (MC-002 Step02.3)

- **Author:** Claude Code (actual), claude-opus-5-5, Solution Architect, task MC-002-INT-ARCH, correction round 1.
- **Method:** packet-only analysis. No tools, MCP, files, commands or URLs.
- **Governance base:** `e377568ac47f8f1b88e3875a8f13d7e57fc30667`.
- **Status:** **PROPOSED / WAITING_PO_APPROVAL**.
  - `INT-Dnn` are proposal IDs, not DEC approvals. All proposed runtime tests are NOT_RUN.
  - The fifteen architecture documents are candidate DOCUMENT_REVIEW_PASS, not PO-approved. Formulas and values taken from them are **candidates**, not PO decisions.
  - Cloudflare prices and limits cited here are inherited from dated snapshots in those documents and were **not freshly verified**.
- **Companion:** [integration-scope-proposal.md](integration-scope-proposal.md).

## 1. Classification of decisions

**Already approved; preserved, not re-requested:**

- Product requirements and business rules.
- The OWNER/EDITOR/VIEWER matrix and its scope rule (`APPROVED_BY_PO`).
- DEC-023 H5 local.
- DEC-024 W1 local measurement envelope and local restore target RPO 24h / RTO 8h.
- DEC-025 ARCH-Q3/Q5.
- C01-NATIVE at `52b60a4` (R01/R02 closed).
- The constraints: Go, PostgreSQL, Next.js, the Cloudflare Free Tier goal, and the $0 target (unproven).
- ARCH-Q1 literal RULE-003. ARCH-Q2 and ARCH-Q4 remain unadopted.
- The accepted tiny synthetic tooling restore (tooling only) is preserved. The full product restore is future work.

**Technical, Claude-owned** (subject to the pending overall architecture approval): policy-evaluation mechanism, token validation rules, harness assertions, log fields, problem-mapping implementation.

**Material trade-offs needing the PO:** integration scope (including temporary harness endpoints), identity provider, hosting topology, frontend adapter, storage/recovery providers, retention values, cost exceptions, product error/retry conventions.

**Standards notes** (supplied by Codex from Context7; Next.js 16.4.2 not verified here):

- Next.js guidance requires authentication and authorization at **every** Server Action, Route Handler and data-access boundary; page gating is insufficient. Tokens stay server-side. No cached response may be served across users: any cache of per-user data must be scoped so that one user's response is never returned to another.
- OIDC authenticates the user. An OIDC **ID Token is a JWT** whose audience is the relying-party client. An access token is validated separately by the resource server, and **its format depends on the identity provider**: OAuth 2.0 does not mandate one; RFC 9068 defines an optional JWT profile; opaque tokens need introspection. Go validates **access tokens** for its own API audience and never accepts ID Tokens as API credentials.
- Neither standard prescribes an identity provider.

## 2. Decisions

Each decision uses the same sixteen fields.

### INT-D01 Integration scope under H5

| Field | Content |
|---|---|
| Question | Which local Next.js→REST→Go→PostgreSQL seam, if any, is built before a product API/auth seam exists? |
| Decision class | PO trade-off |
| Reason | The frontend Task contract and the backend User API differ; the session is fail-closed; the API has no auth. Integration is PENDING (dependency plan, row 2) |
| Approved baseline | H5 local. No alias, bypass, new product routes or screens implied. The prior architect's (a) transport-only and (b) defer remain unselected |
| Options | INT-A temporary Next.js runtime harness (isolated root outside `src/`, one harness-only endpoint, existing client run inside Next). INT-A0 Node-only runner (explicit reduced-scope exception). INT-B authenticated harness. INT-C defer |
| Technical | A: no backend or `src/` change; the client is executed inside a Next development server; app-client checks are split from wire-level controls because `httpRequest` returns only the decoded body. A0: no Next runtime. B: Go middleware outside C01 scope. C: none |
| Product | None delivers product behavior. A, A0 and B are not product progress |
| Security | A/A0 exclude auth explicitly: no session weakening, no Task/User alias, no proxy. B risks auth theatre on a resource with no authorization model |
| Integration | A finds Next-runtime client/server/persistence defects early. A0 misses Next-runtime defects. C postpones everything |
| Cloudflare | None. Local results say nothing about Workers |
| Cost | No paid service. The local monetary cost is not measured. Effort: A small–medium, A0 small, B medium |
| Dependencies | C01-NATIVE (satisfied in scope); a Codex disposable environment; the Antigravity feasibility checks (proposal §5.6). B also needs INT-D02 |
| Evidence present | Native API docs; frontend code including `http-client.ts`; C01 closure; dependency plan |
| Evidence missing | Whether the pinned Next compiles the cross-root import; loopback binding option; runtime results; whether the Go request-ID log is present |
| Recommendation | **INT-A**, including explicit PO approval of the temporary harness endpoint (proposal §5). A0 only as a named exception if A is infeasible. C is the fallback |
| Approval owner | PO. Claude recommends |

### INT-D02 Authentication: identity provider and token model

| Field | Content |
|---|---|
| Question | Which identity mechanism authenticates users, and how do tokens reach Go? |
| Decision class | PO trade-off |
| Reason | Every product `/api/v1` route requires a per-user bearer token (TB-04). Today `resolveSession` returns `null` and Go has no auth middleware |
| Approved baseline | Product policy is immutable; the IdP is not selected. Settled: no shared token, no demo/anonymous mode, the IdP only authenticates, authorization lives in MatterControl, no enterprise SSO in scope |
| Options | ID-A external OIDC (Next holds the session and forwards the access token). ID-B Cloudflare Access JWT. ID-C self-hosted OIDC |
| Technical | Go validates issuer, API audience, expiry and signature (JWT via cached keys) or uses introspection (opaque tokens), according to the selected IdP; it maps `(issuer, subject)` to a user. `API_TOKEN` is forbidden for product data |
| Product | Sign-in experience; account lifecycle; offboarding speed versus token lifetime |
| Security | Stolen-token window. F1/F2/F4 keep tokens server-side; F3 places them in the browser (security-architecture §6.1) |
| Integration | Next session store; per-request dynamic rendering; no response cached across users |
| Cloudflare | ID-B couples identity to hosting; its terms are UNVERIFIED |
| Cost | Unverified for every option |
| Dependencies | INT-D04/D05 (F3 moves tokens). INT-D01 does not need this |
| Evidence present | Template integration points; security-architecture options; standards notes |
| Evidence missing | Provider terms and limits; token format per provider; PoC; lifetime/revocation behavior |
| Recommendation | **Do not select now.** Treat the product auth seam as a separate gate; Claude prepares evaluation criteria. ID-A is preferred for evaluation (portable across H1/H2/H3). This is not a selection |
| Approval owner | PO |

### INT-D03 Application authorization and Workspace/Matter isolation

| Field | Content |
|---|---|
| Question | How is the approved matrix enforced on every path? |
| Decision class | Technical (Claude), within the approved policy |
| Reason | NFR-001/002 and FR-018: enforcement on all read, write and indirect paths; uniform not-found |
| Approved baseline | Active workspace membership AND explicit Matter membership AND role; Workspace OWNER gets no implicit Matter access; immediate revocation; no demo acceptance |
| Options | No alternative to the policy. Candidate mechanism: `core/policy` inside the command transaction after the Matter lock, uniform 404, restricted security audit |
| Technical | Default-deny policy table; a test that every operation has a matrix row; replay re-authorization |
| Product | None new |
| Security | Authentication success is never authorization evidence; defends against page-only gating |
| Integration | Next checks are defense in depth; the backend is authoritative |
| Cloudflare | Transaction placement under H3 only |
| Cost | None directly |
| Dependencies | INT-D02; MatterUnitOfWork |
| Evidence present | Matrix; security-architecture §3–4, §7 |
| Evidence missing | All enforcement tests (NOT_RUN) |
| Recommendation | Preserve. Implement with the first product slice; no separate PoC. OpenCode designs the negative matrix |
| Approval owner | Claude (technical); PO only via the pending architecture approval |

### INT-D04 Hosting topology H1/H2/H3/H4 (H5 approved)

| Field | Content |
|---|---|
| Question | Which production topology preserves the approved stack within the Cloudflare and $0 goals? |
| Decision class | PO trade-off |
| Reason | No demonstrated option meets the stack, Cloudflare-only and $0 constraints together |
| Approved baseline | H5 local only. No provider or paid activation |
| Options | H1 native origin plus Cloudflare edge (hosting exception). H2 Containers (paid; inherited dated figure of a $5/month minimum, not re-verified). H3 Go/Wasm bridge (effectively new adapters). H4 TypeScript/D1 is not proposed (substitutes stack and database) |
| Technical | H1/H2 keep the code; H3 replaces the inbound and database adapters |
| Product | None if behavior is preserved; H3/H4 carry rewrite risk |
| Security | Private origin, TLS, secret stores |
| Integration | Origin reachability from the frontend adapter |
| Cloudflare | H1 is a partial exception; H2 is paid; H3 is unproven against CPU, size and startup limits (inherited, not re-verified) |
| Cost | Unknown for every option. No service bill exists. H2 is not $0 per inherited sources |
| Dependencies | INT-D05, D06, D08 |
| Evidence present | ADR-001; dated snapshots |
| Evidence missing | Host/DB offers, full bill, any spike or remote measurement |
| Recommendation | **Keep unselected. Nothing requested in this step.** Desk evidence (P-HOST-1) or a local H3 spike (P-BE-3) would each need a separate future authorization; neither is needed for local integration |
| Approval owner | PO |

### INT-D05 Frontend adapter F1/F2/F3/F4

| Field | Content |
|---|---|
| Question | How does the Next 16.4.2 template run in production? |
| Decision class | PO trade-off |
| Reason | No adapter is selected; compatibility with `cacheComponents` and `partialPrefetching` is untested |
| Approved baseline | No adapter or migration approved |
| Options | F1 vinext (beta). F2 OpenNext. F3 static SPA (browser tokens). F4 Node co-hosted with H1/H2 |
| Technical | F1/F2 Server Action and partial-prefetch support: **NOT_TESTED** (documentation claims only). F3 drops Server Actions. F4 couples to the origin |
| Product | F3 changes the session and Server Action model |
| Security | F3 must meet the §6.1 entry conditions; the others keep tokens server-side |
| Integration | Determines where the API client and session live. The INT-A harness says nothing about any adapter |
| Cloudflare | Inherited, not re-verified: a 10 ms Free CPU limit against SSR risk (Error 1102) |
| Cost | Unmeasured for all options. No ranking is claimed |
| Dependencies | INT-D04, D02 |
| Evidence present | ADR-003; dated snapshots |
| Evidence missing | P-FE-2/3/4 results; CPU profiles; feature-support tests |
| Recommendation | **Keep unselected; decide with INT-D04. Nothing requested now.** Local adapter spikes would need separate future authorization |
| Approval owner | PO |

### INT-D06 PostgreSQL provider, object storage, backup and recovery

| Field | Content |
|---|---|
| Question | Which production database, object store and backup/restore mechanism? |
| Decision class | PO (providers, objectives); Claude (mechanism) |
| Reason | NFR-014, AC-155. Hyperdrive is a connection pool to an existing PostgreSQL, not storage |
| Approved baseline | PostgreSQL; local restore target RPO 24h / RTO 8h; accepted tiny tooling restore. No provider, object store or production RPO/RTO/SLA |
| Options | Follow INT-D04 (managed or co-hosted PostgreSQL; R2 or an S3-compatible store) |
| Technical | `verify-full` TLS; streaming proxy; restore rehearsal |
| Product | Data loss and recovery expectations |
| Security | Encryption at rest UNVERIFIED per provider; backups inherit Matter confidentiality |
| Integration | INT-A uses only its own disposable database |
| Cloudflare | R2 billing steps need approval |
| Cost | Storage, backup and egress unbudgeted |
| Dependencies | INT-D04, D07, D08 |
| Evidence present | Synthetic tooling restore PASS (tooling only) |
| Evidence missing | Owner and product restore; provider terms |
| Recommendation | Defer. **No restore or cadence rerun absent a new defect**; the full product restore belongs with the product slice |
| Approval owner | PO / Claude as above |

### INT-D07 Retention and limit parameters

| Field | Content |
|---|---|
| Question | Values for legal, history and receipt retention, preview expiry, import/export frequency, row and byte limits? |
| Decision class | PO with legal input |
| Reason | Idempotency correctness and storage cost depend on them (TB-06, OBD-11) |
| Approved baseline | None. The candidate constraint `receiptRetention > maxCommandDuration + allowedSkew` comes from candidate documents and **is not a PO decision** |
| Options | Values only |
| Technical | Key-age check; purge role |
| Product | Legal hold and erasure obligations |
| Security | Length of the exposure window |
| Integration | None for INT-A |
| Cloudflare | Free storage quotas (inherited, not re-verified) |
| Cost | Storage growth |
| Dependencies | Measured command durations from a product slice |
| Evidence present | Candidate formula; W1 inputs |
| Evidence missing | Measurements; legal input |
| Recommendation | Do not set now. Claude proposes values after product-slice measurements |
| Approval owner | PO, with legal input |

### INT-D08 Production workload and cost verification

| Field | Content |
|---|---|
| Question | Can the full service run at $0/month for an approved production workload? |
| Decision class | PO trade-off |
| Reason | A component's free allowance does not prove the whole service is free |
| Approved baseline | W1 is local test inputs, not capacity. $0 is a goal, not proof |
| Options | Keep the goal and gather evidence, or later grant an explicit cost exception |
| Technical | Quota-headroom measurement |
| Product | Pricing and viability |
| Security | Monitoring and backups must not be dropped to reach $0 |
| Integration | None |
| Cloudflare | Free-tier limits (inherited, not re-verified) |
| Cost | No local bill was measured; the service bill is unknown |
| Dependencies | INT-D04, D05, D06, D07 |
| Evidence present | Budget document (unverified) |
| Evidence missing | Full lifecycle bill; measured demand |
| Recommendation | No decision and no paid activation. Revisit when hosting evidence exists |
| Approval owner | PO |

### INT-D09 Product error and retry conventions (from the C01 disposition)

| Field | Content |
|---|---|
| Question | Product `retryAfter` unit and range; whether to send a `Retry-After` header; how a command `503` is documented as outcome-unknown; what fills the catalogue-wide `type` gap? |
| Decision class | Claude proposes; PO approves |
| Reason | C01-PRODUCT cannot close without them |
| Approved baseline | Native `retryAfter: 1` is a template constant, not a contract value |
| Options | Proposed by Claude with the first product endpoint |
| Technical | One shared mapping |
| Product | Client retry experience |
| Security | Retry storms; no leakage |
| Integration | Frontend unavailable handling |
| Cloudflare | Workers error surfaces (A15) |
| Cost | None |
| Dependencies | INT-D03; idempotency implementation |
| Evidence present | C01 clarification |
| Evidence missing | Product implementation |
| Recommendation | No PO decision now. Claude proposes, then the PO records a dated decision |
| Approval owner | PO, on Claude's proposal |

## 3. C01-NATIVE (accepted) versus C01-PRODUCT (open)

**Native behavior proven (scoped, PASS_WITH_LIMITATIONS):**

- typed 499/503/500 classification, with cancellation taking precedence;
- the `port.ErrUnavailable` sentinel;
- the fixed `503 /problems/unavailable` body with `retryAfter: 1`;
- probes preserved;
- the scoped outage log check.

**Limits:** HTTP 57014 NOT_RUN; 42P01 by composition only; no independent database replay; dirty pre-commit binary.

**Product behavior still required (OPEN/NOT_RUN, untestable without product code):**

- inaccessible-resource uniformity (A2);
- idempotency, receipts and unknown-outcome recovery (A4–A6);
- the MatterUnitOfWork suite (A11-product);
- the membership/auth store (A12);
- the `error_class` log policy (A14);
- the Workers adapter (A15);
- the INT-D09 conventions.

**INT-A can validate:**

- In app-client mode, inside the Next runtime: the native 503 surfaces as `ApiError` with the unavailable problem during a real outage and recovers; no false success or empty result; problem bodies arrive in `details`.
- In wire mode, with separate request IDs: media types, `Location`, `ETag`, the request-ID echo, and the `400`/`415` behaviors the client cannot produce.
- Persistence across restarts.

**INT-A cannot validate:** any product item, auth, production build/start, or Cloudflare behavior. C01-PRODUCT is not closed by its label or by INT-A.

## 4. Recommended PO package

1. **INT-D01:** select INT-A as the temporary Next.js runtime harness, explicitly approving its isolated harness-only endpoint outside product `src/` (proposal §5, §11). Acknowledge that authentication, authorization and isolation remain deferred. Note INT-A0 as a reduced-scope exception available only on reported infeasibility.
2. **INT-D02:** keep the IdP unselected; authorize Claude to prepare evaluation criteria.
3. **Not requested now:** INT-D03 beyond the pending architecture approval; D04, D05 (no spike or priority choice), D06, D07, D08 and D09. Optional spikes require future separate authorization.

None of these is a production, account, paid or $0 decision.

## 5. Ownership and evidence limits

| Who | Role |
|---|---|
| Claude | Architecture now; conformance review later |
| ZCode, Antigravity | Implementation only after PO selection |
| OpenCode | Independent QA plan, review and verification |
| Codex | Coordination and the local environment |

No agent self-approves. MC-002 is not DONE. A local PASS does not establish Cloudflare viability. Price facts and account eligibility are not runtime proof.

## Current bounded review exception

The human [this-round override](../ai-sdlc/step-02-3-review-routing.md) routes the remaining Step02.3 clarification/review to actual OpenCode and skips Claude review of those current items. Historical Claude authorship and default future architecture responsibilities above remain accurate. [Actual OpenCode review](../reviews/step-02-3-opencode-clarification-review.md) and applied scope/matrix wording close the current documentation findings; no PO decision, runtime result or overall architecture approval is implied.
