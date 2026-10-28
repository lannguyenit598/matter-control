"""Bounded handoff capture: public source pins and non-DB checks only."""
from pathlib import Path
import datetime
import hashlib
import json
import os
import subprocess
import sys

root = Path(__file__).resolve().parents[3]
out = Path(__file__).resolve().parent
phase = sys.argv[1]
target = out / (phase + '.json')
if target.exists():
    raise SystemExit('Preserve the existing attempt.')
now = lambda: datetime.datetime.now(datetime.timezone.utc).isoformat()
if phase == 'inventory':
    excluded = {'.git', '.mimosa', 'node_modules', '.next', 'dist', 'build', 'bin',
                'coverage', '.turbo', '.cache', 'test-results', 'playwright-report', '__pycache__'}
    files = []
    for app in ['apps/backend', 'apps/frontend']:
        for directory, dirs, names in os.walk(root / app, followlinks=False):
            for name in list(dirs):
                p = Path(directory) / name
                if name in excluded or p.is_symlink():
                    dirs.remove(name)
                    if p.is_symlink():
                        names.append(name)
            for name in names:
                if (name.startswith('.env') and not name.endswith(('.example', '.sample'))) or name.endswith(('.key', '.pem', '.p12')):
                    continue
                p = Path(directory) / name
                data = os.readlink(p).encode() if p.is_symlink() else p.read_bytes()
                files.append({'path': str(p.relative_to(root)), 'bytes': len(data),
                              'sha256': hashlib.sha256(data).hexdigest(), 'symlink': p.is_symlink()})
    files.sort(key=lambda e: e['path'])
    deltas = {}
    for label, relative in [('claude_start', 'docs/testing/p0-claude-takeover-20261027/source-inventory.json'),
                            ('claude_w1_review', 'docs/testing/p0-claude-w1-review-20261027/inventory-check.json')]:
        old = {e['path']: e for e in json.loads((root / relative).read_text())['files']}
        current = {e['path']: e for e in files}
        deltas[label] = {'changed': [p for p in current if p in old and current[p]['sha256'] != old[p]['sha256']],
                         'added': sorted(current.keys() - old.keys()), 'missing': sorted(old.keys() - current.keys())}
    aggregate = '\n'.join(e['sha256'] + '  ' + e['path'] for e in files).encode()
    value = {'captured_utc': now(), 'files': files, 'aggregate_sha256': hashlib.sha256(aggregate).hexdigest(),
             'aggregate_method': "sha256 of newline-joined sorted '<sha256>  <path>' lines, no trailing newline",
             'deltas': deltas, 'scope': 'Public apps source/config/docs; secret-like files and generated/dependency directories excluded.'}
else:
    env = os.environ.copy()
    for name in ['DATABASE_URL', 'TEST_DATABASE_URL', 'MC_TEST_DATABASE_URL']:
        env.pop(name, None)
    if phase in ['go', 'build']:
        env.update({'GOPROXY': 'off', 'GOTOOLCHAIN': 'local',
                    'GOCACHE': '/private/tmp/mc-p0-claude-takeover-20261027-go-cache'})
        cwd = root / 'apps/backend'
        argv = ['rtk', 'proxy', 'go', 'build', './...'] if phase == 'build' else [
            'rtk', 'proxy', 'go', 'test', '-race', '-count=1', '-json', './internal/core/...',
            './internal/adapter/inbound/productapi', './internal/adapter/outbound/repotest/mattercontrol',
            './internal/adapter/outbound/objectstore']
    elif phase == 'frontend':
        cwd, argv = root / 'apps/frontend', ['rtk', 'proxy', 'pnpm', 'check']
    else:
        raise SystemExit('Unknown phase')
    started = now()
    result = subprocess.run(argv, cwd=cwd, env=env, capture_output=True, text=True, timeout=300)
    (out / (phase + '-stdout.log')).write_text(result.stdout)
    (out / (phase + '-stderr.log')).write_text(result.stderr)
    value = {'argv': argv, 'cwd': str(cwd), 'utc_start': started, 'utc_end': now(), 'exit': result.returncode,
             'database_env_removed': ['DATABASE_URL', 'TEST_DATABASE_URL', 'MC_TEST_DATABASE_URL']}
    if phase == 'go':
        events = [json.loads(s) for s in result.stdout.splitlines() if s.startswith('{')]
        value['test_events'] = {a: sum(e.get('Action') == a and bool(e.get('Test')) for e in events)
                                for a in ['pass', 'fail', 'skip']}
target.write_text(json.dumps(value, indent=2) + '\n')
if phase == 'inventory':
    print(json.dumps({'files': len(files), 'aggregate_sha256': value['aggregate_sha256'],
                      'deltas': {k: {c: len(v) for c, v in d.items()} for k, d in deltas.items()}}, indent=2))
else:
    print(json.dumps(value, indent=2))
