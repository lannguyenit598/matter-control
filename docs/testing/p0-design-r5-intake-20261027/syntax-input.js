
"use strict";
const data=JSON.parse(document.getElementById('atlas-data').textContent);
const records=data.records;
const recordById=Object.fromEntries(records.map(r=>[r.id,r]));
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const eligible=r=>r.type==='action' && !!r.owner && ['NOT_STARTED','IN_PROGRESS'].includes(r.exec) && r.dep==='READY';
const edgeSatisfied=(r,gate)=>!!r && r.dep==='READY' && r.exec==='COMPLETED' && (gate==='completion' || (gate==='proof' && r.ver==='VERIFIED' && r.validProof===true));
const milestone=rs=>!rs?.length?'UNASSESSED':rs.every(r=>r.dep==='READY' && r.exec==='COMPLETED' && ((r.ver==='VERIFIED' && r.validProof===true) || (r.ver==='NOT_REQUIRED' && r.explicitNotRequired===true)))?'READY':'BLOCKED';
const inWindow=(t,t1,t2)=>Date.parse(t)>Date.parse(t1) && Date.parse(t)<=Date.parse(t2);
const timing=r=>['COMPLETED','CANCELLED'].includes(r.exec)||!r.dueISO?'ON_TRACK':Date.parse(r.dueISO)<Date.parse(data.asOf)?'OVERDUE':Date.parse(r.dueISO)<=Date.parse(data.asOf)+48*3600000?'DUE_SOON':'ON_TRACK';
const attention=r=>['RQ-04','AC-05'].includes(r.id)?'CRITICAL':['RQ-02','RQ-06','AC-04','AC-10'].includes(r.id)?'ATTENTION':'NORMAL';
const densityRows=n=>Array.from({length:n},(_,i)=>({id:'DENSITY-'+String(i+1).padStart(3,'0'),type:i%2?'action':'req',label:i%2?'Synthetic work — reconcile the complete supporting document reference before internal follow-up':'Điều kiện tổng hợp — cần giữ đầy đủ lý do và chứng từ được đối chiếu trước khi bàn giao',owner:null,exec:'NOT_STARTED',ver:'UNVERIFIED',dep:null,dueISO:null,ws:'Labelled density fixture',sub:'DENSITY ONLY · no legal relationship or state evaluation supplied'}));
const axes=r=>'<dl class="axes">'+[['Execution',r.exec],['Verification',r.ver],['Dependency',r.dep??'unavailable'],['Timing',r.id.startsWith('DENSITY')?'unavailable':timing(r)],['Attention',r.id.startsWith('DENSITY')?'unavailable':attention(r)]].map(([k,v])=>'<div><dt>'+k+'</dt><dd>'+esc(v)+'</dd></div>').join('')+'</dl>';
const button=r=>'<button data-record="'+esc(r.id)+'"><code>'+esc(r.id)+'</code> · '+esc(r.label)+'</button>';

// State & navigation tracking
const selected=new Set(), drafts=new Map();
let view='control', opener=null, currentRecord=null, detailMode='record';
const navStack=[]; // Navigation history trail [{ id, mode, label }]
let modalOrigin='Control Room';

function originLabel(v){
 const map={
  control:'Control Room',
  grid:'Operational Grid',
  mine:'My Actions Queue',
  waiting:'Waiting On',
  filing:'Filing context',
  brief:'Draft Status Brief',
  transfer:'Data operations',
  states:'Screen States Specimen'
 };
 return map[v]||'Operational Grid';
}

function showView(next){
 view=next;
 for(const name of ['control','grid','mine','waiting','filing','brief','transfer','states']){
  const el=$('view-'+name);
  if(el) el.hidden=name!==next;
 }
 document.querySelectorAll('nav [data-view]').forEach(b=>{if(b.dataset.view===next)b.setAttribute('aria-current','page');else b.removeAttribute('aria-current');});
 if(next==='grid') renderGrid();
 if(next==='mine') renderMyActions();
 if(next==='states') renderStateSpecimen();
 if(next==='transfer')$('bulk-scope').textContent='Explicit selected IDs: '+([...selected].join(', ')||'none; return to Grid and choose rows.');
 $('main').focus({preventScroll:true});
}

function updateTrailUI(){
 const trailEl=$('modal-trail'), backPrevBtn=$('btn-back-prev'), backRecordBtn=$('btn-back-record');
 if(!trailEl) return;
 const parts=['<span class="trail-node">'+esc(modalOrigin)+'</span>'];
 for(const item of navStack){
  parts.push('<span class="trail-sep">/</span><button class="screen-link" data-record="'+esc(item.id)+'">'+esc(item.id)+'</button>'+(item.mode==='proof'?' (Proof)':''));
 }
 if(currentRecord){
  if(detailMode==='proof'){
   parts.push('<span class="trail-sep">/</span><button class="screen-link" data-record="'+esc(currentRecord)+'">'+esc(currentRecord)+'</button>');
   parts.push('<span class="trail-sep">/</span><strong class="trail-node">Proof Context</strong>');
  } else {
   parts.push('<span class="trail-sep">/</span><strong class="trail-node">'+esc(currentRecord)+'</strong>');
  }
 }
 trailEl.innerHTML=parts.join(' ');

 if(detailMode==='proof'){
  backRecordBtn.style.display='inline-block';
  backRecordBtn.textContent='← Return to '+esc(currentRecord);
 } else {
  backRecordBtn.style.display='none';
 }

 if(navStack.length>0){
  const prev=navStack[navStack.length-1];
  backPrevBtn.style.display='inline-block';
  backPrevBtn.textContent='← Back to '+esc(prev.id);
 } else {
  backPrevBtn.style.display='none';
 }
}

function cleanupModalSession(){
 navStack.length=0;
 currentRecord=null;
 detailMode='record';
}

function openRecord(id,trigger,pushHistory=true){
 const r=recordById[id];
 if(!$('detail').open){
  cleanupModalSession();
  opener=trigger??document.activeElement;
  modalOrigin=originLabel(view);
 } else if(pushHistory && currentRecord && currentRecord!==id){
  navStack.push({id:currentRecord,mode:detailMode});
 }

 if(!r){
  currentRecord=null;detailMode='density';$('detail-title').textContent=id+' · labelled density specimen';
  $('detail-body').innerHTML='<p>Typography/reachability fixture only; no Atlas relationship, proof or authoritative state supplied. Use Grid filters to inspect all matching rows.</p>';
 }else{
  currentRecord=id;detailMode='record';$('detail-title').textContent=id+' · '+(r.type==='req'?'Requirement Detail':'Action Detail');
  const incoming=data.edges.filter(e=>e[2]===id),outgoing=data.edges.filter(e=>e[1]===id);
  const links=es=>es.map(e=>'<div class="row"><code>'+e[0]+'</code> · '+e[3]+' gate · <button data-record="'+e[1]+'">'+e[1]+'</button> → <button data-record="'+e[2]+'">'+e[2]+'</button></div>').join('')||'<p class="meta">No edges declared in this direction.</p>';
  $('detail-body').innerHTML=
   '<div style="margin-bottom:12px;"><span class="state-pill '+(r.dep==='READY'?'ready':'blocked')+'">'+esc(r.dep??'UNAVAILABLE')+'</span> <span class="state-pill '+(r.exec==='COMPLETED'?'completed':r.exec==='WAITING'?'waiting':'neutral')+'">'+esc(r.exec)+'</span> <span class="state-pill neutral">'+esc(r.ver)+'</span></div>'+
   '<p><strong>'+esc(r.label)+'</strong></p>'+
   '<p>Internal accountable owner: <strong>'+esc(r.owner)+'</strong> · Workstream: '+esc(r.ws)+' · Due: <time>'+esc(r.dueISO)+'</time></p>'+
   axes(r)+
   '<p class="meta">'+esc(r.sub)+'</p>'+
   '<div class="feedback">Read-only canonical snapshot. Five-axis state values, eligibility and proof validity shown here are fixture context; no client-side truth becomes an accepted domain result.</div>'+
   '<h3>Causal Dependency Context</h3><p><strong>Incoming gates:</strong></p>'+links(incoming)+'<p><strong>Downstream impact:</strong></p>'+links(outgoing)+
   '<h3>Proof &amp; Version Context</h3><button id="proof-context" class="primary">Inspect criterion and exact proof context</button>'+
   '<h3>Local Draft Editor Specimen</h3><p class="meta">EDITOR/OWNER product intent only; both Matter EDITOR and OWNER can assign actions in scope.</p>'+
   '<div class="field"><label for="draft-title">Title draft</label><textarea id="draft-title" aria-describedby="draft-error draft-limit"></textarea><p id="draft-error" class="error" role="alert"></p><p id="draft-limit" class="meta">Retained in page memory until reload; canonical title remains unchanged.</p></div>'+
   '<button id="preview-draft">Preview draft intent</button><div id="draft-result" role="status" style="margin-top:8px;"></div>'+
   '<details><summary>Conflict / unknown write / revocation recovery protocol</summary><p><strong>Conflict (409):</strong> Keep user draft, compare only permitted current values, reload/rebase and issue new command against accepted current revision. No blind overwrite.</p><p><strong>OUTCOME_UNKNOWN:</strong> Preserve permitted intent, reconcile accepted receipt/readback before safe retry. Receipt wire DEPENDENCY_PENDING.</p><p><strong>Permission Revocation:</strong> Purge protected values/drafts immediately; no stale-grant rescue export.</p></details>';
  $('draft-title').value=drafts.get(id)??r.label;
 }
 updateTrailUI();
 if(!$('detail').open){$('detail').showModal();}
 $('detail-title').focus({preventScroll:true});
}

function showProof(){
 const r=recordById[currentRecord];
 if(!r) return;
 detailMode='proof';
 $('detail-title').textContent=r.id+' · Evidence & Proof Verification Context';

 let criterion='';
 let item=null;

 if(r.type==='req'){
  criterion='ER-'+r.id.slice(-2);
  const reqProofData={
   'RQ-01':{ev:'EV-01',doc:'DOC-01 v2',submitter:'U-01 (Internal Counsel)',verifier:'U-02 (Historical Reviewer)',validity:'VERIFIED (Historical audit caveat)',consequences:'None directly blocking; baseline approval recorded. Current verifier designation not established in fixture.',note:'Historical approval proof; re-review required under current independent policy.'},
   'RQ-02':{ev:'None (Missing Proof)',doc:'ER-02 Counterparty Acknowledgement required',submitter:'None supplied',verifier:'UNDESIGNATED · Submitter cannot self-review',validity:'UNVERIFIED',consequences:'RQ-02 is COMPLETED in execution but UNVERIFIED in proof; does not satisfy proof gates.',note:'COMPLETED ≠ VERIFIED. Execution completed, but counterparty acknowledgement missing.'},
   'RQ-03':{ev:'EV-03',doc:'DOC-02 v2 + review note',submitter:'U-02 (Internal Counsel)',verifier:'U-02 (Self-Review)',validity:'UNVERIFIED (Historical Self-Review Invalid)',consequences:'Self-review violates independent verification policy (RULE-007); cannot serve as valid milestone proof.',note:'Submitter U-02 reviewed own submission. Designated independent verifier required.'},
   'RQ-04':{ev:'None (Missing Proof ER-04)',doc:'ER-04 Supplementary Due Diligence Documentation',submitter:'External Counterparty EP-01 (Cedar Seller Demo)',verifier:'UNDESIGNATED · Requires non-submitter assignment upon receipt',validity:'UNVERIFIED (Proof Missing)',consequences:'Directly blocks DEP-01 proof gate to AC-05, cascading to block AC-07 (payment), AC-08 (closing), and AC-09 (filing).',note:'Critical DD blocker. Follow-up action AC-04 assigned to U-01 to request missing supplementary records.'},
   'RQ-05':{ev:'EV-05',doc:'DOC-03 v3 + content review note',submitter:'U-02 (Internal Counsel)',verifier:'U-02 (Self-Review)',validity:'UNVERIFIED (Historical Self-Review Invalid)',consequences:'Content review does not establish signature execution. Blocks DEP-05 gate to AC-05.',note:'Content review is separate from signature verification. Submitter self-review invalid.'},
   'RQ-06':{ev:'EV-06',doc:'DOC-03 v3 · 1 of 2 signatures executed',submitter:'External Signatory EP-02 (Elm Signatory Demo)',verifier:'U-02 (Assigned Reviewer; Submitter is EP-02/U-03)',validity:'PARTIALLY_VERIFIED',consequences:'Agreement version v3 cannot satisfy closing prerequisite until second signature is obtained.',note:'Only 1 of 2 required signatures present. Second signature pending counterparty execution.'},
   'RQ-07':{ev:'None (Missing Proof)',doc:'Payment confirmation proof required for RQ-07',submitter:'None supplied',verifier:'UNDESIGNATED',validity:'UNVERIFIED',consequences:'Payment condition unproven; transfer and closing blocked.',note:'Execution NOT_STARTED and BLOCKED by upstream dependencies.'},
   'RQ-10':{ev:'EV-10',doc:'Filing Receipt + DOC-05 v2 filing package',submitter:'U-03 (Paralegal)',verifier:'U-02 (Assigned Reviewer)',validity:'PARTIALLY_VERIFIED (Receipt ≠ Approval)',consequences:'Filing is in Authority Review; cannot advance to APPROVED until regulatory outcome is issued.',note:'Receipt acknowledges submission only (RULE-012); authority approval outcome is pending from Harbor Registry Demo (EP-03).'}
  };
  item=reqProofData[r.id]||{ev:'Not supplied in fixture',doc:'Exact version specification required',submitter:'Not recorded',verifier:'UNDESIGNATED',validity:r.ver,consequences:'No downstream proof gates declared for this requirement.',note:'Proof applicability must be declared explicitly before verification.'};
 } else {
  criterion='Explicit Action proof applicability: NOT_REQUIRED';
  const actionProofData={
   'AC-01':{ev:'Audit EVT-03',doc:'Board approval execution record',submitter:'U-01',verifier:'Independent Legal Audit',validity:'NOT_REQUIRED',consequences:'Operational action execution complete. Associated legal proof ER-01 attaches to Requirement RQ-01.',note:'Action execution is COMPLETED; proof applicability is NOT_REQUIRED for this operational action.'},
   'AC-03':{ev:'Audit EVT-03',doc:'DD review record',submitter:'U-02',verifier:'Internal Legal Lead',validity:'NOT_REQUIRED',consequences:'Action completed; legal proof ER-03 attaches to Requirement RQ-03.',note:'Action execution is COMPLETED; proof applicability is NOT_REQUIRED for this operational action.'},
   'AC-04':{ev:'None (Action in Progress)',doc:'Follow-up communication record with EP-01',submitter:'U-01',verifier:'UNDESIGNATED',validity:'NOT_REQUIRED',consequences:'Action actively follows up for ER-04 proof required by RQ-04.',note:'Action execution is WAITING on EP-01; proof applicability is NOT_REQUIRED for the action itself.'},
   'AC-05':{ev:'None (Proof attaches to RQ-06)',doc:'DOC-03 v3 signature execution context',submitter:'U-01 (Monitor)',verifier:'Assigned Reviewer for RQ-06',validity:'NOT_REQUIRED',consequences:'Action execution is WAITING on EP-02 and BLOCKED by DEP-01 proof gate from RQ-04. Proof requirement attaches to RQ-06 (DOC-03 signatures); AC-05 itself does not carry proof criteria.',note:'Canonical Atlas: AC-05 has proof applicability NOT_REQUIRED. It does NOT inherit RQ-05 proof or verification state.'},
   'AC-06':{ev:'None',doc:'Closing signature tracking record',submitter:'U-01',verifier:'UNDESIGNATED',validity:'NOT_REQUIRED',consequences:'Action blocked by upstream prerequisites. Associated proof attaches to RQ-06.',note:'Proof applicability NOT_REQUIRED for this Action.'},
   'AC-10':{ev:'EV-10 attaches to RQ-10',doc:'Filing coordination record',submitter:'U-03',verifier:'Regulatory Reviewer',validity:'NOT_REQUIRED',consequences:'Action coordinates filing; regulatory proof ER-10 attaches to RQ-10/FIL-02.',note:'Receipt acknowledges submission only (RULE-012). Proof applicability NOT_REQUIRED for the action.'}
  };
  item=actionProofData[r.id]||{ev:'N/A',doc:'Action execution context',submitter:r.owner??'Not recorded',verifier:'N/A',validity:'NOT_REQUIRED',consequences:'Proof applicability NOT_REQUIRED for this Action. Proof criteria in MatterControl attach strictly to Requirements (RQ-xx), not individual operational actions.',note:'Actions track operational tasks; verification attaches to Requirements.'};
 }

 $('detail-body').innerHTML=
  '<p><strong>Evidence Requirement Criterion:</strong> <code>'+esc(criterion)+'</code></p>'+
  '<div class="proof-grid">'+
   '<div class="proof-card"><h4>Criterion &amp; Required Version</h4><p><strong>Version:</strong> '+esc(item.doc)+'</p><p><strong>Evidence ID:</strong> '+esc(item.ev)+'</p></div>'+
   '<div class="proof-card"><h4>Submitter vs Independent Verifier</h4><p><strong>Submitter:</strong> '+esc(item.submitter)+'</p><p><strong>Verifier:</strong> '+esc(item.verifier)+'</p></div>'+
   '<div class="proof-card"><h4>Verification Validity</h4><p class="'+(item.validity.includes('VERIFIED')&&!item.validity.includes('UNVERIFIED')&&!item.validity.includes('PARTIALLY')?'proof':item.validity==='NOT_REQUIRED'?'meta':'cause')+'"><strong>Status:</strong> '+esc(item.validity)+'</p><p class="meta">'+esc(item.note)+'</p></div>'+
   '<div class="proof-card"><h4>Causal Consequences</h4><p>'+esc(item.consequences)+'</p></div>'+
  '</div>'+
  '<div class="feedback"><p><strong>Governance &amp; Integrity Rules:</strong></p>'+
  '<p>1. <strong>Submitter cannot self-review:</strong> Submitter and verifier must be distinct authorized identities (RULE-007).</p>'+
  '<p>2. <strong>OWNER is not automatic verifier:</strong> Matter OWNER role alone does not grant verifier authority without explicit verifier designation.</p>'+
  '<p>3. <strong>Receipt ≠ Approval:</strong> Uploading a submission confirmation or filing receipt records receipt, not regulatory approval (RULE-012).</p>'+
  '<p>4. <strong>Honest Non-Simulated Verification:</strong> Verification requires authoritative server-side review and ledger recording. No client-side mock toasts, simulated uploads, or synthetic approval buttons are permitted.</p>'+
  '</div>'+
  '<div style="display:flex; gap:12px; margin-top:16px;">'+
  '<button id="btn-proof-back-record" class="primary">← Return to '+esc(r.id)+' Detail</button>'+
  '<button id="btn-proof-back-prev" '+(navStack.length>0?'':'style="display:none;"')+'>← Back to Previous ('+esc(navStack[navStack.length-1]?.id||'')+')</button>'+
  '</div>';
 updateTrailUI();
 $('detail-title').focus({preventScroll:true});
}

function handleBackPrev(){
 if(!navStack.length) return;
 const prev=navStack.pop();
 detailMode=prev.mode||'record';
 openRecord(prev.id,null,false);
 if(detailMode==='proof'){
  showProof();
 }
}

function handleBackRecord(){
 if(!currentRecord) return;
 detailMode='record';
 openRecord(currentRecord,null,false);
}

function handleCloseDetail(){
 cleanupModalSession();
 $('detail').close();
}
function renderMyActions(){
 const u1Actions=records.filter(r=>r.type==='action'&&r.owner==='U-01');
 const u1Reqs=records.filter(r=>r.type==='req'&&r.owner==='U-01');
 const eligibleActions=u1Actions.filter(eligible);
 const waitingActions=u1Actions.filter(r=>r.exec==='WAITING');
 const blockedActions=u1Actions.filter(r=>r.dep==='BLOCKED');
 const completedActions=u1Actions.filter(r=>r.exec==='COMPLETED');

 const renderItem=r=>'<div class="queue-item"><div>'+button(r)+'<div style="margin-top:4px;"><span class="state-pill '+(r.dep==='READY'?'ready':'blocked')+'">'+esc(r.dep)+'</span> <span class="state-pill '+(r.exec==='COMPLETED'?'completed':r.exec==='WAITING'?'waiting':'neutral')+'">'+esc(r.exec)+'</span> <span class="state-pill neutral">'+esc(r.ver)+'</span></div><p class="meta">'+esc(r.sub)+'</p></div><div><time>'+esc(r.dueISO)+'</time><br><small>'+esc(r.ws)+'</small></div></div>';

 $('my-actions-container').innerHTML=
  '<div class="notice" style="margin-bottom:16px;"><p><strong>Current Actor:</strong> U-01 (Internal Counsel) · Fixture alias for testing. All actions display explicit five-axis state values without synthesis or truncation.</p></div>'+
  '<section class="queue-group" data-od-id="queue-eligible"><div class="queue-header"><h3>1. Eligible Actions ('+eligibleActions.length+')</h3><span class="state-pill ready">Ready to Work</span></div><div class="queue-body">'+
  (eligibleActions.length?eligibleActions.map(renderItem).join(''):'<div class="feedback" style="margin:8px 0;"><p><strong>Zero actions eligible for execution.</strong></p><p class="meta">All assigned actions are either waiting on external counterparties (AC-04, AC-05), blocked by upstream proof/completion gates (AC-05, AC-12), or already completed (AC-01, AC-02). No false Next Action is fabricated.</p></div>')+
  '</div></section>'+
  '<section class="queue-group" data-od-id="queue-waiting"><div class="queue-header"><h3>2. Waiting On External Parties ('+waitingActions.length+')</h3><span class="state-pill waiting">External Wait</span></div><div class="queue-body">'+
  waitingActions.map(r=>'<div class="queue-item"><div>'+button(r)+'<div style="margin-top:4px;"><span class="state-pill waiting">WAITING</span> <span class="state-pill '+(r.dep==='READY'?'ready':'blocked')+'">'+esc(r.dep)+'</span></div><p><strong>Waiting Condition:</strong> '+esc(r.id==='AC-04'?'Waiting on EP-01 (Cedar Seller Demo) for missing ER-04 proof':'Waiting on EP-02 (Elm Signatory Demo) for signature execution')+'</p><p class="meta">'+(r.id==='AC-05'?'Note: AC-05 is also BLOCKED by DEP-01 proof gate via RQ-04. Shared identity across groups.':'')+'</p></div><div><time>'+esc(r.dueISO)+'</time></div></div>').join('')+
  '</div></section>'+
  '<section class="queue-group" data-od-id="queue-blocked"><div class="queue-header"><h3>3. Blocked Actions ('+blockedActions.length+')</h3><span class="state-pill blocked">Upstream Gate Blocked</span></div><div class="queue-body">'+
  blockedActions.map(r=>'<div class="queue-item"><div>'+button(r)+'<div style="margin-top:4px;"><span class="state-pill blocked">BLOCKED</span> <span class="state-pill '+(r.exec==='WAITING'?'waiting':'neutral')+'">'+esc(r.exec)+'</span></div><p><strong>Blocking Cause:</strong> '+esc(r.id==='AC-05'?'Blocked by DEP-01 proof gate (RQ-04 unverified proof ER-04 missing from EP-01)':'Blocked by DEP-07 proof gate (RQ-11 unverified)')+'</p></div><div><time>'+esc(r.dueISO)+'</time></div></div>').join('')+
  '</div></section>'+
  '<section class="queue-group" data-od-id="queue-completed"><div class="queue-header"><h3>4. Historical / Completed Actions ('+completedActions.length+')</h3><span class="state-pill completed">Completed</span></div><div class="queue-body">'+
  completedActions.map(renderItem).join('')+
  '</div></section>'+
  '<details data-od-id="queue-requirements-ref"><summary>Assigned Matter Requirements Owned by U-01 ('+u1Reqs.length+' records)</summary><p class="meta">Requirements define legal criteria, not operational tasks. They belong to matter structure and are not actionable queue items.</p>'+
  u1Reqs.map(renderItem).join('')+'</details>';
}

function visibleRecords(){
 const fixture=Number($('fixture').value);
 let list=fixture===24?records:densityRows(fixture);
 const q=$('query').value.trim().toLocaleLowerCase();
 return list.filter(r=>($('type').value==='all'||r.type===$('type').value)&&(!q||(r.id+' '+r.label).toLocaleLowerCase().includes(q))).sort((a,b)=>$('sort').value==='due'?(Date.parse(a.dueISO)||Infinity)-(Date.parse(b.dueISO)||Infinity)||a.id.localeCompare(b.id):a.id.localeCompare(b.id));
}

function selectionText(){
 const visible=new Set(visibleRecords().map(r=>r.id));
 const hidden=[...selected].filter(id=>!visible.has(id));
 $('selection').textContent='Selected exact IDs: '+([...selected].join(', ')||'none')+(hidden.length?' · Hidden by current view/filter: '+hidden.join(', '):'');
}

function renderGrid(){
 const list=visibleRecords();
 $('grid-title').textContent='Operational Grid';
 $('grid-intent').textContent='Read typed conditions and work with separate axes. Long titles and reasons wrap multiline. DENSITY fixtures replace Atlas and carry no authoritative evaluation.';
 const checkbox=(r,mobile)=>'<input class="check" type="checkbox" data-select="'+esc(r.id)+'" aria-label="Select '+esc(r.id)+(mobile?' mobile':'')+'" '+(selected.has(r.id)?'checked':'')+'>';
 $('rows').innerHTML=list.map(r=>'<tr tabindex="0" data-row="'+esc(r.id)+'" class="'+(selected.has(r.id)?'selected':'')+'"><td>'+checkbox(r,false)+'</td><td class="identity">'+button(r)+'<small>'+esc(r.type==='req'?'Requirement':'Action')+' · '+esc(r.ws)+'</small><small>'+esc(r.sub)+'</small></td><td>'+esc(r.exec)+'</td><td>'+esc(r.ver)+'</td><td>'+esc(r.dep??'unavailable')+'</td><td><time>'+esc(r.dueISO??'no due date')+'</time><small>'+esc(r.owner??'not supplied')+'</small></td><td>'+esc(r.id.startsWith('DENSITY')?'unavailable':timing(r))+'</td><td>'+esc(r.id.startsWith('DENSITY')?'unavailable':attention(r))+'</td></tr>').join('');
 $('mobile-rows').innerHTML=list.map(r=>'<article class="panel row" data-od-id="mobile-card-'+esc(r.id)+'">'+checkbox(r,true)+button(r)+'<p>'+esc(r.type==='req'?'Requirement':'Action')+' · '+esc(r.owner??'not supplied')+' · '+esc(r.ws)+'</p>'+axes(r)+'<time>'+esc(r.dueISO??'no due date')+'</time><p>'+esc(r.sub)+'</p></article>').join('');
 $('range').textContent=list.length+' matching records · all matching rows shown · '+(Number($('fixture').value)===24?'Atlas T0 canonical':'labelled DENSITY fixture, not Atlas');
 $('rows').closest('table').classList.toggle('compact',$('density').value==='compact');
 if(!list.length){
  $('rows').innerHTML='<tr><td colspan="8">No matching records. Reset filters; this does not mean the Matter contains no work.</td></tr>';
  $('mobile-rows').textContent='No matching records. Reset filters.';
 }
 selectionText();
}

function renderStateSpecimen(){
 const scr=$('state-screen-select').value, st=$('state-state-select').value;
 const stateDescriptions={
  loading:{title:'Loading State',badge:'neutral',msg:'Asynchronous fetch in flight. Accessible progress indicator displayed without layout shift or UI flickering. Controls are non-interactive until data arrives.'},
  empty:{title:'Empty State (Zero Records)',badge:'neutral',msg:'No entities have been created in this scope yet. Helpful guidance explains how to initialize or request scope, with zero fabricated placeholder data.'},
  no_match:{title:'No Match (Filter / Search)',badge:'neutral',msg:'Active search query or filters returned zero matching results. Clearly communicates that records exist in the Matter, with a direct "Reset filters" action.'},
  unavailable:{title:'Unavailable / Subsystem Failure',badge:'blocked',msg:'Downstream service or graph evaluation engine unreachable. Honest error message displayed; never falls back to zero counts or false READY indicators.'},
  forbidden:{title:'Forbidden (403 Role Restriction)',badge:'blocked',msg:'Authenticated user lacks necessary permissions (e.g. VIEWER attempting mutation or submitter attempting self-verification). Reason explained clearly; mutation controls omitted.'},
  stale:{title:'Stale Revision Warning',badge:'waiting',msg:'Client snapshot revision lags behind server state. Prompts user to refresh and rebase, preserving any uncommitted local draft inputs.'},
  conflict:{title:'Conflict (409 Concurrent Edit)',badge:'blocked',msg:'Optimistic concurrency detected conflicting server update. Displays side-by-side comparison of local draft vs accepted revision. Overwrite strictly forbidden.'},
  partial:{title:'Partial Success (Batch / Multi-row)',badge:'waiting',msg:'Bulk operation executed with mixed outcomes. Per-row atomic audit log clearly indicates succeeded rows, failed rows, and unconfirmed items requiring reconciliation.'},
  recovery:{title:'Recovery & Rebase Workflow',badge:'ready',msg:'Guided path to resolve failures: draft restoration, conflict rebasing, and reconciliation of uncertain writes before safe retry.'}
 };
 const desc=stateDescriptions[st]||stateDescriptions.loading;

 const screenEmptyGuidance={
  'SCR-01':'<p>No Matters assigned to current account. Contact Workspace Admin to receive matter access.</p><button disabled class="primary">Request Matter Access</button>',
  'SCR-02':'<p>Matter operational components uninitialized. No active requirements or actions present in scope.</p><button disabled>Initialize Matter Structure</button>',
  'SCR-03':'<p>No Requirements or Actions found in this Matter.</p><button class="primary">+ Create Requirement</button>',
  'SCR-04':'<p>Requirement has no associated metadata or actions yet.</p><button class="primary">+ Add Action to Requirement</button>',
  'SCR-05':'<p>Action has no assigned owner or dependency gates yet.</p><button class="primary">Assign Action</button>',
  'SCR-06':'<p>No dependency gates declared for this record.</p><button>Declare Dependency Gate</button>',
  'SCR-07':'<p>No evidence proof submitted yet for this requirement.</p><button class="primary">Submit Evidence Package</button>',
  'SCR-08':'<p>No document versions uploaded yet.</p><button class="primary">Upload Version 1</button>',
  'SCR-09':'<p>Filing package has not been initialized.</p><button class="primary">Initialize Filing Package</button>',
  'SCR-10':'<p>No records selected for bulk editing. Return to Grid to select items.</p><button onclick="showView(\'grid\')">Return to Operational Grid</button>',
  'SCR-11':'<p>No import files uploaded yet. Select CSV or XLSX file.</p><button class="primary">Select Import File (CSV/XLSX)</button>',
  'SCR-12':'<p>No changes recorded in the selected window (t1, t2].</p><button>Adjust Time Window</button>',
  'SCR-13':'<p>No event history recorded yet; event stream initializes upon first matter command.</p>'
 };

 const screenRoleContext={
  'SCR-01':'Roles: All authenticated members (OWNER, EDITOR, VIEWER).',
  'SCR-02':'Roles: Matter OWNER, Lead Counsel, Lead Operator.',
  'SCR-03':'Roles: All members (OWNER, EDITOR can edit/assign; VIEWER read-only).',
  'SCR-04':'Roles: OWNER, EDITOR (Create and update requirements).',
  'SCR-05':'Roles: OWNER, EDITOR (Both can assign actions in scope; Contributor executes).',
  'SCR-06':'Roles: OWNER, Lead Operator (Dependency management).',
  'SCR-07':'Roles: Submitter (Contributor) vs Designated Verifier (Anti-self-review).',
  'SCR-08':'Roles: OWNER, EDITOR, Verifier (Document promotion requires reason).',
  'SCR-09':'Roles: Filing Counsel, Paralegal, Regulatory Specialist.',
  'SCR-10':'Roles: OWNER, Lead Operator (Bulk metadata allowlist).',
  'SCR-11':'Roles: OWNER, Legal Ops Admin (Structured data import).',
  'SCR-12':'Roles: All roles, including scoped VIEWER (Delta Status Brief).',
  'SCR-13':'Roles: OWNER, Compliance Auditor, Legal Counsel (Append-only audit).'
 };

 let specimenBody='';
 if(st==='loading'){
  specimenBody=
   '<div role="status" aria-busy="true" style="padding:16px;">'+
    '<div class="skeleton-box" style="width:40%;"></div>'+
    '<div class="skeleton-box" style="width:85%;"></div>'+
    '<div class="skeleton-box" style="width:70%;"></div>'+
    '<p class="meta" style="margin-top:12px;">Loading '+esc(scr)+' components and state data...</p>'+
   '</div>';
 } else if(st==='empty'){
  specimenBody=
   '<div style="padding:24px; text-align:center;">'+
    (screenEmptyGuidance[scr]||'<p>No items found in this section.</p>')+
   '</div>';
 } else if(st==='no_match'){
  specimenBody=
   '<div style="padding:24px; text-align:center;">'+
    '<p>No items match your filter criteria in '+esc(scr)+'.</p>'+
    '<button onclick="$(\'query\').value=\'\'; showView(\'grid\');">Reset search &amp; filters</button>'+
   '</div>';
 } else if(st==='unavailable'){
  specimenBody=
   '<div style="padding:16px; border:1px solid var(--r2-error);">'+
    '<p class="error"><strong>Service Unavailable (503):</strong> Subsystem for '+esc(scr)+' unreachable. Retrying with exponential backoff.</p>'+
    '<div style="margin-top:8px;"><button disabled>Retry Connection</button> <span class="specimen-tag">SPECIFIED_ONLY · Non-operational specimen</span></div>'+
   '</div>';
 } else if(st==='forbidden'){
  specimenBody=
   '<div style="padding:16px; border:1px solid var(--r2-muted);">'+
    '<p><strong>Access Denied (403 Forbidden):</strong> Active role lacks required permission for this operation in '+esc(scr)+'.</p>'+
    '<p class="meta">VIEWER accounts are read-only; Submitter identities cannot perform verification (RULE-007). Both Matter EDITOR and OWNER can assign actions.</p>'+
   '</div>';
 } else if(st==='stale'){
  specimenBody=
   '<div style="padding:16px; background:var(--r2-selected);">'+
    '<p><strong>Stale Revision Warning:</strong> Server revision advanced while '+esc(scr)+' remained open. Uncommitted local drafts preserved.</p>'+
    '<div style="margin-top:8px;"><button class="primary" disabled>Refresh &amp; Rebase</button> <span class="specimen-tag">SPECIFIED_ONLY · Non-operational specimen</span></div>'+
   '</div>';
 } else if(st==='conflict'){
  specimenBody=
   '<div style="padding:16px; border:2px solid var(--r2-error);">'+
    '<p class="error"><strong>Conflict Detected (409):</strong> Concurrent update on '+esc(scr)+' record. Overwrite strictly forbidden.</p>'+
    '<p><strong>Server accepted revision (v2):</strong> Title updated by U-02 at 09:14 UTC+07<br><strong>Your local draft (v1):</strong> Unsubmitted title draft preserved in memory</p>'+
    '<div style="margin-top:10px;"><button class="primary" disabled>Rebase Draft onto v2</button> <button disabled>Discard Draft</button> <span class="specimen-tag">SPECIFIED_ONLY · Non-operational specimen</span></div>'+
   '</div>';
 } else if(st==='partial'){
  specimenBody=
   '<div style="padding:16px;">'+
    '<p><strong>Batch Execution Result:</strong> 3 items updated, 1 validation failure, 1 unconfirmed write.</p>'+
    '<p class="meta">AC-07, AC-08, AC-10: Updated successfully · AC-09: Invalid due date format · AC-11: OUTCOME_UNKNOWN (Server readback reconciliation required before retry)</p>'+
    '<p class="meta">Notice: exactly 3 items updated matches 3 IDs listed (AC-07, AC-08, AC-10).</p>'+
   '</div>';
 } else if(st==='recovery'){
  specimenBody=
   '<div style="padding:16px;">'+
    '<p class="proof"><strong>Recovery &amp; Rebase Protocol:</strong> Guided path for '+esc(scr)+' to recover from network timeout or concurrency conflict.</p>'+
    '<p class="meta">Preserves local uncommitted input, issues server readback to reconcile OUTCOME_UNKNOWN, then re-enables mutation button.</p>'+
    '<div style="margin-top:8px;"><button class="primary" disabled>Execute Reconciled Retry</button> <span class="specimen-tag">SPECIFIED_ONLY · Non-operational specimen</span></div>'+
   '</div>';
 }

 $('state-preview-panel').innerHTML=
  '<div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:12px;">'+
   '<h3>'+esc(scr)+' · '+esc(desc.title)+'</h3><span class="state-pill '+desc.badge+'">'+esc(st.toUpperCase())+'</span>'+
  '</div>'+
  '<p class="meta">'+esc(screenRoleContext[scr]||'')+'</p>'+
  '<div class="feedback '+(st==='conflict'||st==='forbidden'?'error':st==='stale'||st==='unavailable'?'warning':'')+'">'+
   '<p><strong>Specification Contract:</strong> '+esc(desc.msg)+'</p>'+
  '</div>'+
  '<div class="state-card" style="margin-top:16px;">'+
   '<h4>Simulated Specimen for '+esc(scr)+'</h4>'+
   specimenBody+
  '</div>';
}
function waits(){
 return ['AC-04','AC-05','AC-10'].map(id=>{
  const r=recordById[id],party={'AC-04':'EP-01 · Cedar Seller Demo','AC-05':'EP-02 · Elm Signatory Demo','AC-10':'EP-03 · Harbor Registry Demo'}[id];
  return '<div class="row">'+button(r)+'<p>Waiting on '+party+' · Internal owner '+r.owner+' · '+r.exec+' / '+r.dep+'</p><p class="meta">'+esc(r.dueISO)+' · waiting age unavailable</p></div>';
 }).join('');
}

const events=[['EVT-01','2026-06-14T10:00:00+07:00','DOC-03 v3 added; v2 superseded'],['EVT-02','2026-06-14T11:00:00+07:00','Content review v3 recorded; historical self-review caveat'],['EVT-03','2026-06-14T14:00:00+07:00','AC-03 completed; RQ-03 historical review'],['EVT-04','2026-06-14T15:00:00+07:00','DOC-05 v2; FIL-02 submitted'],['EVT-05','2026-06-14T16:00:00+07:00','FIL-02 receipt; authority waiting, not approval'],['EVT-06','2026-06-15T08:00:00+07:00','First signature receipt; RQ-06 partial']];

function previewBrief(){
 const a=$('t1').value,b=$('t2').value,t1=a+':00+07:00',t2=b+':00+07:00';
 const invalid=!a||!b||Date.parse(t1)>Date.parse(t2)||!Number.isFinite(Date.parse(t1))||!Number.isFinite(Date.parse(t2));
 $('window-error').textContent=invalid?'Choose valid endpoints with t1 ≤ t2; no draft generated.':'';
 $('t1').setAttribute('aria-invalid',String(invalid));$('t2').setAttribute('aria-invalid',String(invalid));
 if(invalid){$('brief-changes').textContent='Window invalid; no narrative preview.';$('outstanding-limit').textContent='No outstanding result generated for invalid window.';return;}
 const chosen=events.filter(e=>inWindow(e[1],t1,t2));
 $('brief-changes').innerHTML=chosen.map(e=>'<div class="row"><code>'+e[0]+'</code> · <time>'+e[1]+'</time><p>'+e[2]+'</p></div>').join('')||'<p>No changes in this narrative window. Outstanding may still exist.</p>';
 $('outstanding-limit').textContent=Date.parse(t2)===Date.parse(data.asOf)?'Outstanding shown only for supplied canonical T0. Recorded-time report provenance remains dependency.':'Outstanding at chosen t2 unavailable: this fixture supplies only T0 state; do not infer a historical snapshot.';
}

document.addEventListener('click',e=>{
 const b=e.target.closest('button');if(!b)return;
 if(b.dataset.view){showView(b.dataset.view);return;}
 if(b.dataset.record){openRecord(b.dataset.record,b);return;}
 if(b.id==='proof-context')showProof();
 if(b.id==='btn-proof-back-record')handleBackRecord();
 if(b.id==='btn-proof-back-prev'||b.id==='btn-back-prev')handleBackPrev();
 if(b.id==='btn-back-record')handleBackRecord();
 if(b.id==='close-detail'||b.id==='btn-close-origin')handleCloseDetail();
 if(b.id==='preview-draft'){
  const value=$('draft-title').value;drafts.set(currentRecord,value);const bad=!value.trim();
  $('draft-title').setAttribute('aria-invalid',String(bad));$('draft-error').textContent=bad?'Title must not be blank. Draft retained.':'';
  $('draft-result').textContent=bad?'No intent preview; correct the field.':'Local draft intent for '+currentRecord+': '+value+' · Not saved; current permission, revision and accepted command contract required.';
  if(bad)$('draft-title').focus();
 }
 if(b.id==='clear-selection'){selected.clear();renderGrid();}
 if(b.id==='reset-filter'){$('query').value='';$('type').value='all';renderGrid();}
 if(b.id==='brief-preview')previewBrief();
});

document.addEventListener('input',e=>{
 if(e.target.id==='query')renderGrid();
 if(e.target.id==='draft-title'&&currentRecord)drafts.set(currentRecord,e.target.value);
});

document.addEventListener('change',e=>{
 if(e.target.dataset.select){
  const id=e.target.dataset.select;
  if(e.target.checked)selected.add(id);else selected.delete(id);
  document.querySelectorAll('[data-select="'+id+'"]').forEach(c=>c.checked=selected.has(id));
  document.querySelectorAll('[data-row="'+id+'"]').forEach(r=>r.classList.toggle('selected',selected.has(id)));
  selectionText();
 }
 if(['type','sort','fixture'].includes(e.target.id))renderGrid();
 if(e.target.id==='density')$('rows').closest('table').classList.toggle('compact',$('density').value==='compact');
 if(['state-screen-select','state-state-select'].includes(e.target.id))renderStateSpecimen();
});

document.addEventListener('keydown',e=>{
 const row=e.target.closest('[data-row]');
 if(row&&e.target===row){
  if(['ArrowDown','ArrowUp'].includes(e.key)){e.preventDefault();(e.key==='ArrowDown'?row.nextElementSibling:row.previousElementSibling)?.focus();}
  if(e.key==='Enter'){e.preventDefault();openRecord(row.dataset.row,row);}
 }
});

$('detail').addEventListener('close',()=>{
 cleanupModalSession();
 const replacement=opener?.dataset?.record?document.querySelector('[data-record="'+opener.dataset.record+'"]'):null;
 if(opener?.isConnected)opener.focus({preventScroll:true});else if(replacement)replacement.focus({preventScroll:true});else $('main').focus({preventScroll:true});
});

const chainSteps=[
 {id:'RQ-04',tag:'Step 1 · Blocker root cause',tagClass:'root',stepClass:'root-blocker',condition:'ER-04 supplementary due diligence proof required',cause:'Missing clearance documentation from EP-01 (Cedar Seller Demo)',impact:'Directly blocks signature gate DEP-01 to AC-05, cascading to payment, closing, and filing',nextStep:'Execute follow-up AC-04 with EP-01; no client-side waiver permitted'},
 {id:'AC-05',tag:'Step 2 · Direct impact',tagClass:'gate',stepClass:'direct-gate',condition:'Signature tracking prerequisite',cause:'Blocked by gate DEP-01 (unverified RQ-04 proof)',impact:'Halts closing agreement execution and payment gate DEP-02',nextStep:'Await ER-04 resolution; monitor EP-02 counterparty'},
 {id:'AC-07',tag:'Step 3 · Downstream payment',tagClass:'pipe',stepClass:'downstream',condition:'Payment condition clearance',cause:'Cascading block from unexecuted signatures (AC-05)',impact:'Halts closing transfer checklist DEP-03',nextStep:'Pending upstream signature execution'},
 {id:'AC-08',tag:'Step 4 · Downstream transfer',tagClass:'pipe',stepClass:'downstream',condition:'Closing checklist & ownership transfer',cause:'Cascading block from unconfirmed payment (AC-07)',impact:'Halts post-closing regulatory filing preparation DEP-04',nextStep:'Pending upstream payment confirmation'},
 {id:'AC-09',tag:'Step 5 · Downstream filing',tagClass:'pipe',stepClass:'downstream',condition:'Post-closing filing preparation (FIL-01)',cause:'Cascading block from unclosed transaction (AC-08)',impact:'Final regulatory filing package suspended',nextStep:'Pending upstream closing checklist'}
];
$('chain').innerHTML=chainSteps.map(step=>{
 const r=recordById[step.id];
 return '<div class="chain-step '+step.stepClass+'" data-od-id="chain-step-'+esc(step.id)+'">'+
  '<div>'+
   '<span class="step-tag '+step.tagClass+'">'+esc(step.tag)+'</span>'+
   '<strong><code>'+esc(r.id)+'</code> · '+esc(r.label)+'</strong>'+
   '<p class="meta">'+esc(r.exec)+' / '+esc(r.dep)+' · Owner '+esc(r.owner)+'</p>'+
   '<p><strong>Condition:</strong> '+esc(step.condition)+'</p>'+
   '<p class="cause"><strong>Cause:</strong> '+esc(step.cause)+'</p>'+
   '<p><strong>Downstream impact:</strong> '+esc(step.impact)+'</p>'+
   '<p><strong>Permitted next step:</strong> '+esc(step.nextStep)+'</p>'+
  '</div>'+
  '<button data-record="'+esc(step.id)+'" style="margin-top:8px;">Inspect '+esc(step.id)+'</button>'+
 '</div>';
}).join('');

$('next').innerHTML='<p><strong>'+records.filter(eligible).length+' eligible Actions</strong></p><p>Five NOT_STARTED Actions are BLOCKED; AC-04/05/10 are WAITING. RQ-06 is a Requirement, not an actionable recommendation.</p>';
$('wait-summary').innerHTML=waits();
$('waiting-list').innerHTML=waits();
renderGrid();
previewBrief();
renderStateSpecimen();
