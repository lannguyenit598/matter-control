import datetime, json, os, pathlib, subprocess, sys

repo = pathlib.Path('/Users/nguyenvanlan/Documents/code/pet-projects/matter-control')
fixture = json.loads(pathlib.Path('/private/tmp/mc-codex-adr006-fixture/private.json').read_text())
out = repo / 'docs/testing/codex-adr006-remediation-20261030-r1'
out.mkdir(exist_ok=True)
name, *args = sys.argv[1:]
dest = out / (name + '.log')
if dest.exists(): raise SystemExit('refuse overwrite')
env = dict(os.environ, MC_BFF_TEST_DATABASE_URL=fixture['dsn'])
cmd = ['rtk', 'proxy', 'node', 'node_modules/vitest/vitest.mjs', 'run', *args]
start = datetime.datetime.now(datetime.timezone.utc).isoformat()
p = subprocess.run(cmd, cwd=repo / 'apps/frontend', env=env, capture_output=True)
password = fixture['dsn'].split(':', 2)[2].split('@', 1)[0].encode()
raw = (p.stdout + p.stderr).replace(password, b'REDACTED')
dest.write_bytes(raw)
metadata = dict(command=cmd, cwd=str(repo / 'apps/frontend'), started_utc=start, ended_utc=datetime.datetime.now(datetime.timezone.utc).isoformat(), exit=p.returncode, fixture_name=fixture['name'])
(out / (name + '-meta.json')).write_text(json.dumps(metadata, indent=2) + '\n')
print(json.dumps(metadata))
print(raw.decode()[-10000:])
raise SystemExit(p.returncode)
