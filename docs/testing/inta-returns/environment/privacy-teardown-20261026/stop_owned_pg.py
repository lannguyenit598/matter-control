#!/usr/bin/env python3
"""One exact-owned graceful stop, only after validated read-only prerequisites."""
import copy,json,subprocess,sys
from pathlib import Path
from datetime import datetime,timezone
OUT=Path(__file__).parent
CID='04552c273cb6be564d8c1deab7498c9f3f0b522e6dc84c1ac5163134ab85bd01'
IMAGE='sha256:77f585114c32fbca283dc835b0596f4e52b51b4c6662d7810b2f4084f60a1873'
FORMAT='{"Id":{{json .Id}},"Name":{{json .Name}},"Image":{{json .Image}},"Labels":{{json .Config.Labels}},"Running":{{json .State.Running}},"Status":{{json .State.Status}},"ExitCode":{{json .State.ExitCode}},"StartedAt":{{json .State.StartedAt}},"FinishedAt":{{json .State.FinishedAt}},"StopSignal":{{json .Config.StopSignal}},"Memory":{{json .HostConfig.Memory}},"NanoCpus":{{json .HostConfig.NanoCpus}},"PidsLimit":{{json .HostConfig.PidsLimit}},"Ports":{{json .HostConfig.PortBindings}},"Mounts":{{json .Mounts}}}'
def now():return datetime.now(timezone.utc).isoformat()
def save(name,d):
 with (OUT/name).open('x') as f:json.dump(d,f,indent=2);f.write('\n')
def cmd(argv,timeout=10):
 start=now()
 try:
  p=subprocess.run(['rtk','proxy',*argv],capture_output=True,text=True,timeout=timeout)
  return {'argv':['rtk','proxy',*argv],'start_utc':start,'end_utc':now(),'exit':p.returncode,'stdout':p.stdout,'stderr':p.stderr}
 except subprocess.TimeoutExpired:
  return {'argv':['rtk','proxy',*argv],'start_utc':start,'end_utc':now(),'exit':None,'status':'CLIENT_TIMEOUT_OUTCOME_UNKNOWN_NO_RETRY'}
def validate(d):
 assert d['Id']==CID and d['Name']=='/mc002-inta-pg-intamvnmoems3pd'
 assert d['Image']==IMAGE
 assert d['Labels']=={'mattercontrol.owner':'Codex','mattercontrol.runId':'intamvnmoems3pd','mattercontrol.task':'MC-002-INTA-ENV'}
 assert d['Memory']==536870912 and d['NanoCpus']==1000000000 and d['PidsLimit']==128
 assert d['Ports']=={'5432/tcp':[{'HostIp':'127.0.0.1','HostPort':'15457'}]}
 assert len(d['Mounts'])==1 and d['Mounts'][0]['Type']=='volume' and d['Mounts'][0]['Name']=='mc002-inta-data-intamvnmoems3pd' and d['Mounts'][0]['Destination']=='/var/lib/postgresql'
 assert d.get('StopSignal','') in ('','SIGINT','SIGTERM','2','15')
 assert d['StartedAt']=='2026-10-26T00:26:58.345144717Z'
def main():
 assert json.loads((OUT/'actual-value-scan.json').read_text())['match_events']==0
 assert json.loads((OUT/'dependency-disposition.json').read_text())['decision'].startswith('CLEAR_FOR_ONE')
 before=json.loads((OUT/'resources-before-authorized.json').read_text())
 assert before['ledger_matches_stage7'] and before['ledger_count']==59
 for s in before['sources']:assert s['head']['exit']==0 and s['status']['exit']==0 and not s['status']['stdout']
 versions=cmd(['docker','--version']);save('docker-version.json',versions)
 inspect=cmd(['docker','inspect','--format',FORMAT,CID]);save('pg-immediate-before.json',inspect)
 assert inspect['exit']==0
 d=json.loads(inspect['stdout']);validate(d)
 # Pure regression selfcheck of the same validation gate; no extra container operation.
 tested=0
 for key,value in [('Id','wrong'),('Name','/wrong'),('Image','wrong'),('Labels',{}),('Ports',{}),('Memory',0),('Mounts',[]),('StopSignal','SIGKILL')]:
  bad=copy.deepcopy(d);bad[key]=value
  try:validate(bad)
  except (AssertionError,KeyError):tested+=1
 assert tested==8
 save('teardown-gate-selfcheck.json',{'synthetic_mutations':8,'refused':8,'current_identity_valid':True})
 checks=[]
 for port in [15457,18085,18086]:
  c=cmd(['lsof','-nP',f'-iTCP:{port}','-sTCP:ESTABLISHED']);checks.append(c)
  assert c['exit']==1 and c['stdout']=='' and c['stderr']==''
  if port!=15457:
   c=cmd(['lsof','-nP',f'-iTCP:{port}','-sTCP:LISTEN']);checks.append(c)
   assert c['exit']==1 and c['stdout']=='' and c['stderr']==''
 c=cmd(['ps','-p','98134,88444,88453','-o','pid=,ppid=,lstart=,comm=']);checks.append(c)
 assert c['exit']==1 and not c['stdout'] and not c['stderr']
 save('immediate-dependency-checks.json',checks)
 if not d['Running']:
  save('stop-result.json',{'status':'ALREADY_STOPPED_NO_STOP_SENT','executed':False});return 0
 assert d['Status']=='running'
 # No daemon SIGKILL escalation: --timeout=-1; bound only our CLI wait to 30 seconds.
 # shortcut: a CLI timeout leaves daemon outcome unknown; inspect and escalate, never retry blindly.
 save('stop-attempt.json',{'single_attempt':True,'target':CID,'created_utc':now(),'no_forcekill':True,'daemon_timeout':-1,'client_wait_seconds':30,'docs':'https://docs.docker.com/reference/cli/docker/container/stop/#timeout'})
 res=cmd(['docker','stop','--timeout=-1',CID],timeout=30)
 save('stop-result.json',{'status':'STOP_COMMAND_RETURNED' if res['exit'] is not None else 'OUTCOME_UNKNOWN_NO_RETRY','executed':True,'command':res})
 print(json.dumps({'stop_command_exit':res['exit'],'target':CID,'no_forcekill':True}))
 return 0 if res['exit']==0 else 2
if __name__=='__main__':
 try:code=main()
 except Exception:
  save('teardown-blocked.json',{'status':'STOPPED_AT_PREREQUISITE_OR_METADATA_FAILURE','values_suppressed':True,'retry_performed':False});code=3
 sys.exit(code)
