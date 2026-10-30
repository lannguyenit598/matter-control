// Source/mock probes only; no browser, network, product execution or file writes.
const fs = require('node:fs');
const vm = require('node:vm');
const assert = require('node:assert');
const base = 'docs/design/p0-handoff-r7/';
const html = fs.readFileSync(base + 'prototype.html', 'utf8');
const ownerCheck = fs.readFileSync(base + 'checks/check_mock_dom_bootstrap.js', 'utf8');
function load(markup) {
  const context = {
    console: {log() {}},
    require(name) {
      if (name === 'fs') return {readFileSync() { return markup; }};
      assert.equal(name, 'assert');
      return assert;
    }
  };
  context.global = context;
  vm.createContext(context);
  vm.runInContext(ownerCheck, context, {timeout: 5000});
  return context;
}
const context = load(html);
const proof = vm.runInContext(`
  openRecord('RQ-11'); showProof();
  const rq11 = elements.get('detail-body').innerHTML;
  openRecord('RQ-07'); showProof();
  const rq07 = elements.get('detail-body').innerHTML;
  JSON.stringify({
    rq11_has_outgoing_proof_edge: true,
    rq11_panel_denies_downstream_proof_gates: rq11.includes('No downstream proof gates declared'),
    rq07_record_dependency: recordById['RQ-07'].dep,
    rq07_panel_says_blocked: rq07.includes('NOT_STARTED and BLOCKED by upstream dependencies')
  });
`, context, {timeout: 5000});
const data = JSON.parse(html.match(/<script id="atlas-data"[^>]*>([\s\S]*?)<\/script>/)[1]);
assert(data.edges.some(e => e[1] === 'RQ-11' && e[3] === 'proof'));
assert.equal(JSON.parse(proof).rq11_panel_denies_downstream_proof_gates, true);
assert.equal(JSON.parse(proof).rq07_record_dependency, 'READY');
assert.equal(JSON.parse(proof).rq07_panel_says_blocked, true);
assert(html.includes('id="query"'));
load(html.replace('id="query"', 'id="query-renamed"'));
console.log(JSON.stringify({
  proof: JSON.parse(proof),
  mutation_missing_query_id_owner_suite_still_passes: true,
  limits: 'All assertions use the owner mock; no real DOM, rendering, focus or accessibility proof.'
}, null, 2));
