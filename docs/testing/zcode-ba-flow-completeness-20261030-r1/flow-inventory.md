# Flow inventory — MC-ZCODE-BA-FLOW-COMPLETENESS-20261030-r1

- Agent: actual ZCode acting as BA (author-adjacent: ZCode is a partial backend author — NOT independent QA).
- Base: HEAD `0de3e5dbb8ef578c7288ba9c49ecaeddbbcbdcee` + dirty tree (tracked-diff hash before review: `5b086afe86e032f5290fd6307d403955319f42ae22a3c2be32e48b11a2aedd8f`).
- Sources: backend route table `apps/backend/internal/adapter/inbound/productapi/server.go:110-201` (88 endpoints under `/api/v1`), frontend routes `apps/frontend/src/app/(app)/**/page.tsx` (20 app routes + `/login` + root), BF review/remediation returns, targeted page reads.
- Status vocabulary: COMPLETE / PARTIAL / MISSING / NOT_VERIFIED; final per-flow verdicts live in coverage-summary.md.

## F01 — Identity & session (access layer of REQ-MC-P0-18)

- API: bearer verification on every `/api/v1` route (`server.go:110,241-258`); verifier = RFC 7662 introspection to ZITADEL (`identity/zitadel/verifier.go:129`); identity resolution `postgres/identity_resolver.go:26` (provisioning explicit, unknown → uniform 403).
- UI: `/login` (`app/login/page.tsx`), root `/` (`app/page.tsx` → redirect), OIDC flow `src/lib/oidc/flow.ts` (safe return targets, BF-06 remediation), BFF session (server actions).
- Rules: RULE-017 scope rule; token expiry + verifier CacheTTL (30 s default, documented revocation window).
- Roles: any provisioned user; verifier outage=503, unprovisioned=uniform 403 (`server.go:239-241` comment).
- UI reach: YES (login + callback; default landing My Work after BF-06 fix).
- BA status: PARTIAL — bearer path verified over HTTP this run with a synthetic IdP stub; real-IdP SSO login (ZITADEL) NOT_RUN (no synthetic passwords available without reading secret files; per prompt recorded as blocked, other paths used).

## F02 — Workspace & members (REQ-MC-P0-18)

- API: `GET/POST /workspaces`, `GET /workspaces/:id`, `GET /workspaces/:id/matters`, `POST /workspaces/:id/matters`, `GET /workspaces/:id/members`, `GET /workspaces/:id/member-candidates`, `POST /workspaces/:id/members`, `POST /workspaces/:id/members/:userId/revocation` (`server.go:111-119`).
- UI: `/workspaces` (list), `/workspaces/[workspaceId]` (detail with members admin).
- Rules: RULE-017; workspace OWNER administers membership; revocation removes derived matter access immediately (AC-147).
- Roles: Workspace OWNER admin; members read.
- UI reach: YES.
- BA status: finalized in coverage-summary.md after walkthrough.

## F03 — Matter & membership & verifiers (REQ-MC-P0-18, container of P0-09)

- API: `GET /matters` (cross-workspace discovery, BF-08 fix), `POST /workspaces/:id/matters`, `GET /matters/:id`, matter members list/grant/revoke, member-candidates, verifiers list/designate/revoke (`server.go:120-124,198-200`).
- UI: `/matters` (discovery + client-side search), matter root `/matters/[matterId]` (operational brief after BF-07 fix), members admin section (icon disclosures).
- Rules: RULE-017; matter OWNER admin; workspace OWNER is not an automatic matter reader (AC-118); verifier designation must be EDITOR/OWNER, not submitter (RULE-006).
- Roles: OWNER admin; all members read; workspace-external users uniform 403.
- UI reach: YES.
- BA status: finalized in coverage-summary.md.

## F04 — Workstream & Milestone (REQ-MC-P0-02)

- API: `GET/POST /matters/:id/workstreams`, `GET/POST /matters/:id/milestones`, `PUT /matters/:id/milestones/:milestoneId/prerequisites` (`server.go:140-147`).
- UI: `/matters/[matterId]/planning` (workstreams, milestones, critical designation, required prerequisites via icon disclosure).
- Rules: RULE-008 (readiness = conjunction of explicitly designated required Requirements; empty set = unassessed; counts informational); RULE-003; OWNER-only prerequisite/critical changes with reason.
- UI reach: YES (planning page).
- BA status: finalized in coverage-summary.md.

## F05 — Requirement & Action (work items) (REQ-MC-P0-01, P0-03)

- API: `POST /matters/:id/requirements`, `GET /requirements/:id`, `GET /matters/:id/work-items` (list/grid), `POST /matters/:id/actions`, `GET/PATCH /matters/:id/work-items/:itemId`, `POST .../execution` transitions, `POST .../escalation` (`server.go:126-137`).
- UI: `/matters/[matterId]/work` grid, `/matters/[matterId]/work/[itemId]` detail (WorkNow primary operation after BF-09), `/requirements/[requirementId]` deep link, `/my-actions` (own work, BF-06 landing).
- Rules: RULE-001 (Requirement ≠ Action; action completion never verifies), RULE-021 (deterministic next-action order), state-semantics execution table (guards, WAITING reason/party, OWNER-only cancel/reopen), AC-101/121/122/122-family.
- UI reach: YES.
- BA status: finalized in coverage-summary.md.

## F06 — Dependency / Blocker / Waiting-On (REQ-MC-P0-04, P0-05)

- API: `POST /matters/:id/work-items/:itemId/dependencies`, `POST .../dependencies/:edgeId/removal` (`server.go:138-139`), `GET /matters/:id/waiting-on` (`server.go:148`).
- UI: work detail dependency panel (search picker after BF-04), waiting-on view (Control Room + work detail); waiting relations recorded with reason/party.
- Rules: RULE-003 (AND gates; completion vs proof gate explicit; cycle/self/duplicate/cross-matter rejection), RULE-004 (reopen re-blocks transitively; cancellation never waives), AC-104/105/123/124/125/130/146.
- UI reach: YES.
- BA status: finalized in coverage-summary.md.

## F07 — Evidence & Proof (REQ-MC-P0-06, P0-07)

- API: `GET .../work-items/:itemId/proof` checklist, `POST .../criteria`, `POST .../criteria/:critId/revision`, `POST .../applicability`, `GET/POST /matters/:id/evidence`, `POST .../evidence/:evId/claims`, `POST .../evidence/:evId/withdrawal`, `POST .../claims/:claimId/assessments`, `POST .../assessments/:aId/revocation`, `POST .../assessments/:aId/disputes`, `POST .../disputes/:dId/resolution`, `GET /me/reviews` (BF-05 verifier queue) (`server.go:130,158-169`).
- UI: work detail proof panel (Package/Outcome grouping after BF-01/02), `/my-reviews` verifier queue page, evidence review disclosures.
- Rules: RULE-005 (criteria vs proof; zero criteria ≠ verified), RULE-006 (designated non-submitter verifier), RULE-007 (rejection/expiry/supersession recompute; dispute precedence), AC-106/107/126/127/128/140/157.
- UI reach: YES (all controls on work detail + /my-reviews).
- BA status: finalized in coverage-summary.md.

## F08 — Document & Version & Signature (REQ-MC-P0-15)

- API: `GET/POST /matters/:id/documents`, `GET .../documents/:docId`, `POST /matters/:id/documents/:docId/versions` (upload), `GET .../versions/:versionId/content`, `POST .../promotion`, `POST /matters/:id/versions/:versionId/signatures` (`server.go:151-157`).
- UI: `/matters/[matterId]/documents` + `/documents/[documentId]` (version list, upload, promotion, signature recording, current/superseded badges).
- Rules: RULE-011 (upload never auto-promotes; OWNER promotion requires expected prior version + reason), signature completeness is a separate observation/criterion.
- UI reach: YES.
- BA status: finalized in coverage-summary.md.

## F09 — Filing lifecycle (REQ-MC-P0-16)

- API: `GET/POST /matters/:id/filings`, `GET .../filings/:filingId`, `POST .../stage` advance, `POST .../negative-outcome`, `POST .../closure`, `POST .../reopening`, `POST .../signature-applicability`, `POST .../observations/:obsId/correction` (`server.go:170-178`).
- UI: `/matters/[matterId]/filings` list, `/filings/new` (creation with outcome-verification choice), `/filings/[filingId]` detail (stage advance, observations, outcome-verification badge after BF-01/02 remediation).
- Rules: RULE-012 (stage guards; submission ≠ receipt ≠ approval; package completeness from declared criteria; rejection/withdrawal distinct), BF-01 criterion-purpose split (PACKAGE vs OUTCOME), AC-116/129/145.
- UI reach: YES.
- BA status: finalized in coverage-summary.md.

## F10 — Review grids (due-diligence grid) (P1 REQ-MC-P1 partial, supports GW-02)

- API: `GET/POST /matters/:id/review-grids`, `GET .../review-grids/:gridId`, `POST .../versions`, `POST .../versions/:versionId/removal`, `POST .../questions`, `POST .../questions/:questionId/revision`, `POST .../answers`, `GET .../cells/:versionId/:questionId/history` (`server.go:179-187`).
- UI: `/matters/[matterId]/reviews` page.
- Rules: beyond-P0 capability (P1-adjacent, implemented early); AC-157-style history on cells; links to gap/finding context records.
- UI reach: YES.
- BA status: finalized in coverage-summary.md; classified as beyond-baseline implementation (Bước F).

## F11 — Context records & Parties (REQ-MC-P0-17, RULE-020)

- API: `GET/POST /matters/:id/context-records`, `PATCH .../context-records/:recordId`, `GET/POST /matters/:id/parties`, `PATCH .../parties/:partyId` (`server.go:142-144,189-191`).
- UI: matter pages hosting context records (Control Room sections, work detail context), party management in matter UI, waiting-on party references.
- Rules: RULE-020 (Decision/Finding/Risk/Entity typed distinctions); FR-017 (parties have no accounts; contact scoped); AC-117/159.
- UI reach: YES.
- BA status: finalized in coverage-summary.md.

## F12 — Orientation views (REQ-MC-P0-09, P0-10, P0-11 surfaces)

- API: `GET /matters/:id/control-room`, `GET /me/actions`, `GET /me/reviews`, work-items list, waiting-on (shared reads).
- UI: matter root overview (brief variant after BF-07/13 remediation), `/control-room` full variant, `/my-actions`, `/my-reviews`, `/planning`, `/agenda`, `/work` grid + detail.
- Rules: FR-009 (Control Room must answer state/blockers/next/waiting/proof/milestone), FR-010 (My Actions scoped), RULE-021 ordering, AC-109/110/144.
- UI reach: YES.
- BA status: finalized in coverage-summary.md.

## F13 — Data operations (bulk/import/export) (REQ-MC-P0-12, P0-13, P0-14)

- API: `POST /matters/:id/bulk/preview`, `POST .../bulk/commit`, `POST .../import/preview`, `POST .../import/commit`, `GET .../export` (`server.go:192-196`).
- UI: `/matters/[matterId]/data` page (bulk preview→commit, import preview→commit with mapping/duplicates, export CSV/Excel, brief section after BF-10 fix).
- Rules: RULE-013 (allowlist title/description/assignee/due; per-row atomic; partial success explicit; no bulk verify/waive/promote), RULE-014 (import validation, retry-safety, claims-not-verified), RULE-015 (export scope/formula-escaping/empty explicit), AC-112/113/131/132/133/148.
- UI reach: YES.
- BA status: finalized in coverage-summary.md.

## F14 — History & Status Brief (REQ-MC-P0-08, P0-19)

- API: `GET /matters/:id/events` (paged history), `GET /matters/:id/brief` (t1/t2 delta) (`server.go:125,197`).
- UI: `/matters/[matterId]/history`, `/data` brief section (BF-10 fix: device-zone windows, readable labels, links).
- Rules: RULE-016 (deterministic delta; changes in (t1,t2] vs outstanding at t2; no-change explicit; access-loss blocks), RULE-019, AC-108/119/136/138/149.
- UI reach: YES.
- BA status: finalized in coverage-summary.md.

## F15 — Recovery & concurrency (RULE-018; NFR-003; AC-139/153)

- API: `Idempotency-Key` header on commands, `GET /operations/:key` (own receipt), `POST /matters/:id/operations/:key/reconciliation` (`server.go:128,149`), `If-Match` CAS on resource writes (`server.go:291-345`).
- UI: reload-safe create forms (idempotency key + values retained across reload — recent commit fc09bec), OUTCOME_UNKNOWN state display + recovery action.
- Rules: RULE-018 (stale/conflict, safe retry returns outcome once, no duplicate effects); AC-139/153.
- UI reach: YES (create forms + work detail recovery affordances).
- BA status: finalized in coverage-summary.md.

## F16 — Cross-cutting (permission matrix, states coherence, a11y basics, timezone)

- API: central gate `WorkService.execute` (membership + policy; hidden → not-found; denials audited — backend AGENTS.md "Architecture: mandatory rules"); readSnapshot on all reads; problem+json errors.
- UI: hidden vs 403/404 conventions, empty/loading/error states, client-zone dates (BF-03 fix: `lib/mc/local-time.ts`), bilingual labels (vi/en), keyboard/a11y basics (AC-150/151/152).
- Rules: RULE-002 (five axes preserved), permission-matrix.md whole table, AC-134/135/147/150/151/152/156.
- UI reach: YES (cross-cutting).
- BA status: finalized in coverage-summary.md.

## F-extra discovered during inventory

- **FE-01 — Matter cross-workspace discovery read model** (`GET /matters`): BF-08 remediation addition; authorized `MattersOf` derivation; listed because the seeded list did not name it (it was folded into F03 "danh sách/khám phá").
- **FE-02 — Verifier review queue** (`GET /me/reviews`, `/my-reviews` page): BF-05 remediation addition; already named in F07 seed ("hàng chờ verifier").
- No flow was found in source that lacks any seed category; the two above are the only new named surfaces.
