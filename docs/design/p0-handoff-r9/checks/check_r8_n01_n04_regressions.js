#!/usr/bin/env node
'use strict';
/* MOCK_EXECUTED regression checks for R8-N01, R8-N02 and R8-N03.
 *
 * This file is new in R9. It reuses the exact bootstrap helper the
 * reviewer's own reviewer-probes.cjs used against the R8 package
 * (docs/testing/p0-design-r8-intake-20261027/reviewer-probes.cjs), extracted
 * here from this package's own checks/check_mock_dom_bootstrap.js so the
 * same probe technique runs against R9's corrected prototype.html instead.
 *
 * Evidence tier: MOCK_EXECUTED. This proves the corrected concept-state
 * logic behaves as specified against a strict mock DOM with real event
 * listeners dispatched. It does not establish rendered geometry, focus,
 * keyboard or screen-reader behaviour (VERIFICATION_BLOCKED, see
 * validation-plan.md) and it is not a product authorization/security PASS.
 */
const fs = require('node:fs');
const path = require('node:path');
const {createRequire} = require('node:module');
const assert = require('node:assert');

const PKG = path.resolve(__dirname, '..');
const checkPath = path.join(__dirname, 'check_mock_dom_bootstrap.js');
const source = fs.readFileSync(checkPath, 'utf8');
const prefix = source.slice(0, source.indexOf('const results = [];')).replace(/^#!.*\n/, '');
assert(prefix.length > 1000, 'bootstrap prefix extraction must find the shared boot() helper');
const htmlPath = path.join(PKG, 'prototype.html');
const html = fs.readFileSync(htmlPath, 'utf8');
const {boot, html: htmlVar} = new Function('require', '__dirname', '__filename', prefix + '\nreturn {boot, html};')(
  createRequire(checkPath), path.dirname(checkPath), checkPath);

const results = [];
function check(name, fn) { fn(); results.push(name); console.log('PASS  ' + name); }

function freshSandbox() {
  const {dom, sandbox} = boot(html, {strict: true});
  function change(id, value) {
    const el = dom.getElementById(id);
    el.value = value;
    if (el.tagName === 'INPUT' && el.type === 'checkbox') { el.checked = value; }
    dom.dispatch('change', el);
  }
  function input(id, value) {
    const el = dom.getElementById(id);
    el.value = value;
    dom.dispatch('input', el);
  }
  function click(id) { dom.dispatch('click', dom.getElementById(id)); }
  return {dom, sandbox, change, input, click};
}

/* ── R8-N01: revoke -> re-grant must not resurrect a purged draft ──────── */
check('R8-N01 regression — record draft does NOT survive revoke -> owner re-grant (reproduces reviewer marker, now red->green)', () => {
  const {dom, change, input} = freshSandbox();
  dom.sandbox ? null : null;
  const sandbox = dom; // not used; kept for clarity
  const marker = 'REVIEWER-SYNTHETIC-DRAFT-MUST-NOT-SURVIVE-REVOCATION';
  const s = freshSandbox();
  s.sandbox.openRecord('RQ-04');
  s.dom.getElementById('draft-title').value = marker;
  s.dom.dispatch('input', s.dom.getElementById('draft-title'));
  s.change('role', 'REVOKED');
  const revokeSaysPurged = s.dom.getElementById('detail-body').innerHTML.includes('have been purged');
  s.change('role', 'OWNER');
  s.sandbox.openRecord('RQ-04');
  const retainedAfterRevocation = s.dom.getElementById('draft-title').value === marker;
  assert(revokeSaysPurged, 'panel must still say purged');
  assert.strictEqual(retainedAfterRevocation, false, 'draft must NOT reappear after revoke -> re-grant');
});

check('R8-N01 regression — selected bulk rows and bulk result do not resurrect after revoke -> re-grant', () => {
  const s = freshSandbox();
  s.sandbox.showView('grid');
  s.change('role', 'OWNER');
  const row = s.dom.getElementById('rows') ? null : null; // selection is driven by checkbox change events with data-select
  // select two rows the same way a user checkbox-click would, via dataset-select elements created at render time
  const checkboxes = [...s.dom.querySelectorAll('[data-select]')].slice(0, 2);
  assert(checkboxes.length === 2, 'grid must render at least two selectable rows');
  checkboxes.forEach(cb => { cb.checked = true; s.dom.dispatch('change', cb); });
  s.change('role', 'REVOKED');
  s.change('role', 'OWNER');
  s.sandbox.showView('grid');
  const stillSelected = [...s.dom.querySelectorAll('[data-select]')].some(cb => cb.checked);
  assert.strictEqual(stillSelected, false, 'bulk selection must not resurrect after an access-loss transition');
});

check('R8-N01 regression — downgrade to VIEWER (still has scoped read) does NOT purge the record draft', () => {
  const s = freshSandbox();
  const marker = 'kept-on-downgrade';
  s.sandbox.openRecord('RQ-04');
  s.dom.getElementById('draft-title').value = marker;
  s.dom.dispatch('input', s.dom.getElementById('draft-title'));
  s.change('role', 'VIEWER');
  s.change('role', 'OWNER');
  s.sandbox.openRecord('RQ-04');
  assert.strictEqual(s.dom.getElementById('draft-title').value, marker,
    'a downgrade that still carries scoped read (OWNER -> VIEWER) must not purge protected drafts');
});

/* ── R8-N02: Create Matter title / promotion reason survive navigation ─── */
check('R8-N02 regression — Create Matter title survives view switch (reproduces reviewer finding, now red->green)', () => {
  const s = freshSandbox();
  s.sandbox.showView('session');
  s.input('new-matter-title', 'Synthetic unsent Matter title');
  s.sandbox.showView('control');
  s.sandbox.showView('session');
  assert.strictEqual(s.dom.getElementById('new-matter-title').value, 'Synthetic unsent Matter title');
});

check('R8-N02 regression — promotion reason survives view switch and locale switch (reproduces reviewer finding, now red->green)', () => {
  const s = freshSandbox();
  s.sandbox.showView('documents');
  s.input('promote-reason', 'Synthetic promotion rationale');
  s.sandbox.showView('control');
  s.sandbox.showView('documents');
  assert.strictEqual(s.dom.getElementById('promote-reason').value, 'Synthetic promotion rationale', 'survives view switch');
  s.change('lang', 'vi');
  s.sandbox.showView('documents');
  assert.strictEqual(s.dom.getElementById('promote-reason').value, 'Synthetic promotion rationale', 'survives locale switch');
});

check('R8-N02 regression — promotion reason/target do not bleed across documents', () => {
  const s = freshSandbox();
  s.sandbox.showView('documents');
  const docs = [...s.dom.getElementById('doc-select').options].map(o => o.value);
  assert(docs.length >= 2, 'fixture must carry at least two documents to prove isolation');
  s.change('doc-select', docs[0]);
  s.input('promote-reason', 'reason for doc A');
  s.change('doc-select', docs[1]);
  assert.notStrictEqual(s.dom.getElementById('promote-reason').value, 'reason for doc A', 'doc B must not see doc A draft');
  s.change('doc-select', docs[0]);
  assert.strictEqual(s.dom.getElementById('promote-reason').value, 'reason for doc A', 'doc A keeps its own draft');
});

check('R8-N02 / R8-N01 regression — explicit discard (Sign out) clears the form drafts', () => {
  const s = freshSandbox();
  s.sandbox.showView('session');
  s.input('new-matter-title', 'to be discarded');
  s.change('session-state', 'logout');
  s.click('btn-sign-out');
  s.change('session-state', 'current');
  s.sandbox.showView('session');
  assert.strictEqual(s.dom.getElementById('new-matter-title').value, '', 'Sign out must clear the Create Matter draft');
});

/* ── R8-N03: target is independent from the expected-current guard ─────── */
check('R8-N03 regression — target and expected-current are two independent controls', () => {
  const s = freshSandbox();
  s.sandbox.showView('documents');
  const ids = [...s.dom.getElementById('documents-body').innerHTML.matchAll(/id="(promote-[^"]+)"/g)].map(m => m[1]);
  assert(ids.includes('promote-target'), 'a distinct promote-target control must exist');
  assert(ids.includes('promote-expected'), 'the expected-current concurrency guard must still exist');
  assert.notStrictEqual(s.dom.getElementById('promote-target'), s.dom.getElementById('promote-expected'));
});

check('R8-N03 regression — no target selected never produces a ready/success intent', () => {
  const s = freshSandbox();
  s.sandbox.showView('documents');
  s.change('promote-target', '');
  s.input('promote-reason', 'because');
  s.change('promote-impact', true);
  s.click('promote-preview');
  const msg = s.dom.getElementById('promote-result').textContent;
  assert(/No target version selected/.test(msg), 'missing target must not fabricate success: ' + msg);
});

check('R8-N03 regression — re-selecting the current version as target yields a no-change message, not success', () => {
  const s = freshSandbox();
  s.sandbox.showView('documents');
  const sel = s.dom.getElementById('promote-target');
  const currentOpt = [...sel.options].find(o => /\(current\)/.test(o.textContent));
  assert(currentOpt, 'fixture must expose which option is current');
  s.change('promote-target', currentOpt.value);
  s.input('promote-reason', 'because');
  s.change('promote-impact', true);
  s.click('promote-preview');
  const msg = s.dom.getElementById('promote-result').textContent;
  assert(/already current|no-change/.test(msg), 'selecting current as target must not read as a real promotion: ' + msg);
});

check('R8-N03 regression — changing the target resets a stale impact acknowledgment', () => {
  const s = freshSandbox();
  s.sandbox.showView('documents');
  const sel = s.dom.getElementById('promote-target');
  const opts = [...sel.options].map(o => o.value).filter(Boolean);
  assert(opts.length >= 2, 'fixture must carry at least two versions to prove ack invalidation');
  s.change('promote-target', opts[0]);
  s.change('promote-impact', true);
  assert.strictEqual(s.dom.getElementById('promote-impact').checked, true);
  s.change('promote-target', opts[1]);
  assert.strictEqual(s.dom.getElementById('promote-impact').checked, false,
    'a changed target must not silently keep an acknowledgment that no longer corresponds to it');
});

check('R8-N03 regression — a stale expected-current guard never becomes a force-save', () => {
  const s = freshSandbox();
  s.sandbox.showView('documents');
  const targetSel = s.dom.getElementById('promote-target');
  const nonCurrent = [...targetSel.options].find(o => o.value && !/\(current\)/.test(o.textContent));
  assert(nonCurrent, 'fixture must expose a non-current version to promote');
  s.change('promote-target', nonCurrent.value);
  s.input('promote-reason', 'because');
  s.change('promote-impact', true);
  const expectedSel = s.dom.getElementById('promote-expected');
  const staleOpt = [...expectedSel.options].find(o => o.value !== nonCurrent.value && o.value !== expectedSel.value) || expectedSel.options[expectedSel.options.length - 1];
  s.change('promote-expected', staleOpt.value);
  s.click('promote-preview');
  const msg = s.dom.getElementById('promote-result').textContent;
  if (staleOpt.value !== [...expectedSel.options].find(o => o.defaultSelected || /current/i.test('')) ) {
    assert(/stale write|DEPENDENCY_PENDING|rebase/i.test(msg), 'a stale expected-current must be refused, not force-saved: ' + msg);
  }
});

check('R8-N03 regression — EDITOR can add a version but has no promotion control; VIEWER keeps scoped read', () => {
  const s = freshSandbox();
  s.change('role', 'EDITOR');
  s.sandbox.showView('documents');
  let markup = s.dom.getElementById('documents-body').innerHTML;
  assert(markup.includes('data-od-id="add-version-panel"'), 'EDITOR must still be able to add a version');
  assert(!markup.includes('data-od-id="promote-panel"'), 'EDITOR must not see an operable promotion panel');
  s.change('role', 'VIEWER');
  s.sandbox.showView('documents');
  markup = s.dom.getElementById('documents-body').innerHTML;
  assert(markup.includes('Version lineage for'), 'VIEWER must keep scoped read of the document');
  assert(!markup.includes('data-od-id="promote-panel"'), 'VIEWER must not see an operable promotion panel');
});

console.log('');
console.log('MOCK_EXECUTED: ' + results.length + ' R8-N01..N03 regression checks passed against docs/design/p0-handoff-r9/prototype.html.');
console.log('Limits: mock DOM execution only; not rendered/browser evidence; not a product authorization/security PASS.');
