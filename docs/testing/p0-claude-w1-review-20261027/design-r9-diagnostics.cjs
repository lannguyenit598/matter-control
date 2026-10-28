// Reviewer diagnostics only. Original owner checks and mock remain unchanged.
const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const {createRequire} = require('node:module');
const pkg = path.resolve('docs/design/p0-handoff-r9');
const checkPath = path.join(pkg, 'checks/check_r8_n01_n04_regressions.js');
const source = fs.readFileSync(checkPath, 'utf8');
const original = "function check(name, fn) { fn(); results.push(name); console.log('PASS  ' + name); }";
assert(source.includes(original));
const continued = source.replace(original, `function check(name, fn) {
  try { fn(); results.push(name); console.log('PASS ' + name); }
  catch (e) { console.log('CHECK_FAILURE ' + name + ': ' + e.message); }
}`);
new Function('require', '__dirname', '__filename', continued.replace(/^#!.*\n/, ''))(
  createRequire(checkPath), path.dirname(checkPath), checkPath);

const bootPath = path.join(pkg, 'checks/check_mock_dom_bootstrap.js');
const bootstrap = fs.readFileSync(bootPath, 'utf8');
const prefix = bootstrap.slice(0, bootstrap.indexOf('const results = [];')).replace(/^#!.*\n/, '');
const {boot, html} = new Function('require', '__dirname', prefix + '\nreturn {boot, html};')(
  createRequire(bootPath), path.dirname(bootPath));
const {dom, sandbox} = boot(html, {strict: true});
sandbox.showView('documents');
const marker = 'Reviewer synthetic promotion reason';
dom.getElementById('promote-reason').value = marker;
dom.dispatch('input', dom.getElementById('promote-reason'));
sandbox.showView('control');
sandbox.showView('documents');
const markup = dom.getElementById('documents-body').innerHTML;
assert(markup.includes('>' + marker + '</textarea>'));
console.log(JSON.stringify({
  promotion_reason_after_navigation: {
    present_in_generated_textarea_markup: true,
    mock_value: dom.getElementById('promote-reason').value,
    conclusion: 'Mock does not hydrate textarea.value from child text; original test failure does not prove user draft loss.'
  },
  limits: 'Diagnostic continuation is not a PASS for the failing owner suite; no browser/rendering.'
}, null, 2));
