import datetime,json,os,pathlib,subprocess,sys,time
cwd='/private/tmp/mc-p0-codex-impl-20261028-1o2z4r_1/frontend/apps/frontend'
out=pathlib.Path('/Users/nguyenvanlan/Documents/code/pet-projects/matter-control/docs/testing/p0-codex-implementation-20261028/frontend/evidence')
out.mkdir(parents=True,exist_ok=True)
name=sys.argv[1]; args=sys.argv[2:]
env={'PATH':os.environ['PATH'],'HOME':'/private/tmp','TMPDIR':'/private/tmp','NO_COLOR':'1'}
start=datetime.datetime.now(datetime.timezone.utc).isoformat(); before=time.monotonic()
r=subprocess.run(['rtk','proxy',*args],cwd=cwd,env=env,text=True,stdout=subprocess.PIPE,stderr=subprocess.STDOUT)
(out/(name+'.log')).write_text(r.stdout)
(out/(name+'.json')).write_text(json.dumps({'cwd':cwd,'command':['rtk','proxy',*args],'startedUtc':start,'finishedUtc':datetime.datetime.now(datetime.timezone.utc).isoformat(),'seconds':round(time.monotonic()-before,3),'exit':r.returncode,'environment':'env cleared; only PATH, HOME=/private/tmp, TMPDIR=/private/tmp, NO_COLOR=1; no .env files copied'},indent=2)+'\n')
print(r.stdout[-16000:]);print('EXIT',r.returncode)
sys.exit(r.returncode)
