from pathlib import Path
import os,json,hashlib,datetime,subprocess,secrets,socket,time,stat
R=Path('/Users/nguyenvanlan/Documents/code/pet-projects/matter-control')
run=json.loads((R/'docs/testing/inta-environment-preflight/driver-runid.json').read_text())['runId']
assert run.isalnum() and 8<=len(run)<=32
name='mc002-inta-pg-'+run; volume='mc002-inta-data-'+run; image='postgres@sha256:77f585114c32fbca283dc835b0596f4e52b51b4c6662d7810b2f4084f60a1873'
attempt='env-'+run; raw=Path('/tmp/mc002-inta-evidence/environment')/attempt
export=R/'docs/testing/inta-returns/environment'/attempt
private=Path('/tmp/mc002-inta-private')/run
assert not raw.exists() and not export.exists() and not private.exists()
raw.mkdir(parents=True); export.mkdir(parents=True)
private.mkdir(parents=True,mode=0o700); os.chmod(private,0o700)
password=secrets.token_hex(32); dsn=f'postgres://mc002_inta:{password}@127.0.0.1:15457/mc002_inta?sslmode=disable'
j={'task':'MC-002-INTA-ENV','runId':run,'attempt':attempt,'actor':'Codex actual ENV owner','approval':'DEC-028/INTA-1 plus actual R4 ZCode source review accepted by Codex','started_utc':datetime.datetime.now(datetime.timezone.utc).isoformat(),'state':'PREFLIGHT','container_name':name,'volume_name':volume,'image':image,'commands':[],'secrets_policy':'Private0600files only; values never printed/argv/evidence; no env/fullinspect dump','existing_resources_mutated':False,'go_migration_or_harness_runtime_executed':False}
def clean(s):return s.replace(password,'REDACTED').replace(dsn,'REDACTED_DSN')
def save():
 data=json.dumps(j,indent=2)+'\n';assert password not in data and dsn not in data
 (raw/'environment.json').write_text(data);(export/'environment.json').write_text(data)
def command(args,env=None,timeout=20):
 a=['rtk','proxy']+args;start=datetime.datetime.now(datetime.timezone.utc).isoformat()
 p=subprocess.run(a,env=env,capture_output=True,stdin=subprocess.DEVNULL,timeout=timeout)
 out=clean(p.stdout.decode());err=clean(p.stderr.decode());j['commands'].append({'argv':a,'started_utc':start,'ended_utc':datetime.datetime.now(datetime.timezone.utc).isoformat(),'exit':p.returncode,'stdout':out,'stderr':err});save()
 if p.returncode:raise RuntimeError('Command failed: '+str(a)+' '+err[:250])
 return p.stdout.decode().strip()
def private_write(p,text):
 fd=os.open(p,os.O_WRONLY|os.O_CREAT|os.O_EXCL,0o600)
 with os.fdopen(fd,'w') as f:f.write(text)
 assert stat.S_IMODE(p.stat().st_mode)==0o600
try:
 for port in [18085,18086,15457]:
  with socket.socket() as sock:sock.bind(('127.0.0.1',port))
 j['ports_verified_free']=[18085,18086,15457]
 # Name inventories kept in memory only; avoid dumping unrelated resources.
 for args,target in [(['docker','ps','-a','--format','{{.Names}}'],name),(['docker','volume','ls','--format','{{.Name}}'],volume)]:
  p=subprocess.run(['rtk','proxy']+args,capture_output=True,stdin=subprocess.DEVNULL,timeout=15);assert p.returncode==0
  names=p.stdout.decode().splitlines();assert target not in names
  j.setdefault('name_preflight',[]).append({'kind':'container' if args[1]=='ps' else 'volume','proposed_name':target,'absent':True,'existing_count':len(names),'inventory_sha256':hashlib.sha256(p.stdout).hexdigest()})
 for owner in ['backend','frontend','environment','qa']:assert not (Path('/tmp/mc002-inta-evidence')/owner/run).exists()
 assert not Path('/tmp/mc002-inta-state-'+run).exists()
 for p,head in [(Path('/tmp/mc002-inta-be'),'52b60a4617081c41b949f2242e1784238c170f75'),(Path('/tmp/mc002-inta-harness'),'48cc03e949d66fc47a7d304413621eb79804e6c1'),(Path('/tmp/mc002-inta-fe'),'3e5a642479acb789eb210e73fba956f3e85082e3')]:
  assert subprocess.check_output(['rtk','proxy','git','rev-parse','HEAD'],cwd=p,text=True).strip()==head
  assert not subprocess.check_output(['rtk','proxy','git','status','--porcelain'],cwd=p,text=True).strip()
 img=json.loads(command(['docker','image','inspect',image,'--format','{"Id":{{json .Id}},"RepoDigests":{{json .RepoDigests}},"Volumes":{{json .Config.Volumes}}}']))
 assert img['Id']=='sha256:77f585114c32fbca283dc835b0596f4e52b51b4c6662d7810b2f4084f60a1873'
 assert '/var/lib/postgresql' in img['Volumes'];j['image_verified']=img
 private_write(private/'postgres.env','POSTGRES_PASSWORD='+password+'\n')
 labels=['--label','mattercontrol.task=MC-002-INTA-ENV','--label','mattercontrol.runId='+run,'--label','mattercontrol.owner=Codex']
 command(['docker','volume','create']+labels+[volume]);j['volume_created']=True;j['state']='VOLUME_CREATED';save()
 penv=os.environ.copy();penv.update(POSTGRES_PASSWORD=password,POSTGRES_USER='mc002_inta',POSTGRES_DB='mc002_inta')
 cid=command(['docker','run','--pull=never','-d','--name',name]+labels+['--memory','512m','--cpus','1','--pids-limit','128','--publish','127.0.0.1:15457:5432','--mount','type=volume,src='+volume+',dst=/var/lib/postgresql','--env','POSTGRES_PASSWORD','--env','POSTGRES_USER','--env','POSTGRES_DB','--health-cmd','pg_isready -U mc002_inta -d mc002_inta','--health-interval','2s','--health-timeout','2s','--health-retries','15',image],env=penv)
 assert len(cid)==64;j['container_id']=cid;j['state']='CONTAINER_STARTED';save()
 healthy=False
 for _ in range(25):
  health=command(['docker','inspect','--format','{{.State.Status}} {{.State.Health.Status}}',cid]);
  if health=='running healthy':healthy=True;break
  time.sleep(1)
 assert healthy,'New owned container not healthy within bounded wait'
 fields='{"Id":{{json .Id}},"Name":{{json .Name}},"Image":{{json .Image}},"Labels":{{json .Config.Labels}},"Running":{{json .State.Running}},"Health":{{json .State.Health.Status}},"Memory":{{json .HostConfig.Memory}},"NanoCpus":{{json .HostConfig.NanoCpus}},"PidsLimit":{{json .HostConfig.PidsLimit}},"Ports":{{json .NetworkSettings.Ports}},"Mounts":{{json .Mounts}}}'
 current=json.loads(command(['docker','inspect','--format',fields,cid]));assert current['Id']==cid and current['Name']=='/'+name and current['Image']==img['Id'];assert current['Labels']['mattercontrol.runId']==run and current['Labels']['mattercontrol.owner']=='Codex';assert current['Memory']==536870912 and current['NanoCpus']==1000000000 and current['PidsLimit']==128;assert current['Ports']['5432/tcp']==[{'HostIp':'127.0.0.1','HostPort':'15457'}];assert len(current['Mounts'])==1 and current['Mounts'][0]['Name']==volume and current['Mounts'][0]['Destination']=='/var/lib/postgresql';j['verified_inspection']=current
 q="SELECT current_database(), current_user, (SELECT count(*) FROM information_schema.tables WHERE table_schema='public' AND table_type='BASE TABLE');"
 db=command(['docker','exec',cid,'psql','-X','-v','ON_ERROR_STOP=1','-U','mc002_inta','-d','mc002_inta','-At','-c',q]);assert db=='mc002_inta|mc002_inta|0';j['empty_db_identity']=db
 authenv=os.environ.copy();authenv['PGPASSWORD']=password
 tcp=command(['docker','exec','-e','PGPASSWORD',cid,'psql','-X','-v','ON_ERROR_STOP=1','-h','127.0.0.1','-U','mc002_inta','-d','mc002_inta','-At','-c','SELECT current_database(), current_user;'],env=authenv);assert tcp=='mc002_inta|mc002_inta';j['tcp_password_connection_verified']=True
 with socket.create_connection(('127.0.0.1',15457),timeout=3):pass
 j['published_host_port_connect_verified']=True
 conf={'STORAGE':'postgres','HTTP_ADDR':'127.0.0.1:18086','EVENTS_SINK':'none','API_DOCS_ENABLED':'false','TRUSTED_PROXIES':'','MIGRATE_ON_START':'false','READINESS_CHECK_DB':'true','LOG_LEVEL':'info','REQUEST_TIMEOUT':'10s','DB_STATEMENT_TIMEOUT':'5s','DB_MAX_CONNS':'5','DB_MIN_CONNS':'0','SHUTDOWN_DELAY':'0s','OTEL_EXPORTER_OTLP_ENDPOINT':''}
 private_write(private/'backend.env','DATABASE_URL='+dsn+'\n'+''.join(k+'='+v+'\n' for k,v in conf.items()))
 j['private_handoff']={'directory':str(private),'backend_env_path':str(private/'backend.env'),'mode':'directory0700/files0600','eligible':'Only after exact new DB/user/empty/healthy identity verification completed','contains':'DSN and approved native backend config; values not in governance'}
 j['state']='VERIFIED_ENV_READY_FOR_MANUAL_ZCODE_MIGRATE_START';j['ended_utc']=datetime.datetime.now(datetime.timezone.utc).isoformat();j['resource_disposition']='New task-owned container running healthy and named volume retained for immediate owner handoff. No existing resource stopped/removed/pruned; no migration/Go/Next executed.';save()
 payload=(export/'environment.json').read_bytes();(export/'SHA256SUMS').write_text(hashlib.sha256(payload).hexdigest()+'  environment.json\n');(raw/'SHA256SUMS').write_bytes((export/'SHA256SUMS').read_bytes())
 print(json.dumps({'state':j['state'],'runId':run,'container_id':cid,'container_name':name,'volume_name':volume,'health':current['Health'],'database':'mc002_inta','user':'mc002_inta','public_tables':0,'caps':'512MiB/1CPU/128PIDs','ports':'127.0.0.1:15457->5432','evidence':str(export),'private_handoff_file':str(private/'backend.env'),'secrets_printed':False},indent=2))
except Exception as exc:
 j['state']='STOPPED_ON_ERROR';j['error']=clean(str(exc));save();print(json.dumps({'state':j['state'],'error':j['error'],'created_container_id':j.get('container_id'),'created_volume':volume if j.get('volume_created') else None,'automatic_retry':False,'evidence':str(export)},indent=2));raise SystemExit(1)
