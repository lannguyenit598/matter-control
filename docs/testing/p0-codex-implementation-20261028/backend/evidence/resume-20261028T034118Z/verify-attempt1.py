"""Read-only frozen-backend audit; writes only new sibling evidence files."""
from pathlib import Path
import datetime
import hashlib
import json
import re
import subprocess
import sys

attempt = Path(__file__).resolve().parent
packet = attempt.parents[2]
started = datetime.datetime.now(datetime.timezone.utc).isoformat()
sha = lambda path: hashlib.sha256(path.read_bytes()).hexdigest()
baseline = json.loads((packet / 'baseline-manifest.json').read_text())
delivery = json.loads((packet / 'delivery/manifest.json').read_text())
lane = next(p for p in delivery['patches'] if p['lane'] == 'backend')
frozen = json.loads((packet / 'backend/evidence/changed-files.json').read_text())
root = Path(baseline['backend_workspace'])
expected = {e['path']: e for e in lane['files']}
assert len(expected) == 7
assert sha(packet / 'baseline-manifest.json') == frozen['baseline_manifest_sha256']
rows = []
for e in lane['files']:
    hashes = {
        'baseline': sha(Path(baseline['baseline']) / e['path']),
        'before': sha(packet / 'delivery/backend/before' / e['path']),
        'after': sha(packet / 'delivery/backend/after' / e['path']),
        'isolated': sha(root / e['path']),
    }
    assert hashes['baseline'] == hashes['before'] == e['before_sha256']
    assert hashes['after'] == hashes['isolated'] == e['after_sha256']
    old = next(c for c in frozen['changes'] if c['path'] == e['path'])
    assert old['sha256'] == hashes['isolated'] and old['baseline_sha256'] == hashes['baseline']
    rows.append({'path': e['path'], **hashes})
for e in baseline['entries']:
    assert sha(Path(baseline['baseline']) / e['path']) == e['sha256'], e['path']
    if e['path'].startswith('apps/backend/'):
        assert sha(root / e['path']) == expected.get(e['path'], {}).get('after_sha256', e['sha256']), e['path']
backend_entries = {e['path'] for e in baseline['entries'] if e['path'].startswith('apps/backend/')}
actual_entries = {str(p.relative_to(root)) for p in (root / 'apps/backend').rglob('*') if p.is_file()}
assert actual_entries == backend_entries, sorted(actual_entries ^ backend_entries)
assert sha(packet / lane['patch']) == lane['patch_sha256']
metadata = []
for path in sorted((packet / 'backend/evidence').glob('*-command.json')):
    item = json.loads(path.read_text())
    argv = item['command']
    assert not any(re.match(r'(HOME|home|CODEX_HOME)=', arg) for arg in argv)
    assert item['cwd'] == str(root / 'apps/backend')
    assert 'GOPROXY=off' in argv and 'GOSUMDB=off' in argv and 'GOTOOLCHAIN=local' in argv
    assert any(a.startswith('GOCACHE=/private/tmp/mc-p0-codex-impl-') for a in argv)
    for name in ['DATABASE_URL', 'TEST_DATABASE_URL', 'MC_TEST_DATABASE_URL']:
        assert any(argv[i:i+2] == ['-u', name] for i in range(len(argv)-1))
    assert item['exit'] == (1 if path.name.startswith('red') else 0)
    metadata.append({'path': str(path.relative_to(packet)), 'sha256': sha(path), 'exit': item['exit'], 'home_override': False})
log = packet / 'backend/evidence/green-frozen.log'
text = log.read_text()
assert len(re.findall(r'^\s*--- PASS:', text, re.M)) == 98
assert '--- FAIL:' not in text and text.count('\nok  \t') == 3
assert 'WARNING: DATA RACE' not in text
assert len(metadata) == 7
prior = {str(p.relative_to(packet)): sha(p) for p in (packet / 'backend/evidence').iterdir() if p.is_file()}
versions = {}
for argv in [['rtk', '--version'], ['rtk', 'proxy', 'env', 'GOTOOLCHAIN=local', 'go', 'version']]:
    result = subprocess.run(argv, cwd=root / 'apps/backend', capture_output=True, text=True)
    assert result.returncode == 0
    versions[' '.join(argv)] = result.stdout.strip()
result = {'task': 'MC-P0-CODEX-BE-PATCH-20261028', 'agent': 'actual Local Codex /root (resume; author-side verification)',
          'started_utc': started, 'finished_utc': datetime.datetime.now(datetime.timezone.utc).isoformat(),
          'cwd': str(Path.cwd()), 'product_cwd': str(root / 'apps/backend'),
          'command': ['rtk', 'proxy', 'python3', str(Path(__file__).resolve())], 'exit': 0,
          'script_sha256': sha(Path(__file__)), 'python': sys.version.split()[0], 'tools': versions,
          'branch': baseline['branch'], 'base_head': baseline['head'], 'new_product_commit': None,
          'all_baseline_pins_verified': len(baseline['entries']), 'backend_file_count': len(backend_entries),
          'seven_path_hashes': rows, 'patch_sha256': lane['patch_sha256'], 'patch_remains_valid': True,
          'command_metadata': metadata, 'retained_evidence_sha256': prior,
          'frozen_log_sha256': sha(log), 'retained_pass_nodes': 98, 'tests_rerun': False,
          'reason_not_rerun': 'Exact frozen bytes and compliant final environment; required cases present in frozen log and source; no new reviewer finding returned.',
          'independent_review': 'PENDING; no review result in packet/review at resume',
          'not_run': ['PostgreSQL', 'make check', 'integrated product', 'live HTTP', 'deployment']}
target = attempt / 'integrity.json'
with target.open('x') as stream:
    json.dump(result, stream, indent=2)
    stream.write('\n')
print(json.dumps({'exit': 0, 'baseline_pins': len(baseline['entries']), 'backend_files': len(backend_entries), 'changed_paths': len(rows), 'retained_pass_nodes': 98, 'tests_rerun': False, 'output': str(target)}))
