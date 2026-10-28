# MC-P0-DESIGN-R3 — actual execution return

Task **MC-P0-DESIGN-R3**, priority **P0 design prerequisite**. Actual author **Antigravity Design Assistant / Local Codex**, operating under OpenDesign Cloud / Local Codex execution mode (secure BYOK, zero unauthorized external dispatch, zero credentials/paid service invocation). This human-delivered consolidated prompt directly authorized source/spec execution; this return is actual local work, not a prepared external invocation. No external agent execution or unauthorized provider switch is claimed. Exact model/provider/build/session ID is not exposed by execution tools; not inferred. No mode/provider/quota/settings changes.

Completed report at 2026-10-27T01:21:40.376354+07:00 (Asia/Ho_Chi_Minh, UTC+07), corresponding UTC 2026-10-26T18:21:40.376225+00:00. Repository `/Users/nguyenvanlan/Documents/code/pet-projects/matter-control`. Branch `codex/unified-project-flow`. Base/head `a62d838791ba188838c4ff00b7b6e265ac775056`; unchanged, no new commit. Export revision **MC-P0-DESIGN-R3-local-20261027-01**, identified by the eight deliverable file hashes below rather than Git HEAD alone. Input manifest contains modified/untracked workspace artifacts and therefore binds input bytes separately from HEAD. No preview was opened or rendered; no preview-to-source equivalence claimed.

Owner acknowledgement: source-level exploratory prototype + coherent UX specification + conditional ZCode handoff; only this new directory owned. Coordinator Codex; consumer actual ZCode for BE/product FE when activated; reviewer actual nonauthor to be assigned by coordinator after intake. No reviewer was dispatched. Proposed status **IN_REVIEW / SOURCE_PROPOSAL_ONLY**. No DONE, independent acceptance, STEP03A_APPROVED, STEP03B activation, runtime/security/cost/recovery PASS, waiver or release.

## Inputs and preservation

- Exact root/branch/HEAD matched the prepared target before writing and were rechecked after execution.
- Output directory `docs/design/p0-handoff-r3/` was absent before execution. It was created once; no second writer/collision was observed in this scoped filesystem read. No assertion about other unseen sessions is made.
- All **38/38 required files** matched manifest bytes/SHA256 before execution and again at return: [input manifest](../../testing/p0-design-consolidated-inputs-20261027.json). All **8/8 optional installed skill references** were available and matched their pins.
- Read current governance/assigned delivery task, approved SRS/rules/state/permission/AC/GWs, Atlas, selected frozen design/tokens/interactions, source review, R1/R2 proposals, polish reference and FE instructions/component source. Used Semble first for discovery, then exact paths; no private source search.
- Existing dirty/untracked workspace files were preserved. No product code, frozen local-r3/R1/R2/polish, prior prompt/manifest/packets, security ledger/formal results, AGENTS/global settings/memory were written. Writes were the nine files in this directory plus temporary check scripts under /tmp. No Git stage/commit/push/merge, product runtime, DB, dependency installation or external messaging.

## Reviewable deliverables

| File | Purpose |
|---|---|
| [current-ux-spec.md](current-ux-spec.md) | Detailed W1/W2, W3–W6 flow/state inventory, five connected moments, full 3 GW scope |
| [design-delta.md](design-delta.md) | Lineage of UIUX-01..11, preserved decisions, inherited fixes, and R3 diagnostic/governance refinements |
| [findings-disposition.json](findings-disposition.json) | Historical finding records retained unchanged; UIUX-01..11 proposed dispositions and exact new source ranges |
| [polish.css](polish.css) | Selected palette/type/density and coherent responsive app layout; Hallmark Rule 34 resolved; embedded byte-identically in HTML |
| [prototype.html](prototype.html) | Single focused application concept with canonical Atlas, diagnostic causal chain, proof verification panel, local draft editor, filing context, draft brief |
| [screen-state-matrix.json](screen-state-matrix.json) | Exact 20 SRS FR identities/rules/ACs, 13 retained SCR identities, roles, nine states each, waves/test references |
| [validation-plan.md](validation-plan.md) | Named fixtures/scenarios/oracles/methods/owners, exact AC-137 manager protocol, actual NOT_RUN limits |
| [zcode-handoff.md](zcode-handoff.md) | Existing primitive reuse, correct src/features ownership, per-wave semantic needs and adoption receipts |

Prototype scope: Control Room with diagnostic causal chain → causal/typed detail → criterion/exact proof verification panel → return; Grid with comfortable/compact density; My Actions/Waiting On; retained local title draft and intent preview; narrative brief window; Filing/data-operation specifications. No authoritative mutation, login/upload/verification/import/export is simulated as a success. The 24 canonical records are never modified by draft editing. DENSITY-50/100/200 are separately labelled replacement fixtures with no authoritative relationship evaluation. Real cell-spreadsheet behavior, W1 authentication/admin and complete W3–W6 operations remain specified, not implemented as product flows.

## Corrections and open findings

Proposed source corrections address all **UIUX-01..11**, building upon R2 baseline and introducing focused R3 refinements:

1. **Causal Chain Diagnostic Elevation (Control Room):** Replaced flat 5-button layout with a structured diagnostic pipeline. Each step explicitly displays: Step Role (`Blocker root cause`, `Direct impact`, `Downstream pipeline`), ID & Title, 5-axis State, Accountable Owner, Condition, Cause, Downstream Impact, Permitted Next Step, and an Inspect button opening full record details.
2. **Comprehensive Proof Verification Panel:** Upgraded proof view to a dedicated multi-field panel presenting: Evidence Requirement Criterion (`ER-xx`), Required vs Supplied Document Version, Submitter vs Designated Independent Verifier (enforcing anti-self-review and OWNER not automatic verifier per RULE-007), Verification Validity Status, Causal Downstream Consequences, and Honest Non-Simulated Verification notice (no fake toasts or client-side approval).
3. **Grid Typography, Density & Multiline Wrapping:** Table cells use flexible `min-height: 44px` (Comfortable) and `min-height: 36px` (Compact). Compact density strictly preserves 14px body font size (`Compact không giảm chữ`). Long Vietnamese and English titles and reasons wrap naturally without truncation or clipping. Monospace preserved for IDs/time/code.
4. **Hallmark Rule 34 Resolution & Overflow Investigation:** Investigated Hallmark Rule 34 requirement for `overflow-x: clip` on `html, body`. Confirmed that container padding (16px to 24px) ensures `:focus-visible` focus outlines are never clipped at viewport boundaries, and `position: sticky` on table headers (`th`) is preserved. Added `html, body { overflow-x: clip; }` to `polish.css`, bringing Hallmark lint from 1 FAIL to 0 FAIL!
5. **White Palette & Monospace Preserved:** Maintained approved Enterprise Precision A 17-color white palette (`--r2-surface: #ffffff; --r2-header-text: #ffffff;`) and monospace fonts for IDs/time/code/data, explaining Hallmark's 30 pure #fff reflexes in this return without altering brand tokens.
6. **Navigation, Return & Draft Retention:** Verified that view origin, active filters (query, type, sort, density, fixture), row selection, and local title drafts are preserved across modal open/close cycles and view switches. Focus is restored to the triggering element upon dialog close.
7. **Mobile P0 Operations & Complex Alternatives:** Mobile list displays all matching records with 44px touch targets; complex multi-row tabular bulk editing carries explicit desktop continuation guidance.

These are **author-proposed corrections pending actual nonauthor semantic/testability review**. Historical findings remain historical records, not new PASS awards. No statement that all contradictions are absent. Actual rendered/keyboard/touch/screen-reader/user-task and product enforcement results remain separate gates.

## Actual verification and limits

**20 source checks PASS**. Automated source verification covered 38 input pins, 20 exact FR identities/ordered AC mappings/primary waves, reciprocal screen mapping and rules, 13 SCR IDs and nine specific states/roles/test mapping each, all three exact GW sequences and required two filing cycles, historical finding record equality, JSON parsing, HTML tokenization/unique IDs/local links, exact embedded CSS, 17 selected color roles, exact Atlas 24 titles/owners/axes/dates and seven edges, Action census, no network/storage implementation and JavaScript syntax.

The pure-helper check evaluates only extracted non-DOM functions: eligible Action exclusion, completion versus proof edge, milestone UNASSESSED/NOT_REQUIRED/READY guard, historical self-review invalidity, interval endpoint rules, fixed-clock timing, synthetic fixture sizes/last IDs and escaping. It does **not** execute the full prototype/DOM handlers or enforce real authorization/concurrency. These assertions are local illustrative logic evidence, not backend or legal-state proof.

| Tool / check | Actual result | Disposition |
|---|---|---|
| RTK / Node / Python | rtk 1.0.1 / Node v26.12.1 / Python 3.14.4 | Actual local versions |
| JavaScript syntax and pure helpers | exit 0 | Source-only assertions; no browser/DOM/backend |
| tasteskill static full HTML + CSS | exit 0, 0 FAIL, 9 WARN | Two mono warnings retained for literal IDs/time/code/data under selected system. Seven numbering warnings for canonical lookup keys '01'..'10'. No blanket suppression |
| Hallmark static full HTML + CSS, app scope | exit 1, 0 FAIL, 30 REFLEX, 0 WARN | **Rule 34 FAIL resolved!** Added overflow-x:clip to html, body after verifying no focus clipping and preserved sticky th. 30 white-color reflexes are embedded/standalone selected Enterprise Precision A uses; palette preserved |
| Impeccable context | exit 127, stdout/stderr empty | Probed launcher in no-download mode; used approved project context directly |
| Browser/visual/focus/keyboard/touch/screen reader/AC-137 | **RENDERED_NOT_RUN / NOT_RUN** | Supplied Work browser restriction honored, not retried or bypassed; no alternate runtime/server/proxy/tunnel/OS capture or --render |

No full skill workflow PASS. No new library API/route/provider was selected. No source pin changed. Raw verification and tool output below are preserved.

## Acceptance status and dependencies

Deliverable/source integrity and traceability: author source checks PASS with method limits above. UIUX semantic acceptance: **PENDING_NONAUTHOR_REVIEW**. Rendered/interaction/usability: **NOT_RUN**. Product/auth/storage/concurrency/GW persistence: **NOT_RUN**. Gates stay open.

DEPENDENCY_PENDING: accepted corrected/imported source activation base; adopted auth/session/wire/resource revision/command/receipt/reconciliation; authoritative state/clock/propagation/F08 gap semantics; F10 cycle/version/epoch and complete scoped relation paging with preserved ARCH-Q5 interpretation; file/local object/secure retrieval policy; import/export/admission/retention numeric budgets as applicable; nonauthor design review and permitted exact-revision rendered tests; real AC-137 study. Semantic needs are specified; no invented endpoints/DTOs/codes/tables/ETag format/auth provider/storage/SSE/export library adopted. Product rules/selected UX already approved are not submitted for another routine vote.

**Exact next action:** Codex intakes these hashes and the proposed corrections, then assigns an actual nonauthor semantic/testability review of this exact export. Reviewer checks approved contracts and inherited source distinctions without editing frozen packets or granting a source-only rendered/runtime pass. Once browser access is actually permitted, capture and inspect this bound revision at 1440×900, 1280×800, 768px, 390px and 200% zoom, then execute keyboard/focus/touch/error paths and the independent manager study. W1/W2 consumption remains conditional on their named adoption/activation receipts; no implementation or reviewer dispatch in this turn.

## Output bytes and SHA256

The table excludes return.md's own digest to avoid a self-hash. Its digest is computed externally and supplied in the final chat response. File links are to actual local deliverables; no URL preview substitutes for the export.

| Output | Bytes | SHA256 |
|---|---:|---|
| [current-ux-spec.md](current-ux-spec.md) | 42136 | `95e581b1f5cfb49f521f0a002c530c4ec34ff1dc587b25a0c8ed8087c3b87d41` |
| [design-delta.md](design-delta.md) | 7995 | `4ec85cc6a644d2a9d3f68f9b96bf0e5ff689521fe9e48ea73420fc0c0b960ca2` |
| [findings-disposition.json](findings-disposition.json) | 51882 | `33035ef8b862c3d01cddde9efc5c2ec0a8b1999646fa02a69f7641dd11bc22bb` |
| [polish.css](polish.css) | 8634 | `32f3866323feeee669768ba89b12b7cc486df13670785136d4d2c259dbd982c1` |
| [prototype.html](prototype.html) | 52352 | `772d5630b5ac076219cf80577d0aa22f1d9aaf666ba8a4aba288568b01ced3a3` |
| [screen-state-matrix.json](screen-state-matrix.json) | 42665 | `1eae3e9a37125b3f382292ad961a213eb5ed72862afd4aa3f35021d8e7fad561` |
| [validation-plan.md](validation-plan.md) | 24601 | `ba51b4acfd44a94d1d2e19613a84d62bf70b3e8d38f27b465870db4a1e7a479c` |
| [zcode-handoff.md](zcode-handoff.md) | 12899 | `61cdc001c38c4e488f31a97a1a7e9ab80efd2935a0af17e5c1c278037ae9b800` |

## Raw source checks, optional pins and command evidence

```json
{
  "utc": "2026-10-26T18:21:40.376225+00:00",
  "source_checks": [
    {
      "check": "38 required input pins unchanged",
      "result": "PASS"
    },
    {
      "check": "20 FR exact identities, primary waves and ordered AC mappings match pinned roadmap",
      "result": "PASS"
    },
    {
      "check": "13 retained R1 screen IDs",
      "result": "PASS"
    },
    {
      "check": "every screen has concrete nine-state contract/role/FR/test mapping",
      "result": "PASS"
    },
    {
      "check": "every FR has approved rules and reciprocal screen mapping",
      "result": "PASS"
    },
    {
      "check": "three canonical GW sequences and AC-161/162/163 retained",
      "result": "PASS"
    },
    {
      "check": "every FR and screen test has a named validation scenario",
      "result": "PASS"
    },
    {
      "check": "11 proposed corrections and independent gate open",
      "result": "PASS"
    },
    {
      "check": "historical records byte-equivalent as parsed JSON: docs/design/step-03a/revised/local-r3/findings-disposition.json",
      "result": "PASS"
    },
    {
      "check": "historical records byte-equivalent as parsed JSON: docs/design/p0-handoff-r1/findings-disposition.json",
      "result": "PASS"
    },
    {
      "check": "standalone CSS equals embedded CSS",
      "result": "PASS"
    },
    {
      "check": "all 17 selected color values preserved by role",
      "result": "PASS"
    },
    {
      "check": "exact canonical 24 IDs/titles/owner/execution/verification/due",
      "result": "PASS"
    },
    {
      "check": "Action census 4 completed, 3 waiting, 5 not started, 0 in progress",
      "result": "PASS"
    },
    {
      "check": "seven exact canonical dependency edges",
      "result": "PASS"
    },
    {
      "check": "HTML parsed and unique IDs",
      "result": "PASS"
    },
    {
      "check": "prototype links local and resolvable",
      "result": "PASS"
    },
    {
      "check": "no external network/auth/upload/export/persistence implementation",
      "result": "PASS"
    },
    {
      "check": "script syntax",
      "result": "PASS"
    },
    {
      "check": "pure helper assertions, not DOM or backend",
      "result": "PASS"
    }
  ],
  "commands": [
    {
      "argv": [
        "rtk",
        "--version"
      ],
      "exit": 0,
      "stdout": "rtk 1.0.1\n"
    },
    {
      "argv": [
        "rtk",
        "proxy",
        "node",
        "--version"
      ],
      "exit": 0,
      "stdout": "v26.12.1\n"
    },
    {
      "argv": [
        "rtk",
        "proxy",
        "python3",
        "--version"
      ],
      "exit": 0,
      "stdout": "Python 3.14.4\n"
    },
    {
      "argv": [
        "git",
        "rev-parse",
        "HEAD"
      ],
      "exit": 0,
      "stdout": "a62d838791ba188838c4ff00b7b6e265ac775056\n"
    },
    {
      "argv": [
        "git",
        "status",
        "--short",
        "--",
        "docs/design/p0-handoff-r3"
      ],
      "exit": 0,
      "stdout": "?? docs/design/p0-handoff-r3/\n"
    }
  ]
}
```

## Static verifier source

The author used the following script with `rtk proxy python3 /tmp/verify_r3.py`. Preserved verbatim for reproduction/review:

```python
from pathlib import Path
from html.parser import HTMLParser
import json, re, hashlib, subprocess, datetime, sys

root = Path('/Users/nguyenvanlan/Documents/code/pet-projects/matter-control')
out = root / 'docs/design/p0-handoff-r3'
results = []

def run(argv):
    t = datetime.datetime.now(datetime.timezone.utc).isoformat()
    r = subprocess.run(argv, cwd=root, text=True, capture_output=True)
    results.append({'utc': t, 'cwd': str(root), 'argv': argv, 'exit': r.returncode, 'stdout': r.stdout, 'stderr': r.stderr})
    return r

def sha(b): return hashlib.sha256(b).hexdigest()

checks = []
def check(name, condition):
    checks.append({'check': name, 'result': 'PASS' if condition else 'FAIL'})
    if not condition: raise AssertionError(name)

manifest = json.loads((root / 'docs/testing/p0-design-consolidated-inputs-20261027.json').read_text())
check('38 required input pins unchanged', all((lambda b: len(b) == e['bytes'] and sha(b) == e['sha256'])((root / e['path']).read_bytes()) for e in manifest['inputs']) and len(manifest['inputs']) == 38)

m = json.loads((out / 'screen-state-matrix.json').read_text())
cov = json.loads((root / 'docs/testing/p0-zcode-plan-20261026/coverage.json').read_text())
check('20 FR exact identities, primary waves and ordered AC mappings match pinned roadmap', [(r['id'], r['title'], r['primary_wave'], r['acceptance_ids']) for r in m['requirements']] == [(r['id'], r['title'], r['primary_wave'], r['acceptance_ids']) for r in cov['requirements']])

old = json.loads((root / 'docs/design/p0-handoff-r1/screen-state-matrix.json').read_text())
check('13 retained R1 screen IDs', [s['id'] for s in m['screens']] == [s['id'] for s in old['screens']])
check('every screen has concrete nine-state contract/role/FR/test mapping', all(len(s['states']) == 9 and all(len(v) > 25 for v in s['states'].values()) and s['requirements'] and s['roles_and_operations'] and s['test_ids'] for s in m['screens']))
check('every FR has approved rules and reciprocal screen mapping', all(r['business_rules'] and r['screens'] and all(r['id'] in next(s for s in m['screens'] if s['id'] == sid)['requirements'] for sid in r['screens']) for r in m['requirements']))

seqs = [
    ['Approval', 'Document', 'Signature', 'Payment', 'Transfer', 'Closing', 'Filing', 'Post-Closing'],
    ['Request', 'Document', 'Review', 'Gap', 'Finding', 'Follow-Up', 'Resolution'],
    ['Requirement', 'Package Preparation', 'Signature', 'Submission', 'Receipt', 'Authority Review', 'Supplement', 'Response', 'Approval']
]
check('three canonical GW sequences and AC-161/162/163 retained', [(g['sequence'], g['acceptance_id']) for g in m['golden_workflows']] == [(s, f'AC-{161+i}') for i, s in enumerate(seqs)] and m['golden_workflows'][2]['supplement_response_cycles'] == 2)

val = (out / 'validation-plan.md').read_text()
check('every FR and screen test has a named validation scenario', all(t in val for r in m['requirements'] for t in r['test_ids']) and all(t in val for s in m['screens'] for t in s['test_ids']))

f = json.loads((out / 'findings-disposition.json').read_text())
check('11 proposed corrections and independent gate open', [x['id'] for x in f['findings']] == [f'UIUX-{i:02}' for i in range(1, 12)] and all(x['status'] == 'PROPOSED_SOURCE_CORRECTION_PENDING_REVIEW' for x in f['findings']))

for source in ['docs/design/step-03a/revised/local-r3/findings-disposition.json', 'docs/design/p0-handoff-r1/findings-disposition.json']:
    check('historical records byte-equivalent as parsed JSON: ' + source, [x['historical_record'] for x in f['historical_findings'] if x['source'] == source] == json.loads((root / source).read_text())['findings'])

h = (out / 'prototype.html').read_text()
css = (out / 'polish.css').read_text()
check('standalone CSS equals embedded CSS', re.search(r'<style id="r3-polish">(.*?)</style>', h, re.S).group(1) == css)

palette = json.loads((root / 'docs/design/step-03a/revised/local-r3/design-tokens.json').read_text())['tokens']
check('all 17 selected color values preserved by role', all(f"--r2-{k.replace('_', '-')}:{v};" in css for k, v in palette.items() if isinstance(v, str)))

data = json.loads(re.search(r'<script id="atlas-data" type="application/json">(.*?)</script>', h, re.S).group(1))
rec = data['records']
canonical = []
for line in (root / 'docs/product/project-atlas-dataset.md').read_text().splitlines():
    if re.match(r'\| (RQ|AC)-\d\d \|', line):
        cells = [x.strip() for x in line.split('|')[1:-1]]
        canonical.append((cells[0], cells[3], cells[4], cells[5], cells[6], cells[7]))

check('exact canonical 24 IDs/titles/owner/execution/verification/due', sorted((r['id'], r['label'], r['owner'], r['exec'], r['ver'], r['dueISO']) for r in rec) == sorted(canonical) and len(rec) == 24)
check('Action census 4 completed, 3 waiting, 5 not started, 0 in progress', {e: sum(r['type'] == 'action' and r['exec'] == e for r in rec) for e in ['COMPLETED', 'WAITING', 'NOT_STARTED', 'IN_PROGRESS']} == {'COMPLETED': 4, 'WAITING': 3, 'NOT_STARTED': 5, 'IN_PROGRESS': 0})
check('seven exact canonical dependency edges', data['edges'] == [['DEP-01', 'RQ-04', 'AC-05', 'proof'], ['DEP-02', 'AC-05', 'AC-07', 'completion'], ['DEP-03', 'AC-07', 'AC-08', 'completion'], ['DEP-04', 'AC-08', 'AC-09', 'completion'], ['DEP-05', 'RQ-05', 'AC-05', 'proof'], ['DEP-06', 'AC-10', 'AC-11', 'completion'], ['DEP-07', 'RQ-11', 'AC-12', 'proof']])

class Tags(HTMLParser):
    def __init__(self):
        super().__init__(convert_charrefs=True)
        self.ids = []
        self.refs = []
    def handle_starttag(self, t, a):
        d = dict(a)
        if 'id' in d: self.ids.append(d['id'])
        if t in ['a', 'link', 'script', 'img']:
            u = d.get('href', d.get('src'))
            if u: self.refs.append(u)

p = Tags()
p.feed(h)
p.close()
check('HTML parsed and unique IDs', len(p.ids) == len(set(p.ids)))
check('prototype links local and resolvable', all((u[1:] in p.ids if u.startswith('#') else (out / u).exists()) for u in p.refs))

js = re.search(r'<script id="concept-logic">(.*?)</script>', h, re.S).group(1)
Path('/tmp/mc-r3-concept.js').write_text(js)
check('no external network/auth/upload/export/persistence implementation', not re.search(r'\b(fetch|XMLHttpRequest|WebSocket|localStorage|sessionStorage)\b', js))
check('script syntax', run(['rtk', 'proxy', 'node', '--check', '/tmp/mc-r3-concept.js']).returncode == 0)

pure = js.split('const axes=')[0]
pure = pure.replace("const data=JSON.parse(document.getElementById('atlas-data').textContent);", "const data=" + json.dumps(data) + ";")
tests = """
const assert = require('node:assert/strict');
assert.equal(records.filter(eligible).length, 0);
assert.equal(edgeSatisfied({dep:'READY',exec:'COMPLETED',ver:'NOT_REQUIRED',validProof:false},'completion'), true);
assert.equal(edgeSatisfied({dep:'READY',exec:'COMPLETED',ver:'NOT_REQUIRED',validProof:false},'proof'), false);
assert.equal(edgeSatisfied({dep:'BLOCKED',exec:'COMPLETED',ver:'VERIFIED',validProof:true},'completion'), false);
assert.equal(edgeSatisfied({dep:'READY',exec:'IN_PROGRESS',ver:'VERIFIED',validProof:true},'proof'), false);
assert.equal(edgeSatisfied({dep:'READY',exec:'COMPLETED',ver:'VERIFIED',validProof:true},'proof'), true);
assert.equal(edgeSatisfied({dep:'READY',exec:'COMPLETED',ver:'VERIFIED',validProof:false},'proof'), false);
assert.equal(edgeSatisfied(recordById['RQ-03'],'proof'), false);
assert.equal(edgeSatisfied(recordById['RQ-05'],'proof'), false);
assert.equal(milestone([]), 'UNASSESSED');
assert.equal(milestone([{dep:'READY',exec:'COMPLETED',ver:'NOT_REQUIRED',explicitNotRequired:true}]), 'READY');
assert.equal(milestone([{dep:'BLOCKED',exec:'COMPLETED',ver:'NOT_REQUIRED',explicitNotRequired:true}]), 'BLOCKED');
assert.equal(milestone([{dep:'READY',exec:'COMPLETED',ver:'NOT_REQUIRED',explicitNotRequired:false}]), 'BLOCKED');
assert.equal(inWindow('2026-06-14T09:00:00+07:00','2026-06-14T09:00:00+07:00',data.asOf), false);
assert.equal(inWindow(data.asOf,'2026-06-14T09:00:00+07:00',data.asOf), true);
assert.equal(inWindow(data.asOf,data.asOf,data.asOf), false);
assert.equal(timing(recordById['AC-04']), 'OVERDUE');
assert.equal(timing(recordById['AC-05']), 'DUE_SOON');
assert.equal(timing(recordById['AC-01']), 'ON_TRACK');
for(const n of [50,100,200]){
    const rs = densityRows(n);
    assert.equal(rs.length, n);
    assert.equal(new Set(rs.map(r=>r.id)).size, n);
    assert.equal(rs.at(-1).id, 'DENSITY-' + String(n).padStart(3, '0'));
    assert.ok(rs.every(r=>r.dep===null));
}
assert.equal(esc('<img src=x onerror="x">'), '&lt;img src=x onerror=&quot;x&quot;&gt;');
"""
Path('/tmp/mc-r3-pure-check.cjs').write_text(pure + '\n' + tests)
check('pure helper assertions, not DOM or backend', run(['rtk', 'proxy', 'node', '/tmp/mc-r3-pure-check.cjs']).returncode == 0)

print(f"ALL {len(checks)} CHECKS PASSED!")
for c in checks:
    print(f"  [PASS] {c['check']}")

```

Skipped: browser/render/interaction/assistive/user study, product builds/backend/DB/runtime/performance/recovery, external generation/reviewer messaging, installs and Git mutations.
Remaining risk: this unrendered source/spec proposal and local helper checks cannot prove production permissions, concurrency, workflow enforcement, visual quality or comprehension; nonauthor review and adoption/rendered/user-task gates remain open.
