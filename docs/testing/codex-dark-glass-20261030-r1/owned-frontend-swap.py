from pathlib import Path
import subprocess,os,signal,time,json,socket,datetime,urllib.request,re
root=Path('/Users/nguyenvanlan/Documents/code/pet-projects/matter-control');run=Path('/private/tmp/mc-dark-manual-chv1bfpa');out=root/'docs/testing/codex-dark-glass-20261030-r1'
old=71345
cwd=subprocess.check_output(['rtk','proxy','lsof','-a','-p',str(old),'-d','cwd','-Fn'],text=True)
identity=subprocess.check_output(['rtk','proxy','ps','-p',str(old),'-o','lstart=,command='],text=True).strip()
assert 'n/private/tmp/mc-liquid-manual-_7psy_qa/frontend' in cwd
assert identity.startswith('Fri Oct 30 12:10:44 2026') and 'next-server (v16.4.2)' in identity
assert json.loads((out/'runtime-build.json').read_text())['exit']==0
assert (run/'frontend/src/app/globals.css').read_bytes()==(root/'apps/frontend/src/app/globals.css').read_bytes()
os.kill(old,signal.SIGTERM)
def port_open():
 s=socket.socket();s.settimeout(.25)
 try:return s.connect_ex(('127.0.0.1',3000))==0
 finally:s.close()
for _ in range(80):
 if not port_open():break
 time.sleep(.1)
else:raise SystemExit('Old frontend port did not close; no new process started')
argv=['rtk','proxy','node',str(run/'frontend/node_modules/next/dist/bin/next'),'start','--hostname','127.0.0.1','--port','3000']
log=os.open(run/'frontend.log',os.O_WRONLY|os.O_CREAT|os.O_EXCL,0o600)
p=subprocess.Popen(argv,cwd=run/'frontend',env=dict(os.environ,NEXT_TELEMETRY_DISABLED='1'),stdout=log,stderr=subprocess.STDOUT,start_new_session=True);os.close(log)
meta=dict(owner='Actual Local Codex',time_utc=datetime.datetime.now(datetime.timezone.utc).isoformat(),old_pid=old,old_identity=identity,old_cwd='/private/tmp/mc-liquid-manual-_7psy_qa/frontend',old_signal='SIGTERM',frontend_pid=p.pid,cwd=str(run/'frontend'),argv=argv,url='http://localhost:3000/workspaces',api_and_database_unchanged=True,session_note='Frontend memory BFF restarted; sign-in may be required',browser_visual='BLOCKED_TOOL_DISABLED')
(run/'frontend-process.json').write_text(json.dumps(meta,indent=2)+'\n')
for _ in range(100):
 if p.poll() is not None:raise SystemExit('New frontend exited; inspect private log')
 try:
  with urllib.request.urlopen('http://localhost:3000/login',timeout=2) as r:html=r.read().decode();status=r.status
  break
 except Exception:time.sleep(.2)
else:raise SystemExit('New frontend readiness timed out')
assets=re.findall(r'href="([^" ]+\.css[^" ]*)"',html)
css=''
for asset in assets:
 with urllib.request.urlopen('http://localhost:3000'+asset,timeout=3) as r:css+=r.read().decode()
with urllib.request.urlopen('http://localhost:8081/healthz',timeout=3) as r:health=r.status
meta['checks']=dict(login_http=status,api_health=health,css_assets=len(assets),dark_status_token_served='--success:oklch(.79 .12 155)' in css,field_token_served='--input:oklch(.66 .015 286)' in css,action_sheen_served='--liquid-action-sheen:' in css)
assert all(meta['checks'][x] for x in ['dark_status_token_served','field_token_served','action_sheen_served'])
(out/'runtime.json').write_text(json.dumps(meta,indent=2)+'\n');(run/'runtime.json').write_text(json.dumps(meta,indent=2)+'\n');Path('/private/tmp/mc-dark-active-path.txt').write_text(str(run)+'\n')
print(json.dumps(meta,indent=2))
