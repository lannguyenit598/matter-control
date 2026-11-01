# V2-3 — Independent review: `usability-prep-20261101-r1/` (MC-ZCODE-USABILITY-PREP-20261101, CO-19 prep)

- **Reviewer:** actual OpenCode (independent QA). Namespace: `docs/testing/opencode-verify-wave-20261031-r1/`.
- **Verdict time (UTC):** 2026-10-31T17:52:14Z.
- **Bytes reviewed:** working-tree bytes of the 6 prep files (uncommitted; author's return.md states base `6b0c358` + 6 new uncommitted files). HEAD of the shared branch at verdict time: `bb54d6e` (branch `codex/unified-project-flow`). Prep files were NOT part of any of the 4 commits `5e932bd..bb54d6e`; author base `6b0c358` is consistent. **Byte-drift protocol:** if the files change between this review and their commit, this verdict stands for the bytes read in window 2026-10-31T17:15–17:52Z; line numbers below may shift and must be re-anchored at commit time.

## 1. Verdict: AMEND (not REJECT, not yet APPROVE_FOR_USE)

Package structure, scope discipline, and ethics framing are strong. **5 amendment items** must be fixed before the two affected files can be used for seed/moderation; none of them invalidates the overall design.

## 2. AMEND items (exact cites)

### A-1 · `dataset-checklist.md:44` — aggregate counts do not equal the per-matter tables, and §8 mis-reference

Line 44 states: *«Tổng: **1 workspace, 4 member, 5 matter, 4 party bên ngoài, 4 document (5 version), 12 requirement, 7 action, 6 claim, 3 filing, 1 milestone, 2 context record, 1 review grid, 3 item WAITING, 2 item BLOCKED.** Bảng đối chiếu số lượng tổng nằm ở §8.»*

Recounted from the entity tables of §3–§7 (M1–M5):

| Field | L44 says | §3–§7 tables sum to | Note |
|---|---|---|---|
| requirement | 12 | **9** (M1: 3, M2: 4, M4: 2; M3: 0, M5: 0 — trống) | Nếu đếm thêm 6 dòng REQUIREMENT trong CSV §7 thì là 15; không cách nào ra 12 |
| action | 7 | **9** (M1: 4, M2: 2, M4: 3) — cộng 4 dòng ACTION của CSV import là 13 | |
| claim | 6 | **10** (M1: 2 = claim#1/#2, M2: 4 = #3–#6, M3: 3 = package F1 + package F2 + outcome F2, M4: 1 = claim của R-T2) | |
| document version | 5 | **6** (D1 v1+v2, D2 v1+v2, D3 v1, D4 v1) | field "4 document" đứng ✓ |
| party | 4 | 4 ✓ | |
| filing / milestone / context / grid / WAITING / BLOCKED | 3/1/2/1/3/2 | 3/1/2/1/3/2 ✓ | |

Additionally, *«Bảng đối chiếu số lượng tổng nằm ở §8»* is false: **§8 is the receipt-replay case spec** (`## 8. Case "receipt replay"`), there is no aggregate reconciliation table anywhere in the file.

**Required fix:** correct L44 to the recounted numbers (or make the tables match the intended totals and say what the totals cover — seed-time only vs including CSV import), and delete/repoint the §8 reference.

### A-2 · `dataset-checklist.md:143,155,159` — CSV afflictions (propagated to `session-scripts.md:185` and author `return.md:12,24`)

1. **Row count mismatch.** L143 declares *«12 dòng dữ liệu: 10 hợp lệ + 2 lỗi cố ý»*; the embedded CSV block (L146–157) contains **exactly 10 data rows = 8 valid + 2 error rows** (row 7 missing-title, row 8 bad date `31-12-2026`). Same wrong "12 dòng / 10 hợp lệ" repeated at `session-scripts.md:185` and in author `return.md:12,24` ("CSV import 12 dòng (10 hợp lệ + 2 lỗi có đáp án)").
2. **Self-dependency.** CSV row 9 (`ACTION,"Việc 4 — Hủy tài khoản…"`) has `dependsOn 9` — **it depends on itself** (row numbering 1–10 as they appear in the file, per the note's own convention). Must be either a real dependency (e.g. `5`) or empty.
3. **Garbled moderator answer.** L159's answer for the missing-title row is *«Bản án tích ban quản lý công ty mục tiêu»* — semantically unrelated to an SPA closing-checklist item ("điều kiện" dataset). Looks like a leftover from another dataset read. A moderator reading this verbatim would inject nonsense into the trial.
4. Minor but same-area: L159's stated fix answer for the bad-date row is `2026-12-15`, yet the row's due is the intended-correct value itself (`31-12-2026` → `2026-12-15` fine); consistent — no change needed here beyond wording, listed for completeness.

**Required fix:** declare **10 dòng: 8 hợp lệ + 2 lỗi** (all three locations), fix row 9's `dependsOn`, replace the garbled answer with one matching the row (e.g. title paraphrase of "Giấy xác nhận không vi phạm"/correct closing condition), and keep 2 error rows as designed.

### A-3 · `metrics-thresholds.md:18` — invented equivalence with a phrase the test-plan never wrote

The row operationalizes SEQ as *trung vị ≥5 trên thang 1=rất khó…7=rất dễ* and justifies it as *«tương đương cách ghi "độ khó ≤5" trong test-plan»*. **The source (`usability-test-plan.md` §5) reads «SEQ ≤5 cho luồng chính» — the words "độ khó ≤5" do not exist there.** The operationalized threshold itself (median ease ≥5, Sauro-aligned) is a defensible interpretation — but the claimed equivalence (a) attributes wording to the source that it never wrote, and (b) glosses over that the source's raw "SEQ ≤5" is ambiguous on a 1..7 ease scale (≤5 literally caps ease; common UX practice reads acceptance as ≥5).

**Required fix:** keep the proposed threshold but (i) quote the source verbatim («SEQ ≤5»), (ii) present ≥5 as "cách hiểu đề xuất — chờ PO chốt", and (iii) flag the source anomaly to the PO (test-plan §5's direction may itself need an erratum). This is exactly the risk the author already self-disclosed as R-06 — the fix is disclosure wording, not threshold change. Dispatch bound me to "verify operationalization didn't distort thresholds; don't change them": I confirm the distortion is only in the *justification sentence*, not in the chosen numbers.

### A-4 · `forms.md:41` — stray CJK characters

*«Ghi chú note-taker: chỉ事实 quan sát được…»* — "事实" (Chinese for "facts") slipped into Vietnamese text. Should read *«chỉ quan sát được…»* (or "chỉ ghi sự thật quan sát được"). These prep files get printed for the PO; must be clean.

### A-5 · `evidence.go:292` → actual line **285** — citation drift in 4 places

The `EXPIRED` constant ("accepted proof is past its validity") lives at `apps/backend/internal/core/domain/matter/evidence.go:285`, not `:292`. Semantics fully correct; only the line number is off. Occurrences: `dataset-checklist.md:98`, author `return.md:12,24,31`. Fix all four to `:285` (or drop the line number — the quoted comment is unambiguous).

## 3. Positive verifications (checked independently)

| # | Check | Result |
|---|---|---|
| 1 | Test-plan §3 fidelity: sessions A–F; **T7 omitted** — cross-checked `usability-test-plan.md` §3 (source lines show sessions A–F with T4 rejected/expired cases; no T7 in session list), consistent with prep's own disclosure. | PASS |
| 2 | Threshold table otherwise faithful to test-plan §5: task completion ≥80% per session, median T1 ≤10s, SUS ≥70, 0-case "completed=verified / receipt=approval" misconception (hard threshold). | PASS |
| 3 | Dataset covers GW-01..03 (M1/M2/M3 shapes match BA r1 receipts references), trap matter M4 (1 blocker + 1 waiting + reachable A-T2, BF-07-style single-truth readback), receipt-replay case §8 (fault AFTER commit on A5 + event socket assertion) with explicit «not a cross-matter R-02 probe» boundary. | PASS |
| 4 | Forms PII-clean: P#+role only everywhere; signed originals held by PO outside repo; consent form collects no identifying data; recording opt-out path present. | PASS |
| 5 | SUS: 10 standard questions, per-question scoring and ×2.5 aggregation correct in form. | PASS |
| 6 | Logistics §8: **7/7 decisions** each carry a recommendation + default value; gate §1 conditions match test-plan prereqs; E-2/E-4 gaps listed as blocking. | PASS |
| 7 | Receipt-replay assertion (c) is technically grounded: `GET /api/v1/operations/:key` exists (`productapi/server.go:128` → `s.ownReceipt`), actor-scoped. | PASS |
| 8 | Author's E-2 self-disclosure is real: stub IdP exposes machine endpoints only (`/introspect`, `/healthz` per `stubidp/main.go`) — browser login genuinely missing; correctly gated in logistics §1 row 4. | PASS |
| 9 | EXPIRED semantics: `evidence.go:285` matches the quoted comment exactly (line number aside, see A-5). | PASS |
| 10 | Scope discipline in author return.md: commits not touched, project-status.md untouched, PII policy honored, no claim of seed execution (seed assigned to executor). | PASS |

## 4. Conditions to re-open

- Author fixes A-1..A-5 → OpenCode re-reviews the diffs (targeted, limited to changed lines) → verdict may become APPROVE_FOR_USE.
- A-2 items 1–3 are trial-blocking at the moment the CSV and its notes are put into a moderator's hands; A-1 blocks seed reconciliation; A-3/A-5 are documentation-integrity fixes that can land with the same commit.
- After fix-wave commit: this review must be re-anchored to committed bytes (per byte-drift protocol).

## 5. Skipped checks and risks

- **Not done here (out of this case's scope):** executing the seed or CSV import on a live env; verifying the product's CSV parser behavior against rows (the walkthrough env exists — a 10-minute smoke of the actual import could be added by the executor as a seed receipt); UI rendering of any checklist item.
- **Risk:** line numbers in this review are anchored to uncommitted bytes; if the author edits files before committing, anchors shift (content findings remain valid).
- **Risk:** A-3 reveals a small latent ambiguity in the *source* test-plan §5 («SEQ ≤5») — if left unfixed at source level, judge sheets will inherit it. Recommend the author raise it with the PO when R-06 is adjudicated.
