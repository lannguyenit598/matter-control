# Phase B reconciliation + UI-F01..12 disposition table — ZCode session r2 (noncompeting supplement)

Date: 2026-10-29 ~00:00+0700. This session executed the combined assignment's Phase A independently in `docs/testing/zcode-system-multitenancy-review-20261029-r2/` (namespace r2, chosen because r1 was already claimed) and began Phase B research. While working, it verified that **the continuing ZCode session (the review-matrix rework session) is the legitimate combined-assignment writer**: it had already sealed its own Phase A in `zcode-system-multitenancy-review-20261029-r1/` (full artifact set incl. full-go-test logs) and produced the Phase B research + `docs/implementation/plans/MC-ZCODE-SOLID-GLASS-PLAN-20261029.md` (rev 1, READY_FOR_IMPLEMENTATION — SHARED-FILE EDITS BLOCKED PENDING WRITER HANDOFF).

Per the assignment's no-competing-writer rule, **this session did not create a second plan or second Phase B evidence namespace.** This document contributes only what the plan of record is missing, plus reconciliation. No product source was edited by this session at any point.

## 1. Reconciliation with the plan of record

| Aspect | Plan of record (rev 1) | This session's independent work | Reconciliation |
|---|---|---|---|
| Upstream pin | `deeplethe/solid-glass @ 6e8903e4…` MIT | Same SHA, same date, independently fetched | Agreed |
| Approach | token/recipe adaptation into MatterControl's own system; reject `:root/.dark` deletion and data-slot wholesale; explicit hooks only | Same conclusion (research.md §3) | Agreed |
| Geometry | SURFACE ONLY; compact tiers + CTA exception preserved | Same (audit finding F-09 provenance + intake qualification) | Agreed |
| Phase A verdicts | sealed in r1 (763-file pin) | sealed in r2 (512-file pin + 3 extra reviewer negative tests, fresh PG fixture) | **Two independent Phase A audits exist.** Both reach the same headline (workspace+matter tenancy SUPPORTED_WITH_LIMITS; no organization entity). r2's added negative tests (cross-cell cursor, foreign-grid anchor, cross-matter idempotency) extend r1's coverage and can be adopted by r1's delta reviewer. |
| UI audit consumption | plan cites the compact-CTA authority and inherits geometry | audit authored by this session + Codex intake | **GAP: the plan lacks the required per-finding disposition table** → provided in §2 below for adoption by the plan owner |
| Review GET-form navigation lead | not mentioned | intake flags it: determine whether the native review search form still reloads the full document; behavioral correction belongs to the feature owner | **GAP: add to the plan's handoff list** → §2 UI-F01 disposition row |

## 2. Per-finding disposition table — UI-F01..UI-F12 (mandatory input, ready for plan adoption)

Qualifications applied from `MC-ZCODE-SYSTEM-REVIEW-THEN-SOLID-GLASS-IMPLEMENT-PROMPT.md` §Phase B and `codex-ui-consistency-intake-20261029-r1/return.md`. Verdict values: CONFIRMED_IN_SCOPE (resolve in the visual plan after handoff) · INTENTIONAL_VARIANT (keep) · NEEDS_RENDERED_PROOF · SUPERSEDED · DEFERRED.

| ID | Finding (from `zcode-ui-ux-consistency-audit-20261029-r1/findings.md`) | Intake qualification | Disposition |
|---|---|---|---|
| UI-F01 (P2) | Reviews search submit is a raw `<button>` outline vs Work grid `Button` primary md | Real duplicate; native GET form is also a **navigation review lead** — check whether search reloads the full document; behavioral fixes belong to the feature owner, not the visual pass | **CONFIRMED_IN_SCOPE (visual half)**: under handoff, replace with the shared Button or an agreed outline variant applied to BOTH grids. **Behavioral half → handoff item** for the feature owner (document-full-reload check), recorded in the remediation plan, not bundled here |
| UI-F02 (P2) | Input 40px vs Select/Button 36px adjacent | Global shrinking is not automatically right; specify tiers + row alignment first; dialog fields and footer actions need not match heights | **CONFIRMED_IN_SCOPE with design decision**: define explicit tiers; recommended minimal alignment = same-row filter field vs submit; dialog input height is an intentional tier unless rendered evidence shows misalignment harm. Decision recorded in plan §5 before any `input.tsx` edit |
| UI-F03 (P3) | Two filter-chip families | Distinct semantics (removable applied chips vs state navigation); consistency of target/typography may help; no forced FilterChip abstraction | **CONFIRMED_IN_SCOPE (partial)**: harmonize hit-target/typography only where the same job is performed; no new abstraction. Differences of color/height across genuinely different jobs stay |
| UI-F04 (P3) | global-error hand-rolled button | Preserve the root fallback's independence — check import availability + fallback CSS before reusing shared code | **CONFIRMED_IN_SCOPE with guard**: `buttonVariants` is a pure module (no runtime deps); adopt it only with a rendered root-error check; if any doubt, keep the hand-rolled classes and just align their values |
| UI-F05 (P3) | Disabled pagination-link conventions differ (aria-disabled vs aria-hidden+opacity) | Low-priority convention cleanup; avoid forcing page-number component onto cursor navigation | **DEFERRED** to maintenance (with UI-F12); pick the `aria-disabled` convention when touched |
| UI-F06 (P3) | Bare `summary` disclosures lack 44px touch coverage (base rule omits `summary`) | Verify actual effective target/spacing at 320px/coarse before declaring numeric failure or applying overlays | **NEEDS_RENDERED_PROOF → CONFIRMED_IN_SCOPE (rule half)**: adding `summary` to the coarse-pointer base rule is a one-line, no-overlay fix (source-supported); rendered verification at 320px follows in Phase C's visual matrix. The style-family convergence (underline vs card-like) is a separate, smaller decision for the plan owner |
| UI-F07 (P3) | Dead selector `a[data-control]` | Cleanup, not demonstrated harm | **CONFIRMED_IN_SCOPE (trivial)**: remove the selector in the same `globals.css` pass |
| UI-F08 (P3) | Partial EN/VI copy in upload form + one error body | Extend the existing EN/VI mechanism; do not change upload UNKNOWN intent or expose content | **CONFIRMED_IN_SCOPE**: wrap the four strings in `LocalizedText` (owner supplies VI copy); no behavior change |
| UI-F09 (P3) | search-input raw clear button lacks touch min-width | Verify effective geometry first | **NEEDS_RENDERED_PROOF**: add `control-target` (or Button icon) under handoff; verify overlay doesn't clip at 390 |
| UI-F10 (P3) | inline-edit `size-7` vs 32px icon buttons | Recompute effective geometry — `size-7` coexists with shared min-h-8/min-w-8; one utility class does not prove a 28px box | **NEEDS_RENDERED_PROOF (recomputed)**: with `min-h-8/min-w-8` inherited, effective floor is 32px unless `size-7`'s width/height beat the minima — they do not (32 > 28); effective size is **32px, not 28px** → the original finding is DOWNGRADED to cosmetic-class drift; disposition: align intentionally or keep with a comment; not a hit-area defect |
| UI-F11 (P3) | Two tab families (44px queues vs 38px matter tabs); density active=outline vs pagination secondary | Intentional navigation hierarchy; preserve unless task evidence shows harm | **INTENTIONAL_VARIANT** — keep; revisit only with design owner |
| UI-F12 (P3) | Unused Pagination molecule | Optional maintenance, not a prerequisite | **DEFERRED** — adopt-or-delete decision parked; not blocking the material adaptation |

Also per intake: **UI-CTA (work-primary 160×44/14px) = SUPERSEDED/INTENTIONAL** — PO density amendment is the current authority; prototype 200×56 historical. RMV-F02/F04 references in the UI audit described the pre-fix baseline; the corrected candidate is now consumed (this session's Phase A r2 reverified all four RMV findings at source/unit level).

## 3. Blocked file set for Phase C (matches the plan of record's §9)

Shared files blocked pending writer handoff (held by Local Codex under `MC-P0-CODEX-UI-FIDELITY-20261029`, task updated 19:57): `apps/frontend/src/app/globals.css`, `src/app/(app)/layout.tsx`, `src/components/atoms/{button,input,select,textarea,badge}.tsx`, `src/components/molecules/dialog.tsx`, shell/navigation components, font setup. No handoff exists; this session makes no Phase C edits. This session's own additions (Phase A r2 namespace, verifier test in the isolated copy) claim no shared paths.

## 4. This session's residue and cleanup statement
- Retained: `/private/tmp/mc-sysrev-20261029-r2/` isolated candidate copy (no secrets) for the delta reviewer; PG fixture + secrets already removed (label-checked).
- No commit/push/deploy; no other session stopped, messaged, or checkpoint-altered.
