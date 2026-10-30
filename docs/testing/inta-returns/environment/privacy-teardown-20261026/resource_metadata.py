#!/usr/bin/env python3
"""Selected read-only lifecycle prerequisite evidence; never inspect environment."""
import hashlib,json,subprocess,sys,os
from datetime import datetime,timezone
from pathlib import Path
OUT=Path(__file__).parent
ROOT=Path('/Users/nguyenvanlan/Documents/code/pet-projects/matter-control')
CID='04552c273cb6be564d8c1deab7498c9f3f0b522e6dc84c1ac5163134ab85bd01'
TEMPLATE='{"Id":{{json .Id}},"Name":{{json .Name}},"Image":{{json .Image}},"Labels":{{json .Config.Labels}},"Running":{{json .State.Running}},"Status":{{json .State.Status}},"ExitCode":{{json .State.ExitCode}},"StartedAt":{{json .State.StartedAt}},"FinishedAt":{{json .State.FinishedAt}},"Health":{{json .State.Health.Status}},"Memory":{{json .HostConfig.Memory}},"NanoCpus":{{json .HostConfig.NanoCpus}},"PidsLimit":{{json .HostConfig.PidsLimit}},"Ports":{{json .HostConfig.PortBindings}},"Mounts":{{json .Mounts}}}'
def now():return datetime.now(timezone.utc).isoformat()
def command(argv,cwd=None):
 start=now()
 try:
  p=subprocess.run(['rtk','proxy',*argv],cwd=cwd,capture_output=True,text=True,timeout=20)
  return {'argv':['rtk','proxy',*argv],'cwd':str(cwd) if cwd else None,'start_utc':start,'end_utc':now(),'exit':p.returncode,'stdout':p.stdout,'stderr':p.stderr}
 except subprocess.TimeoutExpired:return {'argv':['rtk','proxy',*argv],'start_utc':start,'end_utc':now(),'exit':None,'error':'bounded metadata command timed out'}
records=[command(['docker','inspect','--format',TEMPLATE,CID])]
for port in [15457,18085,18086]:
 records.append(command(['lsof','-nP',f'-iTCP:{port}','-sTCP:LISTEN']))
 records.append(command(['lsof','-nP',f'-iTCP:{port}','-sTCP:ESTABLISHED']))
records.append(command(['ps','-p','98134,88444,88453','-o','pid=,ppid=,lstart=,comm=']))
ledger=Path('/tmp/mc002-inta-state-intamvnmoems3pd')
entries=[]
for p in sorted(ledger.rglob('*')):
 if p.is_file() and not p.is_symlink():entries.append({'path':str(p.relative_to(ledger)),'bytes':p.stat().st_size,'sha256':hashlib.sha256(p.read_bytes()).hexdigest()})
expected={}
for line in (ROOT/'docs/testing/inta-returns/frontend/runtime-intamvnmoems3pd/stage7/05-ledger-after.sha256').read_text().splitlines():
 digest,name=line.split(None,1);expected[name.strip().removeprefix('./')]=digest
ledger_equal={x['path']:x['sha256'] for x in entries}==expected
sources=[]
for path in ['/tmp/mc002-inta-be','/tmp/mc002-inta-fe','/tmp/mc002-inta-harness']:
 sources.append({'path':path,'head':command(['git','rev-parse','HEAD'],path),'status':command(['git','status','--porcelain'],path)})
head=command(['git','rev-parse','HEAD'],ROOT);branch=command(['git','branch','--show-current'],ROOT)
result={'actor':'Local Codex','observed_utc':now(),'metadata_only_no_environment':True,'commands':records,'ledger':entries,'ledger_count':len(entries),'ledger_matches_stage7':ledger_equal,'sources':sources,'governance_head':head,'governance_branch':branch}
name=sys.argv[1]
with (OUT/name).open('x') as f:json.dump(result,f,indent=2);f.write('\n')
print(json.dumps({'output':name,'command_exits':[x.get('exit') for x in records],'ledger_count':len(entries),'ledger_matches_stage7':ledger_equal,'docker_metadata_available':records[0].get('exit')==0}))
