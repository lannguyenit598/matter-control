"""Read/hash/source/mock checks; keep author artifacts unchanged."""
from pathlib import Path
import datetime
import hashlib
import json
import os
import re
import subprocess

root = Path(__file__).resolve().parents[3]
out = Path(__file__).resolve().parent
pkg = root / 'docs/design/p0-handoff-r8'
receipt_path = out / 'receipt.json'
if receipt_path.exists():
    raise SystemExit('Preserve existing review receipt.')

def pin(path):
    b = path.read_bytes()
    return {'path': str(path.relative_to(root)), 'bytes': len(b), 'sha256': hashlib.sha256(b).hexdigest()}

started = datetime.datetime.now(datetime.timezone.utc).isoformat()
before = [pin(f) for f in sorted(pkg.rglob('*')) if f.is_file()]
declared = []
for line in (pkg / 'return.md').read_text().splitlines():
    m = re.match(r'\| `([^`]+)` \| ([\d,]+) \| `([0-9a-f]{64})`', line)
    if m:
        actual = pin(pkg / m[1])
        declared.append({'path': m[1], 'match': actual['bytes'] == int(m[2].replace(',', ''))
                         and actual['sha256'] == m[3]})
assert len(declared) == 8 and all(d['match'] for d in declared)
env = os.environ.copy()
env['PYTHONDONTWRITEBYTECODE'] = '1'
commands = []

def run(label, argv, stdin=None):
    start = datetime.datetime.now(datetime.timezone.utc).isoformat()
    r = subprocess.run(argv, cwd=root, input=stdin, text=True, capture_output=True, timeout=45, env=env)
    commands.append({'label': label, 'argv': argv, 'started_utc': start,
                     'completed_utc': datetime.datetime.now(datetime.timezone.utc).isoformat(),
                     'exit': r.returncode, 'stdout': r.stdout, 'stderr': r.stderr})

for script in ['check_vocabulary.py', 'check_canonical_dataset_and_proof.py',
               'check_study_assets.py', 'check_css_byte_identity.py']:
    run(script, ['rtk', 'proxy', 'python3', '-B', str(pkg / 'checks' / script)])
run('owner mock', ['rtk', 'proxy', 'node', str(pkg / 'checks/check_mock_dom_bootstrap.js')])
for file, script_id in [('prototype.html', 'concept-logic'), ('study/participant-surface.html', 'study-logic')]:
    logic = re.search(r'<script id="' + script_id + r'">(.*?)</script>', (pkg / file).read_text(), re.S)[1]
    run('syntax ' + file, ['rtk', 'proxy', 'node', '--check'], logic)
for file in ['strict_dom.js', 'check_mock_dom_bootstrap.js']:
    run('syntax ' + file, ['rtk', 'proxy', 'node', '--check', str(pkg / 'checks' / file)])
run('reviewer negative probes', ['rtk', 'proxy', 'node', str(out / 'reviewer-probes.cjs')])

matrix = json.loads((pkg / 'screen-state-matrix.json').read_text())
coverage = json.loads((root / 'docs/testing/p0-zcode-plan-20261026/coverage.json').read_text())
expected = {k: set() for k in ['FR', 'AC', 'NFR']}
def collect(value):
    if isinstance(value, dict):
        for child in value.values(): collect(child)
    elif isinstance(value, list):
        for child in value: collect(child)
    elif isinstance(value, str):
        for key in expected:
            expected[key].update(re.findall(r'\b' + key + r'-\d{3}\b', value))
collect(coverage)
assert {r['id'] for r in matrix['requirements']} == expected['FR']
assert set(matrix['all_acceptance_ids']) == expected['AC']
assert set(matrix['nfr_ids']) == expected['NFR']
reqs = {r['id']: r for r in matrix['requirements']}
screens = {s['id']: s for s in matrix['screens']}
required_states = {'loading', 'empty', 'no_match', 'unavailable', 'forbidden', 'stale', 'conflict', 'partial', 'recovery'}
assert len(screens) == 13
for sid, s in screens.items():
    assert required_states <= s['states'].keys()
    for fr in s['requirements']: assert sid in reqs[fr]['screens']
for fr, req in reqs.items():
    for sid in req['screens']: assert fr in screens[sid]['requirements']
assert len(matrix['golden_workflows']) == 3
history = json.loads((pkg / 'findings-disposition.json').read_text())
prior = json.loads((root / 'docs/design/p0-handoff-r7/findings-disposition.json').read_text())
assert history['historical_findings'] == prior['historical_findings']
after = [pin(f) for f in sorted(pkg.rglob('*')) if f.is_file()]
assert before == after
result = {
    'task': 'MC-P0-DESIGN-R8-INTAKE', 'reviewer': 'Actual Codex / Local Codex',
    'started_utc': started, 'completed_utc': datetime.datetime.now(datetime.timezone.utc).isoformat(),
    'mode': 'READ_HASH_SOURCE_AND_BOUNDED_MOCK_ONLY', 'package_pins': before,
    'declared_output_pins': declared, 'package_unchanged': before == after,
    'coverage': {k: len(v) for k, v in expected.items()}, 'screens': len(screens),
    'historical_records_preserved': len(history['historical_findings']),
    'commands': commands,
    'referenced_but_absent': [f for f in ['checks/check_manifest_pins.py', 'checks/check_screen_state_matrix.py', 'checks/run_all_checks.sh'] if not (pkg / f).exists()],
    'browser': 'VERIFICATION_BLOCKED: Local browser use is disabled in Work settings',
    'not_run': ['browser/render', 'screen reader', 'human study', 'product runtime/build/auth/DB', 'external dispatch']
}
receipt_path.write_text(json.dumps(result, ensure_ascii=False, indent=2) + '\n')
print(json.dumps({'pins_match': len(declared), 'checks': [(c['label'], c['exit']) for c in commands],
                  'coverage': result['coverage'], 'package_unchanged': before == after,
                  'receipt': str(receipt_path)}, indent=2))
