"""Capture public product working files; never traverse private local runtime data."""
from pathlib import Path
import collections
import datetime
import hashlib
import json
import os
import re

root = Path(__file__).resolve().parents[3]
out = Path(__file__).resolve().parent
target = out / 'source-inventory.json'
if target.exists():
    raise SystemExit('Preserve the existing intake snapshot.')
baseline_path = root / 'docs/implementation/p0-zcode-execution/evidence/baseline-20261027/source-baseline-manifest.txt'
baseline = {}
for line in baseline_path.read_text().splitlines():
    match = re.fullmatch(r'([0-9a-f]{64})  (.+)', line)
    if match:
        baseline[match[2]] = match[1]

def info(path):
    if path.is_symlink():
        data = os.readlink(path).encode()
        kind = 'symlink'
    else:
        data = path.read_bytes()
        kind = 'file'
    return {'path': str(path.relative_to(root)), 'kind': kind, 'bytes': len(data),
            'sha256': hashlib.sha256(data).hexdigest()}

current = {}
excluded = []
skip_dirs = {'.git', '.mimosa', 'node_modules', '.next', 'dist', 'build', 'bin',
             'coverage', '.turbo', '.cache', 'test-results', 'playwright-report'}
for app in ['apps/backend', 'apps/frontend']:
    for directory, dirs, files in os.walk(root / app, followlinks=False):
        for name in list(dirs):
            p = Path(directory) / name
            if p.is_symlink():
                entry = info(p)
                current[entry['path']] = entry
                dirs.remove(name)
            elif name in skip_dirs:
                dirs.remove(name)
        for name in files:
            path = Path(directory) / name
            if (name.startswith('.env') and name not in {'.env.example', '.env.sample'}) or name.endswith(('.pem', '.key')):
                excluded.append(str(path.relative_to(root)))
                continue
            entry = info(path)
            current[entry['path']] = entry

changed, missing, unchanged = [], [], []
for path, sha in baseline.items():
    entry = current.get(path)
    if entry is None:
        missing.append(path)
    elif entry['sha256'] == sha:
        unchanged.append(path)
    else:
        changed.append({**entry, 'baseline_sha256': sha})
added = [entry for path, entry in current.items() if path not in baseline]
imported = json.loads((root / 'docs/source-import/manifest.json').read_text())
frontend = next(s for s in imported['sources'] if s['kind'] == 'frontend')
frontend_drift = [e['target_path'] for e in frontend['files']
                  if e['target_path'] not in current or current[e['target_path']]['sha256'] != e['sha256']]
board = json.loads((root / 'docs/implementation/p0-zcode-execution/workboard.json').read_text())
refs = [baseline_path, root / 'docs/implementation/p0-zcode-execution/workboard.json',
        root / 'docs/implementation/p0-zcode-execution/local-contract.md',
        root / 'docs/implementation/p0-zcode-execution/w1-implementation-notes.md',
        root / 'docs/implementation/p0-zcode-end-to-end-execution-plan.md',
        root / 'docs/reviews/p0-design-r7-full-review-20261027.md']
result = {
    'task': 'MC-P0-CLAUDE-TAKEOVER', 'captured_by': 'Actual Codex / Local Codex',
    'captured_utc': datetime.datetime.now(datetime.timezone.utc).isoformat(),
    'mode': 'READ_HASH_ONLY', 'baseline_hashed_entries': len(baseline),
    'owner_reported_baseline_files': board['step0']['baseline_files'],
    'baseline_comment_lines': sum(l.startswith('#') for l in baseline_path.read_text().splitlines()),
    'changed': sorted(changed, key=lambda e: e['path']),
    'added': sorted(added, key=lambda e: e['path']), 'missing': sorted(missing),
    'unchanged_count': len(unchanged), 'files': sorted(current.values(), key=lambda e: e['path']),
    'frontend_imported_entries': len(frontend['files']), 'frontend_imported_drift': frontend_drift,
    'w1_test_names': re.findall(r'^func (Test\w+)\(',
        (root / 'apps/backend/internal/core/service/workspace_service_w1_test.go').read_text(), re.M),
    'board_summary': {k: board.get(k) for k in ['task', 'owner', 'status', 'updated_utc', 'current_source_checkpoint', 'local_contract']},
    'waves': [{'id': w['id'], 'status': w['status']} for w in board['waves']],
    'references': [info(p) for p in refs], 'excluded_private_paths_not_read': excluded,
    'limits': 'No private ops/runtime/credential data, lifecycle or product runtime read. New source authorship is supported by owner records, not committed Git provenance.'
}
target.write_text(json.dumps(result, indent=2) + '\n')
print(json.dumps({'baseline_hashed_entries': len(baseline), 'changed': [e['path'] for e in changed],
                  'added': [e['path'] for e in added], 'missing': missing,
                  'frontend_imported_entries': len(frontend['files']), 'frontend_drift': frontend_drift,
                  'w1_tests': len(result['w1_test_names'])}, indent=2))
