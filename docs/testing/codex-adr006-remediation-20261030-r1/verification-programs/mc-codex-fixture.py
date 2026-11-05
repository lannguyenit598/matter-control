import json, os, pathlib, secrets, subprocess, sys, time

root = pathlib.Path('/private/tmp/mc-codex-adr006-fixture')
if root.exists():
    raise SystemExit('REFUSE existing fixture directory')
root.mkdir(mode=0o700)
name = 'mc-codex-adr006-' + secrets.token_hex(6)
password = secrets.token_urlsafe(32)
env = dict(os.environ, POSTGRES_PASSWORD=password)
result = subprocess.run(['docker', 'run', '-d', '--name', name, '--label', 'mc.owner=codex-adr006-20261030', '--memory', '512m', '--cpus', '1', '--pids-limit', '128', '-p', '127.0.0.1::5432', '-e', 'POSTGRES_PASSWORD', '-e', 'POSTGRES_USER=mc_fixture', '-e', 'POSTGRES_DB=mc_fixture', 'postgres:18.6-alpine'], env=env, capture_output=True, text=True)
if result.returncode:
    raise SystemExit('Docker fixture creation failed: ' + result.stderr)
cid = result.stdout.strip()
port = subprocess.check_output(['docker', 'port', cid, '5432/tcp'], text=True).strip().rsplit(':', 1)[1]
for _ in range(100):
    if subprocess.run(['docker', 'exec', cid, 'pg_isready', '-U', 'mc_fixture', '-d', 'mc_fixture'], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL).returncode == 0:
        break
    time.sleep(0.1)
else:
    raise SystemExit('Fixture did not become ready; retain for inspection')
record = {'container_id': cid, 'name': name, 'port': int(port), 'dsn': f'postgres://mc_fixture:{password}@127.0.0.1:{port}/mc_fixture?sslmode=disable'}
path = root / 'private.json'
path.write_text(json.dumps(record))
path.chmod(0o600)
print(json.dumps({k:v for k,v in record.items() if k != 'dsn'}))
