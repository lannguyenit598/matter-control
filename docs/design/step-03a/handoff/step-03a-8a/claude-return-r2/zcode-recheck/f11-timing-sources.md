# F-11 and timing — selected source excerpts

<!-- docs/requirements/business-rules.md, source lines 1-3 -->
# Business Rules and Invariants

Owner: Codex — BA. Source: approved prompts plus explicit recommendations below. **APPROVED_INPUT rules retain original authority; formerly PROPOSED policy is now APPROVED_BY_PO** under OBD-02..08/10/11 at `572835a`, 2026-10-24; [approval record](../ai-sdlc/step-01-approval.md). Numeric workload/retention/RPO/RTO remain explicitly deferred; no implementation start is authorized. No jurisdiction-specific legal rule is asserted.

<!-- docs/requirements/business-rules.md, source lines 17-17 -->
| RULE-009 | APPROVED_BY_PO / OBD-06 | For nonterminal Requirement/Action/Filing: due earlier than as-of → OVERDUE; due in [as-of, as-of+48h] → DUE_SOON; later → ON_TRACK. No deadline → ON_TRACK with visible “no due date”, never proof of schedule health. Terminal COMPLETED/CANCELLED → ON_TRACK for active monitoring; actual completion time/lateness preserved separately. Deadline changes are audited; all comparisons use an explicit instant/timezone. 48h is approved by explicit OBD-06 decision, not inferred from Atlas. |

<!-- docs/product/project-atlas-dataset.md, source lines 1-5 -->
# Project Atlas — Acquisition & Corporate Restructuring

**SYNTHETIC_PROPOSAL / specification only.** Không phải bản khôi phục dataset gốc từ Document A, không phải seed code hoặc legal advice. Mọi tổ chức, người, sự kiện và deadline bên dưới đều hư cấu, không mô phỏng quy định của jurisdiction cụ thể.

Source: SRC-00A / Task 6 và SRC-00A1 §5.10 quy định quy mô và tình huống. Các ID/quan hệ/nội dung mẫu do Codex đề xuất để chuẩn bị acceptance cases; domain rules vẫn phải chốt ở Step 01.

<!-- docs/product/project-atlas-dataset.md, source lines 19-36 -->
## 2. Workstreams và milestones

| Workstream ID | Tên | Mục đích | Milestone chính |
|---|---|---|---|
| WS-01 | Approvals | Điều kiện phê duyệt giao dịch | MS-01 |
| WS-02 | Due Diligence | Review thông tin và xử lý gaps | MS-01 |
| WS-03 | Documents & Signatures | Version awareness và trạng thái ký | MS-02 |
| WS-04 | Funding, Transfer & Closing | Theo dõi payment/transfer/closing | MS-02 |
| WS-05 | Regulatory Filings | Chuẩn bị và theo dõi filing | MS-03 |
| WS-06 | Post-Closing | Bổ sung, bàn giao và theo dõi sau closing | MS-03 |

| Milestone ID | Tên | Due | Candidate acceptance |
|---|---|---|---|
| MS-01 | Readiness Review | 2026-06-14T17:00:00+07:00 | Nhìn rõ RQ-04 còn gap dù đã có hồ sơ review |
| MS-02 | Closing | 2026-06-18T17:00:00+07:00 | Chain từ gap đến signature/payment/closing chưa được che khuất |
| MS-03 | Filing & Post-Closing Review | 2026-06-22T17:00:00+07:00 | Phân biệt filing đang chờ authority và bước follow-up còn lại |

Chưa chốt công thức roll-up milestone. Bảng mô tả điều cần thấy, không mặc định mọi workstream/requirement là gate của milestone.

<!-- docs/product/project-atlas-dataset.md, source lines 48-102 -->
## 4. 24 Requirements / Actions

RQ-* là Requirement; AC-* là Action. 12 đối tượng mỗi loại; không gộp thành generic Task.
Các cặp execution/verification bên dưới là expected fixture data, không phải quy tắc tự đồng bộ giữa requirement và action.

| ID | Type | WS | Mô tả | Owner | Execution | Verification | Due |
|---|---|---|---|---|---|---|---|
| RQ-01 | Requirement | WS-01 | Bằng chứng approval nội bộ đầy đủ | U-01 | COMPLETED | VERIFIED | 2026-06-13T17:00:00+07:00 |
| AC-01 | Action | WS-01 | Ghi nhận approval đã nhận cho RQ-01 | U-01 | COMPLETED | NOT_REQUIRED | 2026-06-13T17:00:00+07:00 |
| RQ-02 | Requirement | WS-01 | Điều kiện chấp thuận thay đổi được chứng minh | U-02 | COMPLETED | UNVERIFIED | 2026-06-14T17:00:00+07:00 |
| AC-02 | Action | WS-01 | Gửi thông báo thay đổi liên quan RQ-02 | U-01 | COMPLETED | NOT_REQUIRED | 2026-06-14T17:00:00+07:00 |
| RQ-03 | Requirement | WS-02 | Review bộ DD hiện có được ghi nhận | U-02 | COMPLETED | VERIFIED | 2026-06-14T17:00:00+07:00 |
| AC-03 | Action | WS-02 | Review DOC-02 v2 cho RQ-03 | U-02 | COMPLETED | NOT_REQUIRED | 2026-06-14T17:00:00+07:00 |
| RQ-04 | Requirement | WS-02 | Gap về chứng từ bổ sung được giải quyết | U-02 | WAITING | UNVERIFIED | 2026-06-14T17:00:00+07:00 |
| AC-04 | Action | WS-02 | Follow-up EP-01 về chứng từ RQ-04 | U-01 | WAITING | NOT_REQUIRED | 2026-06-14T17:00:00+07:00 |
| RQ-05 | Requirement | WS-03 | Nội dung DOC-03 v3 được review | U-02 | COMPLETED | VERIFIED | 2026-06-15T17:00:00+07:00 |
| AC-05 | Action | WS-03 | Theo dõi chữ ký còn thiếu cho RQ-06 | U-01 | WAITING | NOT_REQUIRED | 2026-06-16T17:00:00+07:00 |
| RQ-06 | Requirement | WS-03 | Agreement version hiện hành có đủ chữ ký cần thiết | U-02 | IN_PROGRESS | PARTIALLY_VERIFIED | 2026-06-16T17:00:00+07:00 |
| AC-06 | Action | WS-03 | Ghi nhận receipt chữ ký đầu tiên cho RQ-06 | U-03 | COMPLETED | NOT_REQUIRED | 2026-06-15T08:00:00+07:00 |
| RQ-07 | Requirement | WS-04 | Payment condition được chứng minh | U-03 | NOT_STARTED | UNVERIFIED | 2026-06-17T17:00:00+07:00 |
| AC-07 | Action | WS-04 | Ghi nhận payment confirmation cho RQ-07 | U-03 | NOT_STARTED | NOT_REQUIRED | 2026-06-17T17:00:00+07:00 |
| RQ-08 | Requirement | WS-04 | Transfer và closing evidence đầy đủ | U-02 | NOT_STARTED | UNVERIFIED | 2026-06-18T17:00:00+07:00 |
| AC-08 | Action | WS-04 | Ghi nhận transfer/closing checklist cho RQ-08 | U-03 | NOT_STARTED | NOT_REQUIRED | 2026-06-18T17:00:00+07:00 |
| RQ-09 | Requirement | WS-05 | Post-closing filing được chấp thuận | U-02 | NOT_STARTED | UNVERIFIED | 2026-06-22T17:00:00+07:00 |
| AC-09 | Action | WS-05 | Chuẩn bị FIL-01 để đáp ứng RQ-09 | U-03 | NOT_STARTED | NOT_REQUIRED | 2026-06-19T17:00:00+07:00 |
| RQ-10 | Requirement | WS-05 | Filing notice có đủ kết quả cần theo dõi | U-02 | WAITING | PARTIALLY_VERIFIED | 2026-06-20T17:00:00+07:00 |
| AC-10 | Action | WS-05 | Chờ response FIL-02 từ EP-03 cho RQ-10 | U-03 | WAITING | NOT_REQUIRED | 2026-06-20T17:00:00+07:00 |
| RQ-11 | Requirement | WS-06 | Yêu cầu supplement được xử lý khi phát sinh | U-02 | NOT_STARTED | UNVERIFIED | 2026-06-21T17:00:00+07:00 |
| AC-11 | Action | WS-06 | Chuẩn bị follow-up khi nhận response FIL-02 cho RQ-11 | U-03 | NOT_STARTED | NOT_REQUIRED | 2026-06-21T17:00:00+07:00 |
| RQ-12 | Requirement | WS-06 | Bàn giao post-closing có acknowledgement | U-01 | NOT_STARTED | UNVERIFIED | 2026-06-22T17:00:00+07:00 |
| AC-12 | Action | WS-06 | Gửi bàn giao sau supplement/resolution cho RQ-12 | U-01 | NOT_STARTED | NOT_REQUIRED | 2026-06-22T17:00:00+07:00 |

AC-05/06 cùng hỗ trợ RQ-06; RQ-05 đã có evidence review, không cần ép tạo một Action chỉ để có cặp 1:1. Rule mọi Requirement bắt buộc có Action hay không còn ở Step 01.

Waiting On fixture: RQ-04/AC-04 → EP-01; AC-05 → EP-02; RQ-10/AC-10 → EP-03. Candidate Next Actions: giải quyết gap qua AC-04; theo dõi AC-05 nhưng hiển thị dependency chưa đạt; theo dõi AC-10. Đây là các lựa chọn demo, không định nghĩa automatic ranking.

## 5. Seven dependencies và critical blocker chain

Giả định fixture: mỗi edge nêu điều kiện riêng; target chỉ READY khi tất cả incoming gates thỏa. Không có incoming edge thì READY theo dependency axis, dù execution vẫn có thể WAITING. Đây chưa phải policy sản phẩm; Step 01 chốt OBD-04.

| ID | Prerequisite | Target | Gate fixture | T0 |
|---|---|---|---|---|
| DEP-01 | RQ-04 | AC-05 | Verification = VERIFIED | Unsatisfied |
| DEP-02 | AC-05 | AC-07 | Execution = COMPLETED | Unsatisfied |
| DEP-03 | AC-07 | AC-08 | Execution = COMPLETED | Unsatisfied |
| DEP-04 | AC-08 | AC-09 | Execution = COMPLETED | Unsatisfied |
| DEP-05 | RQ-05 | AC-05 | Verification = VERIFIED | Satisfied |
| DEP-06 | AC-10 | AC-11 | Execution = COMPLETED | Unsatisfied |
| DEP-07 | RQ-11 | AC-12 | Verification = VERIFIED | Unsatisfied |

Critical chain: **RQ-04 → AC-05 → AC-07 → AC-08 → AC-09**, ảnh hưởng readiness, closing và filing. Các cạnh execution-only không có nghĩa đủ điều kiện pháp lý để payment/transfer; semantics thật chưa được đặc tả.

Expected dependency snapshot: AC-05/07/08/09/11/12 = BLOCKED; các record còn lại = READY theo giả định trên. RQ-04 có thể READY về dependency nhưng WAITING về execution; đó là hai chiều độc lập.

Attention fixture: RQ-04 và AC-05 = CRITICAL vì chuỗi blocker; RQ-02, RQ-06, AC-04, AC-10 = ATTENTION; các record còn lại NORMAL. Đây là nhãn demo được gán rõ, chưa là escalation algorithm.

<!-- docs/architecture/dependency-engine.md, source lines 1-5 -->
# Dependency Engine Design

- Author: Claude Code (actual), claude-opus-5-5, MC-002-ARCH, packet-only.
- Inputs: requirements `572835a` / approval `54e1db5`; backend `d024e3ec9dd96abf9ada1d7516f1b2f0e8cba67b`.
- Status: **PROPOSED / NOT_IMPLEMENTED / WAITING_ARCHITECTURE_APPROVAL**.

<!-- docs/architecture/dependency-engine.md, source lines 7-28 -->
## 1. Graph definition

- Nodes: Requirements and Actions of one Matter (`graph_nodes` supertype, kind REQUIREMENT|ACTION). Filings are gated through their linked Requirement/Action; Milestones are not nodes (they have prerequisites, not edges).
- Edge `u → d` means *d depends on u*. Attributes: `gate ∈ {COMPLETION, COMPLETION_AND_VERIFIED}` (explicit, no default), reason, author, revision, soft removal with reason.
- Structural constraints: same Matter (composite FK), no self-edge (CHECK), at most one active edge per ordered pair (partial unique index), acyclic (algorithmic under lock, §3); every endpoint has exactly one typed Requirement/Action row (deferred totality trigger, data-model §3).
- Not supported in P0 (require approved change): OR groups, cross-matter edges, automatic waivers, edges to milestones.

## 2. Readiness semantics (RULE-003)

```
satisfied(e: u→d) = dep(u) == READY && exec(u) == COMPLETED &&
                    (e.gate == COMPLETION || ver(u) == VERIFIED)
dep(d) = READY  iff  ∀ active e into d: satisfied(e)     // no incoming edges ⇒ READY
```

Proof gates use VERIFIED only, as RULE-003 states; NOT_REQUIRED is never treated as VERIFIED. **Adopted fail-closed handling (ARCH-Q1, within approved semantics):**
- An upstream whose verification is NOT_REQUIRED (or not applicable) never satisfies a `COMPLETION_AND_VERIFIED` edge. The edge reason is `NOT_VERIFIED` with `upstreamVerification: NOT_REQUIRED`.
- Order-independent outcome. Adding such an edge to an exempt upstream is accepted (201, warning `PROOF_GATE_UNSATISFIED_WHILE_UPSTREAM_NOT_REQUIRED`). Exempting an upstream with outgoing proof gates is accepted, with those edges listed as impact. Both orders yield the same graph and the same BLOCKED state. The earlier proposal to reject creation is withdrawn because it made the result order-dependent.
- Remediation uses only approved commands: change the gate with an audited reason (`POST /dependency-edges/{id}:replace-gate`, which emits `edge.removed` + `edge.added` atomically; the permission matrix allows reasoned edge change), or OWNER revokes the exemption and the upstream is verified normally.
- **Unapproved alternative ARCH-Q1-B (not adopted):** an OWNER NOT_REQUIRED decision satisfies proof gates. That would broaden RULE-003 and needs an explicit PO change. OpenCode F-07 is recorded as this option only.

Each BLOCKED node carries `blockingReasons[]`: `{edgeId, upstreamId, gate, failed: [UPSTREAM_BLOCKED | NOT_COMPLETED | NOT_VERIFIED], upstreamVerification}`, ordered by upstream ID. The Control Room "why blocked" view walks reasons upstream to the root causes (nodes that are themselves READY but not completed/verified).

<!-- docs/architecture/dependency-engine.md, source lines 71-75 -->
## 5. Milestones and critical chain

- Readiness (RULE-008): no prerequisites → UNASSESSED; else READY iff every prerequisite Requirement has `exec = COMPLETED ∧ ver ∈ {VERIFIED, NOT_REQUIRED} ∧ dep = READY`. This RULE-008 predicate is deliberately distinct from the RULE-003 edge predicate (§2). Output `satisfied/total` and per-prerequisite failure reasons (AC-102, AC-141). Cancelled prerequisites are unsatisfied; there is no waiver label.
- Critical chain set `C` = prerequisites of milestones with `critical = true` ∪ all graph ancestors of those prerequisites. A node in `C` is **critical-unsatisfied** if (a) it is a critical prerequisite and fails milestone satisfaction, or (b) it is an ancestor and at least one of its outgoing edges on a path into `C` is unsatisfied. Such nodes get CRITICAL attention with reasons naming the milestone(s) (RULE-010).
- Prerequisite add/remove and critical designation are OWNER-only, reasoned, audited, and trigger recomputation.
