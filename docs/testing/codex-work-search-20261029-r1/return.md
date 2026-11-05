# MC-P0 Work search progressive disclosure

Actual Local Codex, author implementation and checks, 2026-10-29. Current primary checkout/branch retained; exact HEAD and five source/test/story pins in source-manifest.json. Direct PO screenshot feedback requests a simpler primary search with advanced criteria. IN_REVIEW; independent review pending. Existing dirty changes preserved; no commit/push/deploy.

## Scope and design

The Work list now defaults to one labeled keyword input and Search action, with a closed Advanced filters disclosure underneath. Expanded criteria retain the existing Type, Execution, Dependency, Timing, Attention, Owner, Workstream and Sort fields. Applied keyword/criteria appear as removable named chips with Clear filters. Use the existing native details element and Next Form instead of adding a modal, custom query language or new dependency. All criteria retain the existing backend AND semantics. Display names remain names; a selected member/workstream omitted from current options is labeled unavailable while retaining its submitted value.

This is a presentation/navigation change, not new search capabilities or global full-text search. Existing 200-character limit, authorization, snapshot/paging and backend filtering remain authoritative. Assumptions: explicit Enter/Search/Apply submission; no request on each keystroke; URL state is shareable and back-button friendly. Advanced controls stay mounted when closed and keep their values. Applying/removing filters restarts at the first page, while keeping density and descending sort. The route keys the filter form by its current URL so query navigation restores the applied values. No backend/DB/IdP change.

## Checks

Three initial acceptance assertions failed on the old UI (missing searchbox/disclosure/chip and dropped display parameters), then passed after the change. An intermediate accessible-name assertion exposed a missing separator in the chip link name; fixed without weakening that assertion. Final tests also cover retained unavailable selections and clear-one/clear-all settings preservation. Next Form navigation test verifies internal router push, scroll false, first page and retained density/desc.

First full pnpm check:694 pass/1 fail, known proof-upload5s timeout; log retained. Unchanged retry passed695/695 across76files, with typecheck/lint/format/agent config pass. Isolated Webpack production build/CSS guard pass. Storybook builds pass; successful build alone did not guarantee rendering: App Router fixture threw on Next16.4 parentRenderTree, a null-layout decorator was ineffective, and both failed preview observations are retained here. Final story uses the documented Pages Router fixture and renders successfully; no production routing mock/shim was introduced. Storybook only verifies isolated UI; product navigation is checked separately by tests, not awarded E2E acceptance. Final five scoped files equal retained snapshot bytes.

## Actual browser observation

Official cua tools observed the final isolated component in Storybook at1280x720: closed state shows only keyword search and Advanced filters; clicking the summary exposes all eight controls and Apply filters; the applied variant shows two advanced criteria plus a keyword chip with three separate removal links and clear-all URL retaining compact density. Screenshots: search-simple.png, search-advanced.png, search-applied.png. Data are declared synthetic story props, not a live Matter result. Product tab is authenticated but has no accessible workspaces, so no product Matter was created or seeded for this check. Storybook does not supply the product next/font wrapper; font-metric fidelity is not certified by these isolated screenshots.

Temporary preview tabs/three own loopback servers stopped; cleanup.json confirms no listeners. Existing product runtime and other resources untouched. Snapshot excludes private env and reuses installed dependencies without install. The first preview bind was sandbox-denied; explicit local test-server escalation succeeded. No unrelated data/credentials read or transmitted.

Skipped: authenticated product Work search E2E, real dataset search result accuracy, narrow viewport matrix, screen-reader and independent review. Risks: an existing intermittent upload-test timeout remains; successful source/build/isolated rendering is not full product acceptance.
