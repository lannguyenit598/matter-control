#!/usr/bin/env python3
"""Bounded INT-A actual-value matcher. Never prints credentials or exception values."""
import gzip, hashlib, io, json, os, re, stat, sys, tarfile, zipfile
from datetime import datetime, timezone
from pathlib import Path
from urllib.parse import urlsplit, unquote, quote, unquote_to_bytes
ROOT=Path('/Users/nguyenvanlan/Documents/code/pet-projects/matter-control')
OUT=Path(__file__).parent
PRIVATE=Path('/tmp/mc002-inta-private/intamvnmoems3pd/backend.env')
MAX_FILE=128*1024*1024
MAX_MEMBER=32*1024*1024
MAX_TOTAL=512*1024*1024

def save(name,value):
    p=OUT/name
    with p.open('x',encoding='utf-8') as f: json.dump(value,f,indent=2);f.write('\n')

def hits(data,forms):
    return sum(data.count(value) for value in forms)

def selfcheck():
    raw='Synthetic/Only+ ?%42'
    forms={raw.encode(),quote(raw,safe='').encode()}
    assert hits(b'no-secret-here',forms)==0
    assert hits(raw.encode(),forms)>0
    assert hits(quote(raw,safe='').encode(),forms)>0
    # The matcher has no output side effects; verify via a redirected stdout.
    import contextlib
    buf=io.StringIO()
    with contextlib.redirect_stdout(buf): assert hits(raw.encode(),forms)>0
    assert buf.getvalue()==''
    save('matcher-selfcheck.json',{'tests':4,'passed':4,'data':'synthetic only','actual_private_read':False})

class LimitReader:
    def __init__(self,stream,limit):self.stream=stream;self.remaining=limit
    def read(self,n=-1):
        n=min(1024*1024 if n<0 else n,self.remaining+1)
        result=self.stream.read(n);self.remaining-=len(result)
        if self.remaining<0:raise ValueError('expansion limit')
        return result

def bounded_read(stream,limit):
    parts=[];remaining=limit
    while True:
        block=stream.read(min(1024*1024,remaining+1))
        if not block:break
        remaining-=len(block)
        if remaining<0:raise ValueError('member limit')
        parts.append(block)
    return b''.join(parts)

def secret_forms():
    parent=PRIVATE.parent.lstat();before=PRIVATE.lstat()
    if stat.S_ISLNK(parent.st_mode) or stat.S_ISLNK(before.st_mode):raise ValueError('private metadata')
    if parent.st_uid!=os.getuid() or before.st_uid!=os.getuid():raise ValueError('private metadata')
    if stat.S_IMODE(parent.st_mode)!=0o700 or stat.S_IMODE(before.st_mode)!=0o600:raise ValueError('private metadata')
    fd=os.open(PRIVATE,os.O_RDONLY|os.O_NOFOLLOW)
    try:
        opened=os.fstat(fd)
        if (opened.st_dev,opened.st_ino)!=(before.st_dev,before.st_ino) or not stat.S_ISREG(opened.st_mode) or opened.st_nlink!=1:raise ValueError('private metadata')
        content=os.read(fd,16385)
    finally:os.close(fd)
    if len(content)>16384:raise ValueError('private format')
    selected=[]
    for line in content.decode('utf-8').splitlines():
        if re.match(r'^\s*(?:export\s+)?DATABASE_URL\b',line):
            m=re.fullmatch(r'\s*(?:export\s+)?DATABASE_URL=(.*?)\s*',line)
            if not m:raise ValueError('private assignment')
            v=m[1]
            if v.startswith(('"',"'")):
                if len(v)<2 or v[-1]!=v[0]:raise ValueError('private quoting')
                v=v[1:-1]
            elif any(c.isspace() for c in v):raise ValueError('private quoting')
            if not v or len(v)>4096 or any(c in v for c in '$`\\\r\n'):raise ValueError('private syntax')
            selected.append(v)
    if len(selected)!=1:raise ValueError('private assignment')
    dsn=selected[0];u=urlsplit(dsn)
    if u.scheme not in ('postgres','postgresql') or u.hostname not in ('localhost','127.0.0.1') or u.port!=15457 or unquote(u.username or '')!='mc002_inta' or unquote(u.path)!='/mc002_inta' or not u.password or u.fragment:raise ValueError('private identity')
    encoded=u.password;decoded=unquote(encoded)
    # No credential hashes are produced; these values exist only in this process.
    forms={dsn.encode(),encoded.encode(),decoded.encode(),unquote_to_bytes(encoded),quote(decoded,safe='').encode()}
    for v in list(forms):
        forms.add(re.sub(rb'%[0-9A-Fa-f]{2}',lambda m:m[0].lower(),v))
    if any(len(v)<8 for v in forms):raise ValueError('private value too short for safe evidence matching')
    identity={'uid':before.st_uid,'mode':oct(stat.S_IMODE(before.st_mode)),'parent_mode':oct(stat.S_IMODE(parent.st_mode)),'device':before.st_dev,'inode':before.st_ino,'bytes':before.st_size,'mtime_ns':before.st_mtime_ns}
    return forms,identity

def main():
    started=datetime.now(timezone.utc).isoformat()
    selfcheck() # required before any credential read
    inventory=json.loads((OUT/'scan-inventory.json').read_text())
    forms,private_before=secret_forms()
    gaps=list(inventory['gaps']);results=[];matched=[];expanded=0;entries=0
    pattern_counts={'private_key_headers':0,'credential_url_candidates':0}
    def inspect(data,opaque):
        nonlocal expanded
        count=hits(data,forms)
        if count:matched.append({'artifact_id':opaque,'match_events':count})
        pattern_counts['private_key_headers']+=len(re.findall(rb'-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----',data))
        pattern_counts['credential_url_candidates']+=len(re.findall(rb'postgres(?:ql)?://[^\s:/]+:[^\s@]+@',data))
    def tar_members(stream,opaque):
        nonlocal expanded,entries
        with tarfile.open(fileobj=LimitReader(stream,MAX_FILE),mode='r|') as archive:
            for member in archive:
                if member.isdir():continue
                entries+=1;mid=f'{opaque}:M{entries:05d}'
                if not member.isfile():gaps.append({'artifact_id':mid,'reason':'nonregular archive member not followed'});continue
                if member.size>MAX_MEMBER or expanded+member.size>MAX_TOTAL:gaps.append({'artifact_id':mid,'reason':'archive size budget'});continue
                source=archive.extractfile(member)
                if source is None:gaps.append({'artifact_id':mid,'reason':'archive member unreadable'});continue
                with source:data=bounded_read(source,MAX_MEMBER)
                expanded+=len(data);inspect(data,mid)
    for item in inventory['files']:
        path=Path(item['path']);opaque=item['id']
        try:
            if path.is_symlink() or path.stat().st_size>MAX_FILE:raise ValueError('file boundary')
            with path.open('rb') as f:data=bounded_read(f,MAX_FILE)
            inspect(data,opaque)
            record={'artifact_id':opaque,'bytes':len(data),'sha256':hashlib.sha256(data).hexdigest()}
            results.append(record)
            if path.name.endswith(('.tar.gz','.tgz')):
                with gzip.GzipFile(fileobj=io.BytesIO(data)) as stream:tar_members(stream,opaque)
            elif path.name.endswith('.tar'):tar_members(io.BytesIO(data),opaque)
            elif path.name.endswith('.gz'):
                with gzip.GzipFile(fileobj=io.BytesIO(data)) as stream:body=bounded_read(stream,MAX_FILE)
                if expanded+len(body)>MAX_TOTAL:raise ValueError('archive budget')
                expanded+=len(body);entries+=1;inspect(body,f'{opaque}:G{entries:05d}')
            elif path.name.endswith('.zip'):
                with zipfile.ZipFile(io.BytesIO(data)) as archive:
                    for member in archive.infolist():
                        if member.is_dir():continue
                        entries+=1;mid=f'{opaque}:Z{entries:05d}'
                        if member.file_size>MAX_MEMBER or expanded+member.file_size>MAX_TOTAL or stat.S_ISLNK(member.external_attr>>16):gaps.append({'artifact_id':mid,'reason':'zip boundary'});continue
                        with archive.open(member) as stream:body=bounded_read(stream,MAX_MEMBER)
                        expanded+=len(body);inspect(body,mid)
        except Exception:
            gaps.append({'artifact_id':opaque,'reason':'unreadable or archive/file boundary failure; exception values suppressed'})
    after=PRIVATE.lstat()
    private_after={'uid':after.st_uid,'mode':oct(stat.S_IMODE(after.st_mode)),'parent_mode':oct(stat.S_IMODE(PRIVATE.parent.lstat().st_mode)),'device':after.st_dev,'inode':after.st_ino,'bytes':after.st_size,'mtime_ns':after.st_mtime_ns}
    stable=private_after==private_before
    if not stable:gaps.append({'reason':'private metadata changed during scan'})
    fixtures=Path('/tmp/mc002-inta-harness/src/fixtures.ts')
    source=fixtures.read_text();names=set(re.findall(r"name:\s*'([^']+)'",source))
    emails={x.replace('${runId}','intamvnmoems3pd') for x in re.findall(r'email:\s*`([^`]+)`',source)}
    controls={'not-a-uuid','01A15359-AA28-7A00-A380-000000000001','01a15359-aa28-7a00-a380-000000000001'}
    markers={x.encode() for x in names|emails|controls};log_results=[]
    for item in inventory['files']:
        p=Path(item['path']);name=p.name.lower()
        # Application streams only; envelope/driver fixtures are expected separately.
        if not (p.suffix.lower() in ('.log','.txt') and any(x in name for x in ['server.stdout','server.stderr','next.stdout','next.stderr','go.stdout','go.stderr','next-before','next-after','go-stdout','go-stderr'])):continue
        try:
            body=p.read_bytes();log_results.append({'artifact_id':item['id'],'bytes':len(body),'sha256':hashlib.sha256(body).hexdigest(),'fixture_marker_hits':hits(body,markers)})
        except Exception:gaps.append({'artifact_id':item['id'],'reason':'application log read failure'})
    save('application-log-marker-scan.json',{'marker_source':str(fixtures),'marker_source_sha256':hashlib.sha256(fixtures.read_bytes()).hexdigest(),'names':len(names),'emails':len(emails),'control_literals':len(controls),'logs':log_results,'total_hits':sum(x['fixture_marker_hits'] for x in log_results),'scope':'Full retained Go/Next application stream snapshots selected by explicit filename rules; synthetic envelopes are permitted'})
    save('pattern-scan.json',{'counts':pattern_counts,'scope':'Pattern candidates are separate from actual fixture-secret matching; synthetic/redacted candidates require contextual disposition without exporting secret values'})
    verdict='FAIL' if matched else ('PARTIAL' if gaps else 'PASS_SCOPED')
    save('actual-value-scan.json',{'actor':'Local Codex','start_utc':started,'end_utc':datetime.now(timezone.utc).isoformat(),'verdict':verdict,'private_metadata_before':private_before,'private_metadata_after':private_after,'private_metadata_unchanged':stable,'known_source':'Only approved backend.env DATABASE_URL and its password forms; no other credentials','scanned_files':len(results),'scanned_bytes':sum(x['bytes'] for x in results),'archive_entries':entries,'archive_expanded_bytes':expanded,'artifact_hashes':results,'matched_artifacts':matched,'match_events':sum(x['match_events'] for x in matched),'coverage_gaps':gaps,'secret_values_or_secret_hashes_retained':False,'limits':{'file_bytes':MAX_FILE,'member_bytes':MAX_MEMBER,'total_archive_bytes':MAX_TOTAL},'limitations':['No claim about unselected credentials or transformed/base64/obfuscated secret representations','Archive payloads streamed without extraction; no arbitrary symlink targets followed','Time-scoped inventory; later evidence requires supplemental scan']})
    return 2 if matched else (3 if gaps else 0)

if __name__=='__main__':
    try:status=main()
    except Exception:
        # A parser/identity/permission failure must never reveal the offending value.
        save('scan-failure.json',{'status':'STOPPED','reason':'Private identity/parser/permission or scan failure; exception values intentionally suppressed','secret_content_printed':False})
        status=4
    print(json.dumps({'scan_exit':status,'output_directory':str(OUT),'secret_values_printed':False}))
    sys.exit(status)
