'use strict';
/* A deliberately strict mock DOM for source/unit checks on prototype.html.
 *
 * Why strict: the R7 mock created an element for any requested id, so a
 * renamed or deleted static id still "passed". Here, getElementById throws
 * unless the id is either (a) declared in the prototype markup or (b) created
 * by an innerHTML assignment the prototype itself performed. Nothing is
 * auto-vivified.
 *
 * Event listeners registered on document are retained and can be dispatched,
 * so delegation routing is really exercised rather than asserted.
 *
 * What this mock does NOT prove: layout, geometry, painting, real focus
 * movement, screen-reader output or anything a browser does. Assertions that
 * use it are MOCK_EXECUTED, never BROWSER_EXECUTED.
 */
const TAG_RE = /<([a-zA-Z][a-zA-Z0-9-]*)((?:\s+[^<>]*?)?)\/?>/g;
const ATTR_RE = /([a-zA-Z_:][-a-zA-Z0-9_:.]*)\s*=\s*"([^"]*)"/g;

function camel(name) { return name.replace(/-([a-z])/g, (_, c) => c.toUpperCase()); }

class Element {
  constructor(dom, tagName, attrs, parent) {
    this.dom = dom;
    this.tagName = (tagName || 'div').toUpperCase();
    this.attrs = Object.assign({}, attrs || {});
    this.parentElement = parent || null;
    this.children = [];
    this._innerHTML = '';
    this.textContent = '';
    this.value = this.attrs.value !== undefined ? this.attrs.value : '';
    this.open = false;
    this.hidden = false;
    this.disabled = this.attrs.disabled !== undefined;
    this.style = {};
    this.isConnected = true;
    this.focusCount = 0;
    this._listeners = {};
    this.id = this.attrs.id || '';
    const self = this;
    this.dataset = new Proxy({}, {
      get(_, key) {
        if (typeof key !== 'string') return undefined;
        const attr = 'data-' + key.replace(/[A-Z]/g, m => '-' + m.toLowerCase());
        return self.attrs[attr];
      },
      has(_, key) {
        const attr = 'data-' + String(key).replace(/[A-Z]/g, m => '-' + m.toLowerCase());
        return attr in self.attrs;
      },
      ownKeys() {
        return Object.keys(self.attrs).filter(a => a.startsWith('data-')).map(a => camel(a.slice(5)));
      },
      getOwnPropertyDescriptor() { return {enumerable: true, configurable: true}; }
    });
    this.classList = {
      add: c => { self._classes().add(c); self._syncClass(); },
      remove: c => { self._classes().delete(c); self._syncClass(); },
      toggle: (c, on) => { const s = self._classes(); const want = on === undefined ? !s.has(c) : !!on; if (want) s.add(c); else s.delete(c); self._syncClass(); return want; },
      contains: c => self._classes().has(c)
    };
  }
  _classes() {
    if (!this._classSet) this._classSet = new Set((this.attrs.class || '').split(/\s+/).filter(Boolean));
    return this._classSet;
  }
  _syncClass() { this.attrs.class = [...this._classes()].join(' '); }
  get className() { return this.attrs.class || ''; }
  get innerHTML() { return this._innerHTML; }
  set innerHTML(html) {
    this.children.forEach(c => this.dom._detach(c));
    this.children = [];
    this._innerHTML = String(html);
    this.dom._parseInto(this, this._innerHTML);
  }
  get options() { return this.children.filter(c => c.tagName === 'OPTION'); }
  setAttribute(n, v) { this.attrs[n] = String(v); if (n === 'id') this.id = String(v); if (n === 'class') this._classSet = null; }
  getAttribute(n) { return this.attrs[n] !== undefined ? this.attrs[n] : null; }
  removeAttribute(n) { delete this.attrs[n]; }
  hasAttribute(n) { return this.attrs[n] !== undefined; }
  toggleAttribute(n, on) { if (on === undefined ? this.attrs[n] === undefined : on) this.attrs[n] = ''; else delete this.attrs[n]; }
  focus() { this.focusCount += 1; this.dom.activeElement = this; }
  showModal() { this.open = true; }
  close() { this.open = false; this._fire('close', {type: 'close', target: this}); }
  addEventListener(type, fn) { (this._listeners[type] = this._listeners[type] || []).push(fn); }
  removeEventListener(type, fn) { this._listeners[type] = (this._listeners[type] || []).filter(f => f !== fn); }
  _fire(type, ev) { (this._listeners[type] || []).forEach(fn => fn(ev)); }
  closest(selector) {
    let node = this;
    while (node) { if (this.dom._matches(node, selector)) return node; node = node.parentElement; }
    return null;
  }
  querySelectorAll(selector) { return this.dom._all().filter(el => el !== this && this.dom._matches(el, selector) && this.dom._contains(this, el)); }
  querySelector(selector) { return this.querySelectorAll(selector)[0] || null; }
  get nextElementSibling() {
    if (!this.parentElement) return null;
    const sibs = this.parentElement.children;
    return sibs[sibs.indexOf(this) + 1] || null;
  }
  get previousElementSibling() {
    if (!this.parentElement) return null;
    const sibs = this.parentElement.children;
    return sibs[sibs.indexOf(this) - 1] || null;
  }
}

class StrictDom {
  constructor(markup, options) {
    options = options || {};
    this.strict = options.strict !== false;
    this.registry = new Map();      // id -> element
    this.staticIds = new Set();
    this.missing = [];
    this.nodes = [];
    this.root = new Element(this, 'body', {}, null);
    this.nodes.push(this.root);
    this.activeElement = this.root;
    this._docListeners = {};
    this._parseInto(this.root, markup);
    this.staticIds = new Set(this.registry.keys());
  }
  _detach(el) {
    if (el.id && this.registry.get(el.id) === el) this.registry.delete(el.id);
    el.isConnected = false;
    el.children.forEach(c => this._detach(c));
    const i = this.nodes.indexOf(el);
    if (i >= 0) this.nodes.splice(i, 1);
  }
  _contains(parent, el) {
    let n = el;
    while (n) { if (n === parent) return true; n = n.parentElement; }
    return false;
  }
  _all() { return this.nodes; }
  _parseInto(parent, html) {
    // A small, deliberately literal tag scanner. It tracks nesting with a
    // stack so a <select> really owns its <option> children; it does not try
    // to be a conformant HTML parser and does not need to be.
    const VOID = new Set(['input', 'br', 'img', 'meta', 'link', 'hr', 'source', 'col', 'area', 'base', 'wbr']);
    const TOKEN = /<\/?([a-zA-Z][a-zA-Z0-9-]*)((?:[^<>"']|"[^"]*"|'[^']*')*)>/g;
    const stack = [parent];
    let m;
    TOKEN.lastIndex = 0;
    while ((m = TOKEN.exec(html)) !== null) {
      const closing = m[0][1] === '/';
      const tag = m[1].toLowerCase();
      const raw = m[2] || '';
      if (tag === 'script' || tag === 'style') continue;
      if (closing) {
        for (let i = stack.length - 1; i > 0; i--) {
          if (stack[i].tagName === tag.toUpperCase()) { stack.length = i; break; }
        }
        continue;
      }
      const attrs = {};
      ATTR_RE.lastIndex = 0;
      let a;
      while ((a = ATTR_RE.exec(raw)) !== null) attrs[a[1]] = a[2];
      if (/\bdisabled\b(?!=)/.test(raw)) attrs.disabled = '';
      if (/\bselected\b(?!=)/.test(raw)) attrs.selected = '';
      if (/\bchecked\b(?!=)/.test(raw)) attrs.checked = '';
      if (/\bhidden\b(?!=)/.test(raw)) attrs.hidden = '';
      const top = stack[stack.length - 1];
      const el = new Element(this, tag, attrs, top);
      if (attrs.checked !== undefined) el.checked = true;
      if (attrs.hidden !== undefined) el.hidden = true;
      top.children.push(el);
      this.nodes.push(el);
      if (attrs.id) this.registry.set(attrs.id, el);
      if (!VOID.has(tag) && !raw.trimEnd().endsWith('/')) stack.push(el);
    }
    // Give every select a value drawn from its own options.
    this.nodes.filter(el => el.tagName === 'SELECT' && this._contains(parent, el)).forEach(sel => {
      const opts = sel.options;
      if (opts.length && !opts.some(o => (o.attrs.value !== undefined ? o.attrs.value : '') === sel.value)) {
        const chosen = opts.find(o => o.attrs.selected !== undefined) || opts[0];
        sel.value = chosen.attrs.value !== undefined ? chosen.attrs.value : '';
      }
    });
  }
  _matches(el, selector) {
    selector = selector.trim();
    return selector.split(',').map(s => s.trim()).some(sel => {
      const attr = sel.match(/^\[([-a-zA-Z0-9_:.]+)(?:=["']([^"']*)["'])?\]$/);
      if (attr) {
        const v = el.attrs[attr[1]];
        return attr[2] === undefined ? v !== undefined : v === attr[2];
      }
      const tagAttr = sel.match(/^([a-zA-Z]+)\[([-a-zA-Z0-9_:.]+)(?:=["']([^"']*)["'])?\]$/);
      if (tagAttr) {
        if (el.tagName !== tagAttr[1].toUpperCase()) return false;
        const v = el.attrs[tagAttr[2]];
        return tagAttr[3] === undefined ? v !== undefined : v === tagAttr[3];
      }
      if (sel.startsWith('#')) return el.id === sel.slice(1);
      if (sel.startsWith('.')) return el.classList.contains(sel.slice(1));
      const nested = sel.split(/\s+/);
      if (nested.length === 2) {
        if (!this._matches(el, nested[1])) return false;
        let p = el.parentElement;
        while (p) { if (this._matches(p, nested[0])) return true; p = p.parentElement; }
        return false;
      }
      return el.tagName === sel.toUpperCase();
    });
  }
  getElementById(id) {
    const el = this.registry.get(id);
    if (el) return el;
    this.missing.push(id);
    if (this.strict) throw new Error('getElementById("' + id + '") resolved to nothing. The id is neither declared in the markup nor created by the prototype.');
    const ghost = new Element(this, 'div', {id: id}, this.root);
    this.registry.set(id, ghost);
    this.nodes.push(ghost);
    return ghost;
  }
  addEventListener(type, fn) { (this._docListeners[type] = this._docListeners[type] || []).push(fn); }
  dispatch(type, target, extra) {
    const ev = Object.assign({type: type, target: target, preventDefault() { ev.defaultPrevented = true; }, defaultPrevented: false}, extra || {});
    (this._docListeners[type] || []).forEach(fn => fn(ev));
    return ev;
  }
  querySelectorAll(sel) { return this.nodes.filter(el => this._matches(el, sel)); }
  querySelector(sel) { return this.querySelectorAll(sel)[0] || null; }
  makeTarget(attrs, parent) {
    const el = new Element(this, attrs.tag || 'button', attrs, parent || this.root);
    this.nodes.push(el);
    if (attrs.id) this.registry.set(attrs.id, el);
    return el;
  }
}

module.exports = {StrictDom, Element};
