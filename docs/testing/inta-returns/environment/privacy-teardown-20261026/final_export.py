#!/usr/bin/env python3
"""Final memory-only output scan and authorized new-directory export."""
import contextlib,hashlib,importlib.util,io,json,os,shutil,sys
from datetime import datetime,timezone
from pathlib import Path
from urllib.parse import quote
RAW=Path(__file__).parent
ROOT=Path('/Users/nguyenvanlan/Documents/code/pet-projects/matter-control')
EXPORT=ROOT/'docs/testing/inta-returns/environment/privacy-teardown-20261026'
REPORT=ROOT/'docs/reviews/inta-codex-privacy-teardown-return.md'
def sha(p):return hashlib.sha256(p.read_bytes()).hexdigest()
def write(path,data):
 with path.open('x') as f:json.dump(data,f,indent=2);f.write('\n')
def main():
 assert not EXPORT.exists()
 spec=importlib.util.spec_from_file_location('owned_scan',RAW/'privacy_scan.py')
 module=importlib.util.module_from_spec(spec);spec.loader.exec_module(module)
 # Synthetic checks of the same matcher, before this second and final private read.
 synthetic='Public/Only+ synthetic?';forms={synthetic.encode(),quote(synthetic,safe='').encode()}
 assert module.hits(synthetic.encode(),forms)>0
 assert module.hits(quote(synthetic,safe='').encode(),forms)>0
 assert module.hits(b'absent',forms)==0
 stdout=io.StringIO();stderr=io.StringIO()
 with contextlib.redirect_stdout(stdout),contextlib.redirect_stderr(stderr):assert module.hits(synthetic.encode(),forms)>0
 assert not stdout.getvalue() and not stderr.getvalue()
 forms,metadata=module.secret_forms()
 files=sorted(p for p in RAW.iterdir() if p.is_file())+[REPORT]
 scanned=[];matches=[]
 for i,p in enumerate(files,1):
  body=p.read_bytes();count=module.hits(body,forms)
  if count:matches.append({'artifact_id':f'O{i:03d}','match_events':count})
  scanned.append({'artifact_id':f'O{i:03d}','path':str(p),'bytes':len(body),'sha256':hashlib.sha256(body).hexdigest()})
 forms.clear()
 write(RAW/'output-secret-scan.json',{'scope':'Only new task outputs and report, using approved fixture values in memory','utc':datetime.now(timezone.utc).isoformat(),'synthetic_tests':4,'synthetic_passed':4,'files':scanned,'matched_artifacts':matches,'match_events':sum(x['match_events'] for x in matches),'secret_values_or_secret_hashes_retained':False,'private_metadata_unchanged_from_initial':metadata==json.loads((RAW/'actual-value-scan.json').read_text())['private_metadata_before'],'exit':0 if not matches else 2})
 if matches:
  print(json.dumps({'status':'STOP_NO_EXPORT','matched_artifacts':len(matches)}));return 2
 assert metadata==json.loads((RAW/'actual-value-scan.json').read_text())['private_metadata_before']
 # The only exported content is generated evidence; never copy the private source.
 EXPORT.mkdir(mode=0o700)
 payloads=sorted(p for p in RAW.iterdir() if p.is_file())
 for p in payloads:shutil.copy2(p,EXPORT/p.name)
 checks=[]
 for p in payloads:
  assert p.read_bytes()==(EXPORT/p.name).read_bytes()
  checks.append({'name':'raw/export '+p.name,'result':'PASS'})
 for p in payloads:
  if p.suffix=='.json':json.loads(p.read_text())
 checks.append({'name':'all payload JSON parses','result':'PASS'})
 private=module.PRIVATE.lstat()
 checks.append({'name':'private file remains owned 0600','result':'PASS' if private.st_uid==os.getuid() and private.st_mode&0o777==0o600 else 'FAIL'})
 assert checks[-1]['result']=='PASS'
 write(RAW/'delivery-checks.json',{'actor':'Local Codex','utc':datetime.now(timezone.utc).isoformat(),'checks':checks,'pass':len(checks),'fail':0,'scope':'All preceding payload pairs checked; this receipt and manifest verified by final exporter assertions','runtime_released':False,'independent_review':'PENDING','formal_gates_promoted':False})
 shutil.copy2(RAW/'delivery-checks.json',EXPORT/'delivery-checks.json')
 payloads=sorted(p for p in RAW.iterdir() if p.is_file())
 manifest={'task':'MC-002-INTA-PRIVACY-TEARDOWN','executor':'Local Codex','base_head':'a62d838791ba188838c4ff00b7b6e265ac775056','status':'IN_REVIEW / PRIVACY_TEARDOWN_EVIDENCE_RETURNED','part_P':'PARTIAL / ZERO_MATCHES_IN_SCANNED_SCOPE','part_T':'PASS_SCOPED / EXACT_OWNED_PG_STOPPED_RETAINED','manifest_excludes_self':True,'payload_count':len(payloads),'payload_bytes':sum(p.stat().st_size for p in payloads),'payloads':[{'path':p.name,'bytes':p.stat().st_size,'sha256':sha(p)} for p in payloads],'report':{'path':str(REPORT),'bytes':REPORT.stat().st_size,'sha256':sha(REPORT)},'private_source_exported':False,'independent_review':'PENDING','new_runtime_tests_or_production_approval':False}
 write(RAW/'manifest.json',manifest);shutil.copy2(RAW/'manifest.json',EXPORT/'manifest.json')
 for p in RAW.iterdir():assert p.is_file() and p.read_bytes()==(EXPORT/p.name).read_bytes()
 assert sorted(p.name for p in RAW.iterdir())==sorted(p.name for p in EXPORT.iterdir())
 for x in manifest['payloads']:assert sha(EXPORT/x['path'])==x['sha256']
 print(json.dumps({'status':'IN_REVIEW','privacy':'PARTIAL','teardown':'PASS_SCOPED','payloads':len(payloads),'payload_bytes':manifest['payload_bytes'],'raw_export_pairs':len(payloads)+1,'output_secret_matches':0,'manifest_sha256':sha(RAW/'manifest.json'),'report_sha256':sha(REPORT)}))
 return 0
if __name__=='__main__':
 try:code=main()
 except Exception:
  print(json.dumps({'status':'EXPORT_STOPPED','reason':'Validation failure; values suppressed'}));code=4
 sys.exit(code)
