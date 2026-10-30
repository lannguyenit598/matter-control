// Bounded mock probes, not browser/rendering or product-authorization evidence.
const fs = require('node:fs');
const path = require('node:path');
const {createRequire} = require('node:module');
const assert = require('node:assert');
const checkPath = path.resolve('docs/design/p0-handoff-r8/checks/check_mock_dom_bootstrap.js');
const source = fs.readFileSync(checkPath, 'utf8');
const prefix = source.slice(0, source.indexOf('const results = [];')).replace(/^#!.*\n/, '');
assert(prefix.length > 1000);
const {boot, html} = new Function('require', '__dirname', prefix + '\nreturn {boot, html};')(
  createRequire(checkPath), path.dirname(checkPath));
const {dom, sandbox} = boot(html, {strict: true});
function change(id, value) {
  const control = dom.getElementById(id);
  control.value = value;
  dom.dispatch('change', control);
}

sandbox.openRecord('RQ-04');
const marker = 'REVIEWER-SYNTHETIC-DRAFT-MUST-NOT-SURVIVE-REVOCATION';
dom.getElementById('draft-title').value = marker;
dom.dispatch('input', dom.getElementById('draft-title'));
change('role', 'REVOKED');
const revokeSaysPurged = dom.getElementById('detail-body').innerHTML.includes('have been purged');
change('role', 'OWNER');
sandbox.openRecord('RQ-04');
const retainedAfterRevocation = dom.getElementById('draft-title').value === marker;
sandbox.handleCloseDetail();
sandbox.showView('session');
dom.getElementById('new-matter-title').value = 'Synthetic unsent Matter title';
dom.dispatch('input', dom.getElementById('new-matter-title'));
sandbox.showView('control');
sandbox.showView('session');
const newMatterDraftLost = dom.getElementById('new-matter-title').value !== 'Synthetic unsent Matter title';
sandbox.showView('documents');
dom.getElementById('promote-reason').value = 'Synthetic promotion rationale';
dom.dispatch('input', dom.getElementById('promote-reason'));
sandbox.showView('control');
sandbox.showView('documents');
const promotionDraftLost = dom.getElementById('promote-reason').value !== 'Synthetic promotion rationale';
const docMarkup = dom.getElementById('documents-body').innerHTML;
const promotionControlIds = [...docMarkup.matchAll(/id="(promote-[^"]+)"/g)].map(m => m[1]);
assert(revokeSaysPurged && retainedAfterRevocation);
assert(newMatterDraftLost && promotionDraftLost);
console.log(JSON.stringify({
  revocation_panel_claims_purge: revokeSaysPurged,
  record_draft_reappears_after_revocation_then_owner_restore: retainedAfterRevocation,
  new_matter_draft_lost_on_view_switch: newMatterDraftLost,
  promotion_reason_lost_on_view_switch: promotionDraftLost,
  promotion_form_ids: promotionControlIds,
  limits: 'Observed in owner strict mock only; real browser and product enforcement NOT_RUN.'
}, null, 2));
