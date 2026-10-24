# Software Requirements Specification

Owner: Codex — BA. Status: **DRAFT_FOR_PRODUCT_REQUIREMENTS_APPROVAL**. Source: Step 01 and approved capability baseline `20f12fe`. Functional scope is approved; detailed behaviors below are proposals wherever they reference a proposed RULE/OBD. No implementation/architecture selected.

## Contract conventions

Each FR retains its REQ-MC-P0 parent, maps to BR/US/AC and inherits RULE-017/018/019. All writes validate current authorization, scoped references and revision; failed mutations do not create successful domain history. Data shown unavailable/stale cannot be replaced by a reassuring default. Explicit input means business information, not a database column or API field design.

Domain relationships: Workspace contains memberships and Matters; Matter has explicit memberships, Workstreams/Milestones, Requirements/Actions. Requirement may have zero/multiple Actions and Evidence Requirements; Evidence addresses criteria and exact Document Versions. Document identity differs from versions; Filing groups declared criteria/submission observations and external waiting. Decision/Finding/Risk preserve context/follow-up; Entity reference remains distinct from External Party; Legal Question remains P1. Event History links changes across them. No generic Item+JSON replacement. Detailed language stays in glossary; membership adds the access relationship requested in Step 01, not an arbitrary concept count.

Dependencies below are directional contract/test-setup prerequisites, not a fixed delivery schedule or the product dependency graph. “Related / co-required” preserves mutual behavioral integration separately. FR-018 establishes access contract, FR-001 typed identities and FR-020 state vocabulary/guard contract before dependent test fixtures; integrated derived-state tests use all related contracts. No architecture decomposition is inferred.

## P0 functional contracts

### FR-001 — Requirement vs Action

Parent: REQ-MC-P0-01. Business: BR-005. Persona: Transaction Owner. Story: US-001. Priority: P0.

| Contract field | Requirement |
|---|---|
| Business purpose | Phân biệt điều kiện cần đạt với công việc thực hiện |
| Inputs | Matter/Workstream, loại Requirement hoặc Action, outcome/work description, owner, due, liên kết |
| Outputs | Typed record và liên kết rõ ràng, năm trạng thái phù hợp |
| Functional behavior | Tạo/sửa Requirement độc lập Action; liên kết zero/multiple Actions; tạo basic Decision/Finding/Risk theo RULE-020 khi workflow cần |
| Business rules | RULE-001, RULE-002, RULE-020 |
| Validation | Loại, title/outcome không trống; references cùng matter; không ép 1:1 |
| Error behavior | Sai type/reference: reject và chỉ rõ field; không đổi record loại khác hoặc generic hóa |
| Permissions | EDITOR/OWNER; critical transitions theo matrix |
| Audit | Create/edit/link/unlink và before/after, actor |
| Dependencies | FR-018 |
| Related / co-required | FR-018, FR-020; integration coverage is bidirectional, not sequencing |
| Acceptance criteria | AC-101, AC-121, AC-159 |

### FR-002 — Milestones

Parent: REQ-MC-P0-02. Business: BR-002. Persona: Transaction Owner. Story: US-002. Priority: P0.

| Contract field | Requirement |
|---|---|
| Business purpose | Biết readiness của mốc mà không bị phần trăm hoàn thành gây hiểu nhầm |
| Inputs | Milestone, due, explicit required Requirements, critical designation |
| Outputs | Readiness, satisfied/total, failed prerequisite reasons |
| Functional behavior | Đánh giá từng prerequisite; no prerequisites là unassessed; expose chuỗi blocker và evidence gap |
| Business rules | RULE-008, RULE-003, RULE-010 |
| Validation | Prerequisites cùng matter, explicit applicable criteria; không dùng task count làm approval |
| Error behavior | Thiếu definition: unassessed; stale/evaluator error: unavailable, không ready |
| Permissions | OWNER sửa prerequisites/critical designation; members đọc |
| Audit | Milestone changes và causal readiness changes |
| Dependencies | FR-005, FR-007, FR-020 |
| Related / co-required | FR-001, FR-005, FR-007; integration coverage is bidirectional, not sequencing |
| Acceptance criteria | AC-102, AC-141 |

### FR-003 — Next Action

Parent: REQ-MC-P0-03. Business: BR-003. Persona: Contributor. Story: US-003. Priority: P0.

| Contract field | Requirement |
|---|---|
| Business purpose | Biết hành động khả thi tiếp theo và người chịu trách nhiệm |
| Inputs | Visible Actions, owner, execution, dependency, due/attention |
| Outputs | Ordered candidate list, reason, owner, empty/exclusion explanation |
| Functional behavior | Lọc/sắp theo RULE-021, navigate to context; follow-up explicit thay vì tự mở khóa waiting work |
| Business rules | RULE-021, RULE-003 |
| Validation | Current authorized snapshot; active assignee; deterministic tie order |
| Error behavior | Không có candidate: giải thích waiting/blocker/unassigned; stale snapshot yêu cầu refresh |
| Permissions | Members đọc scope; EDITOR/OWNER assign/edit |
| Audit | Action/assignment changes auditable; đọc recommendation không tạo mutation giả |
| Dependencies | FR-010, FR-005, FR-020 |
| Related / co-required | FR-004, FR-005, FR-010, FR-018; integration coverage is bidirectional, not sequencing |
| Acceptance criteria | AC-103, AC-144 |

### FR-004 — Waiting On

Parent: REQ-MC-P0-04. Business: BR-003. Persona: Contributor. Story: US-004. Priority: P0.

| Contract field | Requirement |
|---|---|
| Business purpose | Biết đang chờ ai hoặc điều kiện gì |
| Inputs | Requirement/Action/Filing context, external party hoặc condition, internal owner, follow-up due |
| Outputs | Waiting On relation, reason, follow-up context |
| Functional behavior | Ghi waiting, nhận response và resolve relation; execution WAITING tách dependency BLOCKED |
| Business rules | RULE-002, RULE-012, RULE-021 |
| Validation | Waiting phải có reason và internal accountable owner; party cùng matter context |
| Error behavior | Party không có quyền/không hợp lệ: reject; response không tự complete/verify |
| Permissions | EDITOR/OWNER mutate; members đọc scoped party data |
| Audit | Waiting set/changed/resolved, response reference và actor/time |
| Dependencies | FR-017, FR-020, FR-001 |
| Related / co-required | FR-017, FR-020; integration coverage is bidirectional, not sequencing |
| Acceptance criteria | AC-104, AC-130 |

### FR-005 — Dependencies and Blocker Logic

Parent: REQ-MC-P0-05. Business: BR-004. Persona: Transaction Owner. Story: US-005. Priority: P0.

| Contract field | Requirement |
|---|---|
| Business purpose | Giải thích và duy trì blockers nhất quán |
| Inputs | Typed prerequisite/target, explicit gate, current states/revisions |
| Outputs | Validated graph links, READY/BLOCKED and causal failed gate list |
| Functional behavior | AND incoming gates; recursive recompute; propagate reopen without falsifying completed history |
| Business rules | RULE-003, RULE-004, RULE-018 |
| Validation | No self/duplicate/cycle/cross-matter link; gate type explicit; current revision |
| Error behavior | Reject cycle with authorized path; concurrent invalid graph rejected without partial edges |
| Permissions | EDITOR/OWNER link ordinary dependencies; milestone prerequisites OWNER |
| Audit | Edge add/remove/gate edit and downstream causal changes |
| Dependencies | FR-001, FR-007, FR-020, FR-018, FR-008 |
| Related / co-required | FR-001, FR-007, FR-020; integration coverage is bidirectional, not sequencing |
| Acceptance criteria | AC-105, AC-122, AC-123, AC-124, AC-125, AC-146 |

### FR-006 — Evidence Requirements

Parent: REQ-MC-P0-06. Business: BR-005. Persona: Reviewer / Manager. Story: US-006. Priority: P0.

| Contract field | Requirement |
|---|---|
| Business purpose | Xác định proof cần có trước khi kết luận |
| Inputs | Subject, mandatory criteria/components, acceptable proof, current/fixed version rule, expiry if applicable |
| Outputs | Criteria checklist distinct from evidence, gaps and applicability |
| Functional behavior | Create/revise criteria; attach evidence later; expose missing even when execution completed |
| Business rules | RULE-005, RULE-007 |
| Validation | Criterion scope/type; applicability reason; positive validity interval; criteria revision invalidates stale assessment |
| Error behavior | Missing proof is gap, not fake attachment; invalid criterion rejected |
| Permissions | EDITOR/OWNER draft criteria; OWNER applicability exception; verifier evaluates |
| Audit | Criterion revision, applicability reason and affected assessments |
| Dependencies | FR-001, FR-015, FR-018 |
| Related / co-required | FR-001, FR-015; integration coverage is bidirectional, not sequencing |
| Acceptance criteria | AC-106, AC-127 |

### FR-007 — Evidence Verification

Parent: REQ-MC-P0-07. Business: BR-005. Persona: Reviewer / Manager. Story: US-007. Priority: P0.

| Contract field | Requirement |
|---|---|
| Business purpose | Chứng minh completion bằng proof được review có trách nhiệm |
| Inputs | Evidence/version, criterion revision, validity, reviewer verdict/reason |
| Outputs | Review record and current verification with dependent impact |
| Functional behavior | Submit separate from verify; independent designated verifier; expiry/rejection/dispute/reversal recomputes current aggregate |
| Business rules | RULE-005, RULE-006, RULE-007 |
| Validation | Scope, version, validity, no-self, verifier designation, current revision |
| Error behavior | Reject unauthorized/stale review; missing/expired proof cannot produce VERIFIED; preserve past review |
| Permissions | Submit EDITOR/OWNER; verify designated non-submitter only |
| Audit | Submission, review, reversal, dispute and causal recompute |
| Dependencies | FR-006, FR-015, FR-018, FR-008, FR-020 |
| Related / co-required | FR-006, FR-015, FR-018, FR-020; integration coverage is bidirectional, not sequencing |
| Acceptance criteria | AC-107, AC-121, AC-126, AC-127, AC-140 |

### FR-008 — Event History

Parent: REQ-MC-P0-08. Business: BR-006. Persona: Reviewer / Manager. Story: US-008. Priority: P0.

| Contract field | Requirement |
|---|---|
| Business purpose | Truy nguyên sự thật và sửa sai có lịch sử |
| Inputs | Accepted domain mutations, actor/reason/time, target/scope, correlation |
| Outputs | Ordered attributable history and correction links |
| Functional behavior | Expose authorized history; distinguish effective vs recorded time; prevent ordinary edit/delete history |
| Business rules | RULE-019, RULE-018 |
| Validation | Accepted event refers to committed change; batch/import correlation; no secret fields |
| Error behavior | Failure to persist history prevents successful mutation; denied attempt separate restricted audit |
| Permissions | Members read same-matter domain history; no direct history mutation |
| Audit | History is the output; correction appends and references prior event |
| Dependencies | FR-018, FR-001 |
| Related / co-required | FR-018; cross-cutting every mutation; integration coverage is bidirectional, not sequencing |
| Acceptance criteria | AC-108, AC-136, AC-149, AC-153 |

### FR-009 — Matter Control Room

Parent: REQ-MC-P0-09. Business: BR-001. Persona: Transaction Owner. Story: US-009. Priority: P0.

| Contract field | Requirement |
|---|---|
| Business purpose | Hiểu major matter state khoảng 10 giây |
| Inputs | Authorized snapshot of states, blockers, milestones, evidence gaps, decisions, changes |
| Outputs | Control Room summary with reasons/as-of and links to source context |
| Functional behavior | Show current truth, changes, blockers/why, next/owner, waiting, missing proof and nearest relevant milestone; unknown is visible |
| Business rules | RULE-002, RULE-008, RULE-010, RULE-016 |
| Validation | Summary ties to same scope/as-of; no aggregation hiding restricted records |
| Error behavior | Partial loading/error/stale region explicit; do not display zero blockers from failure |
| Permissions | Members read only their matters; actions via operation permission |
| Audit | Underlying changes traceable; summary view not a domain change |
| Dependencies | FR-002, FR-003, FR-004, FR-005, FR-007, FR-008, FR-019, FR-020 |
| Related / co-required | FR-002, FR-003, FR-004, FR-005, FR-007, FR-008, FR-019; integration coverage is bidirectional, not sequencing |
| Acceptance criteria | AC-109, AC-137 |

### FR-010 — My Actions

Parent: REQ-MC-P0-10. Business: BR-003. Persona: Contributor. Story: US-010. Priority: P0.

| Contract field | Requirement |
|---|---|
| Business purpose | Tìm việc được giao mà không lẫn quyền truy cập |
| Inputs | Current user, active memberships, assigned actions, filters |
| Outputs | My Actions with due, evidence needs, waiting/dependency reasons |
| Functional behavior | Show own visible assigned work; distinguish actionable/waiting/blocked; open context and follow-up |
| Business rules | RULE-017, RULE-021 |
| Validation | Assignment points to active scoped member; filter stable; no role escalation via assignment |
| Error behavior | Revoked access removes result; zero own work honest empty state; unavailable not empty |
| Permissions | Members read own scope; EDITOR/OWNER assignment updates |
| Audit | Assignment/reassignment history |
| Dependencies | FR-001, FR-004, FR-005, FR-018 |
| Related / co-required | FR-001, FR-004, FR-005, FR-018; integration coverage is bidirectional, not sequencing |
| Acceptance criteria | AC-110, AC-144, AC-147 |

### FR-011 — Operational Grid

Parent: REQ-MC-P0-11. Business: BR-003. Persona: Contributor. Story: US-011. Priority: P0.

| Contract field | Requirement |
|---|---|
| Business purpose | Xử lý 50–200 records với ít chuyển context |
| Inputs | Authorized typed records, filters, row revisions, field edits, selection |
| Outputs | Dense grid, typed states, inline result/errors and stable selection |
| Functional behavior | Keyboard navigation/edit/cancel/save; multiselect; context details; clearly show evidence gaps and blocked vs actionable |
| Business rules | RULE-002, RULE-013, RULE-018 |
| Validation | Editable field allowlist; required types/dates; stale revision; hidden rows not silently selected |
| Error behavior | Inline failure retains draft and prior server value; precise row/field error; conflict requires reconciliation |
| Permissions | Members read; EDITOR/OWNER edit allowed metadata, not computed state |
| Audit | Successful field changes linked to actor; no event for cancelled edit |
| Dependencies | FR-001, FR-012, FR-018, FR-020 |
| Related / co-required | FR-001, FR-012, FR-018, FR-020; integration coverage is bidirectional, not sequencing |
| Acceptance criteria | AC-111, AC-139, AC-150 |

### FR-012 — Bulk Editing

Parent: REQ-MC-P0-12. Business: BR-003. Persona: Contributor. Story: US-012. Priority: P0.

| Contract field | Requirement |
|---|---|
| Business purpose | Thay đổi nhiều record an toàn và biết kết quả từng dòng |
| Inputs | Explicit selected IDs, allowed metadata patch, preview revisions |
| Outputs | Per-row success/failure summary and retry selection |
| Functional behavior | Preview exact selection; commit each valid row atomically with audit; recheck rights/revisions; failed rows unchanged |
| Business rules | RULE-013, RULE-018 |
| Validation | Field allowlist; permissions; owner/due values; no bulk verify/waive/promotion |
| Error behavior | Partial failure explicit; retry failed only; unknown outcome reconcile operation before resubmit |
| Permissions | EDITOR/OWNER per target; VIEWER denied |
| Audit | Batch correlation plus each successful row event; failure list scoped |
| Dependencies | FR-001, FR-018, FR-008, FR-020 |
| Related / co-required | FR-011, FR-018, FR-008; integration coverage is bidirectional, not sequencing |
| Acceptance criteria | AC-112, AC-133, AC-139 |

### FR-013 — Excel/CSV Import

Parent: REQ-MC-P0-13. Business: BR-003. Persona: Contributor. Story: US-013. Priority: P0.

| Contract field | Requirement |
|---|---|
| Business purpose | Chuyển tracker hiện có sang typed operational work |
| Inputs | Excel/CSV, source identity/row keys, mapping, timezone, same-matter references |
| Outputs | Preview/errors, import result and typed records with lineage |
| Functional behavior | Map Requirement/Action separately, validate groups/duplicates; explicit confirm; retry-safe apply; verification claims retained for review only |
| Business rules | RULE-014, RULE-015, RULE-018 |
| Validation | Malformed input/types/dates/formulas, unknown references, duplicate keys, graph cycles and scoped ownership |
| Error behavior | No mutations on preview; invalid group rejected; no silent coercion/fuzzy merge; changed retry conflicts |
| Permissions | EDITOR/OWNER import in granted matter; cannot grant role or verified state |
| Audit | Import/source key and row→record mapping, each actual mutation |
| Dependencies | FR-001, FR-005, FR-006, FR-018, FR-008 |
| Related / co-required | FR-001, FR-005, FR-006, FR-018; integration coverage is bidirectional, not sequencing |
| Acceptance criteria | AC-113, AC-131, AC-132, AC-148 |

### FR-014 — Excel Export

Parent: REQ-MC-P0-14. Business: BR-007. Persona: Reviewer / Manager. Story: US-014. Priority: P0.

| Contract field | Requirement |
|---|---|
| Business purpose | Chia sẻ bảng vận hành có ngữ nghĩa chính xác |
| Inputs | Authorized scope/filter, selected fields, as-of, timezone |
| Outputs | Excel table with type/state/version labels and provenance |
| Functional behavior | Export current permitted facts; preserve distinction and dates; formula-safe literal values; empty export explicit |
| Business rules | RULE-015, RULE-017 |
| Validation | Rights at generation and retrieval; valid fields/scope; no hidden metadata/counts |
| Error behavior | Export failure yields no partial file presented as complete; revoked permission denies retrieval |
| Permissions | All active scoped roles may export visible data; no implied external distribution permission |
| Audit | Export request scope/time/actor without copying sensitive payload into audit |
| Dependencies | FR-018, FR-020, FR-015 |
| Related / co-required | FR-018, FR-020, FR-015; integration coverage is bidirectional, not sequencing |
| Acceptance criteria | AC-114, AC-148, AC-147 |

### FR-015 — Document Versions

Parent: REQ-MC-P0-15. Business: BR-006. Persona: Reviewer / Manager. Story: US-015. Priority: P0.

| Contract field | Requirement |
|---|---|
| Business purpose | Nhận biết authoritative version và proof đang tham chiếu |
| Inputs | Document identity, version content/reference, prior-current revision, promotion reason |
| Outputs | Immutable version identity/lineage, one current pointer, signature observations |
| Functional behavior | Add version separately from promotion; preserve old links; assess current-version criterion impact, not blanket invalidation |
| Business rules | RULE-011, RULE-007 |
| Validation | Same document/matter; current pointer uniqueness; no overwrite; authorized promotion |
| Error behavior | Stale promotion rejects; missing/unavailable content visible; no false version/current label |
| Permissions | EDITOR/OWNER add; OWNER promote; members read accessible version metadata/content |
| Audit | Version added/promoted/superseded and linked proof changes |
| Dependencies | FR-018, FR-001, FR-008 |
| Related / co-required | FR-018, FR-006, FR-007; integration coverage is bidirectional, not sequencing |
| Acceptance criteria | AC-115, AC-128 |

### FR-016 — Regulatory Filing Lifecycle

Parent: REQ-MC-P0-16. Business: BR-005. Persona: Contributor. Story: US-016. Priority: P0.

| Contract field | Requirement |
|---|---|
| Business purpose | Theo dõi hồ sơ nộp đến outcome mà không nhầm receipt với approval |
| Inputs | Filing requirement, party, package criteria/versions, submission/receipt/authority proof |
| Outputs | Stage, execution/proof status, waiting party, supplement cycles, next work |
| Functional behavior | Track golden stages and repeat/negative paths; no automated filing; package completeness based on declared criteria |
| Business rules | RULE-012, RULE-005, RULE-011 |
| Validation | Stage guards, exact versions/evidence, response cycle references, owner and dates |
| Error behavior | Premature submission/approval rejected; missing acknowledgement remains waiting; rejection/withdrawal preserved |
| Permissions | EDITOR/OWNER record stages; OWNER cancellation/correction; verifier handles proof |
| Audit | Each stage/cycle and exact submission snapshot references |
| Dependencies | FR-004, FR-006, FR-007, FR-015, FR-017 |
| Related / co-required | FR-004, FR-006, FR-007, FR-015, FR-017; integration coverage is bidirectional, not sequencing |
| Acceptance criteria | AC-116, AC-129, AC-145 |

### FR-017 — External Parties

Parent: REQ-MC-P0-17. Business: BR-003. Persona: Contributor. Story: US-017. Priority: P0.

| Contract field | Requirement |
|---|---|
| Business purpose | Phối hợp external party trong đúng matter context |
| Inputs | Party label/contact reference, role/context, waiting links |
| Outputs | Scoped external party context and related open waits |
| Functional behavior | Create/update scoped party and link waits; party is neither user grant nor legal entity master |
| Business rules | RULE-001, RULE-017, RULE-020 |
| Validation | Required label/context; valid links; sensitive contact fields scoped |
| Error behavior | Referenced party cannot vanish silently; inactivate preserves history and surfaces unresolved waits |
| Permissions | EDITOR/OWNER manage; members read scope; no external login automatically created |
| Audit | Party changes/inactivation and wait associations |
| Dependencies | FR-001, FR-018, FR-008 |
| Related / co-required | FR-004, FR-018; integration coverage is bidirectional, not sequencing |
| Acceptance criteria | AC-117, AC-130 |

### FR-018 — Simple Roles and Ownership

Parent: REQ-MC-P0-18. Business: BR-001. Persona: Transaction Owner. Story: US-018. Priority: P0.

| Contract field | Requirement |
|---|---|
| Business purpose | Giữ confidential matters trong phạm vi người có trách nhiệm |
| Inputs | Active workspace/matter membership, proposed roles, assignment/verifier designation |
| Outputs | Enforced allow/deny per operation with access audit |
| Functional behavior | Apply matrix to all paths; no cross-workspace leakage; membership revocation takes effect; no implicit grant by ownership field |
| Business rules | RULE-017, RULE-006, RULE-018 |
| Validation | Scope and nested refs validated; last OWNER protected; designation and no-self check |
| Error behavior | Uniform inaccessible/not-found; no leaked metadata; unauthorized write no domain change |
| Permissions | Workspace OWNER administers workspace; Matter OWNER administers matter within workspace |
| Audit | Grants/revocations/designations and denied access audit |
| Dependencies | None among FRs; active scoped membership and approved permission policy are fixture prerequisites |
| Related / co-required | All FR read/write surfaces; no demo auth acceptance; integration coverage is bidirectional, not sequencing |
| Acceptance criteria | AC-118, AC-134, AC-135, AC-140, AC-147, AC-149 |

### FR-019 — Delta-Based Status Brief

Parent: REQ-MC-P0-19. Business: BR-007. Persona: Reviewer / Manager. Story: US-019. Priority: P0.

| Contract field | Requirement |
|---|---|
| Business purpose | Báo cáo đúng thay đổi và outstanding work |
| Inputs | Authorized matter scope, baseline/as-of, source revisions, history |
| Outputs | Deterministic draft brief/export with references, no-change and outstanding sections |
| Functional behavior | Separate (t1,t2] changes from unresolved at t2; stable ordering; label draft/provenance; no implicit P1 snapshot/issued workflow |
| Business rules | RULE-016, RULE-019, RULE-017 |
| Validation | t1≤t2; consistent source boundary; no invisible data through summaries |
| Error behavior | Unavailable/inconsistent historical inputs: explicit cannot generate, not guessed narrative; access change forces new scoped output |
| Permissions | Members read/export allowed scope; no AI inference masquerading as fact |
| Audit | Generation provenance scope/window/actor/source revision |
| Dependencies | FR-008, FR-014, FR-018 |
| Related / co-required | FR-008, FR-014, FR-018; integration coverage is bidirectional, not sequencing |
| Acceptance criteria | AC-119, AC-138 |

### FR-020 — Separate State Dimensions

Parent: REQ-MC-P0-20. Business: BR-001. Persona: Reviewer / Manager. Story: US-020. Priority: P0.

| Contract field | Requirement |
|---|---|
| Business purpose | Không gộp năm khía cạnh sự thật thành một status |
| Inputs | Applicable object, state inputs, operation, effective time, current revision |
| Outputs | Execution, Verification, Dependency, Timing, Attention plus reasons |
| Functional behavior | Apply state semantics and guards server-side; preserve allowed combinations and propagate derived changes |
| Business rules | RULE-002, RULE-003, RULE-004, RULE-009, RULE-010 |
| Validation | Allowed transitions/applicability, actor/reason, evidence, current revision |
| Error behavior | Invalid transition denied with no mutation; inability to compute exposed as unavailable |
| Permissions | Matrix and axis-specific authority; derived labels cannot be manually forced |
| Audit | State before/after and causal inputs/time; no duplicate history on refresh |
| Dependencies | FR-018, FR-001 |
| Related / co-required | FR-005, FR-007, FR-008, FR-018; integration coverage is bidirectional, not sequencing |
| Acceptance criteria | AC-120, AC-121, AC-139, AC-142, AC-143, AC-160 |

## Non-functional requirements

All targets below are requirements/proposals, not measurements. Missing numeric budgets remain explicit approval/validation gates; no SLA or legal guarantee is invented.

| ID | Area | Measurable acceptance / method | Scenario | Qualification |
|---|---|---|---|---|
| NFR-001 | Security | Every read/write and indirect retrieval enforces current scoped authorization; no bypass through UI, import or assignment | AC-134, AC-135, AC-140, AC-147, AC-158 | Proposed enforcement detail; isolation approved |
| NFR-002 | Confidentiality | No inaccessible titles, document metadata, counts or evidence in exports/errors/history; credentials never in domain logs; encryption/access design to Claude, validation required | AC-118, AC-135, AC-147 | No compliance certification claimed |
| NFR-003 | Reliability | Failed or unknown commands expose outcome; no success without committed change and audit; safe retries no duplicate effects | AC-132, AC-133, AC-153, AC-156 | Proposed RULE-018 |
| NFR-004 | Auditability | Each successful mutation has attributable before/after, effective/recorded time and correlation; corrections append | AC-108, AC-136, AC-149 | Retention duration/hold policy pending OBD-11 |
| NFR-005 | Data integrity | No accepted cycle, orphan scoped reference, lost update, duplicate safe retry or unverified proof promoted by import | AC-125, AC-128, AC-131, AC-132, AC-139 | Proposed invariants; mechanism Step 02 |
| NFR-006 | Performance | Benchmark 50/200-row workloads with device/network/build recorded, 30 repetitions and p50/p95/error counts; approve budgets before production acceptance | AC-111, AC-137, AC-154 | 10-second comprehension is usability target, not server latency; numeric latency budgets TBD by OBD-09/10 |
| NFR-007 | Accessibility | Core flows keyboard-operable, named controls, visible focus, no traps/color-only state, errors announced and associated, usable at 200% zoom | AC-150, AC-151 | Testable product requirements, not certification against a claimed legal standard |
| NFR-008 | Availability expectations | Outage/stale/partial data explicitly shown; no false zero/READY; availability objective and support hours must be approved with workload/cost envelope | AC-156 | No invented SLA; OBD-09/10 approval required before release |
| NFR-009 | Error recovery | Preserve unsaved draft on validation failure; per-row reconciliation; unknown write reconciled before retry | AC-131, AC-133, AC-139, AC-150, AC-153 | Proposed operational behavior |
| NFR-010 | Localization readiness | English/Vietnamese-ready labels/date formatting without changing stable IDs or state meaning; avoid truncated critical labels; legal content translation not automatic | AC-152 | Bilingual readiness required; complete bilingual content scope to confirm OBD-10 |
| NFR-011 | Date/timezone consistency | One intended instant survives input/display/export; show zone; ambiguous local dates require clarification; explicit clock for tests | AC-142, AC-152 | Business-day/jurisdiction calendars excluded pending explicit approval |
| NFR-012 | Testability | Each FR/US has identifiable Given/When/Then, actor, clock, input revision, positive/negative result; tests may inject time without changing domain truth | AC-121, AC-139, AC-160 | Requirements coverage check now; automated product tests later |
| NFR-013 | Maintainability | Stable IDs and clear rule ownership; a changed RULE updates impacted FR/US/AC/trace; architecture must show invariant ownership and test seam, no duplicated frontend state authority | AC-160 | Review criterion, no prescribed code pattern or technology |
| NFR-014 | Backup/recovery | Restore synthetic records/versions/evidence/history/access relations in isolated environment; measure data loss/time against approved RPO/RTO before release | AC-155 | RPO/RTO/retention/encryption keys and backup costs open OBD-09/11 |

## Constraints and unresolved feasibility

Backend: https://github.com/lannguyenit598/go-hexa-template

Frontend: https://github.com/lannguyenit598/nextjs-atomic-starter

Cloudflare Free Tier; infrastructure target $0/month for an explicitly defined MVP workload. Go/Echo/PostgreSQL compatibility is UNVERIFIED; no stack substitution approved. Actual tenant/user/concurrency counts, data volume/retention, file sizes, import frequency, recovery objectives and service costs must be measured/decided with Claude at Step 02. The 50–200-row UX workload is not a capacity plan. No schema, hosting topology or API protocol selected.
