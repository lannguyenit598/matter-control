# Database review — MatterControl candidate @20feedbf (uncommitted)

Scope: migrations 0001-0008 (`internal/adapter/outbound/postgres/migrations_mattercontrol/`), the sqlc query set (`queries_mattercontrol/*.sql`), both store adapters (postgres + memory double), pool/config.

## 1. ERD (ownership edges)

```
users(id, idp_issuer, idp_subject UNIQUE(idp_issuer,idp_subject))   ← global identity; NO org entity
  ▲
  │ user_id
workspaces(id, name, revision)
  ▲ workspace_id                    ▲ workspace_id
workspace_memberships               matters(id, workspace_id, revision, event_seq,
  (ws,user) PK, OWNER|MEMBER,           last_recorded_at, boundaries…)
  ACTIVE|REVOKED                        ▲ matter_id
                                    matter_memberships (matter,user) PK,
                                      OWNER|EDITOR|VIEWER, ACTIVE|REVOKED
  ┌───────────────────── every business table below carries matter_id (direct or inherited) ────┐
  │ workstreams(matter_id) ──< requirements / actions (typed totality via graph_nodes +          │
  │   deferred constraint trigger; FK (matter_id,id,kind))                                       │
  │ dependency_edges(matter_id, source, target)  milestones(matter_id) ──< milestone_prerequisites│
  │ parties(matter_id)                                                                            │
  │ documents(matter_id) ──< document_versions(matter_id, document_id composite FK)               │
  │     └─ signature_observations(matter_id, version FK)                                          │
  │ criteria(matter_id, subject_id) ──< evidence(matter_id) ──< evidence_claims ──< assessments    │
  │     ──< disputes;  verifier_designations(matter_id, user)                                     │
  │ filing_details(matter_id) ──< filing_cycles ──< filing_submissions / filing_observations       │
  │ context_records(matter_id) ──< context_links                                                  │
  │ import_sources(matter_id)                                                                     │
  │ review_grids(matter_id) ──< review_grid_versions (composite FK to documents/versions)          │
  │     ──< review_questions ──< review_question_revisions                                        │
  │     ──< review_answers (grid/version/question composite FKs, UNIQUE(supersedes_id))           │
  │ domain_events((matter_id,seq) PK, append-only trigger)                                        │
  │ command_receipts((actor_id,idempotency_key) PK, scope_kind, workspace_id, matter_id)           │
  │     ──< command_receipt_matters (replay re-authorizes EVERY represented matter)               │
  └───────────────────────────────────────────────────────────────────────────────────────────────┘
security_audit_events(id, occurred_at, actor, operation, outcome, requested_id_hash, client_ip)
```

## 2. Table-scope matrix (condensed; every table = one row)

| Table | PK | Tenant scope | Parent path | Key constraints/guards | Authorization anchor |
|---|---|---|---|---|---|
| users | id | global identity | — | UNIQUE(idp_issuer,idp_subject) | issuer+sub verification |
| workspaces | id | tenant | — | — | workspace membership |
| workspace_memberships | (ws,user) | tenant | workspaces | role/status CHECK | ws OWNER admin ops |
| matters | id | tenant | workspaces | boundary CHECKs | ws+matter membership |
| matter_memberships | (matter,user) | sub-scope | matters | role/status CHECK | matter OWNER admin ops |
| workstreams / parties / milestones / context_records / import_sources / filing_details / documents / evidence / criteria | id | inherited | matters(matter_id) | FK to matters | matter read/write role |
| graph_nodes / requirements / actions | id | inherited | matters + typed totality | FK (matter,id,kind); deferred trigger; no-delete triggers | work role policy |
| dependency_edges / milestone_prerequisites | composite | inherited | matters | matter-scoped FKs both ends | work role |
| document_versions | id | inherited | documents (composite FK incl. matter_id) | content hash/size; promotion state | document read/write |
| evidence_claims / assessments / disputes | id | inherited | evidence/criteria (matter-scoped FKs) | epoch binding on assessments | proof policy (EDITOR+ designated verifier) |
| filing_cycles / submissions / observations | id | inherited | filing_details (matter-scoped) | stage machine guards | filing role rules |
| review_grids / grid_versions / questions / question_revisions / answers | id | inherited | matters + composite parent FKs | UNIQUE(matter,version) per grid; UNIQUE(supersedes_id); index review_answers_cell | review read = any active matter role; write = OWNER/EDITOR |
| domain_events | (matter_id,seq) | inherited | matters | append-only trigger; actor CHECK | event read via matter role |
| command_receipts | (actor_id, idempotency_key) | actor+scope | workspaces/matters | scope CHECK; append-only | replay re-auth (represented matters) |
| security_audit_events | id | global audit | — | restricted (hashed ids) | ops only |

## 3. What the DB enforces vs what services enforce

DB-enforced: identity uniqueness `(idp_issuer,idp_subject)`; matter-scoped FK composition (cross-matter references impossible at FK level for work items, document versions, review grid/version/question/answer chains); typed totality (deferred constraint trigger); append-only history + receipts + receipt-matters (triggers); receipt scope CHECK; review answer single-successor (UNIQUE(supersedes_id)); membership role/status CHECKs.

Service-enforced (by design): every authorization decision (no RLS — finding A-04); CAS revisions (revision columns + service compare inside the serialized matter transaction — the unconditional Matter lock makes the compare safe, race-tested); idempotency fingerprint binding to URL path at the HTTP layer (A-01 gap at service layer); receipt purge_after semantics (no retention value approved — TB-06 open); people-directory issuer scoping (A-02).

## 4. Queries, transactions, concurrency

- All sqlc queries are matter_id-scoped (verified across matter.sql, evidence/filing/dataops/review queries); no cross-matter JOIN was found; list/count/export/brief read through the same snapshots.
- `command_receipts` PK (actor_id, idempotency_key): global per actor — cross-ACTOR replay impossible (T-07). Cross-MATTER replay is possible at the service layer (A-01, mitigated at HTTP by the URL-path fingerprint).
- Concurrency: unconditional matter lock serializes all commands of a matter (race tests in the 656-run suite: same-predecessor answers, structure changes, reword-vs-answer races); append-only guards protect history.
- History: review answers now keyset-paginated `(answered_at,id)` limit+1 (0008 + review.sql); domain events paginated (recorded_at,seq); 50×25 grid scale tested by the verifier packet.
- Roles/RLS: none in the disposable test bundle by design ("role/column grants come with the deployment decision", migration comment). No SECURITY DEFINER functions; no session-scoped tenant GUCs to leak across pooled connections (T-17).
- Migration hygiene: goose Up/Down pairs; 0008 Down drops review tables in dependency order (destroys recorded review data — documented; not executed here); generated sqlc byte-consistent with source SQL (make sqlc-check in the suite run).

## 5. Verdict

DB integrity: **SUPPORTED_WITH_LIMITS** — enforced scope composition is strong and correctly inherited; authorization + fingerprint binding live in the application layer (A-01/A-04); organization-level tenancy does not exist in the schema (A-03). No cross-tenant data path was found in any migration, query, or store.
