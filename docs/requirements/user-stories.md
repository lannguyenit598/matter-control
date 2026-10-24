# User Stories

Owner: Codex. Status: APPROVED_BY_PO, 2026-10-24, subject `572835a`; [approval record](../ai-sdlc/step-01-approval.md). Each story is P0; detailed policy follows approved RULE/OBD decisions. AC definitions are in acceptance-criteria.md; no executed tests implied. Dependencies are directional contract/test-setup prerequisites from SRS; related/co-required links describe mutual integration, not a delivery schedule.

## US-001 — Requirement vs Action

- Related capability: REQ-MC-P0-01; functional contract: FR-001; business requirement: BR-005.
- Persona: Transaction Owner. Priority: P0.
- Description: As a Transaction Owner, I want tạo/sửa Requirement độc lập Action; liên kết zero/multiple Actions; tạo basic Decision/Finding/Risk theo RULE-020 khi workflow cần, so that phân biệt điều kiện cần đạt với công việc thực hiện.
- Business value: Phân biệt điều kiện cần đạt với công việc thực hiện.
- Dependencies: FR-018; policy: RULE-001, RULE-002, RULE-020.
- Related / co-required: FR-018, FR-020.
- Acceptance criteria: AC-101, AC-121, AC-159.
- Negative scenarios: Sai type/reference: reject và chỉ rõ field; không đổi record loại khác hoặc generic hóa. Unauthorized/stale changes must preserve prior value and return attributable failure, not false success.

## US-002 — Milestones

- Related capability: REQ-MC-P0-02; functional contract: FR-002; business requirement: BR-002.
- Persona: Transaction Owner. Priority: P0.
- Description: As a Transaction Owner, I want đánh giá từng prerequisite; no prerequisites là unassessed; expose chuỗi blocker và evidence gap, so that biết readiness của mốc mà không bị phần trăm hoàn thành gây hiểu nhầm.
- Business value: Biết readiness của mốc mà không bị phần trăm hoàn thành gây hiểu nhầm.
- Dependencies: FR-005, FR-007, FR-020; policy: RULE-008, RULE-003, RULE-010.
- Related / co-required: FR-001, FR-005, FR-007.
- Acceptance criteria: AC-102, AC-141.
- Negative scenarios: Thiếu definition: unassessed; stale/evaluator error: unavailable, không ready. Unauthorized/stale changes must preserve prior value and return attributable failure, not false success.

## US-003 — Next Action

- Related capability: REQ-MC-P0-03; functional contract: FR-003; business requirement: BR-003.
- Persona: Contributor. Priority: P0.
- Description: As a Contributor, I want lọc/sắp theo RULE-021, navigate to context; follow-up explicit thay vì tự mở khóa waiting work, so that biết hành động khả thi tiếp theo và người chịu trách nhiệm.
- Business value: Biết hành động khả thi tiếp theo và người chịu trách nhiệm.
- Dependencies: FR-010, FR-005, FR-020; policy: RULE-021, RULE-003.
- Related / co-required: FR-004, FR-005, FR-010, FR-018.
- Acceptance criteria: AC-103, AC-144.
- Negative scenarios: Không có candidate: giải thích waiting/blocker/unassigned; stale snapshot yêu cầu refresh. Unauthorized/stale changes must preserve prior value and return attributable failure, not false success.

## US-004 — Waiting On

- Related capability: REQ-MC-P0-04; functional contract: FR-004; business requirement: BR-003.
- Persona: Contributor. Priority: P0.
- Description: As a Contributor, I want ghi waiting, nhận response và resolve relation; execution WAITING tách dependency BLOCKED, so that biết đang chờ ai hoặc điều kiện gì.
- Business value: Biết đang chờ ai hoặc điều kiện gì.
- Dependencies: FR-017, FR-020, FR-001; policy: RULE-002, RULE-012, RULE-021.
- Related / co-required: FR-017, FR-020.
- Acceptance criteria: AC-104, AC-130.
- Negative scenarios: Party không có quyền/không hợp lệ: reject; response không tự complete/verify. Unauthorized/stale changes must preserve prior value and return attributable failure, not false success.

## US-005 — Dependencies and Blocker Logic

- Related capability: REQ-MC-P0-05; functional contract: FR-005; business requirement: BR-004.
- Persona: Transaction Owner. Priority: P0.
- Description: As a Transaction Owner, I want aND incoming gates; recursive recompute; propagate reopen without falsifying completed history, so that giải thích và duy trì blockers nhất quán.
- Business value: Giải thích và duy trì blockers nhất quán.
- Dependencies: FR-001, FR-007, FR-020, FR-018, FR-008; policy: RULE-003, RULE-004, RULE-018.
- Related / co-required: FR-001, FR-007, FR-020.
- Acceptance criteria: AC-105, AC-122, AC-123, AC-124, AC-125, AC-146.
- Negative scenarios: Reject cycle with authorized path; concurrent invalid graph rejected without partial edges. Unauthorized/stale changes must preserve prior value and return attributable failure, not false success.

## US-006 — Evidence Requirements

- Related capability: REQ-MC-P0-06; functional contract: FR-006; business requirement: BR-005.
- Persona: Reviewer / Manager. Priority: P0.
- Description: As a Reviewer / Manager, I want create/revise criteria; attach evidence later; expose missing even when execution completed, so that xác định proof cần có trước khi kết luận.
- Business value: Xác định proof cần có trước khi kết luận.
- Dependencies: FR-001, FR-015, FR-018; policy: RULE-005, RULE-007.
- Related / co-required: FR-001, FR-015.
- Acceptance criteria: AC-106, AC-127.
- Negative scenarios: Missing proof is gap, not fake attachment; invalid criterion rejected. Unauthorized/stale changes must preserve prior value and return attributable failure, not false success.

## US-007 — Evidence Verification

- Related capability: REQ-MC-P0-07; functional contract: FR-007; business requirement: BR-005.
- Persona: Reviewer / Manager. Priority: P0.
- Description: As a Reviewer / Manager, I want submit separate from verify; independent designated verifier; expiry/rejection/dispute/reversal recomputes current aggregate, so that chứng minh completion bằng proof được review có trách nhiệm.
- Business value: Chứng minh completion bằng proof được review có trách nhiệm.
- Dependencies: FR-006, FR-015, FR-018, FR-008, FR-020; policy: RULE-005, RULE-006, RULE-007.
- Related / co-required: FR-006, FR-015, FR-018, FR-020.
- Acceptance criteria: AC-107, AC-121, AC-126, AC-127, AC-140.
- Negative scenarios: Reject unauthorized/stale review; missing/expired proof cannot produce VERIFIED; preserve past review. Unauthorized/stale changes must preserve prior value and return attributable failure, not false success.

## US-008 — Event History

- Related capability: REQ-MC-P0-08; functional contract: FR-008; business requirement: BR-006.
- Persona: Reviewer / Manager. Priority: P0.
- Description: As a Reviewer / Manager, I want expose authorized history; distinguish effective vs recorded time; prevent ordinary edit/delete history, so that truy nguyên sự thật và sửa sai có lịch sử.
- Business value: Truy nguyên sự thật và sửa sai có lịch sử.
- Dependencies: FR-018, FR-001; policy: RULE-019, RULE-018.
- Related / co-required: FR-018; cross-cutting every mutation.
- Acceptance criteria: AC-108, AC-136, AC-149, AC-153.
- Negative scenarios: Failure to persist history prevents successful mutation; denied attempt separate restricted audit. Unauthorized/stale changes must preserve prior value and return attributable failure, not false success.

## US-009 — Matter Control Room

- Related capability: REQ-MC-P0-09; functional contract: FR-009; business requirement: BR-001.
- Persona: Transaction Owner. Priority: P0.
- Description: As a Transaction Owner, I want show current truth, changes, blockers/why, next/owner, waiting, missing proof and nearest relevant milestone; unknown is visible, so that hiểu major matter state khoảng 10 giây.
- Business value: Hiểu major matter state khoảng 10 giây.
- Dependencies: FR-002, FR-003, FR-004, FR-005, FR-007, FR-008, FR-019, FR-020; policy: RULE-002, RULE-008, RULE-010, RULE-016.
- Related / co-required: FR-002, FR-003, FR-004, FR-005, FR-007, FR-008, FR-019.
- Acceptance criteria: AC-109, AC-137.
- Negative scenarios: Partial loading/error/stale region explicit; do not display zero blockers from failure. Unauthorized/stale changes must preserve prior value and return attributable failure, not false success.

## US-010 — My Actions

- Related capability: REQ-MC-P0-10; functional contract: FR-010; business requirement: BR-003.
- Persona: Contributor. Priority: P0.
- Description: As a Contributor, I want show own visible assigned work; distinguish actionable/waiting/blocked; open context and follow-up, so that tìm việc được giao mà không lẫn quyền truy cập.
- Business value: Tìm việc được giao mà không lẫn quyền truy cập.
- Dependencies: FR-001, FR-004, FR-005, FR-018; policy: RULE-017, RULE-021.
- Related / co-required: FR-001, FR-004, FR-005, FR-018.
- Acceptance criteria: AC-110, AC-144, AC-147.
- Negative scenarios: Revoked access removes result; zero own work honest empty state; unavailable not empty. Unauthorized/stale changes must preserve prior value and return attributable failure, not false success.

## US-011 — Operational Grid

- Related capability: REQ-MC-P0-11; functional contract: FR-011; business requirement: BR-003.
- Persona: Contributor. Priority: P0.
- Description: As a Contributor, I want keyboard navigation/edit/cancel/save; multiselect; context details; clearly show evidence gaps and blocked vs actionable, so that xử lý 50–200 records với ít chuyển context.
- Business value: Xử lý 50–200 records với ít chuyển context.
- Dependencies: FR-001, FR-012, FR-018, FR-020; policy: RULE-002, RULE-013, RULE-018.
- Related / co-required: FR-001, FR-012, FR-018, FR-020.
- Acceptance criteria: AC-111, AC-139, AC-150.
- Negative scenarios: Inline failure retains draft and prior server value; precise row/field error; conflict requires reconciliation. Unauthorized/stale changes must preserve prior value and return attributable failure, not false success.

## US-012 — Bulk Editing

- Related capability: REQ-MC-P0-12; functional contract: FR-012; business requirement: BR-003.
- Persona: Contributor. Priority: P0.
- Description: As a Contributor, I want preview exact selection; commit each valid row atomically with audit; recheck rights/revisions; failed rows unchanged, so that thay đổi nhiều record an toàn và biết kết quả từng dòng.
- Business value: Thay đổi nhiều record an toàn và biết kết quả từng dòng.
- Dependencies: FR-001, FR-018, FR-008, FR-020; policy: RULE-013, RULE-018.
- Related / co-required: FR-011, FR-018, FR-008.
- Acceptance criteria: AC-112, AC-133, AC-139.
- Negative scenarios: Partial failure explicit; retry failed only; unknown outcome reconcile operation before resubmit. Unauthorized/stale changes must preserve prior value and return attributable failure, not false success.

## US-013 — Excel/CSV Import

- Related capability: REQ-MC-P0-13; functional contract: FR-013; business requirement: BR-003.
- Persona: Contributor. Priority: P0.
- Description: As a Contributor, I want map Requirement/Action separately, validate groups/duplicates; explicit confirm; retry-safe apply; verification claims retained for review only, so that chuyển tracker hiện có sang typed operational work.
- Business value: Chuyển tracker hiện có sang typed operational work.
- Dependencies: FR-001, FR-005, FR-006, FR-018, FR-008; policy: RULE-014, RULE-015, RULE-018.
- Related / co-required: FR-001, FR-005, FR-006, FR-018.
- Acceptance criteria: AC-113, AC-131, AC-132, AC-148.
- Negative scenarios: No mutations on preview; invalid group rejected; no silent coercion/fuzzy merge; changed retry conflicts. Unauthorized/stale changes must preserve prior value and return attributable failure, not false success.

## US-014 — Excel Export

- Related capability: REQ-MC-P0-14; functional contract: FR-014; business requirement: BR-007.
- Persona: Reviewer / Manager. Priority: P0.
- Description: As a Reviewer / Manager, I want export current permitted facts; preserve distinction and dates; formula-safe literal values; empty export explicit, so that chia sẻ bảng vận hành có ngữ nghĩa chính xác.
- Business value: Chia sẻ bảng vận hành có ngữ nghĩa chính xác.
- Dependencies: FR-018, FR-020, FR-015; policy: RULE-015, RULE-017.
- Related / co-required: FR-018, FR-020, FR-015.
- Acceptance criteria: AC-114, AC-148, AC-147.
- Negative scenarios: Export failure yields no partial file presented as complete; revoked permission denies retrieval. Unauthorized/stale changes must preserve prior value and return attributable failure, not false success.

## US-015 — Document Versions

- Related capability: REQ-MC-P0-15; functional contract: FR-015; business requirement: BR-006.
- Persona: Reviewer / Manager. Priority: P0.
- Description: As a Reviewer / Manager, I want add version separately from promotion; preserve old links; assess current-version criterion impact, not blanket invalidation, so that nhận biết authoritative version và proof đang tham chiếu.
- Business value: Nhận biết authoritative version và proof đang tham chiếu.
- Dependencies: FR-018, FR-001, FR-008; policy: RULE-011, RULE-007.
- Related / co-required: FR-018, FR-006, FR-007.
- Acceptance criteria: AC-115, AC-128.
- Negative scenarios: Stale promotion rejects; missing/unavailable content visible; no false version/current label. Unauthorized/stale changes must preserve prior value and return attributable failure, not false success.

## US-016 — Regulatory Filing Lifecycle

- Related capability: REQ-MC-P0-16; functional contract: FR-016; business requirement: BR-005.
- Persona: Contributor. Priority: P0.
- Description: As a Contributor, I want track golden stages and repeat/negative paths; no automated filing; package completeness based on declared criteria, so that theo dõi hồ sơ nộp đến outcome mà không nhầm receipt với approval.
- Business value: Theo dõi hồ sơ nộp đến outcome mà không nhầm receipt với approval.
- Dependencies: FR-004, FR-006, FR-007, FR-015, FR-017; policy: RULE-012, RULE-005, RULE-011.
- Related / co-required: FR-004, FR-006, FR-007, FR-015, FR-017.
- Acceptance criteria: AC-116, AC-129, AC-145.
- Negative scenarios: Premature submission/approval rejected; missing acknowledgement remains waiting; rejection/withdrawal preserved. Unauthorized/stale changes must preserve prior value and return attributable failure, not false success.

## US-017 — External Parties

- Related capability: REQ-MC-P0-17; functional contract: FR-017; business requirement: BR-003.
- Persona: Contributor. Priority: P0.
- Description: As a Contributor, I want create/update scoped party and link waits; party is neither user grant nor legal entity master, so that phối hợp external party trong đúng matter context.
- Business value: Phối hợp external party trong đúng matter context.
- Dependencies: FR-001, FR-018, FR-008; policy: RULE-001, RULE-017, RULE-020.
- Related / co-required: FR-004, FR-018.
- Acceptance criteria: AC-117, AC-130.
- Negative scenarios: Referenced party cannot vanish silently; inactivate preserves history and surfaces unresolved waits. Unauthorized/stale changes must preserve prior value and return attributable failure, not false success.

## US-018 — Simple Roles and Ownership

- Related capability: REQ-MC-P0-18; functional contract: FR-018; business requirement: BR-001.
- Persona: Transaction Owner. Priority: P0.
- Description: As a Transaction Owner, I want apply matrix to all paths; no cross-workspace leakage; membership revocation takes effect; no implicit grant by ownership field, so that giữ confidential matters trong phạm vi người có trách nhiệm.
- Business value: Giữ confidential matters trong phạm vi người có trách nhiệm.
- Dependencies: no other FR; active scoped membership and approved policy fixture; policy: RULE-017, RULE-006, RULE-018.
- Related / co-required: All FR read/write surfaces; no demo auth acceptance.
- Acceptance criteria: AC-118, AC-134, AC-135, AC-140, AC-147, AC-149.
- Negative scenarios: Uniform inaccessible/not-found; no leaked metadata; unauthorized write no domain change. Unauthorized/stale changes must preserve prior value and return attributable failure, not false success.

## US-019 — Delta-Based Status Brief

- Related capability: REQ-MC-P0-19; functional contract: FR-019; business requirement: BR-007.
- Persona: Reviewer / Manager. Priority: P0.
- Description: As a Reviewer / Manager, I want separate (t1,t2] changes from unresolved at t2; stable ordering; label draft/provenance; no implicit P1 snapshot/issued workflow, so that báo cáo đúng thay đổi và outstanding work.
- Business value: Báo cáo đúng thay đổi và outstanding work.
- Dependencies: FR-008, FR-014, FR-018; policy: RULE-016, RULE-019, RULE-017.
- Related / co-required: FR-008, FR-014, FR-018.
- Acceptance criteria: AC-119, AC-138.
- Negative scenarios: Unavailable/inconsistent historical inputs: explicit cannot generate, not guessed narrative; access change forces new scoped output. Unauthorized/stale changes must preserve prior value and return attributable failure, not false success.

## US-020 — Separate State Dimensions

- Related capability: REQ-MC-P0-20; functional contract: FR-020; business requirement: BR-001.
- Persona: Reviewer / Manager. Priority: P0.
- Description: As a Reviewer / Manager, I want apply state semantics and guards server-side; preserve allowed combinations and propagate derived changes, so that không gộp năm khía cạnh sự thật thành một status.
- Business value: Không gộp năm khía cạnh sự thật thành một status.
- Dependencies: FR-018, FR-001; policy: RULE-002, RULE-003, RULE-004, RULE-009, RULE-010.
- Related / co-required: FR-005, FR-007, FR-008, FR-018.
- Acceptance criteria: AC-120, AC-121, AC-139, AC-142, AC-143, AC-160.
- Negative scenarios: Invalid transition denied with no mutation; inability to compute exposed as unavailable. Unauthorized/stale changes must preserve prior value and return attributable failure, not false success.
