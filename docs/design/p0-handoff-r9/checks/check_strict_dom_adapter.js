#!/usr/bin/env node
'use strict';
/* SOURCE_CHECKED self-checks for the three strict_dom.js adapter gaps the
 * R9 recheck found: a <textarea> did not hydrate .value from its own child
 * text, an <option> with no value= attribute did not fall back to its own
 * text, and <input>.type did not mirror the type= attribute (so checkbox
 * detection by .type silently failed). These are minimal DOM-semantics
 * fixes, not a new parser or framework; this file proves each one in
 * isolation, independent of prototype.html or logic.js.
 */
const assert = require('node:assert');
const {StrictDom} = require('./strict_dom.js');

const results = [];
function check(name, fn) { fn(); results.push(name); console.log('PASS  ' + name); }

check('a <textarea> with no value attribute hydrates .value from its own child text', () => {
  const dom = new StrictDom('<textarea id="t1">hello world</textarea>', {strict: true});
  assert.strictEqual(dom.getElementById('t1').value, 'hello world');
});

check('a <textarea> with an explicit value attribute is NOT overwritten by its child text', () => {
  const dom = new StrictDom('<textarea id="t2" value="kept">ignored</textarea>', {strict: true});
  assert.strictEqual(dom.getElementById('t2').value, 'kept');
});

check('an <option> with no value attribute falls back to its own (trimmed) text', () => {
  const dom = new StrictDom('<select id="s1"><option> V2 (current) </option></select>', {strict: true});
  assert.strictEqual(dom.getElementById('s1').options[0].value, 'V2 (current)');
});

check('an <option> with an explicit value attribute keeps it, independent of its text', () => {
  const dom = new StrictDom('<select id="s2"><option value="V2">V2 (current)</option></select>', {strict: true});
  assert.strictEqual(dom.getElementById('s2').options[0].value, 'V2');
});

check('a <select> takes its value from the LAST selected option, not from an unrelated empty-value placeholder', () => {
  const dom = new StrictDom(
    '<select id="s3"><option value="">— pick —</option><option value="a">A</option><option value="b" selected>B</option></select>',
    {strict: true});
  assert.strictEqual(dom.getElementById('s3').value, 'b');
});

check('a <select> with no selected option defaults to its first option', () => {
  const dom = new StrictDom('<select id="s4"><option value="x">X</option><option value="y">Y</option></select>', {strict: true});
  assert.strictEqual(dom.getElementById('s4').value, 'x');
});

check('input.type mirrors the type attribute, defaulting to "text" for a plain <input>', () => {
  const dom = new StrictDom('<input id="i1"><input id="i2" type="checkbox">', {strict: true});
  assert.strictEqual(dom.getElementById('i1').type, 'text');
  assert.strictEqual(dom.getElementById('i2').type, 'checkbox');
});

check('checked reflects the checked attribute at parse time and stays a plain settable property', () => {
  const dom = new StrictDom('<input id="c1" type="checkbox" checked><input id="c2" type="checkbox">', {strict: true});
  assert.strictEqual(dom.getElementById('c1').checked, true);
  assert.strictEqual(dom.getElementById('c2').checked, false);
  dom.getElementById('c2').checked = true;
  assert.strictEqual(dom.getElementById('c2').checked, true);
});

check('strict missing-ID lookups still throw — the adapter fix did not weaken this negative guarantee', () => {
  const dom = new StrictDom('<div id="only-this"></div>', {strict: true});
  assert.throws(() => dom.getElementById('does-not-exist'));
});

console.log('');
console.log('SOURCE_CHECKED: ' + results.length + ' strict_dom.js adapter self-checks passed.');
console.log('Limits: isolated adapter unit checks only; not evidence about prototype.html or logic.js behaviour by themselves.');
