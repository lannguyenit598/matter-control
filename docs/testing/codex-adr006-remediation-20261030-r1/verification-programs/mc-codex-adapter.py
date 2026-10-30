import datetime, json, os, pathlib, shutil, subprocess, sys

repo = pathlib.Path('/Users/nguyenvanlan/Documents/code/pet-projects/matter-control')
candidate = sys.argv[1]
if candidate not in ['opennext', 'vinext']: raise SystemExit('invalid adapter')
base = pathlib.Path('/private/tmp/mc-codex-adapter-poc')
base.mkdir(exist_ok=True, mode=0o700)
work = base / candidate
if work.exists(): raise SystemExit('refuse existing adapter copy')
shutil.copytree(repo / 'apps/frontend', work, symlinks=False, ignore=shutil.ignore_patterns('node_modules', '.next', '.open-next', '.env*', '.dev.vars*', '.git', '.mimosa', '.claude', '.agents', 'test-results', 'playwright-report', 'storybook-static', '*.orig'))
env = {k:v for k,v in os.environ.items() if not any(s in k.upper() for s in ['TOKEN','SECRET','PASSWORD','CREDENTIAL','DATABASE_URL','BFF_STATE','OIDC'])}
env.update(CI='true', WRANGLER_SEND_METRICS='false', API_MODE='rest', API_BASE_URL='http://127.0.0.1:8089/api/v1')
out = repo / 'docs/testing/codex-adr006-remediation-20261030-r1'
def run(label, argv, timeout=600):
    start = datetime.datetime.now(datetime.timezone.utc).isoformat()
    try:
        p = subprocess.run(['rtk','proxy',*argv], cwd=work, env=env, capture_output=True, timeout=timeout)
        code, raw = p.returncode, p.stdout + p.stderr
    except subprocess.TimeoutExpired as exc:
        code, raw = 124, (exc.stdout or b'') + (exc.stderr or b'')
    (out / f'adapter-{candidate}-{label}.log').write_bytes(raw)
    meta = dict(command=['rtk','proxy',*argv], cwd=str(work), start_utc=start, end_utc=datetime.datetime.now(datetime.timezone.utc).isoformat(), exit=code)
    (out / f'adapter-{candidate}-{label}.json').write_text(json.dumps(meta,indent=2)+'\n')
    print(json.dumps(meta), flush=True)
    if code: print(raw.decode(errors='replace')[-5000:], flush=True)
    return code
install = ['pnpm','add','-D','--save-exact','--ignore-scripts','wrangler@4.156.0', '@opennextjs/cloudflare@1.20.14' if candidate=='opennext' else 'vinext@1.4.0']
if run('install', install): raise SystemExit(1)
if candidate == 'opennext':
    (work/'open-next.config.ts').write_text('import { defineCloudflareConfig } from "@opennextjs/cloudflare";\nexport default defineCloudflareConfig();\n')
    config = dict(name='mc-local-compat-opennext', main='.open-next/worker.js', compatibility_date='2026-10-30', compatibility_flags=['nodejs_compat'], assets=dict(directory='.open-next/assets',binding='ASSETS'), vars=dict(API_MODE='rest',API_BASE_URL='http://127.0.0.1:8089/api/v1'))
    (work/'wrangler.jsonc').write_text(json.dumps(config,indent=2)+'\n')
    code = run('build', ['node','node_modules/@opennextjs/cloudflare/dist/cli/index.js','build'])
else:
    code = run('check', ['node','node_modules/vinext/dist/cli.js','check'])
    if not code: code = run('build', ['node','node_modules/vinext/dist/cli.js','build'])
raise SystemExit(code)
