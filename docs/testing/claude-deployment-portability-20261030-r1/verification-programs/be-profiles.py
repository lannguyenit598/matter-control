# Runs the SAME local mcapi image under the rendered Cloud Run and Compute Engine profiles.
# usage: python3 be-profiles.py <migrate|cloud-run|vm|stop-cloud-run|stop-vm>
# Only these local substitutions are applied to the rendered files (recorded in profile-substitutions.json):
# image reference -> local tag; https issuer/R2 endpoints -> synthetic loopback fixture; Secret Manager
# references -> synthetic private values; VM `-p 127.0.0.1:8081:8081` -> shared fixture namespace
# (published as 127.0.0.1:47881); `--log-driver journald` removed (Docker Desktop has no journald).
import json, os, pathlib, re, shlex, subprocess, sys, tempfile

repo = pathlib.Path('/Users/nguyenvanlan/Documents/code/pet-projects/matter-control')
out = repo / 'docs/testing/claude-deployment-portability-20261030-r1'
S = pathlib.Path('/private/tmp/claude-501/-Users-nguyenvanlan-Documents-code-pet-projects-matter-control/6b785e53-a706-4a54-8bb7-a2e46affed61/scratchpad')
P = S / 'private'
fx = json.loads((P / 'private.json').read_text())
LOCAL_IMAGE = 'mc-claude-portability/mcapi:local'
image_id = subprocess.check_output(['docker', 'image', 'inspect', LOCAL_IMAGE, '--format', '{{.Id}}'], text=True).strip()
digest = image_id.split(':')[1]
NETNS = 'container:mc-claude-portability-pg'
LABEL = 'mc.owner=claude-portability-20261030'

values = {
    'IMAGE': f'asia-southeast1-docker.pkg.dev/mc-synthetic/mattercontrol/mcapi@sha256:{digest}',
    'OIDC_ISSUER': 'https://issuer.synthetic.test', 'OIDC_INTROSPECTION_URL': 'https://issuer.synthetic.test/oauth/v2/introspect',
    'OIDC_AUDIENCE': 'fixture-project', 'OIDC_API_CLIENT_ID': 'fixture-api',
    'R2_ENDPOINT': 'https://0123abcd.r2.cloudflarestorage.com', 'R2_BUCKET': 'mc-local',
    'DATABASE_URL_SECRET': 'mcapi-database-url', 'MIGRATE_DATABASE_URL_SECRET': 'mcapi-migrate-database-url',
    'R2_ACCESS_KEY_ID_SECRET': 'mcapi-r2-access-key-id', 'R2_SECRET_ACCESS_KEY_SECRET': 'mcapi-r2-secret-access-key', 'OIDC_KEY_SECRET': 'mcapi-oidc-api-key',
}
cr_values = {**values, 'SERVICE_NAME': 'mcapi', 'REGION': 'asia-southeast1', 'SERVICE_ACCOUNT': 'mcapi-run@mc-synthetic.iam.gserviceaccount.com', 'MAX_INSTANCES': '3'}
vm_values = {**values, 'PROJECT_ID': 'mc-synthetic', 'API_HOSTNAME': 'api.synthetic.test', 'REGISTRY_HOST': 'asia-southeast1-docker.pkg.dev',
             'GCLOUD_IMAGE': 'gcr.io/google.com/cloudsdktool/google-cloud-cli:590.0.1-stable@sha256:' + '0' * 64,
             'CADDY_IMAGE': 'docker.io/library/caddy:2.11.7-alpine@sha256:eb4d35b7452d1ab6171fbdbe8d9275b2301dad6dad92115d91e19fb9b24d510f'}
endpoint = {'https://issuer.synthetic.test': 'http://127.0.0.1:47811', 'https://0123abcd.r2.cloudflarestorage.com': 'http://127.0.0.1:47812'}
secrets = {'MC_DATABASE_URL': fx['product_netns'], 'MC_MIGRATE_DATABASE_URL': fx['product_netns'],
           'MC_R2_ACCESS_KEY_ID': 'synthetic-access', 'MC_R2_SECRET_ACCESS_KEY': 'synthetic-secret-not-a-credential'}

def render(profile, vals):
    d = pathlib.Path(tempfile.mkdtemp(dir=S)) / profile
    vf = d.parent / 'values.json'; vf.write_text(json.dumps(vals))
    subprocess.run(['node', str(repo / 'ops/deploy/profiles.mjs'), profile, str(vf), str(d)], check=True, capture_output=True)
    return d

def local(v):
    for a, b in endpoint.items(): v = v.replace(a, b)
    return v

def private_file(name, lines, mode=0o600):
    p = P / name; p.write_text(''.join(f'{k}={v}\n' for k, v in lines)); p.chmod(mode); return p

def key_dir(tag):
    d = P / f'oidc-{tag}'; d.mkdir(mode=0o700, exist_ok=True)
    k = d / 'api-key.json'
    if k.exists(): k.chmod(0o600)
    k.write_bytes((P / 'fixture-out/api-key.json').read_bytes()); k.chmod(0o400)
    return d

def run(label, argv):
    p = subprocess.run(argv, capture_output=True, text=True)
    redacted = [('REDACTED' if any(s in a for s in [fx['product_netns']]) else a) for a in argv]
    (out / 'receipts' / f'{label}.json').write_text(json.dumps(dict(label=label, argv=redacted, exit=p.returncode, stdout=p.stdout[-2000:], stderr=p.stderr[-2000:].replace(fx['product_netns'], 'REDACTED')), indent=2) + '\n')
    print(label, p.returncode, p.stdout.strip()[-300:], p.stderr.strip()[-600:].replace(fx['product_netns'], 'REDACTED'))
    return p.returncode

def cloud_run_env(text):
    env = {m.group(1): m.group(2) for m in re.finditer(r"\{ name: (MC_[A-Z0-9_]+), value: '?([^'}]*?)'? \}", text)}
    for m in re.finditer(r'- name: (MC_[A-Z0-9_]+)\n\s+valueFrom', text): env[m.group(1)] = secrets[m.group(1)]
    return {k: local(v) for k, v in env.items()}

cmd = sys.argv[1]
subs = []
if cmd in ('migrate', 'cloud-run'):
    d = render('cloud-run', cr_values)
    text = (d / ('migrate-job.yaml' if cmd == 'migrate' else 'service.yaml')).read_text()
    env = cloud_run_env(text)
    envf = private_file(f'cr-{cmd}.env', sorted(env.items()) + ([('K_SERVICE', 'mcapi'), ('PORT', '8080'), ('K_REVISION', 'mcapi-00001-local')] if cmd == 'cloud-run' else [('CLOUD_RUN_JOB', 'mcapi-migrate')]))
    argv = ['docker', 'run', '--label', LABEL, '--network', NETNS, '--memory', '512m', '--cpus', '1', '--env-file', str(envf)]
    if cmd == 'migrate':
        rc = run('be-cloudrun-migrate-job', argv + ['--rm', LOCAL_IMAGE, *re.search(r'args: \[(\w+)\]', text).group(1).split()])
    else:
        argv += ['-d', '--name', 'mc-claude-portability-be-cloudrun', '--mount', f'type=bind,src={key_dir("cr")},dst=/secrets/oidc,readonly', LOCAL_IMAGE]
        rc = run('be-cloudrun-start', argv)
    subs.append(dict(profile='cloud-run', file=text[:0] or cmd, substitutions=['image->local tag', 'issuer/R2 https->loopback fixture', 'secretKeyRef->synthetic env file', 'secret volume->bind of synthetic key (0400)', 'platform env K_SERVICE/PORT (or CLOUD_RUN_JOB) added as Cloud Run injects them']))
elif cmd == 'vm':
    d = render('compute-engine', vm_values)
    text = (d / 'cloud-init.yaml').read_text()
    envblock = re.search(r'path: /etc/mattercontrol/mcapi.env\n.*?content: \|\n((?:      [^\n]+\n)+)', text, re.S).group(1)
    nonsecret = [l.strip().split('=', 1) for l in envblock.splitlines() if l.strip()]
    f1 = private_file('vm-mcapi.env', [(k, local(v)) for k, v in nonsecret], 0o644)
    f2 = private_file('vm-mcapi-secrets.env', [(k, secrets[k]) for k in ['MC_DATABASE_URL', 'MC_R2_ACCESS_KEY_ID', 'MC_R2_SECRET_ACCESS_KEY']])
    exec_start = re.search(r'ExecStart=(/usr/bin/docker run --name mcapi .*)', text).group(1)
    argv = shlex.split(exec_start)
    argv[0] = 'docker'
    i = argv.index('--log-driver'); del argv[i:i + 2]
    i = argv.index('-p'); argv[i:i + 2] = ['--network', NETNS]
    argv = [{'/etc/mattercontrol/mcapi.env': str(f1), '/run/mattercontrol/mcapi-secrets.env': str(f2), vm_values['IMAGE']: LOCAL_IMAGE}.get(a, a) for a in argv]
    argv = [a.replace('src=/run/mattercontrol/oidc', f'src={key_dir("vm")}') for a in argv]
    argv[2:2] = ['-d', '--label', LABEL]  # detached locally; systemd supervises on the VM
    argv.remove('--rm')  # kept for `docker logs` evidence; systemd uses --rm
    argv[argv.index('--name') + 1] = 'mc-claude-portability-be-vm'
    rc = run('be-vm-start', argv)
    subs.append(dict(profile='compute-engine', exec_start=exec_start, substitutions=['/usr/bin/docker->docker', '--log-driver journald removed', '-p 127.0.0.1:8081:8081 -> --network shared fixture namespace (published 127.0.0.1:47881)', 'env-file/mount paths->synthetic private files (key 0400)', 'image->local tag', '--rm -> detached (-d), container kept for logs; --name mcapi -> mc-claude-portability-be-vm']))
elif cmd.startswith('stop-'):
    name = 'mc-claude-portability-be-' + ('cloudrun' if cmd == 'stop-cloud-run' else 'vm')
    rc = run(f'be-{cmd}', ['docker', 'stop', '-t', '75' if 'vm' in cmd else '10', name])
    subprocess.run(['docker', 'logs', name], stdout=open(P / f'{name}.log', 'w'), stderr=subprocess.STDOUT)
    subprocess.run(['docker', 'inspect', name, '--format', '{{.State.ExitCode}} {{.State.FinishedAt}}'])
if subs:
    f = out / 'receipts' / 'profile-substitutions.json'
    prev = json.loads(f.read_text()) if f.exists() else []
    f.write_text(json.dumps(prev + subs, indent=2) + '\n')
raise SystemExit(rc)
