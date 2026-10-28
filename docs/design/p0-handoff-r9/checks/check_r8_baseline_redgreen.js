#!/usr/bin/env node
'use strict';
/* MOCK_EXECUTED red->green proof for R8-N01 and R8-N02, using the SAME
 * (now-fixed) strict mock adapter from this package's own
 * checks/strict_dom.js against two different prototypes:
 *   RED   — docs/design/p0-handoff-r8/prototype.html, READ-ONLY, unmodified.
 *   GREEN — docs/design/p0-handoff-r9/prototype.html, this package's
 *           corrected candidate.
 *
 * This isolates "is the concept bug real" from "is the test adapter
 * broken": the R8 baseline is never edited, and the adapter used against
 * both prototypes is identical. If R8 were red only because of an adapter
 * bug (as turned out to be true for the promotion-reason textarea
 * hydration gap in an earlier R9 attempt), the adapter fix would make BOTH
 * prototypes green; it does not — R8 stays red here, R9 goes green, so the
 * R8 defect this reproduces is a real concept-state bug, not a fixture
 * artefact.
 */
const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert');
const {createRequire} = require('node:module');

const R9 = path.resolve(__dirname, '..');
const R8 = path.resolve(R9, '..', 'p0-handoff-r8');
const checkPath = path.join(R9, 'checks', 'check_mock_dom_bootstrap.js');
const source = fs.readFileSync(checkPath, 'utf8');
const prefix = source.slice(0, source.indexOf('const results = [];')).replace(/^#!.*\n/, '');
const {boot} = new Function('require', '__dirname', '__filename', prefix + '\nreturn {boot};')(
  createRequire(checkPath), path.dirname(checkPath), checkPath);

function probe(label, htmlPath) {
  const html = fs.readFileSync(htmlPath, 'utf8');
  const {dom, sandbox} = boot(html, {strict: true});
  function input(id, value) { const el = dom.getElementById(id); el.value = value; dom.dispatch('input', el); }
  function change(id, value) { const el = dom.getElementById(id); el.value = value; dom.dispatch('change', el); }

  sandbox.openRecord('RQ-04');
  const marker = 'REVIEWER-SYNTHETIC-DRAFT-MUST-NOT-SURVIVE-REVOCATION';
  input('draft-title', marker);
  change('role', 'REVOKED');
  const purgedPanelShown = dom.getElementById('detail-body').innerHTML.includes('have been purged');
  change('role', 'OWNER');
  sandbox.openRecord('RQ-04');
  const draftResurrected = dom.getElementById('draft-title').value === marker;
  sandbox.handleCloseDetail();

  sandbox.showView('session');
  input('new-matter-title', 'Synthetic unsent Matter title');
  sandbox.showView('control');
  sandbox.showView('session');
  const newMatterDraftLost = dom.getElementById('new-matter-title').value !== 'Synthetic unsent Matter title';

  sandbox.showView('documents');
  input('promote-reason', 'Synthetic promotion rationale');
  sandbox.showView('control');
  sandbox.showView('documents');
  const promotionDraftLost = dom.getElementById('promote-reason').value !== 'Synthetic promotion rationale';

  const result = {label, purgedPanelShown, draftResurrected, newMatterDraftLost, promotionDraftLost};
  console.log(JSON.stringify(result));
  return result;
}

const red = probe('R8-baseline (read-only, unmodified)', path.join(R8, 'prototype.html'));
const green = probe('R9-candidate (corrected)', path.join(R9, 'prototype.html'));

assert.strictEqual(red.purgedPanelShown, true, 'R8 baseline must still say purged (text claim unchanged)');
assert.strictEqual(red.draftResurrected, true, 'R8 baseline RED: draft must still resurrect on re-grant');
assert.strictEqual(red.newMatterDraftLost, true, 'R8 baseline RED: Create Matter title must still be lost on view switch');
assert.strictEqual(red.promotionDraftLost, true, 'R8 baseline RED: promotion reason must still be lost on view switch');

assert.strictEqual(green.purgedPanelShown, true, 'R9 must still show the purge panel on revocation');
assert.strictEqual(green.draftResurrected, false, 'R9 GREEN: draft must NOT resurrect on re-grant');
assert.strictEqual(green.newMatterDraftLost, false, 'R9 GREEN: Create Matter title must survive view switch');
assert.strictEqual(green.promotionDraftLost, false, 'R9 GREEN: promotion reason must survive view switch');

console.log('');
console.log('RED->GREEN CONFIRMED: R8-N01/R8-N02 reproduce red on read-only R8 baseline and green on the R9 candidate, using the identical (adapter-fixed) mock.');
