from pathlib import Path
import datetime as dt
import hashlib
import json
import os
import subprocess
import time

root=Path('/Users/nguyenvanlan/Documents/code/pet-projects/matter-control')
out=root/'docs/testing/step-02-3'
packet=Path('/tmp/mc002-step023-opencode-input.txt')
assert hashlib.sha256(packet.read_bytes()).hexdigest()==json.loads((out/'opencode-input-manifest.json').read_text())['sha256']
argv=['rtk','proxy','opencode','run','--standalone','--agent','plan','--format','json',
      '--title','MatterControl Step02.3 integration API auth decision gate','--file',str(packet),
      'Independently review the Step02.3 proposal documents and define the acceptance matrix. Follow the packet JSON output schema; no tools, files or runtime execution.']
env=os.environ.copy()
permissions=[{'action':'*','resource':'*','effect':'deny'}]
env.update(OPENCODE_PERMISSION=json.dumps(permissions),OPENCODE_DISABLE_AUTOUPDATE='true',OPENCODE_DISABLE_LSP_DOWNLOAD='true')
start=dt.datetime.now(dt.timezone.utc).isoformat(); clock=time.monotonic()
p=subprocess.run(argv,cwd='/tmp/mattercontrol-step021-agent-probe',env=env,capture_output=True,stdin=subprocess.DEVNULL,timeout=600)
(out/'opencode.stdout.jsonl').write_bytes(p.stdout);(out/'opencode.stderr.log').write_bytes(p.stderr)
events=[json.loads(x) for x in p.stdout.splitlines() if x.strip()]
session=next((x['sessionID'] for x in events if x.get('sessionID')),None)
texts=[x['part']['text'] for x in events if x.get('type')=='text' and 'text' in x.get('part',{})]
record={'task':'MC-002-INT-QA-PLAN','argv':argv,'exit':p.returncode,'start_utc':start,'end_utc':dt.datetime.now(dt.timezone.utc).isoformat(),
        'elapsed_seconds':time.monotonic()-clock,'session_id':session,'permissions':permissions,'stdin':'DEVNULL',
        'scope':'independent proposal/testability review and future test matrix; no runtime replay','runtime_tests':'NOT_RUN',
        'stdout_sha256':hashlib.sha256(p.stdout).hexdigest()}
(out/'opencode-execution.json').write_text(json.dumps(record,indent=2)+'\n')
assert p.returncode==0 and session and texts,record
export_argv=['rtk','proxy','opencode','session','export','--sanitize',session]
e=subprocess.run(export_argv,cwd='/tmp/mattercontrol-step021-agent-probe',env=env,capture_output=True,stdin=subprocess.DEVNULL,timeout=60)
(out/'opencode-session.json').write_bytes(e.stdout);(out/'opencode-export.stderr.log').write_bytes(e.stderr)
record.update(export_exit=e.returncode,export_argv=export_argv)
assert e.returncode==0
data=json.loads(e.stdout);models=[]
def walk(v):
    if isinstance(v,dict):
        for k,val in v.items():
            if k=='model' and isinstance(val,dict) and val not in models:models.append(val)
            walk(val)
    elif isinstance(v,list):
        for item in v:walk(item)
walk(data);record['models']=models
result='\n\n'.join(texts).rstrip()+'\n'
(root/'docs/reviews/step-02-3-opencode-return.txt').write_text(result)
clean=result.strip()
if clean.startswith('```'):
    clean=clean.split('\n',1)[1].rsplit('```',1)[0].strip()
parsed=json.loads(clean)
assert parsed['task']=='MC-002-INT-QA-PLAN' and isinstance(parsed['findings'],list)
assert len(parsed['matrix_markdown'])>1000
(root/'docs/testing/integration-acceptance-matrix.md').write_text(parsed['matrix_markdown'].rstrip()+'\n')
record['verdict']=parsed['verdict'];record['findings']=parsed['findings']
(out/'opencode-execution.json').write_text(json.dumps(record,indent=2)+'\n')
review='# Step02.3 — Actual OpenCode Independent Document Review\n\n'+parsed['review_markdown'].rstrip()+'\n'
(root/'docs/reviews/step-02-3-opencode-review.md').write_text(review)
print(json.dumps({k:record[k] for k in ['exit','elapsed_seconds','session_id','models','verdict','findings']}))
