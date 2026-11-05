<!-- source docs/requirements/srs.md, lines 1-14 -->
# Software Requirements Specification

Owner: Codex — BA. Status: **APPROVED_BY_PO**, 2026-10-24, subject `572835a`; [approval record](../ai-sdlc/step-01-approval.md). Source: Step 01 and capability baseline `20f12fe`. Functional scope and linked policy are approved; missing numeric budgets remain deferred/pending validation. No implementation/architecture selected.

## Contract conventions

Each FR retains its REQ-MC-P0 parent, maps to BR/US/AC and inherits RULE-017/018/019. All writes validate current authorization, scoped references and revision; failed mutations do not create successful domain history. Data shown unavailable/stale cannot be replaced by a reassuring default. Explicit input means business information, not a database column or API field design.

Domain relationships: Workspace contains memberships and Matters; Matter has explicit memberships, Workstreams/Milestones, Requirements/Actions. Requirement may have zero/multiple Actions and Evidence Requirements; Evidence addresses criteria and exact Document Versions. Document identity differs from versions; Filing groups declared criteria/submission observations and external waiting. Decision/Finding/Risk preserve context/follow-up; Entity reference remains distinct from External Party; Legal Question remains P1. Event History links changes across them. No generic Item+JSON replacement. Detailed language stays in glossary; membership adds the access relationship requested in Step 01, not an arbitrary concept count.

Dependencies below are directional contract/test-setup prerequisites, not a fixed delivery schedule or the product dependency graph. “Related / co-required” preserves mutual behavioral integration separately. FR-018 establishes access contract, FR-001 typed identities and FR-020 state vocabulary/guard contract before dependent test fixtures; integrated derived-state tests use all related contracts. No architecture decomposition is inferred.

## P0 functional contracts


<!-- source docs/requirements/srs.md, lines 15-33 -->
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


<!-- source docs/requirements/srs.md, lines 53-71 -->
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


<!-- source docs/requirements/srs.md, lines 91-109 -->
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


<!-- source docs/requirements/srs.md, lines 129-147 -->
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


<!-- source docs/requirements/srs.md, lines 148-166 -->
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


<!-- source docs/requirements/srs.md, lines 167-185 -->
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


<!-- source docs/requirements/srs.md, lines 186-204 -->
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


<!-- source docs/requirements/srs.md, lines 281-299 -->
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


<!-- source docs/requirements/srs.md, lines 300-318 -->
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


<!-- source docs/requirements/srs.md, lines 319-337 -->
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


<!-- source docs/requirements/srs.md, lines 338-356 -->
### FR-018 — Simple Roles and Ownership

Parent: REQ-MC-P0-18. Business: BR-001. Persona: Transaction Owner. Story: US-018. Priority: P0.

| Contract field | Requirement |
|---|---|
| Business purpose | Giữ confidential matters trong phạm vi người có trách nhiệm |
| Inputs | Active workspace/matter membership, approved roles, assignment/verifier designation |
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


<!-- source docs/requirements/srs.md, lines 357-375 -->
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
