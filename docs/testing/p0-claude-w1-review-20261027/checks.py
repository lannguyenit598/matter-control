"""Review-only non-DB checks; never read private runtime credentials."""
from pathlib import Path
import collections
import datetime
import hashlib
import json
import os
import subprocess
import sys

root = Path(__file__).resolve().parents[3]
out = Path(__file__).resolve().parent
phase = sys.argv[1]
target = out / (phase + '-check.json')
if target.exists():
    raise SystemExit('Preserve existing attempt.')
if phase == 'inventory':
    prior = json.loads((root / 'docs/testing/p0-claude-takeover-20261027/source-inventory.json').read_text())
    original = {e['path']: e for e in prior['files']}
    now = []
    skips = {'.git', '.mimosa', 'node_modules', '.next', 'dist', 'build', 'bin', 'coverage',
             '.turbo', '.cache', 'test-results', 'playwright-report'}
    for app in ['apps/backend', 'apps/frontend']:
        for directory, dirs, files in os.walk(root / app, followlinks=False):
            for d in list(dirs):
                p = Path(directory) / d
                if d in skips or p.is_symlink():
                    dirs.remove(d)
                    if p.is_symlink(): files.append(d)
            for name in files:
                if (name.startswith('.env') and not name.endswith(('.example', '.sample'))) or name.endswith(('.key', '.pem')):
                    continue
                p = Path(directory) / name
                b = os.readlink(p).encode() if p.is_symlink() else p.read_bytes()
                now.append({'path': str(p.relative_to(root)), 'bytes': len(b), 'sha256': hashlib.sha256(b).hexdigest()})
    files = {e['path']: e for e in now}
    result = {'files': sorted(now, key=lambda e: e['path']),
              'changed': [p for p in files if p in original and files[p]['sha256'] != original[p]['sha256']],
              'added': [p for p in files if p not in original], 'missing': sorted(set(original) - files.keys()),
              'baseline': prior['captured_utc']}
else:
    env = os.environ.copy()
    for name in ['DATABASE_URL', 'TEST_DATABASE_URL', 'MC_TEST_DATABASE_URL']:
        env.pop(name, None)
    if phase == 'go':
        env.update({'GOPROXY': 'off', 'GOTOOLCHAIN': 'local',
                    'GOCACHE': '/private/tmp/mc-p0-claude-takeover-20261027-go-cache'})
        argv = ['rtk', 'proxy', 'go', 'test', '-race', '-count=1', '-json', './internal/core/...',
                './internal/adapter/inbound/productapi', './internal/adapter/outbound/identity/...',
                './internal/adapter/outbound/repotest/mattercontrol']
        cwd = root / 'apps/backend'
    elif phase == 'frontend':
        argv = ['rtk', 'proxy', 'pnpm', 'check']
        cwd = root / 'apps/frontend'
    elif phase == 'frontend-build':
        argv = ['rtk', 'proxy', 'pnpm', 'build']
        cwd = root / 'apps/frontend'
        env['NEXT_TELEMETRY_DISABLED'] = '1'
    else:
        raise SystemExit('Unknown phase')
    start = datetime.datetime.now(datetime.timezone.utc).isoformat()
    r = subprocess.run(argv, cwd=cwd, env=env, capture_output=True, text=True, timeout=300)
    (out / (phase + '-stdout.log')).write_text(r.stdout)
    (out / (phase + '-stderr.log')).write_text(r.stderr)
    result = {'argv': argv, 'cwd': str(cwd.relative_to(root)), 'started_utc': start,
              'completed_utc': datetime.datetime.now(datetime.timezone.utc).isoformat(), 'exit': r.returncode,
              'DB_env_removed': ['DATABASE_URL', 'TEST_DATABASE_URL', 'MC_TEST_DATABASE_URL']}
    if phase == 'go':
        events = [json.loads(l) for l in r.stdout.splitlines() if l.strip().startswith('{')]
        result['test_events'] = {a: sum(e.get('Action') == a and bool(e.get('Test')) for e in events)
                                 for a in ['pass', 'fail', 'skip']}
result['captured_utc'] = datetime.datetime.now(datetime.timezone.utc).isoformat()
target.write_text(json.dumps(result, indent=2) + '\n')
print(json.dumps({k: v for k, v in result.items() if k not in ['files', 'changed', 'added']}, indent=2))
if phase == 'inventory': print('changed', len(result['changed']), 'added', len(result['added']))
