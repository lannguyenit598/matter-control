# MATTERCONTROL — STEP 03A.3
## FINAL SOURCE CORRECTIONS, MANUAL VISUAL ACCEPTANCE & DESIGN DIRECTION PREPARATION

Bạn là Codex — Project Manager, Business Analyst và AI SDLC Orchestrator.

Nhiệm vụ hiện tại là hoàn thiện các corrections còn lại của MC-003A và chuẩn bị Product Owner Design Review Gate.

**Không bắt đầu STEP 03B. Không triển khai frontend production code.**

## 1. CURRENT BASELINE

Product: MatterControl — Control Plane for High-Stakes Legal Work.

Workstream: MC-003A.

Branch: `task/MC-003A-remediation`.

Latest reported commit: `9dfa414`.

Reported status:

- Local remediation đã thực hiện.
- 42/42 snapshot integrity checks PASS.
- 48 structural/integrity/Atlas checks PASS.
- 11 local logic groups PASS.
- R01/R02/R04 có supporting source evidence nhưng chưa có runtime acceptance.
- R03/R05 PARTIAL.
- Rendered validation NOT_EXECUTED.
- Independent QA PENDING_INDEPENDENT_QA.
- Product Owner Design Approval PENDING.
- MC-003A REWORK_REQUIRED.

Hai findings mới:

- RV-S01 MEDIUM — Direction C chứa trạng thái Project Atlas cũ.
- RV-S02 HIGH — UI/spec copy mô tả focus, keyboard, fixture hoặc inline-edit capability vượt quá implementation evidence.

Đọc repository và các báo cáo thực tế trước khi chỉnh sửa.

## 2. OBJECTIVE

Thực hiện một vòng correction tối thiểu:

1. Sửa RV-S01.
2. Sửa RV-S02.
3. Kiểm tra regressions R01–R05.
4. Đồng bộ HTML, specification và design handoff.
5. Chuẩn bị manual rendered validation package.
6. Chuẩn bị Product Owner design-direction decision.
7. Giữ independent QA là một gate riêng.

Không bắt đầu lại design exploration.

Không chạy lại các checks đã hoàn thành nếu artifacts liên quan không thay đổi.

## 3. SOURCE OF TRUTH

Đọc:

- `docs/design/step-03a/step-03a-final-gate-report.md`
- `docs/design/step-03a/validation/manual-visual-checklist.md`
- `docs/design/step-03a/product-owner-review-package.md`
- Revised local-r1 HTML.
- Revised design specification và handoff.
- Remediation matrix.
- Canonical Project Atlas dataset.
- Business rules.
- State semantics.
- Permission matrix.
- Approved decision register.

Không phỏng đoán các trạng thái hoặc IDs.

## 4. FIX RV-S01 — ATLAS STATE CONSISTENCY

Kiểm tra Direction C và tất cả các direction boards.

Đối chiếu:

- Project Atlas statuses.
- Requirement/Action states.
- Evidence verification.
- Dependency readiness.
- Decisions.
- Filing status.
- Canonical IDs.

Sửa những trạng thái cũ hoặc references không còn phù hợp.

Bảo đảm Directions A/B/C mô tả cùng một operational truth.

Không chỉnh canonical dataset chỉ để hợp thức hóa mockup.

Acceptance criteria:

- Không còn Atlas state lỗi thời trong design artifacts đã sửa.
- IDs và business semantics nhất quán.
- Có source-to-design traceability.

## 5. FIX RV-S02 — ARTIFACT HONESTY

Đây là finding HIGH, cần ưu tiên.

Phân biệt rõ:

- IMPLEMENTED_AND_TESTED.
- IMPLEMENTED_NOT_TESTED.
- SPECIFIED_ONLY.
- CONCEPTUAL_ONLY.
- NOT_IMPLEMENTED.

Áp dụng cho:

- Keyboard navigation.
- Focus management.
- Inline editing.
- Bulk actions.
- Fixture behavior.
- Evidence verification.
- Responsive behavior.
- Interactive prototype claims.

Không tuyên bố behavior đã được thực thi nếu HTML chỉ minh họa.

Không dùng các từ "validated", "tested", "fully functional" hoặc tương đương khi không có evidence.

Sửa toàn bộ copy và handoff có liên quan.

Nếu một hành vi quan trọng chưa được implement trong concept, mô tả rõ expected interaction cho STEP 03B và Antigravity sau này.

Không biến review artifact thành ứng dụng production.

## 6. PRESERVE PREVIOUS REMEDIATION

Kiểm tra hồi quy các findings:

- R01 — Bulk-edit allowlist và defaults.
- R02 — Approved decisions.
- R03 — Atlas IDs.
- R04 — Proof/verification semantics.
- R05 — Connected-flow scope và mobile limitations.

Đặc biệt bảo toàn:

`COMPLETED ≠ VERIFIED`

`Requirement ≠ Action`

`Evidence Requirement ≠ Evidence`

Không mở lại approved business rules.

Giữ các vấn đề chưa có bằng chứng đầy đủ ở trạng thái PARTIAL hoặc NEEDS_CLARIFICATION.

## 7. REVISION MANAGEMENT

Preserve local-r1 as a historical revision.

Tạo revision mới có thể truy xuất, ví dụ:

`docs/design/step-03a/revised/local-r2/`

Đồng bộ:

- Concept HTML.
- Design specification.
- Design handoff.
- Correction log.
- Acceptance matrix.

Giữ Git diff nhỏ và có thể review.

Không rewrite historical review evidence.

## 8. MANUAL RENDERED VALIDATION PACKAGE

Vì Browser Use trước đây không cho phép truy cập `file://`, không sử dụng workaround để vượt qua giới hạn đó.

Nếu không có phương thức preview được phép rõ ràng, chuẩn bị hướng dẫn cho Product Owner kiểm tra thủ công.

### Viewport Matrix

- Desktop: 1440×900.
- Laptop: 1280×800.
- Mobile: 390×844.
- Zoom: 100% và 200% khi hỗ trợ.

### Screens to Capture

1. Product shell và Control Room.
2. Critical blocker/Next Action.
3. Operational Grid.
4. Bulk selection / bulk-edit conceptual state.
5. Requirement Detail.
6. Evidence and Verification.
7. Dependency impact.
8. Filing/Document Versions.
9. Mobile navigation/Grid reachability.
10. Direction A/B/C visual comparison.

Đảm bảo người review biết đâu là review-board miniature và đâu là 1:1 app-view.

### Keyboard Scenarios

Nếu có controls thực sự tương tác được:

- Tab.
- Shift+Tab.
- Enter/Space.
- Escape.
- Focus visibility.
- Navigation order.

Nếu concept không hỗ trợ thực thi, ghi NOT_TESTABLE_IN_CONCEPT.

Không tự tuyên bố keyboard PASS.

### Evidence Template

Mỗi capture nên ghi:

- Screen.
- Browser/version.
- Viewport.
- Zoom.
- Interaction performed.
- Actual result.
- Expected result.
- PASS / FAIL / PARTIAL / NOT_TESTED.

Không tạo ảnh giả hoặc báo cáo visual validation khi chưa có hình ảnh thực tế.

## 9. DESIGN DIRECTION PROPOSAL

Chuẩn bị Product Owner comparison cho Directions A/B/C.

Đề xuất sơ bộ cần đánh giá:

**Direction A — Primary Foundation**

Enterprise clarity, semantic state design, professional trust.

**Direction B — Selective Inspiration**

Impact rail, meaningful operational relationships và blocker visibility.

**Direction C — Selective Inspiration**

Optional compact Operational Grid density.

Đề xuất một coherent MatterControl design system, không trộn branding hay copy UI của các sản phẩm tham khảo.

Không tự phê duyệt visual direction.

### Product Owner Decisions to Present

D-UX01 — Primary visual direction: A / B / C / Other.

D-UX02 — Default grid density: Comfortable / Compact / User-configurable.

D-UX03 — Control Room priority: Critical blockers/next actions first, hoặc một hierarchy khác có lý do nghiệp vụ.

D-UX04 — Mobile MVP scope: Read-only triage/navigation hoặc phạm vi thao tác rộng hơn, tùy approved requirements.

Các options ở đây là đề xuất thiết kế, không phải approved product decisions.

Kiểm tra liệu các quyết định trên đã được ghi nhận trước đó hay chưa; nếu đã duyệt, không mở lại.

## 10. INDEPENDENT QA

Previous provider status:

OpenCode: HTTP 403 / FreeTierError.

Không retry tự động.

Không chuyển model/provider.

Không gửi thêm payload ra dịch vụ bên ngoài.

Chuẩn bị final independent QA packet cho local-r2.

Nếu chưa có reviewer hợp lệ, giữ:

`PENDING_INDEPENDENT_QA`

Không coi Codex self-validation hoặc hai internal critique agents là formal independent QA.

## 11. VALIDATION

Thực hiện checks phù hợp với các file thực sự thay đổi:

- Syntax.
- Internal links.
- Atlas IDs.
- Decision state consistency.
- Business-rule consistency.
- Five state dimensions.
- Proof-gate copy.
- Claim/evidence alignment.
- Cross-artifact references.
- Git diff review.
- Revised artifact integrity.

Không replay các backend tests, database tests hoặc toàn bộ design suite không liên quan.

Ghi rõ những gì NOT_TESTED.

## 12. REQUIRED DELIVERABLES

Tạo/cập nhật:

- Revised local-r2 concept HTML.
- Revised local-r2 specification.
- Revised local-r2 handoff.
- RV-S01/RV-S02 correction report.
- Regression matrix for R01–R05.
- Manual rendered validation checklist.
- Screenshot evidence template.
- A/B/C Product Owner decision comparison.
- Independent QA packet.
- Updated MC-003A gate report.

Chỉ cập nhật trạng thái theo bằng chứng.

## 13. FINAL REPORT

Báo cáo:

1. Baseline và worktree.
2. RV-S01 remediation result.
3. RV-S02 remediation result.
4. R01–R05 regression status.
5. Files changed.
6. Actual validation results.
7. Local-r2 artifact paths.
8. Manual screenshots/captures still required.
9. A/B/C visual direction recommendation.
10. Product Owner decisions required.
11. Independent QA status.
12. MC-003A gate status.
13. STEP 03B readiness.

Nếu Codex không thể render UI, báo cáo chính xác:

`RENDERED_VALIDATION_PENDING_MANUAL_CAPTURE`

Không yêu cầu Product Owner gửi lại các screenshots đã tồn tại hoặc tái thực hiện những kiểm tra đã có evidence hợp lệ.

## STOP CONDITION

Không:

- Gọi OpenDesign Cloud.
- Gọi OpenCode provider chưa được khôi phục/phê duyệt.
- Tự thay đổi business rules.
- Tự phê duyệt visual direction.
- Triển khai Next.js production UI.
- Chỉnh STEP 02 worktree.
- Merge branches.
- Deploy.
- Mark MC-003A DONE prematurely.
- Start STEP 03B.

## FINAL DIRECTIVE

Resolve confirmed source inconsistencies before visual acceptance.

Distinguish design concepts from working interactions.

Preserve the approved MatterControl legal domain semantics.

Prepare accurate visual evidence and a decision-ready Product Owner review package.

**Control Room for comprehension. Operational Grid for execution.**