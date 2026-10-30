"""Read/hash/source/mock review; write only this new review evidence directory."""
from pathlib import Path
import datetime
import hashlib
import json
import re
import subprocess

root = Path(__file__).resolve().parents[3]
out = Path(__file__).resolve().parent
package = root / 'docs/design/p0-handoff-r7'
receipt_path = out / 'receipt.json'
if receipt_path.exists():
    raise SystemExit('Review receipt exists; preserve it instead of overwriting.')
started = datetime.datetime.now(datetime.timezone.utc).isoformat()

def pin(path):
    data = path.read_bytes()
    return {'path': str(path.relative_to(root)), 'bytes': len(data),
            'sha256': hashlib.sha256(data).hexdigest()}

before = [pin(p) for p in sorted(package.rglob('*')) if p.is_file()]
declared = []
for line in (package / 'return.md').read_text().splitlines():
    match = re.search(r'\[`([^`]+)`\].*?\|\s*([\d,]+)\s*\|\s*`([0-9a-f]{64})`', line)
    if match:
        actual = pin(package / match[1])
        declared.append({'path': match[1], 'match': actual['bytes'] == int(match[2].replace(',', ''))
                         and actual['sha256'] == match[3]})
assert len(declared) == 22 and all(p['match'] for p in declared)
manifest = json.loads((root / 'docs/testing/p0-design-consolidated-inputs-20261027.json').read_text())
input_matches = []
for entry in manifest['inputs']:
    actual = pin(root / entry['path'])
    input_matches.append({'path': entry['path'], 'match': actual['bytes'] == entry['bytes']
                          and actual['sha256'] == entry['sha256']})

matrix = json.loads((package / 'screen-state-matrix.json').read_text())
coverage = json.loads((root / 'docs/testing/p0-zcode-plan-20261026/coverage.json').read_text())
ids = {'FR': [], 'AC': [], 'NFR': []}
def collect(value):
    if isinstance(value, dict):
        for child in value.values(): collect(child)
    elif isinstance(value, list):
        for child in value: collect(child)
    elif isinstance(value, str):
        for prefix in ids:
            ids[prefix].extend(re.findall(r'\b' + prefix + r'-\d{3}\b', value))
collect(coverage)
assert {r['id'] for r in matrix['requirements']} == set(ids['FR'])
assert set(matrix['all_acceptance_ids']) == set(ids['AC'])
assert set(matrix['nfr_ids']) == set(ids['NFR'])

commands = []
def run(label, argv, stdin=None):
    result = subprocess.run(argv, cwd=root, input=stdin, text=True, capture_output=True, timeout=30)
    commands.append({'label': label, 'argv': argv, 'exit': result.returncode,
                     'stdout': result.stdout, 'stderr': result.stderr})
    assert result.returncode == 0, label

run('node version', ['rtk', 'proxy', 'node', '--version'])
run('python version', ['rtk', 'proxy', 'python3', '--version'])
for name in ['check_manifest_pins.py', 'check_canonical_dataset_and_proof.py',
             'check_css_byte_identity.py', 'check_screen_state_matrix.py']:
    run(name, ['rtk', 'proxy', 'python3', str(package / 'checks' / name)])
logic = re.search(r'<script id="concept-logic">(.*?)</script>',
                  (package / 'prototype.html').read_text(), re.S)[1]
run('syntax via stdin (no owner tmp file overwritten)', ['rtk', 'proxy', 'node', '--check'], logic)
run('owner mock bootstrap', ['rtk', 'proxy', 'node', str(package / 'checks/check_mock_dom_bootstrap.js')])
run('reviewer negative/proof probes', ['rtk', 'proxy', 'node', str(out / 'reviewer-probes.cjs')])
after = [pin(p) for p in sorted(package.rglob('*')) if p.is_file()]
assert before == after
head = subprocess.run(['rtk', 'proxy', 'git', 'rev-parse', 'HEAD'], cwd=root,
                      capture_output=True, text=True, check=True).stdout.strip()
receipt = {
    'task': 'MC-P0-DESIGN-R7-FULL-REVIEW', 'reviewer': 'Actual Codex / Local Codex',
    'started_utc': started, 'completed_utc': datetime.datetime.now(datetime.timezone.utc).isoformat(),
    'base_head': head, 'mode': 'READ_HASH_SOURCE_AND_BOUNDED_MOCK_ONLY',
    'package_pins': before, 'declared_output_pins': declared, 'baseline_inputs': input_matches,
    'package_unchanged_after_checks': before == after,
    'coverage': {key: len(set(value)) for key, value in ids.items()},
    'screens': [{'id': s['id'], 'status': s['prototype_status']} for s in matrix['screens']],
    'commands': commands,
    'browser_blocker': 'Local browser use is disabled in Work settings; native inventory also reports Mac locked.',
    'not_run': ['browser render', 'keyboard/IME/touch/focus', 'screen reader', 'human AC-137',
                'product runtime/build/auth/DB', 'external agent/provider', 'master runner (overwrites owner evidence)']
}
receipt_path.write_text(json.dumps(receipt, ensure_ascii=False, indent=2) + '\n')
print(json.dumps({'declared': len(declared), 'baseline_matches': sum(p['match'] for p in input_matches),
                  'baseline_total': len(input_matches), 'coverage': receipt['coverage'],
                  'commands_passed': len(commands), 'package_unchanged': before == after,
                  'receipt': str(receipt_path)}, indent=2))
