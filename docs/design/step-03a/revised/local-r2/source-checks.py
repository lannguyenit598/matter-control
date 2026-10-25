from pathlib import Path
from html.parser import HTMLParser
from collections import Counter
import json,re,hashlib,subprocess,datetime
b=Path('docs/design/step-03a');r2=b/'revised/local-r2';r1=b/'revised/local-r1';p=r2/'mattercontrol-step-03a-ux-concept-review.html';s=p.read_text();checks=[]
def check(name,condition,details=''):
 checks.append({'name':name,'result':'PASS' if condition else 'FAIL','details':details});assert condition,(name,details)
class Scan(HTMLParser):
 def __init__(self):super().__init__(convert_charrefs=True);self.stack=[];self.errors=[];self.ids=[];self.links=[];self.rec=None;self.field=None;self.rows={};self.truth=None;self.truths=[]
 def handle_starttag(self,t,a):
  d=dict(a)
  if 'id'in d:self.ids.append(d['id'])
  if 'href'in d:self.links.append(d['href'])
  if d.get('data-atlas-id'):self.rec=d['data-atlas-id'];self.rows[self.rec]={}
  if self.rec and 'data-atlas-field'in d:
   self.field=d['data-atlas-field'];self.rows[self.rec][self.field]=''
   if self.field=='due':self.rows[self.rec]['due_instant']=d.get('title','')
  if 'atlas-board-truth'in d.get('class',''):self.truth=''
  if t not in ['area','base','br','col','embed','hr','img','input','link','meta','param','source','track','wbr']:self.stack.append(t)
 def handle_data(self,data):
  if self.rec and self.field:self.rows[self.rec][self.field]+=data
  if self.truth is not None:self.truth+=data
 def handle_endtag(self,t):
  if t=='span':self.field=None
  if t=='div'and self.rec:self.rec=None
  if t=='p'and self.truth is not None:self.truths.append(self.truth);self.truth=None
  if self.stack and self.stack[-1]==t:self.stack.pop()
  else:self.errors.append([self.getpos(),t])
a=Scan();a.feed(s)
check('HTML explicit tag nesting',not a.errors and not a.stack,{'errors':a.errors,'unclosed':a.stack,'limit':'stdlib parser, not full standards validator'})
check('Unique static IDs',len(a.ids)==len(set(a.ids)),len(a.ids))
for link in a.links:
 if link.startswith('#'):check('HTML fragment '+link,link[1:]in a.ids)
 elif not link.startswith(('https:','http:','mailto:','data:')):check('HTML local link '+link,(p.parent/link).exists())
check('No new external executable resource',not re.search(r'<script[^>]+src=|<iframe|<object|@import',s,re.I))
canonical={}
for line in Path('docs/product/project-atlas-dataset.md').read_text().splitlines():
 c=[x.strip()for x in line.split('|')[1:-1]]
 if len(c)==8 and re.fullmatch(r'(RQ|AC)-\d{2}',c[0]):canonical[c[0]]={'exec':c[5],'ver':c[6],'due':c[7]}
for id,row in a.rows.items():
 target=canonical[id] if id!='FIL-02'else {'exec':'WAITING','ver':'PARTIALLY_VERIFIED','due':''}
 check('Board C exact canonical fields '+id,row['exec']==target['exec']and row['ver']==target['ver']and row['due_instant']==target['due'],row)
check('Three boards share same canonical truth caption',len(a.truths)==3 and len(set(a.truths))==1)
for text in ['RQ-02 COMPLETED/UNVERIFIED','RQ-04 WAITING/UNVERIFIED/READY','AC-05 WAITING/NOT_REQUIRED/BLOCKED','AC-07/08/09 NOT_STARTED/NOT_REQUIRED/BLOCKED','DEC-AT-01/02 OPEN','FIL-02 Authority Review · WAITING/PARTIALLY_VERIFIED','ER-02/04 missing']:
 check('Shared board truth '+text,all(text in x for x in a.truths))
check('A/B compressed chain tail explicitly includes AC-08',s.count('AC-08 → AC-09</')>=2)
check('No obsolete decision namespace',not re.search(r'(?<![\w-])D-0[12]\b',s))
js=re.search(r'<script>([\s\S]*?)</script>',s)[1];oldjs=re.search(r'<script>([\s\S]*?)</script>',(r1/p.name).read_text())[1]
expected=oldjs.replace('(spec.interactive ? "Tương tác" : "Spec-only")','(spec.interactive ? "IMPLEMENTED_NOT_TESTED · partial" : "SPECIFIED_ONLY")').replace('(spec.interactive ? "Tương tác" : "Specification-only")','(spec.interactive ? "IMPLEMENTED_NOT_TESTED · partial" : "SPECIFIED_ONLY")')
check('Runtime logic unchanged; only inventory labels changed',js==expected,'Bulk helpers/defaults, proof/milestone predicates, 5-axis functions, mobile row generation, inline/key/focus handlers unchanged from prior source.')
Path('/tmp/mc003a-local-r2.js').write_text(js)
x=subprocess.run(['rtk','proxy','node','--check','/tmp/mc003a-local-r2.js'],capture_output=True,text=True);check('Inline script syntax',x.returncode==0,x.stderr)
# Reconcile canonical live fixture alongside the corrected board, without executing it.
q=json.loads(re.search(r'const requirements = (\[[\s\S]*?\]);\s*const actions',s)[1]);ac=json.loads(re.search(r'const actions = (\[[\s\S]*?\]);\s*const records',s)[1]);records={x['id']:x for x in q+ac}
check('24 interactive fixture states match canonical source',len(records)==24 and all((records[id]['exec'],records[id]['ver'],records[id]['dueISO'])==(c['exec'],c['ver'],c['due'])for id,c in canonical.items()))
for name in ['mattercontrol-step-03a-ux-concept-review.html','mattercontrol-step-03a-ux-specifications.md','mattercontrol-step-03a-handoff-report.md','interaction-guidance.md']:
 text=(r2/name).read_text()
 for flag in ['IMPLEMENTED_AND_TESTED','IMPLEMENTED_NOT_TESTED','SPECIFIED_ONLY','CONCEPTUAL_ONLY','NOT_IMPLEMENTED','RENDERED_VALIDATION_PENDING_MANUAL_CAPTURE']:
  check(name+' capability '+flag,flag in text)
 for obsolete in ['execution chỉ được cấp cho AC-04/AC-05','được kiểm tra ở mức prototype','Đã kiểm tra thủ công trong Chrome headless','đã được chạy tự động trong Chrome headless','Fixture chỉ cấp execution','vì nội dung đầy đủ chưa được cấp']:
  check(name+' removes unsupported claim '+obsolete,obsolete not in text)
check('No bulk workstream control/default due regression','bulkWorkstream'not in s and not re.search(r'id="bulkDue"[^>]*value=',s))
# Historical 42 + phase02 snapshots must remain exact, including all original/r1/normative files.
for manifest in ['local-remediation-review-manifest.json','step-03a-2-review-manifest.json']:
 m=json.loads((b/'qa'/manifest).read_text())
 check('Historical snapshot intact '+manifest,all(Path(f['path']).stat().st_size==f['bytes']and hashlib.sha256(Path(f['path']).read_bytes()).hexdigest()==f['sha256']for f in m['files']),len(m['files']))
result={'timestamp_utc':datetime.datetime.now(datetime.timezone.utc).isoformat(),'command':'rtk proxy python3 docs/design/step-03a/revised/local-r2/source-checks.py','exit':0,'checks':checks,'source_check_count':len(checks),'runtime_suites_rerun':[],'rendered':'RENDERED_VALIDATION_PENDING_MANUAL_CAPTURE','independent_qa':'PENDING_INDEPENDENT_QA'}
(r2/'source-check-results.json').write_text(json.dumps(result,ensure_ascii=False,indent=2)+'\n');print(len(checks),'targeted source/integrity checks PASS. No browser/native interaction PASS.')
