import datetime, json, os, pathlib, subprocess, sys

repo = pathlib.Path('/Users/nguyenvanlan/Documents/code/pet-projects/matter-control')
private = pathlib.Path('/private/tmp/mc-codex-adr006-fixture')
fixture = json.loads((private / 'private.json').read_text())
out = repo / 'docs/testing/codex-adr006-remediation-20261030-r1'
out.mkdir(exist_ok=True)
name, *args = sys.argv[1:]
if not name.replace('-', '').isalnum():
    raise SystemExit('invalid attempt name')
dest = out / (name + '.jsonl')
if dest.exists():
    raise SystemExit('refuse overwrite')
env = dict(os.environ, MC_TEST_DATABASE_URL=fixture['dsn'], GOCACHE='/private/tmp/mc-codex-intake-go-cache')
env.pop('TEST_DATABASE_URL', None)
env.pop('DATABASE_URL', None)
cmd = ['rtk', 'proxy', 'go', 'test', '-race', '-count=1', '-json', *args]
started = datetime.datetime.now(datetime.timezone.utc).isoformat()
p = subprocess.run(cmd, cwd=repo / 'apps/backend', env=env, capture_output=True)
ended = datetime.datetime.now(datetime.timezone.utc).isoformat()
password = fixture['dsn'].split(':', 2)[2].split('@', 1)[0].encode()
raw = p.stdout.replace(password, b'REDACTED')
dest.write_bytes(raw)
(out / (name + '-stderr.txt')).write_bytes(p.stderr.replace(password, b'REDACTED'))
events = [json.loads(line) for line in raw.splitlines() if line.strip()]
counts = {a: sum(e.get('Action') == a and bool(e.get('Test')) for e in events) for a in ['pass', 'fail', 'skip']}
meta = dict(command=cmd, cwd=str(repo / 'apps/backend'), started_utc=started, ended_utc=ended, exit=p.returncode, counts=counts, fixture_name=fixture['name'])
(out / (name + '-meta.json')).write_text(json.dumps(meta, indent=2) + '\n')
print(json.dumps(meta))
for e in events:
    if e.get('Action') == 'output' and ('must not rotate' in e.get('Output', '') or 'foreign-scope' in e.get('Output', '')):
        print(e['Output'].strip())
raise SystemExit(p.returncode)
