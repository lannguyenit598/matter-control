"use strict";
/* Participant surface for the AC-137 comprehension study.
   It carries the two study datasets and the Control Room rendering, and
   nothing else: no expected-response text, no scoring vocabulary and no
   study-administration material. Those live outside this bundle. */
const $ = id => document.getElementById(id);
const DATASETS = JSON.parse($('study-data').textContent);
const esc = v => String(v ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
let ds = DATASETS[0];

const idx = () => Object.fromEntries(ds.records.map(r => [r.id, r]));
const incoming = id => ds.edges.filter(e => e.to === id);
const outgoing = id => ds.edges.filter(e => e.from === id);
const depCache = new Map();
function gateSatisfied(e) {
  const p = idx()[e.from];
  if (!p) return {ok: false, why: 'prerequisite is missing'};
  if (dependency(p.id).state !== 'READY') return {ok: false, why: `${p.id} is itself BLOCKED`};
  if (p.exec !== 'COMPLETED') return {ok: false, why: `${p.id} execution is ${p.exec}`};
  if (e.gate === 'completion') return {ok: true, why: `${p.id} is COMPLETED`};
  if (p.ver !== 'VERIFIED' || p.validProof !== true) return {ok: false, why: `${p.id} has no valid accepted proof (verification ${p.ver})`};
  return {ok: true, why: `${p.id} is COMPLETED with valid proof`};
}
function dependency(id) {
  if (depCache.has(id)) return depCache.get(id);
  depCache.set(id, {state: 'READY', failing: []});
  const inc = incoming(id);
  let out;
  if (!inc.length) out = {state: 'READY', failing: [], because: 'No incoming gate is declared.'};
  else {
    const failing = inc.map(e => ({edge: e, ...gateSatisfied(e)})).filter(x => !x.ok);
    out = failing.length
      ? {state: 'BLOCKED', failing, because: `${failing.length} of ${inc.length} incoming gates are unsatisfied.`}
      : {state: 'READY', failing: [], because: `All ${inc.length} incoming gates are satisfied.`};
  }
  depCache.set(id, out);
  return out;
}
const eligible = r => r.type === 'action' && !!r.owner && ['NOT_STARTED', 'IN_PROGRESS'].includes(r.exec) && dependency(r.id).state === 'READY';
function rootCauses(id, seen) {
  seen = seen || new Set();
  if (seen.has(id)) return [];
  seen.add(id);
  const d = dependency(id);
  if (d.state === 'READY') return [];
  const out = [];
  for (const f of d.failing) {
    const up = rootCauses(f.edge.from, seen);
    if (up.length) out.push(...up); else out.push(f.edge.from);
  }
  return out;
}
function downstream(id) {
  const seen = new Set([id]), q = outgoing(id).slice(), out = [];
  while (q.length) { const e = q.shift(); if (seen.has(e.to)) continue; seen.add(e.to); out.push(e.to); q.push(...outgoing(e.to)); }
  return out;
}
function milestoneState(m) {
  const map = idx();
  const unmet = (m.required || []).filter(id => {
    const r = map[id];
    if (!r) return true;
    if (dependency(id).state !== 'READY' || r.exec !== 'COMPLETED') return true;
    if (r.ver === 'NOT_REQUIRED') return r.explicitNotRequired !== true;
    return !(r.ver === 'VERIFIED' && r.validProof === true);
  });
  return unmet.length
    ? {state: 'BLOCKED', because: `Unmet declared prerequisites: ${unmet.join(', ')}.`}
    : {state: 'READY', because: `All ${(m.required || []).length} declared prerequisites are met.`};
}
const pill = (c, t) => `<span class="state-pill ${c}">${esc(t)}</span>`;

function render() {
  depCache.clear();
  const map = idx();
  const blocked = ds.records.filter(r => dependency(r.id).state === 'BLOCKED');
  const reach = new Map();
  blocked.forEach(r => rootCauses(r.id).forEach(rc => {
    if (!reach.has(rc)) reach.set(rc, new Set());
    reach.get(rc).add(r.id);
  }));
  const ranked = [...reach.entries()].sort((a, b) => b[1].size - a[1].size || a[0].localeCompare(b[0]));
  const rootId = ranked.length ? ranked[0][0] : null;
  const root = rootId ? map[rootId] : null;
  const er = rootId ? ds.evidenceRequirements.find(e => e.subject === rootId) : null;
  const elig = ds.records.filter(eligible);

  const steps = [];
  if (rootId) {
    let cursor = rootId; const guard = new Set([cursor]); steps.push(cursor);
    while (true) {
      const next = outgoing(cursor).map(e => e.to).filter(id => !guard.has(id) && dependency(id).state === 'BLOCKED');
      if (!next.length) break;
      next.sort((a, b) => downstream(b).length - downstream(a).length || a.localeCompare(b));
      cursor = next[0]; guard.add(cursor); steps.push(cursor);
    }
  }

  $('scenario-name').textContent = `${ds.id} · ${ds.name}`;
  $('scenario-asof').textContent = `As of ${ds.asOf}`;
  $('chain').innerHTML = steps.slice(0, 5).map((id, i) => {
    const r = map[id], d = dependency(id), out = outgoing(id);
    const cause = i === 0
      ? (er && !er.evidence ? `${er.id} has no supplied evidence: ${er.criterion}. ${er.absence || ''}`
         : er && er.absence ? `${er.id} is only partially satisfied: ${er.absence}`
         : `execution is ${r.exec} and verification is ${r.ver}`)
      : d.failing.map(f => `${f.edge.id} from ${f.edge.from}: ${f.why}`).join(' ');
    return `<div class="chain-step ${i === 0 ? 'root-blocker' : i === 1 ? 'direct-gate' : 'downstream'}">
      <div><span class="step-tag ${i === 0 ? 'root' : i === 1 ? 'gate' : 'pipe'}">Step ${i + 1}</span>
        <strong><code>${esc(r.id)}</code> · ${esc(r.label)}</strong>
        <p class="meta">${esc(r.exec)} / ${esc(d.state)} · accountable owner ${esc(r.owner || 'unassigned')}</p>
        <p class="cause"><strong>Cause:</strong> ${esc(cause)}</p>
        <p><strong>Downstream impact:</strong> ${esc(out.length ? out.map(e => `${e.id} → ${e.to} (${e.gate} gate)`).join('; ') : 'No outgoing edge is declared.')}</p>
      </div></div>`;
  }).join('');

  $('chain-summary').innerHTML = root
    ? `<p><strong>Primary blocker:</strong> <code>${esc(root.id)}</code> — ${esc(root.label)}.
       <strong>Accountable owner:</strong> ${esc(root.owner)}.
       <strong>Records reached through declared edges:</strong> ${esc([...reach.get(rootId)].sort().join(', '))}.</p>`
    : '<p>No blocked record is present in this snapshot.</p>';

  $('next').innerHTML = `<p><strong>${elig.length} eligible Action${elig.length === 1 ? '' : 's'}.</strong></p>` +
    (elig.length
      ? elig.map(r => `<div class="row"><strong><code>${esc(r.id)}</code> · ${esc(r.label)}</strong><p class="meta">Owner ${esc(r.owner)} · due ${esc(r.dueISO)}</p></div>`).join('')
      : '<p class="meta">No Action is currently executable; every assigned Action is waiting on an external party or blocked by an unsatisfied gate.</p>');

  $('milestones').innerHTML = ds.milestones.map(m => {
    const v = milestoneState(m);
    return `<div class="row"><code>${esc(m.id)}</code> ${esc(m.name)} · due <time>${esc(m.due)}</time>
      <p>${pill(v.state === 'READY' ? 'ready' : 'blocked', v.state)} ${esc(v.because)}</p></div>`;
  }).join('');

  $('waiting').innerHTML = ds.records.filter(r => r.exec === 'WAITING').map(r => {
    const d = dependency(r.id);
    return `<div class="row"><strong><code>${esc(r.id)}</code> · ${esc(r.label)}</strong>
      <p class="meta">Internal accountable owner ${esc(r.owner)} · execution ${esc(r.exec)} / dependency ${esc(d.state)}</p></div>`;
  }).join('') || '<p class="meta">No record is waiting on an external party.</p>';

  $('gaps').innerHTML = ds.evidenceRequirements.filter(e => e.absence).map(e =>
    `<div class="row"><code>${esc(e.id)}</code> on <code>${esc(e.subject)}</code><p>${esc(e.criterion)}</p><p class="cause">${esc(e.absence)}</p></div>`).join('');

  $('counts').textContent = `${ds.records.filter(r => r.type === 'req').length} requirements · ${ds.records.filter(r => r.type === 'action').length} actions · ${ds.edges.length} dependency edges · ${blocked.length} blocked records`;
}

$('scenario-select').addEventListener('change', e => {
  ds = DATASETS.find(d => d.id === e.target.value) || DATASETS[0];
  render();
});
render();
