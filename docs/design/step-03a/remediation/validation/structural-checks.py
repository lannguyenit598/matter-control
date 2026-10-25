from pathlib import Path
from html.parser import HTMLParser
from collections import Counter
import re,json,hashlib,subprocess,datetime
base=Path('docs/design/step-03a'); revision=base/'revised/local-r1';out=base/'remediation/validation'
class Scan(HTMLParser):
 def __init__(self):super().__init__(convert_charrefs=True);self.ids=[];self.refs=[];self.assets=[];self.stack=[];self.errors=[]
 def handle_starttag(self,t,attrs):
  d=dict(attrs)
  if 'id' in d:self.ids.append(d['id'])
  for k in ['href','src']:
   if k in d:
    if d[k].startswith('#'):self.refs.append(d[k][1:])
    elif not d[k].startswith(('http:','https:','data:','mailto:')):self.assets.append(d[k])
  if t not in ['area','base','br','col','embed','hr','img','input','link','meta','param','source','track','wbr']:self.stack.append(t)
 def handle_endtag(self,t):
  if self.stack and self.stack[-1]==t:self.stack.pop()
  else:self.errors.append([self.getpos(),t,self.stack[-3:]])
p=revision/'mattercontrol-step-03a-ux-concept-review.html';s=p.read_text();a=Scan();a.feed(s)
checks=[]
def check(name,passed,details):
 checks.append(dict(name=name,result='PASS' if passed else 'FAIL',details=details));assert passed,(name,details)
check('HTML explicit tag balance / stdlib parser',not a.errors and not a.stack,{'errors':a.errors,'unclosed':a.stack,'limitation':'Not a standards conformance validator or browser parse'})
check('Unique static IDs',len(a.ids)==len(set(a.ids)),len(a.ids))
check('Static fragments resolve',not(set(a.refs)-set(a.ids)),sorted(set(a.refs)-set(a.ids)))
check('Local asset paths exist',all((p.parent/x).exists() for x in a.assets),a.assets)
check('No external executable resources',not re.search(r'<script[^>]+src=|<iframe|<object|@import',s,re.I),'No added scripts/iframes/objects/imports; existing outbound links are not fetched')
original=json.loads((base/'critique/frozen-input-manifest.json').read_text())
for f in original['files']:
 src=Path(f['source']);check('Frozen input unchanged: '+str(src),hashlib.sha256(src.read_bytes()).hexdigest()==f['sha256'],{'bytes':src.stat().st_size,'sha256':f['sha256']})
# Canonical records copied exactly, not inferred from names.
req=json.loads(re.search(r'const requirements = (\[[\s\S]*?\]);\s*const actions',s)[1]);act=json.loads(re.search(r'const actions = (\[[\s\S]*?\]);\s*const records',s)[1]);records={r['id']:r for r in req+act}
for line in Path('docs/product/project-atlas-dataset.md').read_text().splitlines():
 c=[x.strip() for x in line.split('|')[1:-1]]
 if len(c)==8 and re.fullmatch(r'(RQ|AC)-\d{2}',c[0]):
  r=records[c[0]];check('Canonical fields '+c[0],(r['label'],r['owner'],r['exec'],r['ver'],r['dueISO'])==(c[3],c[4],c[5],c[6],c[7]),'label/owner/execution/verification/due match Atlas §4')
check('All original sections and golden flow anchors retained',all('id="'+x+'"' in s for x in ['flows','wireframes','directions','system','architecture','decisions','handoff']), 'Control Room / Grid / three connected slices retained')
check('No obsolete bulk field or evidence IDs',not any(x in s for x in ['bulkWorkstream','"EV-02"','"EV-04"','owner/date/workstream']), 'RULE-013 and canonical EV namespace')
script=re.search(r'<script>([\s\S]*?)</script>',s)[1];Path('/tmp/mc003a-r1.js').write_text(script)
r=subprocess.run(['rtk','proxy','node','--check','/tmp/mc003a-r1.js'],capture_output=True,text=True);check('Extracted inline JavaScript syntax',r.returncode==0,r.stderr)
(out/'structural-results.json').write_text(json.dumps({'timestamp_utc':datetime.datetime.now(datetime.timezone.utc).isoformat(),'checks':checks,'visual':'VISUAL_VALIDATION_NOT_EXECUTED'},indent=2)+'\n')
manifest=[]
for f in sorted(revision.iterdir()):manifest.append({'path':str(f),'bytes':f.stat().st_size,'sha256':hashlib.sha256(f.read_bytes()).hexdigest()})
(out/'revised-output-manifest.json').write_text(json.dumps({'revision':'local-r1','original_git_preservation':'cef67c4a7a162c209fa35cbe0bb471b565ccba62','files':manifest},indent=2)+'\n')
print(len(checks),'checks PASS')
