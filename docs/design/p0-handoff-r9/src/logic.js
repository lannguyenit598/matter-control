"use strict";
/* MatterControl R8 concept logic.
   Synthetic, local and non-operational. Nothing here saves, verifies, submits,
   exports or enforces anything; the role selector changes presentation only.

   Layering, in order:
     1. data          — canonical Atlas snapshot + transcribed fixtures
     2. derive        — every causal claim is computed from typed edges/records
     3. authority     — one permission table transcribed from the approved matrix
     4. render        — screens read 1-3; no screen re-derives a causal fact
*/

/* ── 1. data ─────────────────────────────────────────────────────────── */
const $ = id => document.getElementById(id);
/* Some ids (draft-result, draft-error, promote-*) exist only while the
   drawer/panel that owns them is actually rendered. The strict check mock
   throws rather than returning null for an undeclared id (that is the
   point of it); a real browser just returns null. This helper is safe in
   both so purge/cleanup code can probe optional nodes without caring which
   screen is currently open. */
function safeEl(id) { try { return $(id); } catch (e) { return null; } }
const data = JSON.parse($('atlas-data').textContent);
const fx = JSON.parse($('fixtures-data').textContent);
const records = data.records;
const recordById = Object.fromEntries(records.map(r => [r.id, r]));
const erBySubject = Object.fromEntries(fx.evidenceRequirements.map(e => [e.subject, e]));
const evidenceById = Object.fromEntries(fx.evidence.map(e => [e.id, e]));
const docById = Object.fromEntries(fx.documents.map(d => [d.id, d]));
const filingById = Object.fromEntries(fx.filings.map(f => [f.id, f]));

const demoProofActionRecord = {
  id: 'AC-DEMO-PROOF', type: 'action',
  label: 'Nộp Giấy ủy quyền công chứng cho người đại diện theo pháp luật',
  labelEn: 'File the notarised power of attorney for the legal representative',
  ws: 'Legal & Regulatory', exec: 'IN_PROGRESS', ver: 'UNVERIFIED', dep: 'READY',
  dueISO: '2026-06-25T17:00:00+07:00', owner: 'U-03',
  sub: 'Labelled fixture outside the canonical Atlas 24 · an Action whose proof is explicitly required',
  risk: false, revision: 1, validProof: false, explicitNotRequired: false, labelled: true
};
const lookup = id => recordById[id] || (id === 'AC-DEMO-PROOF' ? demoProofActionRecord : null);

const UNAVAILABLE = 'Not supplied in this fixture.';
const esc = v => String(v ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

/* ── 2. derive ───────────────────────────────────────────────────────────
   The single source of causal truth. Every gate, blocker, consequence and
   eligibility statement on every screen comes from here. DR7-02 was a
   presentation layer writing its own causal prose; that path no longer exists. */
const derive = {
  incoming: id => data.edges.filter(e => e[2] === id).map(e => ({id: e[0], from: e[1], to: e[2], gate: e[3]})),
  outgoing: id => data.edges.filter(e => e[1] === id).map(e => ({id: e[0], from: e[1], to: e[2], gate: e[3]})),
  outgoingByGate: (id, gate) => derive.outgoing(id).filter(e => e.gate === gate),

  /* The status Atlas recorded for this edge at T0. A historical fact, kept
     separate from the current-policy evaluation below and never merged. */
  reportedT0: edgeId => (fx.edgeReportedT0 || {})[edgeId] || null,

  /* A gate is satisfied only by the prerequisite's own typed state, evaluated
     under the current independent-verification policy. */
  gateSatisfied(edge) {
    const p = lookup(edge.from);
    if (!p) return {satisfied: false, reason: 'Prerequisite record is not available in this fixture.'};
    if (p.dep !== 'READY') return {satisfied: false, reason: `${p.id} is itself BLOCKED.`};
    if (p.exec !== 'COMPLETED') return {satisfied: false, reason: `${p.id} execution is ${p.exec}, not COMPLETED.`};
    if (edge.gate === 'completion') return {satisfied: true, reason: `${p.id} execution is COMPLETED.`};
    if (p.ver !== 'VERIFIED') return {satisfied: false, reason: `${p.id} verification is ${p.ver}, not VERIFIED.`};
    if (p.validProof !== true) return {satisfied: false, reason: `${p.id} holds a historical VERIFIED baseline, but no proof that is valid under the current independent-verification policy.`};
    return {satisfied: true, reason: `${p.id} is COMPLETED with valid accepted proof.`};
  },

  /* Dependency recomputed from the graph, so the screen can never show a
     dependency the edges do not support. */
  dependencyOf(id) {
    const inc = derive.incoming(id);
    if (!inc.length) return {state: 'READY', because: 'No incoming gate is declared for this record.', failing: []};
    const failing = inc.map(e => ({edge: e, ...derive.gateSatisfied(e)})).filter(x => !x.satisfied);
    return failing.length
      ? {state: 'BLOCKED', because: `${failing.length} of ${inc.length} incoming gates are unsatisfied.`, failing}
      : {state: 'READY', because: `All ${inc.length} incoming gates are satisfied.`, failing: []};
  },

  /* Root causes: walk back through unsatisfied gates to the records that are
     not themselves blocked. */
  rootCauses(id, seen) {
    seen = seen || new Set();
    if (seen.has(id)) return [];
    seen.add(id);
    const d = derive.dependencyOf(id);
    if (d.state === 'READY') return [];
    const out = [];
    for (const f of d.failing) {
      const upstream = derive.rootCauses(f.edge.from, seen);
      if (upstream.length) out.push(...upstream);
      else out.push({record: f.edge.from, via: f.edge, reason: f.reason});
    }
    return out;
  },

  /* Downstream impact, breadth-first over declared edges. */
  downstream(id) {
    const out = [], queue = derive.outgoing(id).slice(), seen = new Set([id]);
    while (queue.length) {
      const e = queue.shift();
      if (seen.has(e.to)) continue;
      seen.add(e.to);
      out.push(e);
      queue.push(...derive.outgoing(e.to));
    }
    return out;
  },

  eligible: r => r.type === 'action' && !!r.owner && ['NOT_STARTED', 'IN_PROGRESS'].includes(r.exec) && derive.dependencyOf(r.id).state === 'READY',

  milestone(ids) {
    if (!ids || !ids.length) return {state: 'UNASSESSED', because: 'No required prerequisite set is declared for this milestone.'};
    const unmet = ids.filter(id => {
      const r = lookup(id);
      if (!r) return true;
      if (derive.dependencyOf(id).state !== 'READY' || r.exec !== 'COMPLETED') return true;
      if (r.ver === 'NOT_REQUIRED') return r.explicitNotRequired !== true;
      return !(r.ver === 'VERIFIED' && r.validProof === true);
    });
    return unmet.length
      ? {state: 'BLOCKED', because: `${unmet.length} declared prerequisite(s) unmet: ${unmet.join(', ')}.`}
      : {state: 'READY', because: `All ${ids.length} declared prerequisites are met.`};
  },

  timing(r) {
    if (r.id.startsWith('DENSITY') || !r.dueISO) return 'unavailable';
    if (['COMPLETED', 'CANCELLED'].includes(r.exec)) return 'ON_TRACK';
    const due = Date.parse(r.dueISO), now = Date.parse(data.asOf);
    return due < now ? 'OVERDUE' : due <= now + 48 * 3600000 ? 'DUE_SOON' : 'ON_TRACK';
  },
  attention: r => r.id.startsWith('DENSITY') ? 'unavailable'
    : ['RQ-04', 'AC-05'].includes(r.id) ? 'CRITICAL'
    : ['RQ-02', 'RQ-06', 'AC-04', 'AC-10'].includes(r.id) ? 'ATTENTION' : 'NORMAL',

  /* Proof context assembled strictly from the transcribed Atlas evidence
     tables plus the record's own typed edges. Anything the fixture does not
     supply is reported as unavailable; no negative fact is invented. */
  proof(r) {
    const er = erBySubject[r.id] || null;
    const ev = er && er.evidence ? evidenceById[er.evidence] : null;
    const outProof = derive.outgoingByGate(r.id, 'proof');
    const outAll = derive.outgoing(r.id);
    const dep = derive.dependencyOf(r.id);
    const selfReview = !!(ev && ev.reviewedBy && ev.recordedBy === ev.reviewedBy);
    let applicability;
    if (er) applicability = `Explicit evidence requirement ${er.id} applies to this subject.`;
    else if (r.type === 'action' && r.explicitNotRequired === true) applicability = 'Proof applicability is explicitly NOT_REQUIRED for this Action in the canonical Atlas dataset. No evidence requirement is declared against it.';
    else applicability = 'No evidence requirement is declared against this subject in the fixture. Applicability must be decided explicitly before any verification.';
    return {
      subject: r.id, subjectKind: r.type === 'req' ? 'Requirement' : 'Action',
      er, ev, applicability, selfReview,
      criterion: er ? er.criterion : UNAVAILABLE,
      version: ev ? ev.source : (er && er.absence ? er.absence : UNAVAILABLE),
      submitter: ev ? ev.recordedBy : (er ? 'No evidence has been supplied, so there is no submitter.' : UNAVAILABLE),
      verifier: ev && ev.reviewedBy ? ev.reviewedBy
        : (r.type === 'action' && r.explicitNotRequired === true ? 'Not applicable: no proof is required for this Action.'
          : 'No designated verifier is recorded. A verifier must be a Matter EDITOR or OWNER and must not be the submitter.'),
      aggregate: r.ver,
      currentPolicy: ev ? (selfReview
        ? 'Under the current independent-verification policy this evidence was recorded and reviewed by the same identity, so it does not support a gate as currently valid proof. The historical aggregate is preserved exactly as recorded; nothing is silently flipped.'
        : 'Recorder and reviewer are distinct identities.')
        : 'No current-policy evaluation applies because no evidence has been supplied.',
      dependency: dep,
      outgoingProofGates: outProof,
      outgoingAllGates: outAll,
      incoming: derive.incoming(r.id)
    };
  },

  /* The consequence sentence shown on proof panels and queues. */
  consequence(r) {
    const p = derive.proof(r);
    const parts = [];
    if (p.outgoingProofGates.length) {
      parts.push(`This subject gates ${p.outgoingProofGates.length} downstream record(s) through a proof gate: ` +
        p.outgoingProofGates.map(e => `${e.id} → ${e.to}`).join(', ') + '.');
    }
    const completion = p.outgoingAllGates.filter(e => e.gate === 'completion');
    if (completion.length) {
      parts.push(`It also gates ${completion.map(e => `${e.id} → ${e.to}`).join(', ')} through a completion gate.`);
    }
    if (!p.outgoingAllGates.length) {
      parts.push('No outgoing dependency edge is declared from this subject in the fixture, so no downstream record is gated by it here.');
    }
    const far = derive.downstream(r.id).filter(e => !p.outgoingAllGates.some(d => d.id === e.id));
    if (far.length) parts.push(`Further downstream, the same chain reaches ${[...new Set(far.map(e => e.to))].join(', ')}.`);
    if (p.dependency.state === 'BLOCKED') {
      parts.push('This subject is itself BLOCKED: ' + p.dependency.failing.map(f => `${f.edge.id} from ${f.edge.from} — ${f.reason}`).join(' '));
    } else {
      parts.push(`Its own dependency axis is READY: ${p.dependency.because}`);
    }
    return parts.join(' ');
  }
};

/* ── 3. authority ────────────────────────────────────────────────────────
   One table, transcribed from the approved permission matrix. Screens ask
   this and nothing else; personas are labels and never grant anything. */
const PERM = Object.fromEntries(fx.permissionMatrix.rows.map(r => [r.operation, r]));
const OP = {
  READ: 'Matter access / read state and related records',
  EDIT_REQ: 'Requirements create/edit',
  EDIT_ACT: 'Actions create/edit / assign',
  EXEC: 'Execution start/wait/complete',
  CANCEL: 'Cancellation/reopen / proof applicability',
  EDGE: 'Ordinary dependency edges between Requirements/Actions',
  MILESTONE: 'Matter settings / critical milestone designation / milestone required prerequisites',
  SUBMIT_EVIDENCE: 'Evidence submission / replace with new record',
  REVIEW_EVIDENCE: 'Evidence review / verify / reject / resolve dispute',
  DOC_READ: 'Document content and metadata read',
  DOC_ADD: 'Add document version',
  DOC_PROMOTE: 'Promote authoritative version',
  FILING_OBS: 'Filing update / submission observation',
  FILING_NEG: 'Filing rejection/withdrawal correction',
  BULK: 'Bulk editing',
  IMPORT: 'Import',
  EXPORT: 'Excel export / delta draft export',
  HISTORY: 'Event History read',
  MEMBERSHIP: 'Matter membership / verifier designation',
  WS_MEMBERSHIP: 'Workspace membership',
  CREATE_MATTER: 'Create Matter / grant initial owner'
};
let role = 'OWNER';
const matterRole = () => role === 'WS_OWNER_NO_MATTER' || role === 'REVOKED' ? null : role;
const hasMatterAccess = () => matterRole() !== null;
/* The workspace role is a separate scope. The approved matrix marks Create
   Matter and Workspace membership "Conditional" in the Matter-OWNER column and
   states the condition in words: Workspace OWNER. Reading those two rows off a
   Matter role would be exactly the persona-to-grant slip DR7-04 is about, so
   they are routed through this instead. */
const WORKSPACE_ROLE = {OWNER: 'OWNER', EDITOR: 'MEMBER', VIEWER: 'MEMBER', WS_OWNER_NO_MATTER: 'OWNER', REVOKED: 'MEMBER'};
const workspaceRole = () => WORKSPACE_ROLE[role] || 'MEMBER';
const WORKSPACE_OPS = new Set(['Create Matter / grant initial owner', 'Workspace membership']);
const canWorkspace = () => workspaceRole() === 'OWNER';
function can(op) {
  if (WORKSPACE_OPS.has(op)) return canWorkspace();
  const mr = matterRole();
  if (!mr) return false;
  const v = PERM[op] && PERM[op][mr];
  return v === 'Yes' || v === 'Conditional';
}
const isConditional = op => {
  if (WORKSPACE_OPS.has(op)) return false;
  const mr = matterRole();
  return !!mr && PERM[op] && PERM[op][mr] === 'Conditional';
};
function denyReason(op) {
  if (WORKSPACE_OPS.has(op)) {
    return `The approved permission matrix records “${op}” as a Workspace OWNER operation. ` +
      `Your workspace role is ${workspaceRole()}. ${PERM[op] ? PERM[op].condition : ''}`;
  }
  const mr = matterRole();
  if (!mr) return 'You hold no active membership on this Matter.';
  const r = PERM[op];
  if (!r) return 'Operation not present in the approved matrix.';
  return `The approved permission matrix records “${op}” as ${r[mr]} for Matter ${mr}. ${r.condition}`;
}
const ROLE_LABEL = {
  OWNER: 'Matter OWNER', EDITOR: 'Matter EDITOR', VIEWER: 'Matter VIEWER',
  WS_OWNER_NO_MATTER: 'Workspace OWNER with no membership on this Matter',
  REVOKED: 'Membership revoked during this session'
};

/* ── 4. shared presentation helpers ──────────────────────────────────── */
let lang = 'both';
function titleOf(r) {
  const vi = r.label || '', en = r.labelEn || (fx.titlesEn && fx.titlesEn[r.id]) || '';
  if (!en) return vi;
  if (lang === 'vi') return vi;
  if (lang === 'en') return en;
  return `${vi} — ${en}`;
}
const pill = (cls, text) => `<span class="state-pill ${cls}">${esc(text)}</span>`;
const depPill = r => pill(derive.dependencyOf(r.id).state === 'READY' ? 'ready' : 'blocked', derive.dependencyOf(r.id).state);
const execPill = r => pill(r.exec === 'COMPLETED' ? 'completed' : r.exec === 'WAITING' ? 'waiting' : 'neutral', r.exec);
const verPill = r => pill('neutral', r.ver);
const recordButton = r => `<button data-record="${esc(r.id)}"><code>${esc(r.id)}</code> · ${esc(titleOf(r))}</button>`;
/* Anything this design package supplies that the approved sources do not state
   is marked where it is shown, so a reader never has to guess which is which. */
const supplied = why => `<span class="specimen-tag" title="${esc(why || '')}">design-supplied</span>`;
const provenanceNote = text => `<p class="meta" data-od-id="provenance-note"><strong>Provenance.</strong> ${esc(text)}</p>`;
const nonOperational = why => `<span class="specimen-tag" title="${esc(why || 'Concept only')}">non-operational in this concept</span>`;

function axesList(r) {
  const dep = derive.dependencyOf(r.id);
  const rows = [
    ['Execution', r.exec, 'Progress asserted by an accountable human.'],
    ['Verification', r.ver, 'Validity of supporting evidence, aggregated by the evaluator.'],
    ['Dependency', r.id.startsWith('DENSITY') ? 'unavailable' : dep.state, r.id.startsWith('DENSITY') ? 'No relationship is supplied for density rows.' : dep.because],
    ['Timing', derive.timing(r), 'RULE-009 over the declared due date and as-of time.'],
    ['Attention', derive.attention(r), 'RULE-010 inputs; this fixture assigns the labels explicitly.']
  ];
  return '<dl class="axes">' + rows.map(([k, v, why]) =>
    `<div><dt>${esc(k)}</dt><dd>${esc(v)}<br><small>${esc(why)}</small></dd></div>`).join('') + '</dl>';
}

/* The authority strip appears on every screen: who sits here, who may read,
   what this role may actually do. Persona, read scope and operation authority
   are three separate rows and are never collapsed. */
function authorityStrip(screenId, ops) {
  const s = fx.screens.find(x => x.id === screenId);
  if (!s) return '';
  const opLines = ops.map(op => {
    const allowed = can(op);
    const scope = WORKSPACE_OPS.has(op) ? `workspace ${workspaceRole()}` : ROLE_LABEL[role];
    const verdict = allowed ? (isConditional(op) ? 'conditional for ' + scope : 'permitted for ' + scope) : 'not permitted for ' + scope;
    return `<li>${allowed ? '' : '<strong>Denied: </strong>'}${esc(op)} — <strong>${esc(verdict)}</strong><br><small>${esc(PERM[op] ? PERM[op].condition : '')}</small></li>`;
  }).join('');
  return `<dl class="authority" data-od-id="authority-${esc(screenId.toLowerCase())}">
    <div><dt>Personas at this screen</dt><dd>${esc(s.personas)}<br><small>Persona names never grant anything.</small></dd></div>
    <div><dt>Scoped read roles</dt><dd>${esc(s.readRoles)}<br><small>Your scope here: Matter ${esc(matterRole() || 'none')} · workspace ${esc(workspaceRole())}. The two are separate.</small></dd></div>
    <div><dt>Operations under the current fixture role</dt><dd><ul style="margin:0; padding-left:18px;">${opLines}</ul></dd></div>
  </dl>`;
}

/* Denied read and denied mutation are different screens, not one message. */
function accessLostPanel(kind) {
  if (role === 'REVOKED') {
    return `<div class="denied" data-od-id="access-revoked"><h3>Your access to this Matter ended</h3>
      <p>Your membership on this Matter was revoked while this screen was open. Protected values and any local draft on this screen have been purged. We are not showing you what you had typed, and there is no export, download or copy path from here.</p>
      <p>If a command of yours was in flight when access ended, its outcome stays <strong>unknown to you</strong>. An authorised owner can confirm it from their own read. Having performed a read earlier does not unlock a resend.</p>
      <p><button data-view="session">Return to the Matters you can still access</button> ${nonOperational('No membership state is changed by this concept.')}</p></div>`;
  }
  return `<div class="denied" data-od-id="access-none"><h3>No record is available at this address for your access</h3>
    <p>${esc(ROLE_LABEL[role])}. A Workspace OWNER does not automatically read a Matter they are not a member of, and this response is deliberately identical to the response for a Matter that does not exist.</p>
    <p>No title, counterparty, file name, document count or legal detail is shown, and nothing hints at how much exists here.</p>
    <p><button data-view="session">Return to the Matters you can access</button></p></div>`;
}
function deniedMutation(op) {
  return `<div class="denied" data-od-id="denied-mutation"><h3>This change is not available to your role</h3>
    <p>${esc(denyReason(op))}</p>
    <p>The record itself stays visible and read-only, and scoped export and history remain available. Only this control is withheld; nothing is hidden from your read.</p></div>`;
}

/* ── 5. record drawer (SCR-04 / SCR-05) and proof panel (SCR-07) ─────── */
const selected = new Set(), drafts = new Map();
/* R8-N02: same Map-keyed-draft pattern as `drafts`, reused (not reinvented)
   for the two other unsent-input surfaces the reviewer reproduced losing
   intent on re-render: Create Matter title (key 'new-matter-title', one
   workspace in this fixture) and the promotion form (key
   'promotion:<documentId>', so reason/target/ack never bleed across
   documents). Cleared only by purgeProtectedState(), never by a render. */
const formDrafts = new Map();
let view = 'control', opener = null, currentRecord = null, detailMode = 'record';
const navStack = [];
let modalOrigin = 'Control Room';
/* R8-N01: tracks whether the acting identity held live Matter access the
   last time it was observed, so a role transition that actually removes
   access (REVOKED, or dropping to WS_OWNER_NO_MATTER) can be told apart
   from a downgrade that still carries read rights (e.g. OWNER -> VIEWER),
   which must not purge anything. */
let lastHasMatterAccess = hasMatterAccess();
/* R8-N01: the real purge. Removes protected draft/selection/pending-preview/
   result/intent state and the protected drawer trail for the identity that
   just lost access, so a re-grant cannot resurrect purged content from a
   stale in-memory cache. Logout and explicit discard call the same
   function, per the shared access-loss/state boundary the finding asked
   for. This purges local concept state only; it is not a product
   authorization/security control. */
function purgeProtectedState() {
  drafts.clear();
  formDrafts.clear();
  selected.clear();
  bulkResult = null;
  Object.keys(bulkIntent).forEach(k => { bulkIntent[k].mode = 'unchanged'; bulkIntent[k].value = ''; });
  navStack.length = 0;
  currentRecord = null;
  detailMode = 'record';
  const dr = safeEl('draft-result'); if (dr) dr.textContent = '';
  const de = safeEl('draft-error'); if (de) de.textContent = '';
}
const VIEW_LABEL = {
  session: 'Matters & membership', control: 'Control Room', grid: 'Operational Grid',
  mine: 'My Actions queue', waiting: 'Waiting On', documents: 'Documents & versions',
  filing: 'Filing tracker', bulk: 'Bulk metadata editor', import: 'Structured import',
  brief: 'Draft status brief', history: 'Event history', gw: 'Golden Workflow walkthrough',
  states: 'Screen states specimen', errors: 'Error & recovery mapping'
};
const originLabel = v => VIEW_LABEL[v] || 'Operational Grid';

function updateTrailUI() {
  const trailEl = $('modal-trail'), backPrevBtn = $('btn-back-prev'), backRecordBtn = $('btn-back-record');
  if (!trailEl) return;
  const parts = [`<button class="trail-origin-btn" id="btn-trail-origin">${esc(modalOrigin)}</button>`];
  navStack.forEach((item, i) => {
    parts.push(`<span class="trail-sep">/</span><button class="screen-link" data-trail-idx="${i}">${esc(item.id)}${item.mode === 'proof' ? ' (proof)' : ''}</button>`);
  });
  if (currentRecord) {
    if (detailMode === 'proof') {
      parts.push(`<span class="trail-sep">/</span><button class="screen-link" id="btn-trail-current">${esc(currentRecord)}</button>`);
      parts.push('<span class="trail-sep">/</span><strong class="trail-node">Proof context</strong>');
    } else {
      parts.push(`<span class="trail-sep">/</span><strong class="trail-node">${esc(currentRecord)}</strong>`);
    }
  }
  trailEl.innerHTML = parts.join(' ');
  if (detailMode === 'proof' && currentRecord) {
    backRecordBtn.style.display = 'inline-block';
    backRecordBtn.textContent = '← Return to ' + currentRecord;
  } else { backRecordBtn.style.display = 'none'; }
  if (navStack.length) {
    const prev = navStack[navStack.length - 1];
    backPrevBtn.style.display = 'inline-block';
    backPrevBtn.textContent = '← Back to ' + prev.id + (prev.mode === 'proof' ? ' (proof)' : '');
  } else { backPrevBtn.style.display = 'none'; }
  const close = $('close-detail');
  if (close) close.textContent = 'Close to ' + modalOrigin;
}

function cleanupModalSession() { navStack.length = 0; currentRecord = null; detailMode = 'record'; }

function gateRows(edges, direction) {
  if (!edges.length) return `<p class="meta">No ${esc(direction)} dependency edge is declared for this record in the fixture.</p>`;
  return edges.map(e => {
    const g = derive.gateSatisfied(e);
    const reported = derive.reportedT0(e.id);
    const divergent = reported && ((reported === 'Satisfied') !== g.satisfied);
    return `<div class="row"><code>${esc(e.id)}</code> · ${esc(e.gate)} gate
      <p><button data-record="${esc(e.from)}">${esc(e.from)}</button> → <button data-record="${esc(e.to)}">${esc(e.to)}</button></p>
      <dl class="kv">
        <dt>Reported at Atlas T0</dt><dd>${reported ? esc(reported) : 'Not published for this edge.'}</dd>
        <dt>Current-policy evaluation</dt><dd>${pill(g.satisfied ? 'completed' : 'blocked', g.satisfied ? 'satisfied' : 'unsatisfied')} ${esc(g.reason)}</dd>
      </dl>
      ${divergent ? `<p class="cause"><strong>These two differ, and both are kept.</strong> The baseline review recorded at T0 reported this gate as ${esc(reported)}. Applying the current independent-verification policy to the same evidence evaluates it as ${g.satisfied ? 'satisfied' : 'unsatisfied'}. The historical record is not rewritten, and the current evaluation is not hidden.</p>` : ''}
    </div>`;
  }).join('');
}

function openRecord(id, trigger, pushHistory) {
  if (pushHistory === undefined) pushHistory = true;
  const r = lookup(id);
  if (!$('detail').open) {
    cleanupModalSession();
    opener = trigger || document.activeElement;
    modalOrigin = originLabel(view);
  } else if (pushHistory && currentRecord && currentRecord !== id) {
    navStack.push({id: currentRecord, mode: detailMode});
  }
  if (!hasMatterAccess()) {
    currentRecord = null; detailMode = 'denied';
    $('detail-title').textContent = 'Record unavailable';
    $('detail-body').innerHTML = accessLostPanel('record');
  } else if (!r) {
    currentRecord = null; detailMode = 'density';
    $('detail-title').textContent = id + ' · labelled density specimen';
    $('detail-body').innerHTML = '<p>Typography and reachability fixture only. No Atlas relationship, proof or authoritative state is supplied for this row, so none is displayed.</p>';
  } else {
    currentRecord = id; detailMode = 'record';
    const kind = r.type === 'req' ? 'Requirement detail' : 'Action detail';
    $('detail-title').textContent = `${id} · ${kind}`;
    const dep = derive.dependencyOf(id);
    const editOp = r.type === 'req' ? OP.EDIT_REQ : OP.EDIT_ACT;
    $('detail-body').innerHTML =
      `<div style="margin-bottom:12px;">${depPill(r)} ${execPill(r)} ${verPill(r)} ${r.labelled ? pill('neutral', 'labelled fixture') : ''}</div>
       <p><strong>${esc(titleOf(r))}</strong></p>
       <dl class="kv">
         <dt>Internal accountable owner</dt><dd>${esc(r.owner || 'not assigned')}</dd>
         <dt>Workstream</dt><dd>${esc(r.ws)}</dd>
         <dt>Due</dt><dd><time>${esc(r.dueISO || 'no due date')}</time></dd>
         <dt>Revision</dt><dd>${esc(r.revision)} <small>(read as of <time>${esc(data.asOf)}</time>)</small></dd>
       </dl>
       ${axesList(r)}
       <p class="meta">${esc(r.sub)}</p>
       <h3>Causal dependency context</h3>
       <p><strong>Incoming gates</strong> — what must hold before this record can be READY:</p>${gateRows(derive.incoming(id), 'incoming')}
       <p><strong>Outgoing gates</strong> — what this record gates:</p>${gateRows(derive.outgoing(id), 'outgoing')}
       <p class="meta">Dependency shown above is recomputed from these edges: ${esc(dep.because)}</p>
       <h3>Evidence &amp; proof</h3>
       <p><button id="proof-context" class="primary">Inspect criterion and exact proof context</button></p>
       <h3>Draft editor</h3>
       ${can(editOp) ? `
         <p class="meta">${esc(ROLE_LABEL[role])} may edit this record under the approved matrix. The draft below is held in page memory only; it is never saved, and the canonical title is unchanged.</p>
         <div class="field"><label for="draft-title">Title draft</label><textarea id="draft-title" aria-describedby="draft-error draft-limit"></textarea><p id="draft-error" class="error" role="alert"></p><p id="draft-limit" class="meta">Title must not be blank. An active owner cannot be cleared.</p></div>
         <p><button id="preview-draft">Preview draft intent</button> ${nonOperational('No command is issued.')}</p>
         <div id="draft-result" role="status" style="margin-top:8px;"></div>`
         : deniedMutation(editOp)}
       <details><summary>If this edit met a conflict, a denial or a revocation</summary>
         <p class="meta">Requirement and Action edits are a W2+ operation. The current contract has not defined their conflict statuses yet, so this screen shows the business condition and keeps the draft rather than displaying a status it would be guessing.</p>
         ${errorMappingRows(['A domain conflict on an operation the contract has not yet defined', 'A mutation is denied inside a record this role may read', 'The acting member is revoked and loses the right to read back'])}</details>`;
    const dt = safeEl('draft-title');
    if (dt) dt.value = drafts.get(id) !== undefined ? drafts.get(id) : titleOf(r);
  }
  updateTrailUI();
  if (!$('detail').open) $('detail').showModal();
  $('detail-title').focus({preventScroll: true});
}

function showProof() {
  const r = lookup(currentRecord);
  if (!r) return;
  detailMode = 'proof';
  $('detail-title').textContent = r.id + ' · Evidence & proof verification context';
  const p = derive.proof(r);
  const validityClass = p.aggregate === 'VERIFIED' ? 'proof' : p.aggregate === 'NOT_REQUIRED' ? 'meta' : 'cause';
  const reviewOp = OP.REVIEW_EVIDENCE;
  $('detail-body').innerHTML =
    `<p><strong>Subject:</strong> <code>${esc(p.subject)}</code> (${esc(p.subjectKind)}) · <strong>Applicability:</strong> ${esc(p.applicability)}</p>
     <div class="proof-grid">
       <div class="proof-card"><h4>Criterion &amp; exact version</h4>
         <p><strong>Criterion:</strong> ${esc(p.criterion)}</p>
         <p><strong>Evidence:</strong> ${esc(p.er && p.er.evidence ? p.er.evidence : 'None supplied')}</p>
         <p><strong>Source reference:</strong> ${esc(p.version)}</p></div>
       <div class="proof-card"><h4>Submitter vs designated verifier</h4>
         <p><strong>Recorded by:</strong> ${esc(p.submitter)}</p>
         <p><strong>Reviewed by:</strong> ${esc(p.verifier)}</p>
         ${p.selfReview ? '<p class="cause"><strong>Self-review:</strong> recorder and reviewer are the same identity.</p>' : ''}</div>
       <div class="proof-card"><h4>Verification validity</h4>
         <p class="${validityClass}"><strong>Aggregate on this subject:</strong> ${esc(p.aggregate)}</p>
         <p class="meta">${esc(p.currentPolicy)}</p></div>
       <div class="proof-card"><h4>Causal consequences</h4>
         <p>${esc(derive.consequence(r))}</p></div>
     </div>
     <h3>Gates derived from this subject's typed edges</h3>
     <p><strong>Incoming:</strong></p>${gateRows(p.incoming, 'incoming')}
     <p><strong>Outgoing:</strong></p>${gateRows(p.outgoingAllGates, 'outgoing')}
     <div class="feedback"><p><strong>Rules that constrain this panel</strong></p>
       <p>1. Verification applies to Requirements, Evidence Requirements and supplied Evidence, and to an Action or Filing when proof is explicitly required. NOT_REQUIRED arises only from an explicit applicability decision.</p>
       <p>2. A submitter cannot review their own proof, and a Matter OWNER is not automatically the verifier; designation is explicit and the verifier must be an EDITOR or OWNER.</p>
       <p>3. Expired proof is an input that makes the evaluator recompute the aggregate. It is a reason, never a state on the verification axis.</p>
       <p>4. A receipt records that something was submitted. It is not approval.</p>
       <p>5. Where the fixture supplies nothing, this panel says so. It does not assert that nothing exists.</p></div>
     <p>${can(reviewOp) ? `Verification here would be <strong>conditional</strong> for ${esc(ROLE_LABEL[role])}: only an explicitly designated verifier who is not the submitter may act. ${nonOperational('No verification is performed by this concept.')}` : esc(denyReason(reviewOp))}</p>
     <div style="display:flex; gap:12px; margin-top:16px; flex-wrap:wrap;">
       <button id="btn-proof-back-record" class="primary">← Return to ${esc(r.id)} detail</button>
       ${navStack.length ? `<button id="btn-proof-back-prev">← Back to ${esc(navStack[navStack.length - 1].id)}</button>` : ''}
     </div>`;
  updateTrailUI();
  $('detail-title').focus({preventScroll: true});
}

function handleBackPrev() {
  if (!navStack.length) return;
  const prev = navStack.pop();
  openRecord(prev.id, null, false);
  if ((prev.mode || 'record') === 'proof') showProof();
}
function handleBackRecord() { if (currentRecord) { detailMode = 'record'; openRecord(currentRecord, null, false); } }
function handleCloseDetail() { cleanupModalSession(); $('detail').close(); }

/* ── 6. error and recovery mapping (shared by every screen) ──────────── */
function errorMappingRows(conditions) {
  const rows = fx.errorMapping.rows.filter(r => !conditions || conditions.some(c => r.condition.startsWith(c)));
  return `<div class="table-scroll"><table><thead><tr>
    <th scope="col">Condition</th><th scope="col">Status under the current contract</th><th scope="col">What the user is told</th>
    <th scope="col">Retained or purged intent</th><th scope="col">Permitted recovery</th><th scope="col">Disabled actions</th></tr></thead><tbody>` +
    rows.map(r => `<tr><td>${esc(r.condition)}</td><td><code>${esc(r.status)}</code></td><td>${esc(r.message)}</td>
      <td>${esc(r.intent)}</td><td>${esc(r.recovery)}</td><td>${esc(r.disabled)}</td></tr>`).join('') +
    '</tbody></table></div>';
}
function renderErrors() {
  $('errors-body').innerHTML =
    `<div class="feedback"><p><strong>Source:</strong> ${esc(fx.errorMapping.contract)}</p><p>${esc(fx.errorMapping.disclaimer)}</p></div>` +
    errorMappingRows(null) +
    `<h2>Why there is no single “concurrent edit” code here</h2>
     <p>The current contract separates an absent precondition (428) from a stale one (412), and separates a receipted command from one that has no receipt. Collapsing all of that into one status would make the recovery advice wrong in three of the rows above: the 428 case has nothing to reconcile, the receipted case can safely replay, and the non-receipted membership case must never be resent on its own.</p>
     <p>Operations that the contract has not yet defined — requirement edit, bulk, import, filing stages, promotion — appear as <code>DEPENDENCY_PENDING</code>. This design does not borrow the membership rule for them and does not invent a code for them.</p>`;
}

/* ── 7. SCR-02 Control Room ──────────────────────────────────────────── */
const MILESTONES = [
  {id: 'MS-01', name: 'Readiness Review', due: '2026-06-14T17:00:00+07:00', required: null},
  {id: 'MS-02', name: 'Closing', due: '2026-06-18T17:00:00+07:00', required: null},
  {id: 'MS-03', name: 'Filing & Post-Closing Review', due: '2026-06-22T17:00:00+07:00', required: null}
];

function criticalChain() {
  /* Derived, not hand-listed: start from every blocked record, find its root
     causes, pick the root with the widest declared downstream reach. */
  const blocked = records.filter(r => derive.dependencyOf(r.id).state === 'BLOCKED');
  const roots = new Map();
  blocked.forEach(r => derive.rootCauses(r.id).forEach(rc => {
    if (!roots.has(rc.record)) roots.set(rc.record, {record: rc.record, reach: new Set(), reason: rc.reason});
    roots.get(rc.record).reach.add(r.id);
  }));
  /* Rank by declared downstream reach, then prefer a root that was already
     unsatisfied in the status Atlas reported at T0. A root that only becomes a
     root under the current policy is a real co-root and is named as one, but it
     is not promoted over the baseline blocker by an alphabetical accident. */
  roots.forEach(r => {
    r.reportedUnsatisfied = records.some(x => derive.outgoing(x.id).length) &&
      derive.outgoing(r.record).some(e => derive.reportedT0(e.id) === 'Unsatisfied');
  });
  const ranked = [...roots.values()].sort((a, b) =>
    b.reach.size - a.reach.size ||
    (b.reportedUnsatisfied ? 1 : 0) - (a.reportedUnsatisfied ? 1 : 0) ||
    a.record.localeCompare(b.record));
  if (!ranked.length) return {root: null, steps: [], reach: [], coRoots: []};
  const root = ranked[0];
  const coRoots = ranked.slice(1).filter(r => r.reach.size === root.reach.size);
  const steps = [root.record];
  let cursor = root.record;
  const guard = new Set([cursor]);
  while (true) {
    const next = derive.outgoing(cursor).map(e => e.to).filter(id => !guard.has(id) && derive.dependencyOf(id).state === 'BLOCKED');
    if (!next.length) break;
    next.sort((a, b) => derive.downstream(b).length - derive.downstream(a).length || a.localeCompare(b));
    cursor = next[0]; guard.add(cursor); steps.push(cursor);
  }
  return {root, steps, reach: [...root.reach], coRoots};
}

function renderControl() {
  $('control-authority').innerHTML = authorityStrip('SCR-02', [OP.READ, OP.EXPORT]);
  if (!hasMatterAccess()) {
    $('chain').innerHTML = ''; $('chain-summary').innerHTML = accessLostPanel('control');
    ['next', 'wait-summary', 'milestones', 'evidence-gaps', 'control-changes'].forEach(id => { $(id).innerHTML = ''; });
    $('control-lede').textContent = 'No matter content is shown for this access.';
    return;
  }
  const chain = criticalChain();
  const tagFor = i => i === 0 ? {t: 'Step 1 · blocker root cause', c: 'root', s: 'root-blocker'}
    : i === 1 ? {t: 'Step 2 · direct impact', c: 'gate', s: 'direct-gate'}
    : {t: `Step ${i + 1} · downstream`, c: 'pipe', s: 'downstream'};
  $('chain').innerHTML = chain.steps.map((id, i) => {
    const r = lookup(id), tag = tagFor(i), dep = derive.dependencyOf(id);
    const out = derive.outgoing(id);
    const cause = i === 0
      ? describeOwnBlock(r)
      : dep.failing.map(f => `${f.edge.id} from ${f.edge.from}: ${f.reason}`).join(' ');
    return `<div class="chain-step ${tag.s}" data-od-id="chain-step-${esc(id)}">
      <div><span class="step-tag ${tag.c}">${esc(tag.t)}</span>
        <strong><code>${esc(r.id)}</code> · ${esc(titleOf(r))}</strong>
        <p class="meta">${esc(r.exec)} / ${esc(dep.state)} · accountable owner ${esc(r.owner || 'unassigned')}</p>
        <p class="cause"><strong>Cause:</strong> ${esc(cause)}</p>
        <p><strong>Downstream impact:</strong> ${esc(out.length ? out.map(e => `${e.id} → ${e.to} (${e.gate} gate)`).join('; ') : 'No outgoing edge is declared from this record.')}</p>
        <p><strong>Permitted next step:</strong> ${esc(nextStepFor(r))}</p></div>
      <button data-record="${esc(id)}" style="margin-top:8px;">Inspect ${esc(id)}</button></div>`;
  }).join('');
  const rootRec = chain.root ? lookup(chain.root.record) : null;
  $('chain-summary').innerHTML = rootRec
    ? `<p><strong>Primary blocker:</strong> <code>${esc(rootRec.id)}</code> — ${esc(describeOwnBlock(rootRec))}
       <strong>Accountable owner:</strong> ${esc(rootRec.owner || 'unassigned')} ·
       <strong>Records reached through declared edges:</strong> ${esc(chain.reach.sort().join(', '))}.
       <button data-record="${esc(rootRec.id)}" class="primary" style="margin-left:8px;">Inspect blocker root (${esc(rootRec.id)})</button></p>
       ${chain.coRoots.length ? `<p class="cause"><strong>Co-root under the current policy:</strong> ${chain.coRoots.map(c => `<code>${esc(c.record)}</code>`).join(', ')} reach the same records. ${chain.coRoots.map(c => esc(c.record)).join(', ')} was reported satisfied at Atlas T0 and becomes a root only when the current independent-verification policy is applied. Clearing ${esc(rootRec.id)} alone would not clear the chain.</p>` : ''}
       <p class="meta">This chain is computed from the ${data.edges.length} declared dependency edges at read time, not written into the page.</p>`
    : '<p>No blocked record is present in this snapshot.</p>';

  const eligibleAll = records.filter(derive.eligible);
  const waitingAll = records.filter(r => r.type === 'action' && r.exec === 'WAITING');
  const blockedAll = records.filter(r => r.type === 'action' && derive.dependencyOf(r.id).state === 'BLOCKED');
  $('next').innerHTML = `<p><strong>${eligibleAll.length} eligible Action${eligibleAll.length === 1 ? '' : 's'} across the Matter.</strong></p>
    <p>${esc(blockedAll.length)} Action(s) are BLOCKED by an unsatisfied gate and ${esc(waitingAll.length)} are WAITING on an external party. A Requirement is a condition, never a recommended next step.</p>
    ${eligibleAll.length ? eligibleAll.map(r => `<div class="row">${recordButton(r)}</div>`).join('') : '<p class="meta">No eligible Action is fabricated to fill this panel.</p>'}`;

  $('wait-summary').innerHTML = waitRows();
  $('milestones').innerHTML = MILESTONES.map(m => {
    const v = derive.milestone(m.required);
    return `<div class="row"><code>${esc(m.id)}</code> ${esc(m.name)} · due <time>${esc(m.due)}</time>
      <p>${pill(v.state === 'READY' ? 'ready' : v.state === 'BLOCKED' ? 'blocked' : 'neutral', v.state)} ${esc(v.because)}</p></div>`;
  }).join('') + `<p class="meta">A due date does not establish readiness. Satisfied/total counts are unavailable while no required prerequisite set is declared. ${can(OP.MILESTONE) ? 'Declaring those prerequisites is a Matter OWNER operation. ' + nonOperational('No milestone is changed here.') : esc(denyReason(OP.MILESTONE))}</p>`;

  const gaps = fx.evidenceRequirements.filter(e => e.absence && erBySubject[e.subject] && lookup(e.subject));
  $('evidence-gaps').innerHTML = gaps.map(e => {
    const r = lookup(e.subject);
    return `<div class="row"><code>${esc(e.id)}</code> on <button data-record="${esc(e.subject)}">${esc(e.subject)}</button>
      <p>${esc(e.criterion)}</p><p class="cause">${esc(e.absence)}</p></div>`;
  }).join('') + '<p class="meta">Where evidence exists but was recorded and reviewed by the same identity, the proof panel states that caveat; the recorded historical aggregate is preserved rather than flipped.</p>';

  $('control-changes').innerHTML = fx.events.slice(-4).map(e =>
    `<div class="row"><code>${esc(e.id)}</code> <time>${esc(e.recordedAt)}</time><p>${esc(e.operation)} — ${esc(e.entity)}</p></div>`).join('') +
    '<p class="meta">The outstanding DD gap is not newly created in this window; it appears under outstanding, not under changes.</p>';
}

function describeOwnBlock(r) {
  const p = derive.proof(r);
  if (p.er && !p.er.evidence) return `the evidence requirement ${p.er.id} (${p.er.criterion}) has no supplied evidence at this snapshot — ${p.er.absence || 'missing'} — so its proof gates cannot be satisfied.`;
  if (p.ev && p.selfReview) return `${p.er.id} is supported by ${p.ev.id}, but it was recorded and reviewed by the same identity, so it is not valid proof under the current independent-verification policy.`;
  const dep = derive.dependencyOf(r.id);
  if (dep.state === 'BLOCKED') return dep.failing.map(f => `${f.edge.id} from ${f.edge.from}: ${f.reason}`).join(' ');
  return `execution is ${r.exec} and verification is ${r.ver}.`;
}
function nextStepFor(r) {
  const dep = derive.dependencyOf(r.id);
  if (dep.state === 'BLOCKED') return `Nothing can be completed here until ${dep.failing.map(f => f.edge.from).join(' and ')} clears. No client-side waiver exists.`;
  if (r.exec === 'WAITING') {
    const w = externalWait(r.id);
    return w ? `Follow up with ${w} as explicit work; the internal owner stays accountable while waiting.` : 'Continue the recorded wait; the internal owner stays accountable.';
  }
  const p = derive.proof(r);
  if (p.er && !p.er.evidence) return `Obtain and record evidence for ${p.er.id}, then have a designated independent verifier assess it.`;
  return 'Continue the declared work on this record.';
}
const EXTERNAL_WAIT = {'RQ-04': 'EP-01 · Cedar Seller Demo', 'AC-04': 'EP-01 · Cedar Seller Demo', 'AC-05': 'EP-02 · Elm Signatory Demo', 'RQ-10': 'EP-03 · Harbor Registry Demo', 'AC-10': 'EP-03 · Harbor Registry Demo'};
const externalWait = id => EXTERNAL_WAIT[id] || null;

function waitRows() {
  const waiting = records.filter(r => r.exec === 'WAITING');
  return waiting.map(r => {
    const dep = derive.dependencyOf(r.id);
    return `<div class="row">${recordButton(r)}
      <p>Waiting on ${esc(externalWait(r.id) || 'a party not supplied in the fixture')} · internal accountable owner ${esc(r.owner || 'unassigned')} · execution ${esc(r.exec)} / dependency ${esc(dep.state)}</p>
      <p class="meta">${esc(dep.state === 'BLOCKED' ? 'Also BLOCKED: ' + dep.because : 'WAITING is not BLOCKED: ' + dep.because)} · due <time>${esc(r.dueISO)}</time> · waiting age unavailable</p></div>`;
  }).join('');
}

/* ── 8. SCR-03 Operational Grid ──────────────────────────────────────── */
let density = 'comfortable';
const densityRows = n => Array.from({length: n}, (_, i) => ({
  id: 'DENSITY-' + String(i + 1).padStart(3, '0'),
  type: i % 2 ? 'action' : 'req',
  label: i % 2 ? 'Synthetic work — reconcile the complete supporting document reference before internal follow-up'
               : 'Điều kiện tổng hợp — cần giữ đầy đủ lý do và chứng từ được đối chiếu trước khi bàn giao cho bên tiếp nhận',
  labelEn: i % 2 ? 'Synthetic work — reconcile the complete supporting document reference before internal follow-up'
                 : 'Aggregate condition — every reason and reconciled document reference must be retained before handover',
  owner: null, exec: 'NOT_STARTED', ver: 'UNVERIFIED', dep: null, dueISO: null,
  ws: 'Labelled density fixture', sub: 'DENSITY ONLY · no legal relationship or state evaluation is supplied', revision: 1
}));

function visibleRecords() {
  const fixture = Number($('fixture').value);
  const list = fixture === 24 ? records : densityRows(fixture);
  const q = $('query').value.trim().toLocaleLowerCase();
  const type = $('type').value;
  return list.filter(r => (type === 'all' || r.type === type) &&
    (!q || [r.id, r.label, r.labelEn || (fx.titlesEn && fx.titlesEn[r.id]) || '', r.owner || ''].join(' ').toLocaleLowerCase().includes(q)))
    .sort((a, b) => $('sort').value === 'due'
      ? (Date.parse(a.dueISO) || Infinity) - (Date.parse(b.dueISO) || Infinity) || a.id.localeCompare(b.id)
      : a.id.localeCompare(b.id));
}

function selectionText() {
  const visible = new Set(visibleRecords().map(r => r.id));
  const hidden = [...selected].filter(id => !visible.has(id));
  $('selection').textContent = 'Selected exact IDs: ' + ([...selected].join(', ') || 'none') +
    (hidden.length ? ` · ${hidden.length} selected row(s) are hidden by this grid's current filter: ${hidden.join(', ')}` : '');
}

function renderGrid() {
  $('grid-authority').innerHTML = authorityStrip('SCR-03', [OP.READ, OP.EDIT_REQ, OP.EDIT_ACT, OP.CANCEL, OP.EXPORT]);
  if (!hasMatterAccess()) {
    $('rows').innerHTML = `<tr><td colspan="8">${accessLostPanel('grid')}</td></tr>`;
    $('mobile-rows').innerHTML = accessLostPanel('grid');
    $('range').textContent = ''; $('selection').textContent = '';
    return;
  }
  const list = visibleRecords();
  const checkbox = (r, mobile) => `<input class="check" type="checkbox" data-select="${esc(r.id)}" aria-label="Select ${esc(r.id)}${mobile ? ' (card view)' : ''}" ${selected.has(r.id) ? 'checked' : ''}>`;
  $('rows').innerHTML = list.map(r => {
    const dep = r.id.startsWith('DENSITY') ? 'unavailable' : derive.dependencyOf(r.id).state;
    return `<tr tabindex="0" data-row="${esc(r.id)}" class="${selected.has(r.id) ? 'selected' : ''}">
      <td>${checkbox(r, false)}</td>
      <td class="identity">${recordButton(r)}<small>${esc(r.type === 'req' ? 'Requirement' : 'Action')} · ${esc(r.ws)}</small><small>${esc(r.sub)}</small></td>
      <td>${esc(r.exec)}</td><td>${esc(r.ver)}</td><td>${esc(dep)}</td>
      <td><time>${esc(r.dueISO || 'no due date')}</time><small>${esc(r.owner || 'not assigned')}</small></td>
      <td>${esc(derive.timing(r))}</td><td>${esc(derive.attention(r))}</td></tr>`;
  }).join('');
  $('mobile-rows').innerHTML = list.map(r => `<article class="panel row" data-od-id="mobile-card-${esc(r.id)}">${checkbox(r, true)}${recordButton(r)}
    <p>${esc(r.type === 'req' ? 'Requirement' : 'Action')} · ${esc(r.owner || 'not assigned')} · ${esc(r.ws)}</p>${axesList(r)}
    <time>${esc(r.dueISO || 'no due date')}</time><p>${esc(r.sub)}</p></article>`).join('');
  $('range').textContent = `${list.length} matching record(s) · every matching row is shown · ` +
    (Number($('fixture').value) === 24 ? 'Atlas T0 canonical' : 'labelled DENSITY fixture, not Atlas');
  $('grid-table').classList.toggle('compact', density === 'compact');
  if (!list.length) {
    $('rows').innerHTML = `<tr><td colspan="8"><p><strong>No record in this Matter matches this grid's search and filters.</strong></p>
      <p>Records still exist in the Matter. Search here covers record ID, title in either language, and internal owner.</p>
      <p><button id="reset-filter-inline">Reset this grid's search and filters</button></p></td></tr>`;
    $('mobile-rows').innerHTML = $('rows').innerHTML;
  }
  selectionText();
}

/* ── 9. SCR-03a My Actions ───────────────────────────────────────────── */
const SESSION_ACTOR = 'U-01';
function renderMyActions() {
  $('mine-authority').innerHTML = authorityStrip('SCR-03', [OP.READ, OP.EDIT_ACT, OP.EXEC]);
  if (!hasMatterAccess()) { $('my-actions-container').innerHTML = accessLostPanel('mine'); return; }
  const mine = records.filter(r => r.type === 'action' && r.owner === SESSION_ACTOR);
  const myReqs = records.filter(r => r.type === 'req' && r.owner === SESSION_ACTOR);
  const groups = [
    {key: 'eligible', title: 'Eligible to work now', pill: ['ready', 'Ready to work'], rows: mine.filter(derive.eligible),
     emptyMsg: 'No Action assigned to this actor is eligible right now. Each one below is either waiting on an external party or blocked by an unsatisfied gate, and no substitute next action is fabricated.'},
    {key: 'waiting', title: 'Waiting on an external party', pill: ['waiting', 'External wait'], rows: mine.filter(r => r.exec === 'WAITING')},
    {key: 'blocked', title: 'Blocked by an upstream gate', pill: ['blocked', 'Gate unsatisfied'], rows: mine.filter(r => derive.dependencyOf(r.id).state === 'BLOCKED')},
    {key: 'completed', title: 'Completed', pill: ['completed', 'Completed'], rows: mine.filter(r => r.exec === 'COMPLETED')}
  ];
  const item = r => {
    const dep = derive.dependencyOf(r.id);
    const wait = externalWait(r.id);
    return `<div class="queue-item" data-od-id="queue-item-${esc(r.id)}"><div>${recordButton(r)}
      <div style="margin-top:4px;">${depPill(r)} ${execPill(r)} ${verPill(r)}</div>
      ${wait && r.exec === 'WAITING' ? `<p><strong>Waiting on:</strong> ${esc(wait)}</p>` : ''}
      ${dep.state === 'BLOCKED' ? `<p class="cause"><strong>Blocking cause:</strong> ${esc(dep.failing.map(f => `${f.edge.id} (${f.edge.gate} gate) from ${f.edge.from} — ${f.reason}`).join(' '))}</p>` : ''}
      <p class="meta"><strong>Permitted next step:</strong> ${esc(nextStepFor(r))}</p></div>
      <div><time>${esc(r.dueISO)}</time><br><small>${esc(r.ws)}</small></div></div>`;
  };
  const overlap = mine.filter(r => r.exec === 'WAITING' && derive.dependencyOf(r.id).state === 'BLOCKED').map(r => r.id);
  $('my-actions-container').innerHTML =
    `<div class="feedback"><p><strong>Session actor:</strong> ${esc(SESSION_ACTOR)} (fixture alias). In the product the queue is derived from the session principal, never from a selector.</p>
      ${overlap.length ? `<p>${esc(overlap.join(', '))} appear${overlap.length === 1 ? 's' : ''} in two groups on purpose: WAITING and BLOCKED are independent axes and an Action can be both.</p>` : ''}</div>` +
    groups.map(g => `<section class="queue-group" data-od-id="queue-${g.key}">
      <div class="queue-header"><h3>${esc(g.title)} (${g.rows.length})</h3>${pill(g.pill[0], g.pill[1])}</div>
      <div class="queue-body">${g.rows.length ? g.rows.map(item).join('') : `<div class="feedback"><p>${esc(g.emptyMsg || 'Nothing in this group.')}</p></div>`}</div></section>`).join('') +
    `<details data-od-id="queue-requirements-ref"><summary>Requirements owned by ${esc(SESSION_ACTOR)} (${myReqs.length})</summary>
      <p class="meta">Requirements are legal conditions, not operational tasks. They are listed for context and are never queue items.</p>
      ${myReqs.map(item).join('')}</details>
    <div class="feedback" data-od-id="demo-proof-fixture"><p>${pill('neutral', 'labelled demo fixture')} <strong>An Action whose proof is explicitly required.</strong></p>
      <p class="meta">All twelve canonical Atlas Actions carry an explicit NOT_REQUIRED applicability. This separate fixture record is outside the canonical 24 and never enters any Atlas total; it exists so the proof-bearing Action case is inspectable.</p>
      <p><button data-record="AC-DEMO-PROOF">Inspect AC-DEMO-PROOF</button></p></div>`;
}

function renderWaiting() {
  if (!hasMatterAccess()) { $('waiting-list').innerHTML = accessLostPanel('waiting'); return; }
  $('waiting-list').innerHTML = waitRows();
}

/* ── 10. SCR-01 session, matters and membership ──────────────────────── */
let sessionFilter = '';
function renderSession() {
  const s = fx.session;
  const mode = $('session-state').value;
  $('session-authority').innerHTML = authorityStrip('SCR-01', [OP.READ, OP.CREATE_MATTER, OP.MEMBERSHIP, OP.WS_MEMBERSHIP]);
  if (mode === 'loading') {
    $('session-body').innerHTML = `<section class="panel" role="status" aria-busy="true"><h2>Confirming your access</h2>
      <div class="skeleton-box" style="width:46%;"></div><div class="skeleton-box" style="width:80%;"></div><div class="skeleton-box" style="width:62%;"></div>
      <p class="meta">No Matter name, title or count is shown until membership is confirmed. A loading shell never implies how much exists.</p></section>`;
    return;
  }
  if (mode === 'expired') {
    $('session-body').innerHTML = `<section class="panel"><h2>Your session has expired</h2>
      <p>The server-side session reached its time limit. Nothing on this device held a token, so there is nothing to clear here beyond the opaque handle.</p>
      <p>Work you had typed into an open screen is kept in this browser tab only until you reload, and is never sent anywhere on your behalf.</p>
      <p><button class="primary">Sign in again</button> ${nonOperational('No identity provider is contacted by this concept.')}</p>
      <p class="meta">No credential field appears in this concept at any point.</p></section>`;
    return;
  }
  if (mode === 'logout') {
    $('session-body').innerHTML = `<section class="panel"><h2>Sign out of MatterControl?</h2>
      <p>Signing out destroys the server-side session immediately. Any draft held only in this tab is discarded and is not recoverable afterwards.</p>
      <p>Revocation at the identity provider is attempted as a courtesy; this product does not claim instant revocation anywhere it cannot prove it.</p>
      <p><button class="primary" id="btn-sign-out">Sign out</button> <button>Stay signed in</button> ${nonOperational('No session exists to destroy; the in-tab draft discard this button performs is real.')}</p></section>`;
    return;
  }
  const q = sessionFilter.trim().toLocaleLowerCase();
  const accessible = accessibleMatters();
  if (mode === 'access_lost' || !hasMatterAccess()) {
    $('session-body').innerHTML =
      (mode === 'access_lost' || role === 'REVOKED' ? accessLostPanel('session') : '') +
      (role === 'WS_OWNER_NO_MATTER'
        ? `<div class="denied"><h3>Your workspace role does not open this Matter</h3>
           <p>You are a Workspace ${esc(workspaceRole())}. The list below contains only the Matters where you hold an active membership. A workspace role never grants its way into a Matter, and nothing on this screen reveals that a Matter you cannot read exists — not its name, not its identifier, not a count.</p></div>`
        : '') +
      (accessible.length
        ? `<h2>Matters you can access (${accessible.length})</h2>` + matterListHtml(accessible)
        : `<section class="panel"><p><strong>No Matter is accessible to you.</strong></p><p>This is what an account with no active Matter membership sees. It is not a statement about how many Matters exist.</p></section>`) +
      `<p class="meta">${esc(s.inaccessibleNote)}</p>` + createMatterPanel() + provenanceNote(s.src);
    return;
  }
  const list = accessible.filter(m => !q || [m.id, m.title, m.titleVi].join(' ').toLocaleLowerCase().includes(q));
  $('session-body').innerHTML =
    `<section class="panel"><h2>Session</h2><dl class="kv">
       <dt>Workspace</dt><dd>${esc(s.workspace.id)} · ${esc(s.workspace.name)}</dd>
       <dt>Signed in as</dt><dd>${esc(s.actor.display)}</dd>
       <dt>Workspace role</dt><dd>${esc(s.actor.workspaceRole)} <small>— a workspace role is not a Matter role</small></dd>
       <dt>Expiry</dt><dd>${esc(s.expiry)}</dd></dl></section>
     <h2>Matters you can access (${list.length}${q ? ` of ${accessible.length}` : ''})</h2>` +
    (list.length ? matterListHtml(list) : `<section class="panel"><p><strong>No accessible Matter matches “${esc(sessionFilter)}”.</strong></p>
       <p>This is a search result, not an empty workspace. Clearing the search returns your ${s.matters.length} accessible Matters.</p>
       <p><button id="matter-reset-inline">Clear this search</button></p></section>`) +
    `<p class="meta">${esc(s.inaccessibleNote)}</p>` +
    createMatterPanel() +
    membershipPanel(s.matters[0]);
}
function createMatterPanel() {
  return `<section class="panel" data-od-id="matter-create"><h2>Create a Matter</h2>
    ${can(OP.CREATE_MATTER)
      ? `<p>As Workspace ${esc(workspaceRole())} you may create a Matter and become its initial Matter OWNER. Creation and the initial membership grant are both audited. Whatever role you hold on another Matter is irrelevant to this, and creating one grants you nothing anywhere else.</p>
         <div class="field"><label for="new-matter-title">Matter title</label><input id="new-matter-title" type="text" placeholder="e.g. Harbor Logistics — Asset Transfer" value="${esc(formDrafts.get('new-matter-title') || '')}"></div>
         <p><button class="primary">Create Matter</button> ${nonOperational('No Matter is created and no grant is issued.')}</p>`
      : deniedMutation(OP.CREATE_MATTER)}</section>`;
}

/* ATLAS-001 is the only Matter whose membership the role selector changes. A
   role with no membership on it must not see it listed, named or counted. */
function accessibleMatters() {
  return fx.session.matters.filter(m => m.id !== 'ATLAS-001' || hasMatterAccess());
}
function matterListHtml(list) {
  return list.map(m => `<div class="matter-card" data-od-id="matter-${esc(m.id)}">
    <div><span class="matter-id">${esc(m.id)}</span><h3>${esc(lang === 'en' ? m.title : lang === 'vi' ? m.titleVi : m.titleVi + ' — ' + m.title)}</h3>
      <p class="meta">Your role on this Matter: <strong>${esc(m.myRole)}</strong> · read as of <time>${esc(m.readAsOf)}</time></p></div>
    <div><button class="primary" data-view="control" ${m.id === 'ATLAS-001' ? '' : 'disabled'}>Open ${esc(m.id)}</button>
      ${m.id === 'ATLAS-001' ? '' : '<br><small>Only the default Matter carries data in this concept.</small>'}</div></div>`).join('');
}
function membershipPanel(m) {
  const owners = m.members.filter(x => x.role === 'OWNER' && x.state === 'ACTIVE');
  return `<section class="panel" data-od-id="membership-panel"><h2>Membership and verifier designation — ${esc(m.id)}</h2>
    ${can(OP.MEMBERSHIP) ? '' : deniedMutation(OP.MEMBERSHIP)}
    <div class="table-scroll"><table><caption>Membership is an access relationship, not a workflow state.</caption>
      <thead><tr><th scope="col">Member</th><th scope="col">Matter role</th><th scope="col">State</th><th scope="col">Designated verifier</th><th scope="col">Change</th></tr></thead>
      <tbody>${m.members.map(x => {
        const lastOwner = x.role === 'OWNER' && owners.length === 1;
        return `<tr><td><code>${esc(x.user)}</code></td><td>${esc(x.role)}</td><td>${esc(x.state)}</td>
          <td>${x.verifierDesignated ? 'Yes' : 'No'}<small>${esc(x.role === 'VIEWER' ? 'A VIEWER cannot be designated: a verifier must be an EDITOR or OWNER.' : 'Designation is explicit; it is never inferred from role.')}</small></td>
          <td>${can(OP.MEMBERSHIP)
            ? (lastOwner
              ? `<button disabled>Revoke</button><small>Blocked: ${esc(x.user)} is the last active OWNER. Transfer ownership to another active OWNER first.</small>`
              : `<button>Change role</button> <button>Revoke</button><small>${nonOperational('No membership command is issued.')}</small>`)
            : '<small>Read-only for your role.</small>'}</td></tr>`;
      }).join('')}</tbody></table></div>
    <p class="meta">Assigning an Action to a member never grants access, and revocation removes derived Matter access immediately. Two-person verification is not waived in a one-member workspace.</p>
    ${provenanceNote('Atlas names U-01, U-02 and U-03 as persona aliases and states that they are not product roles. The Matter roles, the verifier designation and the fourth member U-04 shown in this table are design-supplied, to exercise the approved matrix.')}
    <details><summary>If a membership command loses its response</summary>${errorMappingRows(['A non-receipted membership command loses its response', 'The acting member is revoked and loses the right to read back'])}</details></section>`;
}

/* ── 11. SCR-08 documents, versions and signatures ───────────────────── */
/* R8-N03: impact recomputes from the actually-selected target, not from
   "current" by assumption. Target and the expected-current concurrency
   guard are two independent values; neither substitutes for the other. */
function promotionImpactText(current, target) {
  if (!target) return 'Select a target version above to see its impact. Nothing is ready to promote yet.';
  if (current && target === current.v) {
    return `${esc(target)} is already the current version. Selecting the current version as the target is a no-change request, not a promotion, and never produces a ready intent.`;
  }
  return `Promoting ${esc(target)} supersedes ${esc(current ? current.v : 'the prior current version')}, recomputes current-version criteria, and leaves every fixed reference pointing where it already points. It does not re-verify anything.`;
}
function renderDocuments() {
  $('documents-authority').innerHTML = authorityStrip('SCR-08', [OP.DOC_READ, OP.DOC_ADD, OP.DOC_PROMOTE]);
  if (!hasMatterAccess()) { $('documents-body').innerHTML = accessLostPanel('documents'); return; }
  const sel = $('doc-select');
  if (!sel.options.length) sel.innerHTML = fx.documents.map(d => `<option value="${esc(d.id)}">${esc(d.id)} · ${esc(d.name)}</option>`).join('');
  const d = docById[sel.value] || fx.documents[0];
  const mode = $('doc-state').value;
  const current = d.versions.find(v => v.status === 'CURRENT');
  const sig = d.signatureCriteria;

  const lineage = `<div class="table-scroll"><table class="lineage"><caption>Version lineage for ${esc(d.id)}. Adding a version never promotes it.</caption>
    <thead><tr><th scope="col">Version</th><th scope="col">Status</th><th scope="col">Added</th><th scope="col">Added by</th><th scope="col">Superseded by</th><th scope="col">Referenced by</th></tr></thead><tbody>
    ${d.versions.map(v => {
      const refs = d.referencedBy.filter(r => r.version === v.v);
      return `<tr><td class="version-cell"><code>${esc(v.v)}</code></td>
        <td>${pill(v.status === 'CURRENT' ? 'completed' : 'neutral', v.status)}</td>
        <td>${v.addedAt ? `<time>${esc(v.addedAt)}</time>` : '<small>not supplied in the fixture</small>'}</td>
        <td>${v.addedBy ? esc(v.addedBy) : '<small>not supplied</small>'}</td>
        <td class="supersede">${esc(v.supersededBy || '—')}</td>
        <td>${refs.length ? refs.map(r => `${esc(r.kind)} <code>${esc(r.id)}</code> <small>${esc(r.binding === 'fixed' ? 'fixed reference to this exact version' : r.binding === 'current' ? 'follows the current version' : 'input only')}${r.note ? ' — ' + esc(r.note) : ''}</small>`).join('<br>') : '<small>No reference binds this version.</small>'}</td></tr>`;
    }).join('')}</tbody></table></div>`;

  const signature = sig
    ? `<section class="panel" data-od-id="signature-panel"><h2>Signature completeness — ${esc(sig.version)}</h2>
        <p>${pill(sig.executed >= sig.required ? 'completed' : 'waiting', `${sig.executed} of ${sig.required} executed`)} Signature criteria are evaluated against this exact version, not against the document.</p>
        <div class="table-scroll"><table><thead><tr><th scope="col">Party</th><th scope="col">State</th><th scope="col">Observed</th><th scope="col">Evidence</th></tr></thead><tbody>
        ${sig.parties.map(p => `<tr><td>${esc(p.party)}</td><td>${pill(p.state === 'EXECUTED' ? 'completed' : 'waiting', p.state)}</td>
          <td><time>${esc(p.observedAt || 'not observed')}</time></td><td>${esc(p.evidence || 'none supplied')}</td></tr>`).join('')}
        </tbody></table></div>
        <p class="meta">A partially signed version is never displayed as signed. If signatures do not apply, a Matter OWNER records the applicability reason explicitly; this concept never invents a signature.</p>
        ${provenanceNote('Atlas records that DOC-03 v3 carries one of two signatures and that the first signature receipt was observed on 15 June. It does not name the executing party, so this panel does not name one either.')}</section>`
    : '<p class="meta">No signature criteria are declared for this document in the fixture.</p>';

  let stateBlock = '';
  if (mode === 'stale') {
    stateBlock = `<div class="feedback warning"><p><strong>This view is behind the server.</strong> A newer revision of ${esc(d.id)} was accepted while this screen was open.</p>
      <p>Your draft is kept. We are only comparing the fields your role may read. Refresh to rebase onto the accepted revision, then resubmit.</p>
      <p><button class="primary">Refresh and rebase</button> <button>Keep reading the snapshot I have</button> ${nonOperational('No refresh is performed.')}</p></div>`;
  } else if (mode === 'forbidden') {
    stateBlock = deniedMutation(OP.DOC_PROMOTE);
  } else if (mode === 'supersession') {
    stateBlock = `<div class="feedback warning"><p><strong>A superseded version is still referenced.</strong></p>
      <p>${esc(d.id)} has a newer current version, and at least one fixed reference still points at an earlier one. That is correct and is left alone: a fixed reference names the exact version that was reviewed or submitted, and supersession does not rewrite it.</p>
      <p>Only references that follow the current version move. The table above marks which is which.</p></div>`;
  }

  const promoKey = 'promotion:' + d.id;
  const pstate = formDrafts.get(promoKey) || {target: '', reason: '', ack: false};
  const promote = mode === 'forbidden' || !can(OP.DOC_PROMOTE)
    ? deniedMutation(OP.DOC_PROMOTE)
    : `<section class="panel" data-od-id="promote-panel"><h2>Promote the authoritative version</h2>
        <p>Promotion is a Matter OWNER operation and needs the target version, the expected current version, a reason and an acknowledgment recorded together. The target and the concurrency guard below are two independent values; one control is never asked to do both jobs.</p>
        <div class="field"><label for="promote-target">Version to promote (target)</label>
          <select id="promote-target"><option value="">— select a version —</option>${d.versions.map(v => `<option value="${esc(v.v)}" ${pstate.target === v.v ? 'selected' : ''}>${esc(v.v)}${v.status === 'CURRENT' ? ' (current)' : ''}</option>`).join('')}</select>
          <p class="meta">The version this command would make authoritative.</p></div>
        <div class="field"><label for="promote-expected">Expected current version (concurrency guard)</label>
          <select id="promote-expected">${d.versions.map(v => `<option ${v.status === 'CURRENT' ? 'selected' : ''}>${esc(v.v)}</option>`).join('')}</select>
          <p class="meta">If the current version has moved since you loaded this screen, the command is refused and you rebase rather than overwrite. This is a concurrency guard, not the target.</p></div>
        <div class="field"><label for="promote-reason">Reason for promotion</label><textarea id="promote-reason" placeholder="Why this version becomes authoritative">${esc(pstate.reason || '')}</textarea></div>
        <div class="field"><label for="promote-impact"><input type="checkbox" id="promote-impact" style="display:inline-block; min-height:auto; width:auto; margin-right:8px;" ${pstate.ack ? 'checked' : ''}>I acknowledge the impact below</label>
          <p class="meta" id="promote-impact-text">${promotionImpactText(current, pstate.target)}</p></div>
        <p><button id="promote-preview" class="primary">Preview promotion intent</button> ${nonOperational('No promotion is performed; the contract has not yet defined the promote-version operation or its status codes (DEPENDENCY_PENDING for the wire).')}</p>
        <div id="promote-result" role="status" style="margin-top:8px;"></div></section>`;

  const addVersion = can(OP.DOC_ADD)
    ? `<section class="panel" data-od-id="add-version-panel"><h2>Add a version</h2>
        <p>Adding a version records new content against this document. It does not promote it, does not verify it and does not satisfy any criterion by itself.</p>
        <div class="field"><label for="add-version-ref">Content reference</label><input id="add-version-ref" type="text" placeholder="Reference for the new version"></div>
        <p><button>Add version</button> ${nonOperational('No upload and no version is created.')}</p></section>`
    : deniedMutation(OP.DOC_ADD);

  $('documents-body').innerHTML = stateBlock +
    `<h2>${esc(d.id)} · ${esc(lang === 'en' ? d.name : lang === 'vi' ? d.nameVi : d.nameVi + ' — ' + d.name)}</h2>
     <p class="count-note">${d.versions.length} version(s) · current: <code>${esc(current ? current.v : 'none')}</code></p>` +
    lineage + signature + addVersion + promote +
    provenanceNote('Version numbers, CURRENT and SUPERSEDED status and every reference binding are transcribed from Atlas. The date and author of a version are shown only where Atlas records the event that added it; everywhere else they are reported as not supplied rather than invented.');
}

/* ── 12. SCR-09 filing tracker ───────────────────────────────────────── */
function renderFiling() {
  $('filing-authority').innerHTML = authorityStrip('SCR-09', [OP.READ, OP.FILING_OBS, OP.FILING_NEG]);
  if (!hasMatterAccess()) { $('filing-body').innerHTML = accessLostPanel('filing'); return; }
  const sel = $('filing-select');
  if (!sel.options.length) sel.innerHTML = fx.filings.map(f => `<option value="${esc(f.id)}">${esc(f.id)} · subject ${esc(f.subject)}</option>`).join('');
  const f = filingById[sel.value] || fx.filings[0];
  const path = $('filing-path').value;
  const scenario = path === 'actual' ? null : fx.filingScenarios[path];
  const stageIdx = fx.filingStages.indexOf(f.stage);

  const stepper = `<ol class="stepper" data-od-id="filing-stepper">${fx.filingStages.map((s, i) => {
    const cls = i < stageIdx ? 'done' : i === stageIdx ? 'current' : 'future';
    return `<li class="${cls}"><span class="stage-name">${esc(s)}</span>${esc(i < stageIdx ? 'recorded' : i === stageIdx ? 'current stage' : 'not reached')}</li>`;
  }).join('')}</ol>
  <p class="meta">The stage is a filing's own axis. It is not execution and not verification: ${esc(f.id)} is stage <strong>${esc(f.stage)}</strong>, execution <strong>${esc(f.exec)}</strong>, verification <strong>${esc(f.ver)}</strong>.</p>`;

  const checklist = `<section class="panel" data-od-id="filing-checklist"><h2>Package checklist</h2>
    <div class="table-scroll"><table><thead><tr><th scope="col">Criterion</th><th scope="col">State</th><th scope="col">Evidence</th></tr></thead><tbody>
    ${f.checklist.map(c => `<tr><td>${esc(c.item)}</td>
      <td>${pill(c.state === 'SATISFIED' ? 'completed' : c.state === 'NOT_APPLICABLE' ? 'neutral' : 'waiting', c.state)}</td>
      <td>${esc(c.evidence || 'not supplied')}</td></tr>`).join('')}</tbody></table></div>
    <p class="meta">A criterion that has not been declared is shown as not declared. It is never shown as satisfied or as not-applicable without a recorded applicability reason.</p>
    ${provenanceNote(f.checklistSrc || '')}</section>`;

  const observations = `<section class="panel" data-od-id="filing-observations"><h2>Submission, receipt and outcome</h2>
    <p class="meta">Three separate observations. None of them implies the next.</p>
    <dl class="kv">
      <dt>Submitted versions</dt><dd>${f.submittedVersions.length
        ? f.submittedVersions.map(v => `<code>${esc(v.document)} ${esc(v.version)}</code> · submission reference ${v.reference ? esc(v.reference) : '<small>not supplied in the fixture</small>'} · <time>${esc(v.submittedAt)}</time>`).join('<br>')
        : 'Nothing has been submitted for this filing.'}</dd>
      <dt>Receipt</dt><dd>${f.receipt ? `${esc(f.receipt.evidence)} recorded by ${esc(f.receipt.recordedBy)} at <time>${esc(f.receipt.recordedAt)}</time><br><small>${esc(f.receipt.note)}</small>` : 'No acknowledgement has been recorded.'}</dd>
      <dt>Authority outcome</dt><dd>${f.outcome ? esc(f.outcome) : '<strong>Not issued.</strong> A receipt is not an outcome, and no approval is inferred from silence.'}</dd>
      <dt>Accountable wait</dt><dd>${f.waiting ? `Waiting on ${esc(f.waiting.party)} since <time>${esc(f.waiting.since)}</time> · internal owner ${esc(f.waiting.accountableInternalOwner)} via <button data-record="${esc(f.waiting.followUp)}">${esc(f.waiting.followUp)}</button><br><small>${esc(f.waiting.note)}</small>` : 'No external wait is recorded.'}</dd>
      <dt>Subject requirement</dt><dd><button data-record="${esc(f.subject)}">${esc(f.subject)}</button></dd>
    </dl></section>`;

  const cycles = scenario
    ? `<section class="panel" data-od-id="filing-cycles"><h2>${esc(scenario.label)} ${supplied('Atlas stops at Authority Review; everything in this panel is a design-supplied scenario.')}</h2><p>${esc(scenario.intro)}</p>
        ${scenario.cycles.map(c => `<div class="row"><h3>Supplement cycle ${esc(c.cycle)}</h3>
          <dl class="kv"><dt>Request reference</dt><dd><code>${esc(c.request.reference)}</code> received <time>${esc(c.request.receivedAt)}</time></dd>
            <dt>Requested items</dt><dd>${c.request.requestedItems.map(esc).join('<br>')}</dd>
            <dt>Owner / due</dt><dd>${esc(c.request.owner)} · <time>${esc(c.request.due)}</time> · execution ${esc(c.request.execution)}</dd>
            <dt>Response reference</dt><dd><code>${esc(c.response.reference)}</code> submitted <time>${esc(c.response.submittedAt)}</time></dd>
            <dt>Exact responding versions</dt><dd>${c.response.versions.map(v => `<code>${esc(v.document)} ${esc(v.version)}</code>`).join(', ')}</dd>
            <dt>Effect</dt><dd>${esc(c.response.note)}</dd></dl></div>`).join('')}
        ${scenario.paths ? `<div class="table-scroll"><table><thead><tr><th scope="col">Path</th><th scope="col">Who may act</th><th scope="col">Effect</th></tr></thead><tbody>
          ${scenario.paths.map(p => `<tr><td>${esc(p.path)}</td><td>${esc(p.authority)}</td><td>${esc(p.effect)}</td></tr>`).join('')}</tbody></table></div>` : ''}
        ${scenario.outcome ? `<div class="feedback"><p><strong>Outcome:</strong> ${esc(scenario.outcome.observation)} — stage ${esc(scenario.outcome.stage)}, execution ${esc(scenario.outcome.execution)}, verification ${esc(scenario.outcome.verification)}.</p><p class="meta">${esc(scenario.outcome.note)}</p></div>` : ''}
      </section>`
    : `<section class="panel" data-od-id="filing-cycles"><h2>Supplement cycles</h2>
        <p>${f.cycles.length ? '' : 'No supplement cycle has been recorded for this filing at this snapshot.'}</p>
        <p class="meta">Use the path selector above to inspect the two-cycle, no-supplement and negative-outcome paths. They are labelled scenarios, not Atlas state.</p></section>`;

  const actions = `<section class="panel" data-od-id="filing-actions"><h2>Recording the next observation</h2>
    ${can(OP.FILING_OBS)
      ? `<p>Stage observations are available to ${esc(ROLE_LABEL[role])} under the package guards.</p>
         <div class="field"><label for="filing-ref">Observation reference</label><input id="filing-ref" type="text" placeholder="Authority reference for this observation"></div>
         <p><button class="primary">Record observation</button> ${nonOperational('No stage advances and no file is sent.')}</p>`
      : deniedMutation(OP.FILING_OBS)}
    <h3>Rejection, withdrawal, correction and reopen</h3>
    ${can(OP.FILING_NEG)
      ? `<p>These are Matter OWNER operations, each needing an explicit reason and its own proof. None of them is an approval.</p>
         <p><button>Record rejection</button> <button>Record withdrawal</button> <button>Append correction</button> <button>Reopen</button> ${nonOperational('No outcome is recorded.')}</p>`
      : deniedMutation(OP.FILING_NEG)}</section>`;

  $('filing-body').innerHTML = `<h2>${esc(f.id)} · authority ${esc(f.authority)}</h2>` + stepper + checklist + observations + cycles + actions;
}

/* ── 13. SCR-10 bulk metadata editor ─────────────────────────────────── */
const BULK_FIELDS = [
  {key: 'title', label: 'Title', clearable: false, clearWhy: 'A title cannot be cleared; every record keeps a readable identity.'},
  {key: 'description', label: 'Description', clearable: true, clearWhy: 'Clearing a description is permitted and is recorded as an explicit clear, not as an empty set.'},
  {key: 'owner', label: 'Assigned internal owner', clearable: false, clearWhy: 'An active internal owner cannot be cleared; reassign instead, so accountability is never dropped silently.'},
  {key: 'due', label: 'Due date', clearable: true, clearWhy: 'Clearing a due date is permitted; the record then shows as unassessed for schedule rather than on track.'}
];
const bulkIntent = {title: {mode: 'unchanged', value: ''}, description: {mode: 'unchanged', value: ''}, owner: {mode: 'unchanged', value: ''}, due: {mode: 'unchanged', value: ''}};
let bulkResult = null;
const bulkCurrent = (r, key) => key === 'title' ? titleOf(r) : key === 'description' ? (r.description || '') : key === 'owner' ? (r.owner || '') : (r.dueISO || '');

function renderBulk() {
  $('bulk-authority').innerHTML = authorityStrip('SCR-10', [OP.READ, OP.BULK]);
  if (!hasMatterAccess()) { $('bulk-body').innerHTML = accessLostPanel('bulk'); return; }
  const visible = new Set(visibleRecordsSafe().map(r => r.id));
  const ids = [...selected];
  const hidden = ids.filter(id => !visible.has(id));
  const rows = ids.map(lookup).filter(Boolean);

  if (!ids.length) {
    $('bulk-body').innerHTML = `<section class="panel"><p><strong>No row is selected.</strong></p>
      <p>A bulk edit always names the exact records it will touch. There is no “apply to everything matching the filter” path, because a filter can change under you between preview and execution.</p>
      <p><button data-view="grid" class="primary">Return to the Grid and select rows</button></p></section>`;
    return;
  }
  const fieldControls = BULK_FIELDS.map(f => {
    const st = bulkIntent[f.key];
    return `<div class="field" data-od-id="bulk-field-${esc(f.key)}">
      <label for="bulk-mode-${esc(f.key)}">${esc(f.label)}</label>
      <select id="bulk-mode-${esc(f.key)}" data-bulk-mode="${esc(f.key)}">
        <option value="unchanged" ${st.mode === 'unchanged' ? 'selected' : ''}>Unchanged (default)</option>
        <option value="set" ${st.mode === 'set' ? 'selected' : ''}>Set to…</option>
        <option value="clear" ${st.mode === 'clear' ? 'selected' : ''} ${f.clearable ? '' : 'disabled'}>Clear${f.clearable ? '' : ' — not permitted'}</option>
      </select>
      ${st.mode === 'set' ? `<input id="bulk-value-${esc(f.key)}" data-bulk-value="${esc(f.key)}" type="text" value="${esc(st.value)}" placeholder="New value for every selected row">` : ''}
      <p class="meta">${esc(f.clearWhy)}</p></div>`;
  }).join('');

  const preview = rows.map(r => {
    const changed = BULK_FIELDS.filter(f => bulkIntent[f.key].mode !== 'unchanged');
    return `<div class="row" data-od-id="bulk-preview-${esc(r.id)}"><strong><code>${esc(r.id)}</code></strong> · revision ${esc(r.revision)}
      ${changed.length ? changed.map(f => {
        const st = bulkIntent[f.key];
        const proposed = st.mode === 'clear' ? '(cleared)' : st.value;
        return `<div class="diffpair" style="margin:8px 0;"><div><span class="diff-label">Before · ${esc(f.label)}</span>${esc(bulkCurrent(r, f.key) || '(empty)')}</div>
          <div><span class="diff-label">Proposed · ${esc(f.label)}</span>${esc(proposed || '(empty)')}</div></div>`;
      }).join('') : '<p class="meta">No field is set to change, so this row would not be touched at all.</p>'}</div>`;
  }).join('');

  const resultBlock = bulkResult ? `<section class="panel" data-od-id="bulk-result"><h2>Result specimen ${supplied('Declared outcomes, not a run.')}</h2>
    <div class="feedback warning"><p><strong>Nothing was sent and nothing changed.</strong> The outcomes below are declared by this fixture so that the succeeded, failed and unknown presentations can be read side by side. No row was written, audited or reconciled.</p></div>
    <p><strong>${bulkResult.ok.length} would succeed · ${bulkResult.fail.length} would fail · ${bulkResult.unknown.length} would be unknown.</strong> That is ${esc(bulkResult.ok.length + bulkResult.fail.length + bulkResult.unknown.length)} rows, matching the ${ids.length} row(s) you selected.</p>
    <div class="table-scroll"><table><thead><tr><th scope="col">Record</th><th scope="col">Outcome</th><th scope="col">What this means</th><th scope="col">Your draft</th></tr></thead><tbody>
      ${bulkResult.ok.map(id => `<tr class="result-row-ok"><td><code>${esc(id)}</code></td><td>Succeeded</td><td>In the product this row would be changed and audited on its own, independently of every other row.</td><td>Would be cleared, because it was applied.</td></tr>`).join('')}
      ${bulkResult.fail.map(x => `<tr class="result-row-fail"><td><code>${esc(x.id)}</code></td><td>Failed</td><td>${esc(x.why)}</td><td><strong>Kept.</strong> Reopen this row to fix and resubmit just this row.</td></tr>`).join('')}
      ${bulkResult.unknown.map(x => `<tr class="result-row-unknown"><td><code>${esc(x.id)}</code></td><td>Unknown</td><td>${esc(x.why)}</td><td><strong>Kept</strong>, together with the attempt identity needed to reconcile it.</td></tr>`).join('')}
    </tbody></table></div>
    ${bulkResult.unknown.length ? `<div class="feedback warning"><p><strong>Reconcile before retrying the unknown row(s).</strong> We do not know whether they were applied. Retrying blind could double-apply a change, and treating them as failed could quietly lose one.</p>
      <p><button class="primary">Reconcile ${esc(bulkResult.unknown.map(x => x.id).join(', '))}</button> <button disabled>Retry unknown rows</button> <small>Retry stays disabled until reconciliation returns an answer.</small> ${nonOperational('No reconciliation call is made.')}</p></div>` : ''}
    <p class="meta">A failed or unknown row never rolls back a row that succeeded: each row is its own atomic mutation with its own audit entry.</p></section>` : '';

  $('bulk-body').innerHTML =
    `<section class="panel" data-od-id="bulk-scope"><h2>Scope</h2>
      <p><strong>Exact selected IDs (${ids.length}):</strong> ${esc(ids.join(', '))}</p>
      <p class="meta">${hidden.length ? `${hidden.length} of these row(s) are currently hidden by the Grid filter: ${esc(hidden.join(', '))}. They are still in scope, because scope is the selection, not the view.` : 'Every selected row is visible under the current Grid filter.'}</p>
      <p class="meta">Only four fields may be edited in bulk: title, description, assigned internal owner and due date. Type, links, waiting state, the five state axes, criteria, roles, verification, applicability, promotion and deletion are all out of scope here by design.</p></section>` +
    (can(OP.BULK)
      ? `<section class="panel" data-od-id="bulk-fields"><h2>Changes to apply</h2>${fieldControls}</section>
         <section class="panel" data-od-id="bulk-preview"><h2>Before and proposed, per row</h2>${preview}
           <p><button id="bulk-run" class="primary">Show the result specimen for this selection</button> ${nonOperational('No command is issued and nothing is saved.')}</p>
           <p class="meta">At execution each row is rechecked for your current rights and its current revision; a row whose revision moved is refused rather than overwritten.</p></section>`
      : `<section class="panel"><h2>Changes to apply</h2>${deniedMutation(OP.BULK)}
         <p class="meta">You can still read the selection and the before values above; only the mutation is withheld.</p></section>`) +
    resultBlock;
}
function visibleRecordsSafe() { try { return visibleRecords(); } catch (e) { return records; } }
function runBulkPreview() {
  const ids = [...selected];
  if (!ids.length) return;
  /* Deterministic specimen outcomes derived from the fixture, not random:
     a row whose revision guard would fail, and a row whose response is lost. */
  const fail = ids.length > 1 ? [{id: ids[1], why: 'The row moved to a newer revision after this preview was built, so the command was refused instead of overwriting it.'}] : [];
  const unknown = ids.length > 2 ? [{id: ids[2], why: 'The response to this row’s command was lost. No rollback is asserted, and the outcome is not guessed from a later read.'}] : [];
  const taken = new Set([...fail.map(x => x.id), ...unknown.map(x => x.id)]);
  bulkResult = {ok: ids.filter(id => !taken.has(id)), fail, unknown};
  renderBulk();
}

/* ── 14. SCR-11 structured import ────────────────────────────────────── */
let importStep = 1;
const IMPORT_STEPS = [
  {n: 1, title: 'File intent', detail: 'Declare the file and its format. Nothing is read, parsed, uploaded or executed.'},
  {n: 2, title: 'Column, type, date, key and reference mapping', detail: 'Bind each source column to a typed target field.'},
  {n: 3, title: 'Validation and group preview', detail: 'Connected groups validate together; independent groups validate alone.'},
  {n: 4, title: 'Result and recovery', detail: 'Honest per-group outcome with a route back for anything rejected.'}
];
function renderImport() {
  $('import-authority').innerHTML = authorityStrip('SCR-11', [OP.READ, OP.IMPORT]);
  $('import-steps').innerHTML = IMPORT_STEPS.map(s =>
    `<li ${s.n === importStep ? 'aria-current="step"' : ''}><strong>Step ${s.n} · ${esc(s.title)}</strong>${esc(s.detail)}</li>`).join('');
  if (!hasMatterAccess()) { $('import-body').innerHTML = accessLostPanel('import'); return; }
  if (!can(OP.IMPORT)) { $('import-body').innerHTML = deniedMutation(OP.IMPORT) + '<p class="meta">The mapping and preview below are withheld because starting an import is the operation being denied, not a read of existing data.</p>'; return; }
  const imp = fx.importFixture;
  let body = '';
  if (importStep === 1) {
    body = `<section class="panel"><h2>File intent</h2>
      <dl class="kv"><dt>Declared file</dt><dd><code>${esc(imp.file.declaredName)}</code></dd>
        <dt>Declared format</dt><dd>${esc(imp.file.declaredFormat)} · CSV and XLSX are both accepted</dd>
        <dt>Declared rows / sheets</dt><dd>${esc(imp.file.declaredRows)} rows · ${esc(imp.file.declaredSheets)} sheet</dd></dl>
      <div class="feedback"><p>${esc(imp.file.note)}</p>
        <p>In the product, a worksheet is parsed as data only: formulas and macros are never evaluated and embedded links are never fetched. A value that begins with <code>=</code>, <code>+</code>, <code>-</code> or <code>@</code> is treated as literal text, both on import and on export.</p></div>
      <p><button class="primary" data-import-step="2">Continue to mapping</button> ${nonOperational('No file is opened.')}</p></section>`;
  } else if (importStep === 2) {
    body = `<section class="panel"><h2>Mapping</h2>
      <div class="table-scroll"><table><thead><tr><th scope="col">Source column</th><th scope="col">Target field</th><th scope="col">Type</th><th scope="col">Required</th></tr></thead><tbody>
      ${imp.targetFields.map(t => `<tr><td><code>${esc(t.source)}</code></td><td>${esc(t.field)}</td><td>${esc(t.type)}</td>
        <td>${t.required ? 'Yes' : 'No'}${t.note ? `<small>${esc(t.note)}</small>` : ''}</td></tr>`).join('')}
      </tbody></table></div>
      <p class="meta">Dates carry their declared timezone (UTC+07) rather than being guessed from the machine running the import. Scoped references are validated against this Matter, never trusted from the file.</p>
      <p><button data-import-step="1">Back</button> <button class="primary" data-import-step="3">Validate</button> ${nonOperational('Nothing is parsed.')}</p></section>`;
  } else if (importStep === 3) {
    body = `<section class="panel"><h2>Validation and group preview</h2>
      ${imp.groups.map(g => `<div class="row" data-od-id="import-group-${esc(g.group)}">
        <h3>${esc(g.group)} · ${esc(g.label)} ${pill(g.verdict === 'REJECTED' ? 'blocked' : g.verdict === 'MIXED' ? 'waiting' : 'ready', g.verdict.replace('_', ' '))}</h3>
        <p class="meta">${esc(g.connected ? 'Connected group: its rows reference each other, so they stand or fall together.' : 'Independent rows: each is judged on its own.')}</p>
        <p>${esc(g.reason)}</p>
        <ul>${g.rowDetail.map(r => `<li><code>${esc(r.row)}</code> — ${esc(r.issue || 'no issue found')}</li>`).join('')}</ul></div>`).join('')}
      <p><button data-import-step="2">Back to mapping</button> <button class="primary" data-import-step="4">See the result</button></p></section>`;
  } else {
    const rejected = imp.groups.filter(g => g.verdict === 'REJECTED');
    const accepted = imp.groups.filter(g => g.verdict === 'ACCEPTED_PREVIEW');
    const mixed = imp.groups.filter(g => g.verdict === 'MIXED');
    body = `<section class="panel"><h2>Result</h2>
      <p><strong>${accepted.length} group(s) would be applied, ${rejected.length} rejected whole, ${mixed.length} reported row by row.</strong></p>
      <div class="table-scroll"><table><thead><tr><th scope="col">Group</th><th scope="col">Rows</th><th scope="col">Outcome</th><th scope="col">Recovery</th></tr></thead><tbody>
      ${imp.groups.map(g => `<tr class="${g.verdict === 'REJECTED' ? 'result-row-fail' : g.verdict === 'MIXED' ? 'result-row-unknown' : 'result-row-ok'}">
        <td><code>${esc(g.group)}</code></td><td>${esc(g.rows.join(', '))}</td><td>${esc(g.verdict.replace('_', ' '))}</td>
        <td>${esc(g.verdict === 'REJECTED' ? 'Fix the named cell in the source file and re-import this group. Rows in an independent valid group are unaffected by this rejection.' : g.verdict === 'MIXED' ? 'Decide each reported row explicitly; a changed-content conflict is never resolved by overwriting.' : 'Rights and revision are rechecked per row at execution.')}</td></tr>`).join('')}
      </tbody></table></div>
      <div class="feedback"><p>${esc(imp.resultNote)}</p>
        <p>An imported verification claim stays a claim. Import never produces a VERIFIED state and never grants a role.</p></div>
      <p><button data-import-step="3">Back to validation</button> <button class="primary">Apply the accepted groups</button> ${nonOperational('Nothing is applied.')}</p></section>`;
  }
  $('import-body').innerHTML = body;
}

/* ── 15. SCR-13 event history ────────────────────────────────────────── */
let histPage = 0, histFilter = '', histEntity = 'all', histReturn = null;
function historyMatches() {
  const q = histFilter.trim().toLocaleLowerCase();
  return fx.events.filter(e =>
    (histEntity === 'all' || e.entity.includes(histEntity)) &&
    (!q || [e.id, e.actor, e.entity, e.operation, e.reason, e.correlation].join(' ').toLocaleLowerCase().includes(q)));
}
function renderHistory() {
  $('history-authority').innerHTML = authorityStrip('SCR-13', [OP.HISTORY, OP.EXPORT]);
  if (!hasMatterAccess()) { $('history-body').innerHTML = accessLostPanel('history'); return; }
  const entSel = $('hist-entity');
  if (entSel.options.length <= 1) {
    const ents = [...new Set(fx.events.flatMap(e => e.entity.split(' / ')))].sort();
    entSel.innerHTML = '<option value="all">All entities in scope</option>' + ents.map(x => `<option value="${esc(x)}">${esc(x)}</option>`).join('');
  }
  const all = historyMatches();
  const size = Number($('hist-page').value);
  const pages = Math.max(1, Math.ceil(all.length / size));
  if (histPage >= pages) histPage = pages - 1;
  const page = all.slice(histPage * size, histPage * size + size);
  const body = all.length
    ? `<ul class="timeline" data-od-id="history-timeline">${page.map(e => `<li>
        <div class="evt-head"><strong>${esc(e.operation)}</strong><code>${esc(e.id)}</code>
          <span class="meta">actor ${esc(e.actor)}</span><span class="meta">correlation <code>${esc(e.correlation)}</code></span></div>
        <p class="meta">recorded <time>${esc(e.recordedAt)}</time> · effective <time>${esc(e.effectiveAt)}</time>${e.causedBy ? ` · caused by <button class="screen-link" data-hist-focus="${esc(e.causedBy)}">${esc(e.causedBy)}</button>` : ''}</p>
        <p><strong>Entity:</strong> ${esc(e.entity)}</p>
        <div class="diffpair"><div><span class="diff-label">Before</span>${esc(e.before)}</div><div><span class="diff-label">After</span>${esc(e.after)}</div></div>
        <p><strong>Reason:</strong> ${esc(e.reason)}</p></li>`).join('')}</ul>
       <p>Showing ${esc(histPage * size + 1)}–${esc(Math.min(all.length, histPage * size + size))} of ${esc(all.length)} event(s) in scope.
         <button id="hist-prev" ${histPage === 0 ? 'disabled' : ''}>Previous</button>
         <button id="hist-next" ${histPage >= pages - 1 ? 'disabled' : ''}>Next</button></p>`
    : `<section class="panel"><p><strong>No event in this Matter's history matches this filter.</strong></p>
        <p>History still exists for this Matter; search here covers event ID, actor, entity, operation, reason and correlation.</p>
        <p><button id="hist-reset-inline">Reset this history filter</button></p></section>`;
  $('history-body').innerHTML = body +
    `<p class="meta">History is append-only. No role may edit or delete a prior entry; a correction is appended with its own actor, time and reason.</p>
     ${provenanceNote(fx.eventsSrc)}
     <section class="panel" data-od-id="security-log"><h2>Restricted security log — separate surface</h2>
       <p class="meta">${esc(fx.securityLog.access)}</p>
       <div class="table-scroll"><table><thead><tr><th scope="col">Entry</th><th scope="col">Recorded</th><th scope="col">Class</th><th scope="col">What this surface shows</th></tr></thead><tbody>
       ${fx.securityLog.entries.map(s => `<tr class="security"><td><code>${esc(s.id)}</code></td><td><time>${esc(s.recordedAt)}</time></td><td>${esc(s.class)}</td>
         <td>${esc(s.summary)}<small>${esc(s.detailVisibility)}</small></td></tr>`).join('')}</tbody></table></div>
       <p class="meta">These rows are listed here only to show that they live apart. They are not mixed into the domain timeline above and never travel with a domain export.</p>
       ${provenanceNote(fx.securityLog.src)}</section>`;
}

/* ── 16. SCR-12 draft brief ──────────────────────────────────────────── */
const inWindow = (t, t1, t2) => Date.parse(t) > Date.parse(t1) && Date.parse(t) <= Date.parse(t2);
function previewBrief() {
  $('brief-authority').innerHTML = authorityStrip('SCR-12', [OP.READ, OP.EXPORT]);
  if (!hasMatterAccess()) {
    $('brief-changes').innerHTML = accessLostPanel('brief');
    $('brief-outstanding').innerHTML = ''; $('outstanding-limit').textContent = '';
    return;
  }
  const a = $('t1').value, b = $('t2').value, t1 = a + ':00+07:00', t2 = b + ':00+07:00';
  const invalid = !a || !b || !Number.isFinite(Date.parse(t1)) || !Number.isFinite(Date.parse(t2)) || Date.parse(t1) > Date.parse(t2);
  $('window-error').textContent = invalid ? 'Choose valid endpoints with t1 no later than t2. No draft is generated.' : '';
  $('t1').setAttribute('aria-invalid', String(invalid));
  $('t2').setAttribute('aria-invalid', String(invalid));
  if (invalid) {
    $('brief-changes').textContent = 'The window is invalid, so no narrative preview is produced.';
    $('brief-outstanding').textContent = '';
    $('outstanding-limit').textContent = 'No outstanding result is generated for an invalid window.';
    return;
  }
  const chosen = fx.events.filter(e => inWindow(e.recordedAt, t1, t2));
  $('brief-changes').innerHTML = chosen.length
    ? chosen.map(e => `<div class="row"><code>${esc(e.id)}</code> <time>${esc(e.recordedAt)}</time><p>${esc(e.operation)} — ${esc(e.entity)}</p><p class="meta">${esc(e.reason)}</p></div>`).join('')
    : '<p>No change falls in this narrative window. Work may still be outstanding.</p>';
  const blocked = records.filter(r => derive.dependencyOf(r.id).state === 'BLOCKED').map(r => r.id);
  const missing = fx.evidenceRequirements.filter(e => e.absence && lookup(e.subject)).map(e => `${e.id} on ${e.subject}`);
  $('brief-outstanding').innerHTML = `<p><strong>Blocked records (${blocked.length}):</strong> ${esc(blocked.join(', '))}</p>
    <p><strong>Evidence requirements without supplied evidence (${missing.length}):</strong> ${esc(missing.join('; '))}</p>
    <p><strong>Milestones:</strong> ${MILESTONES.map(m => `${m.id} ${derive.milestone(m.required).state}`).join(', ')}.</p>
    <p class="meta">Outstanding is what is still true at t2. It is deliberately kept apart from what changed inside the window: the DD gap is outstanding, not newly created.</p>`;
  $('outstanding-limit').textContent = Date.parse(t2) === Date.parse(data.asOf)
    ? 'Outstanding is shown only for the supplied canonical T0. Recorded-time report provenance remains a dependency.'
    : 'Outstanding at the chosen t2 is unavailable: this fixture supplies the T0 state only, and a historical snapshot is not inferred.';
}

/* ── 17. Golden Workflow walkthrough ─────────────────────────────────── */
function renderGW() {
  const gw = fx.goldenWorkflows.find(g => g.id === $('gw-select').value) || fx.goldenWorkflows[0];
  $('gw-body').innerHTML =
    `<h2>${esc(gw.id)} · ${esc(gw.name)} <small>(acceptance ${esc(gw.acceptance)})</small></h2>
     <p class="count-note">Canonical sequence, all ${gw.sequence.length} stages: ${esc(gw.sequence.join(' → '))}</p>` +
    gw.stages.map((s, i) => `<section class="gw-stage" data-od-id="gw-${esc(gw.id)}-${i + 1}">
      <span class="gw-seq">Stage ${i + 1} of ${gw.stages.length} · ${esc(s.screen)}</span>
      <h3>${esc(s.stage)}</h3>
      <dl class="kv"><dt>Where you work</dt><dd>${esc(s.nav)}</dd>
        <dt>What is recorded</dt><dd>${esc(s.do)}</dd>
        <dt>Atlas excerpt</dt><dd>${esc(s.atlas)} <small>An example drawn from the fixture, not a substitute for the full journey.</small></dd>
        <dt>Guard</dt><dd>${esc(s.guard)}</dd></dl></section>`).join('') +
    '<p class="meta">Every stage of all three sequences is listed. Reaching a later stage in the product requires recorded observations; this concept never advances one.</p>';
}

/* ── 18. Screen states specimen ──────────────────────────────────────── */
const STATE_DESC = {
  loading: {title: 'Loading', badge: 'neutral'},
  empty: {title: 'Empty', badge: 'neutral'},
  no_match: {title: 'No match', badge: 'neutral'},
  unavailable: {title: 'Unavailable', badge: 'blocked'},
  forbidden: {title: 'Forbidden', badge: 'blocked'},
  stale: {title: 'Stale revision', badge: 'waiting'},
  conflict: {title: 'Precondition / concurrency failure', badge: 'blocked'},
  partial: {title: 'Partial success', badge: 'waiting'},
  recovery: {title: 'Recovery path', badge: 'ready'}
};
const SCREEN_STATE_TEXT = {
  loading: 'An accessible progress indicator with no layout shift. Nothing is named or counted before access is confirmed; controls stay inert until data arrives.',
  empty: 'This scope genuinely holds no record yet. Guidance explains how to start or how to request scope, and no placeholder data is drawn.',
  no_match: 'This screen’s own search or filter matched nothing. The reset control clears this screen’s filter and stays on this screen; it never redirects to another one.',
  unavailable: 'A dependency could not be evaluated. The honest message appears; nothing falls back to zero, READY or OK.',
  forbidden: 'The role may read here but may not perform this operation. The record stays visible and read-only, and only the specific control is withheld.',
  stale: 'The server revision moved while this screen was open. The draft is preserved, only readable fields are compared, and the route forward is refresh-and-rebase.',
  conflict: 'A precondition was absent (428) or stale (412). These are different conditions with different recovery, and neither is a blind overwrite.',
  partial: 'A multi-row operation finished with mixed outcomes. Succeeded, failed and unknown rows are counted and named separately, and failed drafts are kept.',
  recovery: 'The guided path back: restore the draft, rebase onto the accepted revision, reconcile anything unknown, and only then re-enable the command.'
};
function renderStateSpecimen() {
  const sel = $('state-screen-select');
  if (!sel.options.length) sel.innerHTML = fx.screens.map(s => `<option value="${esc(s.id)}" ${s.id === 'SCR-03' ? 'selected' : ''}>${esc(s.id)} · ${esc(s.name)}</option>`).join('');
  const scr = fx.screens.find(s => s.id === sel.value) || fx.screens[0];
  const st = $('state-state-select').value;
  const d = STATE_DESC[st];
  const reachable = scr.view && scr.view !== 'modal';
  $('state-preview-panel').innerHTML =
    `<div style="display:flex; justify-content:space-between; align-items:center; gap:12px; flex-wrap:wrap; margin-bottom:12px;">
       <h3>${esc(scr.id)} · ${esc(scr.name)} · ${esc(d.title)}</h3>${pill(d.badge, st.replace('_', ' '))}</div>
     <dl class="authority"><div><dt>Personas</dt><dd>${esc(scr.personas)}</dd></div>
       <div><dt>Scoped read roles</dt><dd>${esc(scr.readRoles)}</dd></div>
       <div><dt>Operation authority</dt><dd>${esc(scr.operations)}</dd></div></dl>
     <div class="feedback"><p><strong>Contract for this state:</strong> ${esc(SCREEN_STATE_TEXT[st])}</p></div>
     <div class="state-card"><h4>Where to see it for real</h4>
       ${reachable
        ? `<p>${esc(scr.id)} is a working surface in this concept. Open it and drive the state from its own controls rather than reading a card about it.</p>
           <p><button data-view="${esc(scr.view)}" class="primary">Open ${esc(scr.id)}</button>
           ${st === 'forbidden' || st === 'stale' ? '<span class="meta"> Set the fixture role, or the screen’s own state selector, to reach this state.</span>' : ''}</p>`
        : `<p>${esc(scr.id)} is a drawer. Open any record from the Grid or Control Room to reach it; its states are shown inside the drawer in context.</p>
           <p><button data-view="grid">Open the Grid and choose a record</button></p>`}
     </div>`;
}

/* ── 19. view switching and events ───────────────────────────────────── */
const VIEWS = ['session', 'control', 'grid', 'mine', 'waiting', 'documents', 'filing', 'bulk', 'import', 'brief', 'history', 'gw', 'states', 'errors'];
const RENDER = {
  session: renderSession, control: renderControl, grid: renderGrid, mine: renderMyActions,
  waiting: renderWaiting, documents: renderDocuments, filing: renderFiling, bulk: renderBulk,
  import: renderImport, brief: previewBrief, history: renderHistory, gw: renderGW,
  states: renderStateSpecimen, errors: renderErrors
};
function showView(next) {
  if (!VIEWS.includes(next)) return;
  view = next;
  VIEWS.forEach(name => { const el = $('view-' + name); if (el) el.hidden = name !== next; });
  document.querySelectorAll('nav [data-view]').forEach(b => {
    if (b.dataset.view === next) b.setAttribute('aria-current', 'page'); else b.removeAttribute('aria-current');
  });
  if (RENDER[next]) RENDER[next]();
  $('main').focus({preventScroll: true});
}
/* Every screen renders, including hidden ones, and nothing swallows a failure:
   a broken screen must be visible as broken, not quietly blank. */
function renderAll() { VIEWS.forEach(v => { if (RENDER[v]) RENDER[v](); }); }

document.addEventListener('click', e => {
  const b = e.target.closest('button');
  if (!b) return;
  if (b.disabled) return;
  if (b.dataset.view) { showView(b.dataset.view); return; }
  if (b.dataset.record) { openRecord(b.dataset.record, b); return; }
  if (b.dataset.importStep) { importStep = Number(b.dataset.importStep); renderImport(); return; }
  if (b.dataset.histFocus) { histFilter = b.dataset.histFocus; $('hist-query').value = histFilter; histPage = 0; renderHistory(); return; }
  if (b.id === 'btn-trail-origin') { handleCloseDetail(); return; }
  if (b.id === 'btn-trail-current') { handleBackRecord(); return; }
  if (b.dataset.trailIdx !== undefined) {
    const idx = parseInt(b.dataset.trailIdx, 10);
    if (!Number.isNaN(idx) && idx >= 0 && idx < navStack.length) {
      const target = navStack[idx];
      navStack.splice(idx);
      openRecord(target.id, null, false);
      if (target.mode === 'proof') showProof();
    }
    return;
  }
  if (b.id === 'proof-context') { showProof(); return; }
  if (b.id === 'btn-proof-back-record' || b.id === 'btn-back-record') { handleBackRecord(); return; }
  if (b.id === 'btn-proof-back-prev' || b.id === 'btn-back-prev') { handleBackPrev(); return; }
  if (b.id === 'close-detail') { handleCloseDetail(); return; }
  if (b.id === 'btn-sign-out') {
    /* R8-N01: explicit discard/logout uses the same cleanup path as a real
       access-loss transition. This button still does not contact an
       identity provider or destroy a server session (there is none in this
       concept); it only performs the in-tab draft discard honestly. */
    purgeProtectedState();
    renderAll();
    return;
  }
  if (b.id === 'preview-draft') {
    const value = $('draft-title').value;
    drafts.set(currentRecord, value);
    const bad = !value.trim();
    $('draft-title').setAttribute('aria-invalid', String(bad));
    $('draft-error').textContent = bad ? 'A title must not be blank. Your draft is kept.' : '';
    $('draft-result').textContent = bad
      ? 'No intent preview; correct the field above.'
      : `Local draft intent for ${currentRecord}: ${value} — not saved. A real command needs your current rights, the record's current revision and an accepted command contract.`;
    if (bad) $('draft-title').focus();
    return;
  }
  if (b.id === 'promote-preview') {
    /* R8-N03: target/expected-current are independent; a missing/invalid
       target or a re-selected current version never fabricates a ready
       intent, and a stale expected-current never becomes a force-save. */
    const d = docById[$('doc-select').value] || fx.documents[0];
    const current = d.versions.find(v => v.status === 'CURRENT');
    const target = $('promote-target').value;
    const expected = $('promote-expected').value;
    const reason = $('promote-reason').value.trim();
    const ack = $('promote-impact').checked;
    formDrafts.set('promotion:' + d.id, {target, reason, ack});
    let msg;
    if (!target) {
      msg = 'No target version selected. Nothing is ready to promote yet.';
    } else if (current && target === current.v) {
      msg = `${target} is already current. Selecting the current version as the target is a no-change request, not a promotion.`;
    } else if (!reason) {
      msg = 'A reason for promotion is required before this intent can be marked ready. Your selections are kept.';
    } else if (!ack) {
      msg = 'You must acknowledge the impact shown above before this intent can be marked ready.';
    } else if (current && expected !== current.v) {
      msg = `Your expected current version (${expected}) no longer matches the live current version (${current.v}). The concurrency guard refuses this as a stale write; rebase instead of forcing it through. This refusal is DEPENDENCY_PENDING for the wire — the contract has not yet defined the promote-version operation's status codes.`;
    } else {
      msg = `Local promotion intent for ${d.id}: promote ${target} over expected-current ${expected}, reason recorded, impact acknowledged. DEPENDENCY_PENDING: no command is sent, and no success is simulated, because the contract has not yet defined this operation.`;
    }
    $('promote-result').textContent = msg;
    return;
  }
  if (b.id === 'clear-selection') { selected.clear(); bulkResult = null; renderGrid(); return; }
  if (b.id === 'reset-filter' || b.id === 'reset-filter-inline') {
    $('query').value = ''; $('type').value = 'all'; $('sort').value = 'id'; $('fixture').value = '24';
    renderGrid();
    $('query').focus();
    return;
  }
  if (b.id === 'open-bulk') { showView('bulk'); return; }
  if (b.id === 'bulk-run') { runBulkPreview(); return; }
  if (b.id === 'matter-reset' || b.id === 'matter-reset-inline') {
    sessionFilter = ''; $('matter-query').value = ''; renderSession(); $('matter-query').focus(); return;
  }
  if (b.id === 'hist-reset' || b.id === 'hist-reset-inline') {
    histFilter = ''; histEntity = 'all'; histPage = 0;
    $('hist-query').value = ''; $('hist-entity').value = 'all';
    renderHistory(); $('hist-query').focus(); return;
  }
  if (b.id === 'hist-prev') { histPage = Math.max(0, histPage - 1); renderHistory(); return; }
  if (b.id === 'hist-next') { histPage += 1; renderHistory(); return; }
  if (b.id === 'brief-preview') { previewBrief(); return; }
});

document.addEventListener('input', e => {
  const t = e.target;
  if (t.id === 'query') renderGrid();
  if (t.id === 'matter-query') { sessionFilter = t.value; renderSession(); const el = $('matter-query'); if (el) { el.value = sessionFilter; el.focus(); } }
  if (t.id === 'hist-query') { histFilter = t.value; histPage = 0; renderHistory(); const el = $('hist-query'); if (el) { el.value = histFilter; el.focus(); } }
  if (t.id === 'draft-title' && currentRecord) drafts.set(currentRecord, t.value);
  /* R8-N02: Create Matter title survives view switch / locale switch / re-render. */
  if (t.id === 'new-matter-title') formDrafts.set('new-matter-title', t.value);
  if (t.id === 'promote-reason') {
    const d = docById[$('doc-select').value] || fx.documents[0];
    const key = 'promotion:' + d.id;
    const prev = formDrafts.get(key) || {};
    formDrafts.set(key, Object.assign({}, prev, {reason: t.value}));
  }
  if (t.dataset && t.dataset.bulkValue) { bulkIntent[t.dataset.bulkValue].value = t.value; }
});

document.addEventListener('change', e => {
  const t = e.target;
  if (t.dataset && t.dataset.select) {
    const id = t.dataset.select;
    if (t.checked) selected.add(id); else selected.delete(id);
    document.querySelectorAll('[data-select="' + id + '"]').forEach(c => { c.checked = selected.has(id); });
    document.querySelectorAll('[data-row="' + id + '"]').forEach(r => r.classList.toggle('selected', selected.has(id)));
    bulkResult = null;
    selectionText();
    return;
  }
  if (t.dataset && t.dataset.bulkMode) { bulkIntent[t.dataset.bulkMode].mode = t.value; bulkResult = null; renderBulk(); return; }
  if (t.id === 'promote-target') {
    /* R8-N03: changing the target invalidates any impact acknowledgment
       that was given for a different target; it is never silently reused. */
    const d = docById[$('doc-select').value] || fx.documents[0];
    const key = 'promotion:' + d.id;
    const prev = formDrafts.get(key) || {};
    formDrafts.set(key, Object.assign({}, prev, {target: t.value, ack: false}));
    renderDocuments();
    return;
  }
  if (t.id === 'promote-impact') {
    const d = docById[$('doc-select').value] || fx.documents[0];
    const key = 'promotion:' + d.id;
    const prev = formDrafts.get(key) || {};
    formDrafts.set(key, Object.assign({}, prev, {ack: t.checked}));
    return;
  }
  if (t.id === 'role') {
    /* R8-N01: purge is decided on the real access transition, not on the
       text the denied panel happens to render. A downgrade that keeps
       scoped read (e.g. OWNER -> VIEWER) must not purge; losing Matter
       access entirely (-> REVOKED or -> WS_OWNER_NO_MATTER) must. */
    const hadAccess = lastHasMatterAccess;
    const openId = currentRecord;
    role = t.value;
    const hasAccessNow = hasMatterAccess();
    if (hadAccess && !hasAccessNow) purgeProtectedState();
    lastHasMatterAccess = hasAccessNow;
    renderAll();
    if ($('detail').open && openId) openRecord(openId, null, false);
    return;
  }
  if (t.id === 'density') { density = t.value; $('grid-table').classList.toggle('compact', density === 'compact'); return; }
  if (t.id === 'lang') { lang = t.value; renderAll(); if ($('detail').open && currentRecord) openRecord(currentRecord, null, false); return; }
  if (['type', 'sort', 'fixture'].includes(t.id)) { renderGrid(); return; }
  if (t.id === 'session-state') { renderSession(); return; }
  if (['doc-select', 'doc-state'].includes(t.id)) { renderDocuments(); return; }
  if (['filing-select', 'filing-path'].includes(t.id)) { renderFiling(); return; }
  if (t.id === 'hist-entity') { histEntity = t.value; histPage = 0; renderHistory(); return; }
  if (t.id === 'hist-page') { histPage = 0; renderHistory(); return; }
  if (t.id === 'gw-select') { renderGW(); return; }
  if (['state-screen-select', 'state-state-select'].includes(t.id)) { renderStateSpecimen(); return; }
});

/* Row keyboard navigation. The handler only acts when the row itself has
   focus, so a nested input, textarea, select or an IME composition inside a
   row is never intercepted. */
document.addEventListener('keydown', e => {
  if (e.isComposing || e.keyCode === 229) return;
  const row = e.target.closest ? e.target.closest('[data-row]') : null;
  if (!row || e.target !== row) return;
  if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
    e.preventDefault();
    const next = e.key === 'ArrowDown' ? row.nextElementSibling : row.previousElementSibling;
    if (next && next.focus) next.focus();
  } else if (e.key === 'Enter') {
    e.preventDefault();
    openRecord(row.dataset.row, row);
  }
});

/* Native dismissal (Escape, backdrop) must clean up exactly like the button. */
$('detail').addEventListener('close', () => {
  cleanupModalSession();
  updateTrailUI();
  const replacement = opener && opener.dataset && opener.dataset.record
    ? document.querySelector('[data-record="' + opener.dataset.record + '"]') : null;
  if (opener && opener.isConnected && opener.focus) opener.focus({preventScroll: true});
  else if (replacement) replacement.focus({preventScroll: true});
  else $('main').focus({preventScroll: true});
});

/* ── 20. init ────────────────────────────────────────────────────────── */
renderAll();
showView('control');
