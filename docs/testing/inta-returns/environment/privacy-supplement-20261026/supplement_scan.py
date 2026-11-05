#!/usr/bin/env python3
"""Targeted completion of approved Part P. No lifecycle or external calls."""
import contextlib,gzip,hashlib,importlib.util,io,json,sys
from datetime import datetime,timezone
from pathlib import Path
OUT=Path(__file__).parent
BASE=Path('/Users/nguyenvanlan/Documents/code/pet-projects/matter-control/docs/testing/inta-returns/environment/privacy-teardown-20261026')
def save(name,d):
 with (OUT/name).open('x') as f:json.dump(d,f,indent=2);f.write('\n')
def main():
 start=datetime.now(timezone.utc).isoformat()
 manifest=json.loads((BASE/'manifest.json').read_text())
 expected=next(x['sha256'] for x in manifest['payloads'] if x['path']=='privacy_scan.py')
 helper=BASE/'privacy_scan.py';assert hashlib.sha256(helper.read_bytes()).hexdigest()==expected
 spec=importlib.util.spec_from_file_location('approved_private_matcher',helper);m=importlib.util.module_from_spec(spec);spec.loader.exec_module(m)
 # Same matcher with synthetic exact/encoded/no-match/output-isolation checks first.
 from urllib.parse import quote
 s='Synthetic/Only? +';fake={s.encode(),quote(s,safe='').encode()}
 assert m.hits(s.encode(),fake)>0 and m.hits(quote(s,safe='').encode(),fake)>0 and m.hits(b'no match',fake)==0
 buffer=io.StringIO()
 with contextlib.redirect_stdout(buffer),contextlib.redirect_stderr(buffer):assert m.hits(s.encode(),fake)>0
 assert buffer.getvalue()==''
 inventory=json.loads((OUT/'inventory.json').read_text());forms,metadata=m.secret_forms()
 results=[];matches=[];gaps=list(inventory['gaps'])
 for item in inventory['selected_files']:
  p=Path(item['path'])
  try:
   assert not p.is_symlink() and p.stat().st_size<=m.MAX_FILE
   body=p.read_bytes();assert hashlib.sha256(body).hexdigest()==item['sha256'] and len(body)==item['bytes']
   count=m.hits(body,forms)
   if count:matches.append({'artifact_id':item['artifact_id'],'match_events':count})
   # Any newly discovered archive requires its own streamed member coverage; don't pretend byte matching is enough.
   if p.name.endswith(('.gz','.zip','.tar','.tgz')):gaps.append({'artifact_id':item['artifact_id'],'reason':'new archive needs streamed member coverage'})
   results.append({'artifact_id':item['artifact_id'],'bytes':len(body),'sha256':item['sha256']})
  except Exception:gaps.append({'artifact_id':item['artifact_id'],'reason':'boundary/read/drift failure; values suppressed'})
 forms.clear()
 after=m.PRIVATE.lstat();stable=metadata['inode']==after.st_ino and metadata['mtime_ns']==after.st_mtime_ns and metadata['mode']==oct(after.st_mode&0o777)
 if not stable:gaps.append({'reason':'private metadata changed'})
 result={'task':'MC-002-INTA-PRIVACY-SUPPLEMENT','actor':'Local Codex','start_utc':start,'end_utc':datetime.now(timezone.utc).isoformat(),'scope':'123 omitted/new/changed retained INT-A evidence files only; previous 1153 unchanged artifacts retain original scan evidence','synthetic_selfchecks':4,'selfchecks_passed':4,'scanned_files':len(results),'scanned_bytes':sum(x['bytes'] for x in results),'artifact_hashes':results,'matched_artifacts':matches,'match_events':sum(x['match_events'] for x in matches),'coverage_gaps':gaps,'private_metadata_unchanged':stable,'private_values_or_private_hashes_retained':False,'verdict':'FAIL' if matches else 'PARTIAL' if gaps else 'PASS_SUPPLEMENT_SCOPE','overall_privacy':'PARTIAL_PENDING_INDEPENDENT_PRODUCER_SCOPE_DISPOSITION','old_packet_unchanged':True,'lifecycle_executed':False}
 save('scan-result.json',result)
 print(json.dumps({k:result[k] for k in ['verdict','scanned_files','scanned_bytes','match_events','private_metadata_unchanged']}))
 return 2 if matches else 3 if gaps else 0
if __name__=='__main__':
 try:code=main()
 except Exception:
  save('failure.json',{'status':'STOPPED','reason':'Parser/identity/permission failure; values suppressed'});code=4
 sys.exit(code)
