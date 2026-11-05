from pathlib import Path
import json,urllib.request,re,time
root=Path('/Users/nguyenvanlan/Documents/code/pet-projects/matter-control');run=Path('/private/tmp/mc-dark-manual-chv1bfpa');out=root/'docs/testing/codex-dark-glass-20261030-r1'
meta=json.loads((run/'frontend-process.json').read_text())
for _ in range(100):
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
meta['checks']=dict(login_http=status,api_health=health,css_assets=len(assets),dark_status_token_served='--success:oklch(79% .12 155)' in css,field_token_served='--input:oklch(66% .015 286)' in css,action_sheen_served='--liquid-action-sheen:' in css)
assert all(meta['checks'][x] for x in ['dark_status_token_served','field_token_served','action_sheen_served'])
(out/'runtime.json').write_text(json.dumps(meta,indent=2)+'\n');(run/'runtime.json').write_text(json.dumps(meta,indent=2)+'\n');Path('/private/tmp/mc-dark-active-path.txt').write_text(str(run)+'\n')
print(json.dumps(meta,indent=2))
