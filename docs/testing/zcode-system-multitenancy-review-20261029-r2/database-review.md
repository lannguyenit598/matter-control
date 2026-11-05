# Database review — MC-ZCODE-SYSTEM-MULTITENANCY-REVIEW-20261029-R2

Scope: migrations 0001–0008 (`apps/backend/internal/adapter/outbound/postgres/migrations_mattercontrol/`), query set `queries_mattercontrol/{matter,filings,context,dataops,review}.sql`, stores, and the executed fresh-PG race contracts on the pinned candidate.

## 1. ERD (ownership edges; every edge is a matter-scoped composite FK unless noted)

```
users(id; UNIQUE(idp_issuer,idp_subject))
  └ workspace_memberships(workspace_id,user_id PK; role OWNER|MEMBER; status)
workspaces(id, name, revision)
  └ matters(workspace_id FK; id; event_seq; boundary CHECKs)
      ├ matter_memberships(matter_id,user_id PK; role OWNER|EDITOR|VIEWER; status)
      ├ workstreams(matter_id,id UNIQUE)
      ├ graph_nodes(matter_id,id,kind) ── typed-totality deferred trigger
      │    ├ requirements/actions (FK (matter_id,id,kind); owner FK→matter_memberships(matter,user))
      │    │    └ waiting_party_id FK→parties(matter,id); waiting/cancelled shape CHECKs
      │    ├ dependency_edges(matter,source→graph_nodes, target→graph_nodes; no self; UNIQUE pair)
      │    ├ criteria(subject→graph_nodes; document/fixed_version FKs with version_rule CHECK)
      │    └ assessments(subject→graph_nodes; assessed_version→document_versions)
      ├ parties(matter,id UNIQUE)
      ├ milestones ── milestone_prerequisites (both FKs matter-scoped, requirements-only)
      ├ documents(matter,id UNIQUE; current_version_id DEFERRABLE FK→versions(matter,id))
      │    └ document_versions(matter,document FK; version_no UNIQUE per doc; sha256; IMMUTABLE trigger)
      │         ├ signature_observations (IMMUTABLE trigger)
      │         ├ evidence(version FK; DOCUMENT_VERSION↔version_id CHECK)
      │         └ review_grid_versions(version FK matter-scoped)
      ├ evidence ─ evidence_claims (FK (matter,evidence,submitter); UNIQUE (evidence,criterion,revision))
      │            └ assessments (FK (matter,claim,submitter,claimant); RULE-006 CHECK reviewer≠submitter/claimant;
      │                             superseded_by DEFERRABLE self-FK; revoked shape CHECK)
      │                 └ disputes (assessment FK; resolved shape CHECK)
      ├ filing_details(item→actions(matter,id); requirement→graph_nodes; authority→parties; stage CHECK)
      │    └ filing_cycles (matter,item; cycle_no; append-only submissions/observations [0004 body])
      ├ context_records ─ context_links (record+node both matter-scoped)
      ├ import_sources (matter,source_name,row_key PK; content_hash replay/conflict key)
      ├ review_grids(matter,id UNIQUE)
      │    ├ review_grid_versions (grid+version both matter-scoped)
      │    ├ review_questions (FK (matter,grid); UNIQUE (matter,id)+(grid,id))
      │    │    └ review_question_revisions (FK question_id ONLY — SYR-F02)
      │    └ review_answers (FK (matter,grid); version FK matter-scoped; FK (grid,question);
      │         supersedes_id global FK + UNIQUE(supersedes_id); cell index)  [SYR-F02 scope notes]
      └ domain_events(matter,seq PK; append-only trigger; target index; recorded index)
command_receipts(actor_id,key PK; scope CHECK MATTER|WORKSPACE; response JSONB; IMMUTABLE)
  └ command_receipt_matters(PK (actor,key,matter); append-only)   [replay authorization set]
security_audit_events(no titles/content; requested_id_hash BYTEA)
```

## 2. Table-scope matrix (authorization anchor)

| Table | Tenant scope | Anchor |
|---|---|---|
| workspaces, workspace_memberships | workspace | resolved by (workspace, actor) membership lookups; list endpoints filter by actor |
| matters, matter_memberships | matter (+workspace AND-check in policy) | central Access |
| graph_nodes/requirements/actions/workstreams/parties/milestones/prerequisites/dependency_edges | matter | matter-scoped FKs; service reads only via matter snapshot |
| documents/document_versions/signature_observations/criteria/evidence/claims/assessments/disputes/verifier_designations | matter | same |
| filing_details/filing_cycles/observations | matter | same |
| context_records/links, import_sources | matter | same |
| review_grids/versions/questions/revisions/answers | matter (+grid) | grid anchor re-read per command/page |
| domain_events | matter (PK (matter_id,seq)) | history endpoints matter-authorized |
| command_receipts / receipt_matters | actor-scoped + scope CHECK | replay re-authorized per represented matter, CURRENT access |
| security_audit_events | global (restricted fields only) | no tenant data by design |

## 3. Enforced vs service-only invariants

**Enforced by the database:** matter-scoped existence of every parent reference (composite FKs); typed totality of graph nodes (deferred constraint trigger); waiting/cancelled/verification/proof shape CHECKs; RULE-006 (no self-review of offered proof) as a CHECK; append-only events/receipts/versions/signature observations (trigger `forbid_mutation`); receipt scope shape; one successor per superseded answer (`UNIQUE supersedes_id`); idempotency PK per actor+key.

**Service-only (operational convention / app layer):** cycle refusal for dependency edges (core under matter lock — PG race suite passes; no DB constraint); `question_revision` pointing at an existing revision row; supersedes predecessor belonging to the same cell (FK is global — SYR-F02); receipt request-hash equality (checked in service on replay); matter `event_seq` monotonicity inside the locked tx; import content-hash replay-vs-conflict decision.

**Roles/RLS:** no RLS and no per-tenant GUC/session context anywhere (verified: no `SET`/`current_setting` in migrations/queries) — isolation is join-scoped per query, which the contract suites exercise. `MigrateDatabaseURL` optionally separates a schema-owner role from the serving role (`mcapi migrate` / `MC_MIGRATE_ON_START`); production grants are an unexecuted deployment decision (source comment says so explicitly).

## 4. Executed checks on the pinned candidate
- Fresh-schema per test (`pgtest.FreshSchemaDSNFrom`, `MC_TEST_DATABASE_URL`), goose migrations applied by `MigrateMatterControl` per schema; re-entrancy tested (`migrations still pending` test).
- `go test ./internal/adapter/outbound/postgres/... -race -count=1` — PASS 64.4s (memberships, receipts replay, revocation races, review PG contracts, Unicode, perf-bound, people directory).
- Reviewer negative tests (isolated copy): cross-cell cursor seek-safety, foreign-grid anchor 404, cross-matter idempotency refusal — PASS.
- Fixture: disposable container, label-checked owner, 1 CPU/512MiB/128 PIDs, loopback port, randomized credential in 0700/0600 files, container+volume+secrets removed after tests.

## 5. High-history / scale / lifecycle notes (source-level, not load-tested)
- `review_answers` index (grid,version,question,id) supports the keyset seek; `LoadReviewAnswers` (full-grid read) remains bounded by grid limits (≤50 versions × ≤25 questions) for the view path, while history pagination seeks per page (F03 fix).
- `domain_events` per matter grows unbounded by design (append-only legal history); history endpoints are keyset-paginated; no partitioning/archival — acceptable for P0 scale, recorded for production planning.
- Backup/restore single-tenant extraction: source/evidence of a restore rehearsal test exists (`restore_rehearsal_test.go`); per-firm export/lifecycle is not a product capability (ties to SYR-F01).
