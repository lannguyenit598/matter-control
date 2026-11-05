# MC-P0-SELECT-POLISH-20261029 — author return

Local Codex; branch codex/unified-project-flow; HEAD 20feedbf06c859a9806055d609f5b132fe8bb086. Proposed status: IN_REVIEW.

## Change
Shared native Select now opts into a token-styled picker where `appearance: base-select` is supported: compact trigger, rounded white popup, neutral selection, checkmark, bounded scrolling and wrapping labels. All existing callers retain native values, FormData, controlled change, empty/clear and disabled behavior. Added disabled option support and three regression tests. No dependency added.

Reference: https://medusajs.com/admin and https://docs.medusajs.com/ui/components/select . Progressive enhancement/fallback: https://developer.mozilla.org/en-US/docs/Learn_web_development/Extensions/Forms/Customizable_select . Unsupported browsers keep the native picker.

## Verification
- pnpm check: exit 0; 55 files / 509 tests.
- pnpm build:webpack: exit 0, including built-CSS guard.
- pnpm build-storybook: exit 0. Select story runtime renders successfully with its routing-independent appDirectory=false override. Existing global Next AppRouter Storybook compatibility was not changed or certified.
- Browser: actual local app Person picker opened and visually checked, then dismissed without submitting changes. Isolated Storybook verified popup, disabled, invalid, long-label and long-list presentation. Screenshot is component preview, not full-product acceptance.
- 677/677 current source pins match; manifest SHA256 84474ae8d36066a18e82493ddba3707cad2f9a475a2f30c83f2679810e5088e6. Four-path delta from creation-flow baseline. Product runtime R1 Select/CSS bytes match this R2 candidate; R2 only updates story configuration. No extra frontend restart needed.

## Limits
Keyboard selection could not be established through browser automation (key probes retained placeholder); unit tests establish change/FormData semantics but do not replace manual keyboard acceptance. Mobile/touch, screen readers, unsupported-browser fallback rendering and independent QA remain open. No backend changes or backend rerun. No commit, push or release approval. Temporary Storybook server stopped; local app remains available.
