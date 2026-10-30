import datetime,json,os,pathlib,subprocess,sys
label,*argv=sys.argv[1:]
root=pathlib.Path('/Users/nguyenvanlan/Documents/code/pet-projects/matter-control')
out=root/'docs/testing/codex-adr006-remediation-20261030-r1'
log=out/(label+'.log')
if log.exists(): raise SystemExit('refuse overwrite')
env={k:v for k,v in os.environ.items() if not any(s in k.upper() for s in ['TOKEN','SECRET','PASSWORD','CREDENTIAL','DATABASE_URL','BFF_STATE','OIDC'])}
env.update(CI='true',WRANGLER_SEND_METRICS='false',NEXT_TELEMETRY_DISABLED='1')
start=datetime.datetime.now(datetime.timezone.utc).isoformat()
with log.open('wb') as f:
 try: code=subprocess.run(['rtk','proxy',*argv],cwd=root/'apps/frontend',env=env,stdout=f,stderr=subprocess.STDOUT,timeout=600).returncode
 except subprocess.TimeoutExpired: code=124
meta=dict(argv=['rtk','proxy',*argv],cwd=str(root/'apps/frontend'),start_utc=start,end_utc=datetime.datetime.now(datetime.timezone.utc).isoformat(),exit=code)
(out/(label+'.json')).write_text(json.dumps(meta,indent=2)+'\n')
print(json.dumps(meta));print(log.read_text()[-4000:]);raise SystemExit(code)
