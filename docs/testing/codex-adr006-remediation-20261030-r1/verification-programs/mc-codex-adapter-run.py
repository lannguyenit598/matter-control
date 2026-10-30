import datetime, json, os, pathlib, subprocess, sys
candidate, label, *argv = sys.argv[1:]
if candidate not in ['opennext', 'vinext'] or not label.replace('-', '').isalnum(): raise SystemExit('invalid attempt')
work = pathlib.Path('/private/tmp/mc-codex-adapter-poc') / candidate
out = pathlib.Path('/Users/nguyenvanlan/Documents/code/pet-projects/matter-control/docs/testing/codex-adr006-remediation-20261030-r1')
dest = out / f'adapter-{candidate}-{label}.log'
if dest.exists(): raise SystemExit('refuse overwrite')
env = {k:v for k,v in os.environ.items() if not any(s in k.upper() for s in ['TOKEN','SECRET','PASSWORD','CREDENTIAL','DATABASE_URL','BFF_STATE','OIDC'])}
env.update(CI='true', WRANGLER_SEND_METRICS='false', API_MODE='rest', API_BASE_URL='http://127.0.0.1:8089/api/v1')
start = datetime.datetime.now(datetime.timezone.utc).isoformat()
try:
 p = subprocess.run(['rtk','proxy',*argv], cwd=work, env=env, capture_output=True, timeout=600)
 code, raw = p.returncode, p.stdout + p.stderr
except subprocess.TimeoutExpired as e:
 code, raw = 124, (e.stdout or b'') + (e.stderr or b'')
dest.write_bytes(raw)
meta = dict(command=['rtk','proxy',*argv], cwd=str(work), start_utc=start, end_utc=datetime.datetime.now(datetime.timezone.utc).isoformat(), exit=code)
(out / f'adapter-{candidate}-{label}.json').write_text(json.dumps(meta,indent=2)+'\n')
print(json.dumps(meta)); print(raw.decode(errors='replace')[-5000:]); raise SystemExit(code)
