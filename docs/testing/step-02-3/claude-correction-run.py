from pathlib import Path
import datetime as dt
import hashlib
import json
import subprocess
import time

root=Path('/Users/nguyenvanlan/Documents/code/pet-projects/matter-control')
out=root/'docs/testing/step-02-3'
argv=['rtk','proxy','claude','-p','--output-format','json','--tools','','--restricted',
       '--strict-mcp-config','--mcp-config','{"mcpServers":{}}','--disable-slash-commands',
       '--no-chrome','--no-session-persistence']
packet=Path('/tmp/mc002-step023-claude-correction-input.txt').read_bytes()
assert hashlib.sha256(packet).hexdigest()==json.loads((out/'claude-correction-input-manifest.json').read_text())['sha256']
started=dt.datetime.now(dt.timezone.utc).isoformat(); t=time.monotonic()
p=subprocess.run(argv,input=packet,cwd='/tmp/mattercontrol-step021-agent-probe',capture_output=True,timeout=600)
(out/'claude-correction.stdout.json').write_bytes(p.stdout)
(out/'claude-correction.stderr.log').write_bytes(p.stderr)
record={'task':'MC-002-INT-ARCH','argv':argv,'start_utc':started,'end_utc':dt.datetime.now(dt.timezone.utc).isoformat(),
        'exit':p.returncode,'elapsed_seconds':time.monotonic()-t,'scope':'packet-only architecture proposals; tools/MCP disabled; runtime NOT_RUN',
        'input_manifest':'claude-correction-input-manifest.json','stdout_sha256':hashlib.sha256(p.stdout).hexdigest()}
try:
    data=json.loads(p.stdout)
    record.update({k:data.get(k) for k in ['session_id','subtype','is_error','modelUsage','permission_denials']})
    assert p.returncode==0 and data['subtype']=='success' and not data['is_error']
    result=data['result']; assert isinstance(result,str) and len(result)>100
    (root/'docs/reviews/step-02-3-claude-correction-return.txt').write_text(result.rstrip()+'\n')
    parsed=json.loads(result)
    expected={'docs/architecture/integration-scope-proposal.md','docs/architecture/api-auth-decision-analysis.md'}
    assert parsed['task']=='MC-002-INT-ARCH' and {x['path'] for x in parsed['files']}==expected
    assert len(parsed['files'])==2
    for f in parsed['files']:
        assert len(f['content'])>1000
        (root/f['path']).write_text(f['content'].rstrip()+'\n')
    record['summary']=parsed['summary']; record['outputs']={f['path']:hashlib.sha256((root/f['path']).read_bytes()).hexdigest() for f in parsed['files']}
finally:
    (out/'claude-correction-execution.json').write_text(json.dumps(record,indent=2)+'\n')
print(json.dumps({k:record.get(k) for k in ['exit','elapsed_seconds','session_id','subtype','is_error','summary']}))
