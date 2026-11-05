#!/usr/bin/env node
'use strict';
/* MOCK_EXECUTED checks for prototype.html.
 *
 * Evidence tier: source parsing plus execution against a strict mock DOM.
 * These assertions do NOT establish rendered geometry, visual hierarchy,
 * real focus movement or assistive-technology behaviour. Those remain
 * NOT_RUN / VERIFICATION_BLOCKED and are recorded as such in validation-plan.md.
 */
const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert');
const vm = require('node:vm');
const {StrictDom} = require('./strict_dom.js');

const PKG = path.resolve(__dirname, '..');
const htmlPath = path.join(PKG, 'prototype.html');
const html = fs.readFileSync(htmlPath, 'utf8');

const REQUIRED_STATIC_IDS = [
  'atlas-data', 'fixtures-data', 'concept-logic', 'main', 'detail', 'detail-title', 'detail-body',
  'modal-trail', 'btn-back-prev', 'btn-back-record', 'close-detail',
  'role', 'density', 'lang', 'fixture-flag',
  'session-state', 'matter-query', 'session-body', 'session-authority',
  'chain', 'chain-summary', 'next', 'wait-summary', 'milestones', 'evidence-gaps',
  'control-changes', 'control-authority', 'control-lede',
  'query', 'type', 'sort', 'fixture', 'range', 'selection', 'rows', 'mobile-rows',
  'grid-title', 'grid-intent', 'grid-table', 'grid-authority', 'clear-selection', 'reset-filter', 'open-bulk',
  'my-actions-container', 'mine-authority', 'waiting-list',
  'doc-select', 'doc-state', 'documents-body', 'documents-authority',
  'filing-select', 'filing-path', 'filing-body', 'filing-authority',
  'bulk-body', 'bulk-authority', 'import-steps', 'import-body', 'import-authority',
  't1', 't2', 'brief-preview', 'window-error', 'brief-changes', 'brief-outstanding',
  'outstanding-limit', 'brief-authority',
  'hist-query', 'hist-entity', 'hist-page', 'hist-reset', 'history-body', 'history-authority',
  'gw-select', 'gw-body', 'state-screen-select', 'state-state-select', 'state-preview-panel', 'errors-body'
];

function bodyMarkup(source) {
  // Exclude <script> payloads so JSON content is never mistaken for markup.
  return source.replace(/<script[\s\S]*?<\/script>/g, '');
}

function boot(source, opts) {
  const markup = bodyMarkup(source);
  const dom = new StrictDom(markup, opts);
  const dataMatch = source.match(/<script id="atlas-data"[^>]*>([\s\S]*?)<\/script>/);
  const fxMatch = source.match(/<script id="fixtures-data"[^>]*>([\s\S]*?)<\/script>/);
  const logicMatch = source.match(/<script id="concept-logic">([\s\S]*?)<\/script>/);
  assert(dataMatch && fxMatch && logicMatch, 'prototype must carry atlas-data, fixtures-data and concept-logic');
  for (const [id, text] of [['atlas-data', dataMatch[1]], ['fixtures-data', fxMatch[1]], ['concept-logic', logicMatch[1]]]) {
    const el = dom.registry.get(id) || dom.makeTarget({tag: 'script', id: id});
    el.textContent = text;
  }
  const sandbox = {document: dom, console: {log() {}, warn() {}, error() {}}, JSON: JSON, Date: Date, Math: Math,
                   Number: Number, String: String, Object: Object, Array: Array, Set: Set, Map: Map, Proxy: Proxy, Reflect: Reflect, Error: Error};
  sandbox.window = sandbox;
  sandbox.globalThis = sandbox;
  vm.createContext(sandbox);
  // The prototype's top-level declarations are script-scoped. Append an export
  // shim so the checker can reach them. The shim adds no behaviour and changes
  // no value; it only exposes what already exists.
  const EXPORTS = ['records', 'recordById', 'data', 'fx', 'derive', 'openRecord', 'showProof',
                   'handleCloseDetail', 'handleBackPrev', 'handleBackRecord', 'showView', 'can', 'PERM', 'OP'];
  const shim = '\n;Object.assign(globalThis, {' + EXPORTS.map(n => n + ': typeof ' + n + ' !== "undefined" ? ' + n + ' : undefined').join(', ') + '});';
  vm.runInContext(logicMatch[1] + shim, sandbox, {timeout: 20000, filename: 'concept-logic'});
  EXPORTS.forEach(n => assert(sandbox[n] !== undefined, 'prototype must define ' + n));
  return {dom, sandbox};
}

const results = [];
function check(name, fn) {
  fn();
  results.push(name);
  console.log('PASS  ' + name);
}

/* 1. every required static id is really declared in the markup */
check('required static DOM ids are declared in prototype.html', () => {
  const declared = new Set([...bodyMarkup(html).matchAll(/id="([^"]+)"/g)].map(m => m[1])
    .concat(['atlas-data', 'fixtures-data', 'concept-logic']));
  const missing = REQUIRED_STATIC_IDS.filter(id => !declared.has(id));
  assert.deepEqual(missing, [], 'missing required static ids: ' + missing.join(', '));
});

/* 2. the prototype boots with no auto-vivified lookups */
const {dom, sandbox} = boot(html, {strict: true});
check('prototype boots against a strict mock with zero auto-vivified id lookups', () => {
  assert.deepEqual(dom.missing, [], 'unexpected missing ids: ' + dom.missing.join(', '));
});

/* 3. negative mutation: renaming a required static id must be detected */
check('negative mutation — renaming the static query id is detected', () => {
  const mutated = html.replace('id="query"', 'id="query-renamed"');
  assert.notEqual(mutated, html, 'mutation precondition: id="query" must exist');
  let threw = false;
  try { boot(mutated, {strict: true}); } catch (e) { threw = true; }
  assert.equal(threw, true, 'the strict mock must fail when a required static id disappears');
  const declared = new Set([...bodyMarkup(mutated).matchAll(/id="([^"]+)"/g)].map(m => m[1]));
  assert.equal(declared.has('query'), false);
});

/* 4. negative mutation: deleting a required static id must be detected */
check('negative mutation — deleting the detail-body id is detected on first use', () => {
  const mutated = html.replace('<div id="detail-body">', '<div>');
  assert.notEqual(mutated, html, 'mutation precondition: id="detail-body" must exist');
  let threw = false;
  try {
    const b = boot(mutated, {strict: true});
    b.sandbox.openRecord('RQ-04');          // the first consumer of detail-body
  } catch (e) { threw = true; }
  assert.equal(threw, true, 'the strict mock must fail when detail-body disappears');
});

/* 5. canonical dataset is intact after boot */
check('canonical Atlas dataset is 24 records and 7 edges after boot', () => {
  assert.equal(sandbox.records.length, 24);
  assert.equal(sandbox.data.edges.length, 7);
});

/* 6. DR7-02 regression — RQ-11 must not deny its own downstream proof gate */
check('DR7-02 regression — RQ-11 proof panel reports its DEP-07 proof gate to AC-12', () => {
  sandbox.openRecord('RQ-11');
  sandbox.showProof();
  const body = dom.getElementById('detail-body').innerHTML;
  assert(body.includes('DEP-07'), 'RQ-11 proof panel must name DEP-07');
  assert(body.includes('AC-12'), 'RQ-11 proof panel must name AC-12 as the gated record');
  assert(!/No downstream proof gates declared/.test(body), 'the false denial must be gone');
  const consequence = sandbox.derive.consequence(sandbox.recordById['RQ-11']);
  assert(/DEP-07 → AC-12/.test(consequence), 'consequence must be derived from the typed edge');
});

/* 7. DR7-02 regression — RQ-07 keeps its own READY dependency */
check('DR7-02 regression — RQ-07 shows its own READY dependency, not AC-07 BLOCKED', () => {
  sandbox.openRecord('RQ-07');
  sandbox.showProof();
  const body = dom.getElementById('detail-body').innerHTML;
  assert.equal(sandbox.recordById['RQ-07'].dep, 'READY');
  assert.equal(sandbox.derive.dependencyOf('RQ-07').state, 'READY');
  assert(!/BLOCKED by upstream dependencies/.test(body), 'RQ-07 must not claim an upstream block it does not have');
  assert(/READY/.test(body), 'RQ-07 panel must state its READY dependency');
  assert.equal(sandbox.derive.dependencyOf('AC-07').state, 'BLOCKED', 'AC-07 is the blocked subject, and stays separate');
});

/* 8. every canonical record's panel agrees with its own edges */
check('all 24 canonical proof panels agree with the record and its typed edges', () => {
  for (const r of sandbox.records) {
    sandbox.openRecord(r.id);
    sandbox.showProof();
    const body = dom.getElementById('detail-body').innerHTML;
    const p = sandbox.derive.proof(r);
    for (const e of p.outgoingAllGates) {
      assert(body.includes(e.id), `${r.id} panel must name outgoing edge ${e.id}`);
    }
    for (const e of p.incoming) {
      assert(body.includes(e.id), `${r.id} panel must name incoming edge ${e.id}`);
    }
    if (p.outgoingProofGates.length) {
      assert(!/No downstream proof gates declared/.test(body), `${r.id} must not deny an existing proof gate`);
    }
    const depState = sandbox.derive.dependencyOf(r.id).state;
    assert.equal(depState, r.dep, `${r.id} derived dependency ${depState} must equal the fixture value ${r.dep}`);
  }
});

/* 9. missing-information fallback states unavailability instead of a negative fact */
check('fallback reports unavailable instead of asserting a negative fact', () => {
  sandbox.openRecord('RQ-08');
  sandbox.showProof();
  const body = dom.getElementById('detail-body').innerHTML;
  assert(/No evidence has been supplied|Missing/.test(body), 'absent evidence must be described as absent');
  assert(!/No downstream proof gates declared/.test(body));
});

/* 10. AC-DEMO-PROOF stays a labelled fixture outside every Atlas total */
check('AC-DEMO-PROOF is reachable and never enters the canonical 24', () => {
  assert.equal(sandbox.records.some(r => r.id === 'AC-DEMO-PROOF'), false);
  sandbox.openRecord('AC-DEMO-PROOF');
  assert(dom.getElementById('detail-title').textContent.includes('AC-DEMO-PROOF'));
  sandbox.showProof();
  const body = dom.getElementById('detail-body').innerHTML;
  assert(/UNVERIFIED/.test(body));
  assert(/Explicit evidence requirement ER-DEMO-01/.test(body), 'the demo fixture must carry an explicit evidence requirement');
});

/* 11. boundary assertions on the shared predicates */
check('gate, eligibility and milestone predicates hold at their boundaries', () => {
  const d = sandbox.derive;
  // completion gate: COMPLETED prerequisite satisfies, WAITING does not
  assert.equal(d.gateSatisfied({id: 'X', from: 'AC-06', to: 'ZZ', gate: 'completion'}).satisfied, true);
  assert.equal(d.gateSatisfied({id: 'X', from: 'AC-04', to: 'ZZ', gate: 'completion'}).satisfied, false);
  // proof gate: VERIFIED alone is not enough without valid proof under current policy
  assert.equal(sandbox.recordById['RQ-05'].ver, 'VERIFIED');
  assert.equal(sandbox.recordById['RQ-05'].validProof, false);
  assert.equal(d.gateSatisfied({id: 'DEP-05', from: 'RQ-05', to: 'AC-05', gate: 'proof'}).satisfied, false);
  assert.equal(sandbox.recordById['RQ-01'].validProof, true);
  assert.equal(d.gateSatisfied({id: 'X', from: 'RQ-01', to: 'ZZ', gate: 'proof'}).satisfied, true);
  // NOT_REQUIRED only counts for a milestone when the exemption is explicit
  assert.equal(d.milestone([]).state, 'UNASSESSED');
  assert.equal(d.milestone(null).state, 'UNASSESSED');
  assert.equal(d.milestone(['AC-01']).state, 'READY');
  assert.equal(d.milestone(['AC-05']).state, 'BLOCKED');
  assert.equal(d.milestone(['RQ-05']).state, 'BLOCKED', 'historical VERIFIED without valid proof does not satisfy a milestone');
  // eligibility: an Action that is WAITING is never eligible, and 0 are eligible at T0
  assert.equal(sandbox.records.filter(d.eligible).length, 0);
  assert.equal(d.eligible(sandbox.recordById['AC-04']), false);
  assert.equal(d.eligible(sandbox.recordById['AC-07']), false);
});

/* 12. AC-06 canonical facts preserved */
check('AC-06 remains COMPLETED / READY owned by U-03', () => {
  const r = sandbox.recordById['AC-06'];
  assert.equal(r.exec, 'COMPLETED');
  assert.equal(sandbox.derive.dependencyOf('AC-06').state, 'READY');
  assert.equal(r.owner, 'U-03');
  assert.equal(r.explicitNotRequired, true);
});

/* 13. click delegation really routes (listeners are retained and dispatched) */
check('click delegation routes view switching, record opening and per-screen reset', () => {
  sandbox.handleCloseDetail();
  const navBtn = dom.querySelector('[data-view="history"]');
  assert(navBtn, 'a navigation button for the history view must exist');
  dom.dispatch('click', navBtn);
  assert.equal(dom.getElementById('view-history').hidden, false, 'history view must become visible');
  assert.equal(dom.getElementById('view-control').hidden, true, 'the previous view must be hidden');

  const recBtn = dom.makeTarget({tag: 'button', 'data-record': 'RQ-04'});
  dom.dispatch('click', recBtn);
  assert(dom.getElementById('detail-title').textContent.includes('RQ-04'));
  assert.equal(dom.getElementById('detail').open, true);

  const closeBtn = dom.getElementById('close-detail');
  dom.dispatch('click', closeBtn);
  assert.equal(dom.getElementById('detail').open, false);
});

/* 14. per-screen reset stays on its own screen (DR7-05) */
check('a no-match reset clears only its own screen filter and never navigates to the Grid', () => {
  const gridBtn = dom.querySelector('[data-view="grid"]');
  dom.dispatch('click', gridBtn);
  dom.getElementById('query').value = 'zzz-no-such-record';
  dom.dispatch('input', dom.getElementById('query'));
  assert(/No record in this Matter matches/.test(dom.getElementById('rows').innerHTML));
  const inline = dom.querySelector('#reset-filter-inline');
  assert(inline, 'the no-match state must offer an inline reset for this screen');
  dom.dispatch('click', inline);
  assert.equal(dom.getElementById('query').value, '');
  assert.equal(dom.getElementById('view-grid').hidden, false, 'reset must stay on the Grid');

  // history has its own reset, and it does not touch the grid or change view
  const histBtn = dom.querySelector('[data-view="history"]');
  dom.dispatch('click', histBtn);
  dom.getElementById('hist-query').value = 'zzz-no-such-event';
  dom.dispatch('input', dom.getElementById('hist-query'));
  assert(/No event in this Matter's history matches/.test(dom.getElementById('history-body').innerHTML));
  const histReset = dom.querySelector('#hist-reset-inline');
  assert(histReset, 'the history no-match state must offer its own reset');
  dom.dispatch('click', histReset);
  assert.equal(dom.getElementById('hist-query').value, '');
  assert.equal(dom.getElementById('view-history').hidden, false, 'history reset must stay on history');
  assert.equal(dom.getElementById('view-grid').hidden, true);
});

/* 15. native dismissal cleans up exactly like the close button */
check('native dialog dismissal runs the same cleanup as the close button', () => {
  sandbox.openRecord('RQ-04');
  sandbox.openRecord('AC-05');
  assert(dom.getElementById('modal-trail').innerHTML.includes('RQ-04'), 'the trail must record the previous record');
  dom.getElementById('detail').close();      // native dismissal path
  assert.equal(dom.getElementById('detail').open, false);
  assert.equal(dom.getElementById('modal-trail').innerHTML.includes('RQ-04'), false, 'the trail must be cleared on native dismissal');
});

/* 16. row keyboard handler yields to nested inputs and IME composition */
check('row key handling ignores nested controls and IME composition', () => {
  const gridBtn = dom.querySelector('[data-view="grid"]');
  dom.dispatch('click', gridBtn);
  const row = dom.querySelector('[data-row="RQ-04"]');
  assert(row, 'a grid row must exist');
  sandbox.handleCloseDetail();
  const nested = dom.makeTarget({tag: 'input'}, row);
  const ev1 = dom.dispatch('keydown', nested, {key: 'Enter'});
  assert.equal(dom.getElementById('detail').open, false, 'Enter inside a nested input must not open the drawer');
  assert.equal(ev1.defaultPrevented, false);
  const ev2 = dom.dispatch('keydown', row, {key: 'Enter', isComposing: true});
  assert.equal(dom.getElementById('detail').open, false, 'a composing keystroke must be ignored');
  assert.equal(ev2.defaultPrevented, false);
  const ev3 = dom.dispatch('keydown', row, {key: 'Enter'});
  assert.equal(ev3.defaultPrevented, true);
  assert.equal(dom.getElementById('detail').open, true, 'Enter on the row itself opens the drawer');
  sandbox.handleCloseDetail();
});

/* 17. permission presentation follows the matrix, not the persona */
check('role changes alter permitted operations exactly as the approved matrix says', () => {
  const sel = dom.getElementById('role');
  const setRole = v => { sel.value = v; dom.dispatch('change', sel); };

  setRole('VIEWER');
  dom.dispatch('click', dom.querySelector('[data-view="documents"]'));
  let body = dom.getElementById('documents-body').innerHTML;
  assert(/not available to your role/.test(body), 'VIEWER must be denied the promotion control');
  assert(/version lineage|Version lineage/i.test(body), 'VIEWER must still read the lineage');

  setRole('EDITOR');
  dom.dispatch('click', dom.querySelector('[data-view="documents"]'));
  body = dom.getElementById('documents-body').innerHTML;
  assert(/Add a version/.test(body), 'EDITOR may add a version');
  assert(/Promote authoritative version/.test(body) && /not available to your role/.test(body),
    'EDITOR must be denied promotion, which is OWNER only');

  setRole('OWNER');
  dom.dispatch('click', dom.querySelector('[data-view="documents"]'));
  body = dom.getElementById('documents-body').innerHTML;
  assert(/Promote the authoritative version/.test(body), 'OWNER may promote');
  assert(/Expected current version/.test(body) && /Reason for promotion/.test(body) && /acknowledge the impact/.test(body),
    'promotion must require expected version, reason and impact acknowledgment');

  setRole('WS_OWNER_NO_MATTER');
  dom.dispatch('click', dom.querySelector('[data-view="grid"]'));
  const grid = dom.getElementById('rows').innerHTML;
  assert(/No record is available at this address/.test(grid), 'a Workspace OWNER without membership reads nothing here');
  assert(!/RQ-04/.test(grid), 'no record id may leak in a denied read');

  setRole('REVOKED');
  dom.dispatch('click', dom.querySelector('[data-view="grid"]'));
  const revoked = dom.getElementById('rows').innerHTML;
  assert(/access to this Matter ended/.test(revoked));
  assert(/purged/.test(revoked), 'a revocation must state that protected values and drafts are purged');
  assert(/stays <strong>unknown to you<\/strong>|unknown/.test(revoked), 'the outcome of an in-flight command stays unknown');

  setRole('OWNER');
});

/* 18. the error mapping follows the current contract and never invents 409 */
check('error mapping uses 428/412/422/503 from the contract and contains no invented 409', () => {
  dom.dispatch('click', dom.querySelector('[data-view="errors"]'));
  const body = dom.getElementById('errors-body').innerHTML;
  ['428', '412', '422', 'outcome-unknown', 'DEPENDENCY_PENDING'].forEach(t =>
    assert(body.includes(t), 'error mapping must cover ' + t));
  assert.equal(/\b409\b/.test(body), false, 'no 409 status may appear: the current contract does not define one');
  assert(/no receipt to look up/.test(body), 'the non-receipted membership case must be distinguished');
  assert(/replays instead of creating a second record/.test(body), 'the receipted case must be distinguished');
});

/* 19. bulk results are row-atomic and arithmetically consistent */
check('bulk preview reports succeeded, failed and unknown rows that sum to the selection', () => {
  dom.dispatch('click', dom.querySelector('[data-view="grid"]'));
  ['RQ-01', 'RQ-02', 'RQ-03', 'RQ-04'].forEach(id => {
    const cb = dom.querySelector('[data-select="' + id + '"]');
    assert(cb, 'checkbox for ' + id);
    cb.checked = true;
    dom.dispatch('change', cb);
  });
  dom.dispatch('click', dom.getElementById('open-bulk'));
  const modeSel = dom.querySelector('[data-bulk-mode="description"]');
  modeSel.value = 'set';
  dom.dispatch('change', modeSel);
  dom.dispatch('click', dom.getElementById('bulk-run'));
  const body = dom.getElementById('bulk-body').innerHTML;
  assert(/4 row\(s\) you selected/.test(body), 'the reported total must equal the selection');
  assert(/Succeeded/.test(body) && /Failed/.test(body) && /Unknown/.test(body));
  assert(/<strong>Kept.<\/strong>/.test(body), 'a failed row must keep its draft');
  assert(/Retry stays disabled until reconciliation/.test(body), 'an unknown row must block blind retry');
});

/* 20. filing surface keeps submission, receipt and outcome apart */
check('filing tracker separates submission, receipt and outcome and binds each cycle distinctly', () => {
  dom.dispatch('click', dom.querySelector('[data-view="filing"]'));
  const sel = dom.getElementById('filing-select');
  sel.value = 'FIL-02';
  dom.dispatch('change', sel);
  let body = dom.getElementById('filing-body').innerHTML;
  assert(/DOC-05 v2/.test(body), 'the exact submitted version must be shown');
  assert(/Receipt is not approval/.test(body));
  assert(/Not issued/.test(body), 'an absent outcome must be shown as absent');
  const path = dom.getElementById('filing-path');
  path.value = 'two_cycles';
  dom.dispatch('change', path);
  body = dom.getElementById('filing-body').innerHTML;
  assert(/AUTH-REQ-FIL02-01/.test(body) && /AUTH-REQ-FIL02-02/.test(body), 'both cycles must keep their own reference');
  assert(/DOC-05 v3/.test(body) && /DOC-05 v4/.test(body), 'each cycle must bind its own responding version');
  path.value = 'no_supplement';
  dom.dispatch('change', path);
  assert(/without any supplement cycle/.test(dom.getElementById('filing-body').innerHTML));
  path.value = 'rejection';
  dom.dispatch('change', path);
  const neg = dom.getElementById('filing-body').innerHTML;
  assert(/Rejection/.test(neg) && /Withdrawal/.test(neg) && /correction/i.test(neg) && /Reopen/.test(neg));
});

/* 21. the three Golden Workflows keep their full canonical sequences */
check('all three Golden Workflow sequences are rendered in full', () => {
  const expected = {
    'GW-01': ['Approval', 'Document', 'Signature', 'Payment', 'Transfer', 'Closing', 'Filing', 'Post-Closing'],
    'GW-02': ['Request', 'Document', 'Review', 'Gap', 'Finding', 'Follow-Up', 'Resolution'],
    'GW-03': ['Requirement', 'Package Preparation', 'Signature', 'Submission', 'Receipt', 'Authority Review', 'Supplement', 'Response', 'Approval']
  };
  dom.dispatch('click', dom.querySelector('[data-view="gw"]'));
  const sel = dom.getElementById('gw-select');
  for (const [id, seq] of Object.entries(expected)) {
    sel.value = id;
    dom.dispatch('change', sel);
    const body = dom.getElementById('gw-body').innerHTML;
    const gw = sandbox.fx.goldenWorkflows.find(g => g.id === id);
    assert.deepEqual(gw.sequence, seq, id + ' sequence must match the approved source');
    assert.equal(gw.stages.length, seq.length, id + ' must have one stage block per sequence step');
    seq.forEach(step => assert(body.includes(step), `${id} must render the ${step} stage`));
  }
});

/* 22. history keeps the restricted security log on its own surface */
check('event history keeps restricted security entries out of the domain timeline', () => {
  dom.dispatch('click', dom.querySelector('[data-view="history"]'));
  const body = dom.getElementById('history-body').innerHTML;
  const timelineEnd = body.indexOf('Restricted security log');
  assert(timelineEnd > 0, 'the security log must be a separate labelled section');
  assert.equal(/SEC-0/.test(body.slice(0, timelineEnd)), false, 'no security entry may appear inside the domain timeline');
  assert(/EVT-05/.test(body.slice(0, timelineEnd)) || /EVT-01/.test(body.slice(0, timelineEnd)), 'domain events must be in the timeline');
});

/* 23. DR7-02 carry-forward — RQ-03 and RQ-05 keep the corrections R7 made */
check('RQ-03 keeps its historical VERIFIED baseline with the self-review caveat', () => {
  sandbox.handleCloseDetail();
  sandbox.openRecord('RQ-03');
  sandbox.showProof();
  const body = dom.getElementById('detail-body').innerHTML;
  assert(/Aggregate on this subject:<\/strong> VERIFIED/.test(body), 'the recorded historical aggregate must still read VERIFIED');
  assert(/recorded and reviewed by the same identity/.test(body), 'the self-review caveat must be stated');
  assert(/Self-review:/.test(body), 'submitter and reviewer identity must be compared explicitly');
  assert.equal(sandbox.recordById['RQ-03'].ver, 'VERIFIED');
  assert.equal(sandbox.recordById['RQ-03'].validProof, false);
});

check('RQ-05 keeps the Atlas-reported DEP-05 status beside the current-policy evaluation', () => {
  sandbox.handleCloseDetail();
  sandbox.openRecord('RQ-05');
  sandbox.showProof();
  const body = dom.getElementById('detail-body').innerHTML;
  assert(/DEP-05/.test(body), 'the DEP-05 edge must appear');
  assert(/Reported at Atlas T0/.test(body) && /Satisfied/.test(body),
    'the status Atlas reported at T0 must be preserved and shown');
  assert(/Current-policy evaluation/.test(body) && /unsatisfied/.test(body),
    'the current-policy evaluation must be shown separately');
  assert(/These two differ, and both are kept/.test(body),
    'the divergence must be stated rather than silently resolved one way');
  assert.equal(sandbox.derive.reportedT0('DEP-05'), 'Satisfied');
  assert.equal(sandbox.derive.gateSatisfied({id: 'DEP-05', from: 'RQ-05', to: 'AC-05', gate: 'proof'}).satisfied, false);
  assert.equal(sandbox.derive.reportedT0('DEP-01'), 'Unsatisfied');
});

/* 24. the primary blocker is not chosen by an alphabetical tiebreak */
check('Control Room names the baseline blocker and declares the current-policy co-root', () => {
  sandbox.handleCloseDetail();
  dom.dispatch('click', dom.querySelector('[data-view="control"]'));
  const summary = dom.getElementById('chain-summary').innerHTML;
  assert(/RQ-04/.test(summary), 'the baseline blocker must be named');
  assert(/Co-root under the current policy/.test(summary), 'the equal-reach co-root must be declared');
  assert(/RQ-05/.test(summary), 'RQ-05 must be named as that co-root');
  assert(/Clearing RQ-04 alone would not clear the chain/.test(summary),
    'the reader must be told that clearing the named blocker alone is not enough');
});

/* 25. DR7-04 — an access without Matter membership must not see the Matter at all */
check('SCR-01 never lists, names or counts a Matter this access cannot read', () => {
  const sel = dom.getElementById('role');
  const setRole = v => { sel.value = v; dom.dispatch('change', sel); };
  const sessionMode = v => { const m = dom.getElementById('session-state'); m.value = v; dom.dispatch('change', m); };

  for (const r of ['WS_OWNER_NO_MATTER', 'REVOKED']) {
    setRole(r);
    dom.dispatch('click', dom.querySelector('[data-view="session"]'));
    sessionMode('active');
    const body = dom.getElementById('session-body').innerHTML;
    assert.equal(/ATLAS-001/.test(body), false, r + ' must not see the ATLAS-001 identifier');
    assert.equal(/Project Atlas/.test(body), false, r + ' must not see the Matter title');
    assert.equal(/Your role on this Matter/.test(body) && /OWNER<\/strong>/.test(body), false,
      r + ' must not be told it holds a role on that Matter');
  }

  setRole('WS_OWNER_NO_MATTER');
  dom.dispatch('click', dom.querySelector('[data-view="session"]'));
  const ws = dom.getElementById('session-body').innerHTML;
  assert(/workspace role does not open this Matter|No Matter is accessible/.test(ws),
    'a workspace OWNER without membership must be told plainly, without naming the Matter');
  assert(/Create a Matter/.test(ws) && /you may create a Matter/.test(ws),
    'a workspace OWNER keeps the workspace-scoped create operation');

  setRole('VIEWER');
  dom.dispatch('click', dom.querySelector('[data-view="session"]'));
  const viewer = dom.getElementById('session-body').innerHTML;
  assert(/not available to your role/.test(viewer), 'a Matter VIEWER who is a workspace MEMBER cannot create a Matter');
  assert(/ATLAS-001/.test(viewer), 'a Matter VIEWER does see the Matter they are a member of');
  setRole('OWNER');
});

/* 26. workspace-scoped operations are not read off a Matter role */
check('Create Matter and Workspace membership are decided by the workspace role', () => {
  const sel = dom.getElementById('role');
  const setRole = v => { sel.value = v; dom.dispatch('change', sel); };
  setRole('OWNER');
  assert.equal(sandbox.can('Create Matter / grant initial owner'), true, 'workspace OWNER may create');
  setRole('EDITOR');
  assert.equal(sandbox.can('Create Matter / grant initial owner'), false, 'a Matter EDITOR is a workspace MEMBER here');
  assert.equal(sandbox.can('Workspace membership'), false);
  setRole('WS_OWNER_NO_MATTER');
  assert.equal(sandbox.can('Create Matter / grant initial owner'), true,
    'a workspace OWNER keeps the workspace operation even with no Matter membership');
  assert.equal(sandbox.can('Matter membership / verifier designation'), false,
    'and gains nothing inside the Matter');
  setRole('OWNER');
});

/* 27. design-supplied values are marked where they are shown */
check('every screen that shows design-supplied values states that provenance', () => {
  const sel = dom.getElementById('role');
  sel.value = 'OWNER';
  dom.dispatch('change', sel);
  const pairs = [['session', 'session-body'], ['documents', 'documents-body'],
                 ['filing', 'filing-body'], ['history', 'history-body']];
  for (const [view, bodyId] of pairs) {
    dom.dispatch('click', dom.querySelector('[data-view="' + view + '"]'));
    const body = dom.getElementById(bodyId).innerHTML;
    assert(/Provenance\./.test(body), view + ' must carry a provenance note');
  }
  dom.dispatch('click', dom.querySelector('[data-view="documents"]'));
  const docs = dom.getElementById('documents-body').innerHTML;
  assert(/not supplied in the fixture/.test(docs),
    'a version whose date the fixture does not record must say so rather than show an invented one');
  assert.equal(/Atlas Buyer Demo/.test(docs), false, 'no executing party may be named that the fixture does not name');

  dom.dispatch('click', dom.querySelector('[data-view="filing"]'));
  const filing = dom.getElementById('filing-body').innerHTML;
  assert.equal(/SUB-FIL02-001/.test(filing), false, 'no invented submission reference');
  assert(/submission reference <small>not supplied/.test(filing), 'the absent reference must be reported as absent');
});

/* 28. the bulk result specimen is labelled as declared, not as a run */
check('the bulk result specimen never claims that anything was applied', () => {
  dom.dispatch('click', dom.querySelector('[data-view="bulk"]'));
  const body = dom.getElementById('bulk-body').innerHTML;
  if (/Result specimen/.test(body)) {
    assert(/Nothing was sent and nothing changed/.test(body));
    assert(/would succeed/.test(body), 'outcomes must be phrased as declared, not as performed');
  }
});

console.log('\nMOCK_EXECUTED: ' + results.length + ' checks passed.');
console.log('Limits: mock DOM execution only. No rendering, geometry, painting, real focus, touch or assistive-technology behaviour is established here.');
