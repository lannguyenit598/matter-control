from pathlib import Path
import datetime, hashlib, json, os, re, shutil, subprocess, tarfile, sys

ROOT = Path('/Users/nguyenvanlan/Documents/code/pet-projects/matter-control')
RAW = Path('/tmp/mc002-inta-evidence/frontend/runtime-intamvnmoems3pd/closeout-readiness')
EXPORT = ROOT / 'docs/testing/inta-returns/frontend/runtime-intamvnmoems3pd/closeout-readiness'
FINAL = ROOT / 'docs/reviews/inta-closeout-readiness-return.md'
LEDGER = Path('/tmp/mc002-inta-state-intamvnmoems3pd')
RUN = 'intamvnmoems3pd'
UTC = json.loads((RAW / 'completion-codex/source-state.json').read_text())[0]['observedUTC'] if (RAW / 'completion-codex/source-state.json').exists() else datetime.datetime.now(datetime.timezone.utc).isoformat()
checks = []

def digest(b):
    return hashlib.sha256(b).hexdigest()

def check(name, ok):
    checks.append({'name': name, 'result': 'PASS' if ok else 'FAIL'})
    assert ok, name

def command(argv, cwd=ROOT):
    p = subprocess.run(['rtk', 'proxy', *argv], cwd=cwd, capture_output=True)
    assert p.returncode == 0, (argv, p.returncode)
    return p.stdout

def pin(path):
    p = Path(path)
    b = p.read_bytes()
    return {'path': str(p), 'bytes': len(b), 'sha256': digest(b)}

def snapshot_ledger():
    return {str(p.relative_to(LEDGER)): digest(p.read_bytes()) for p in LEDGER.rglob('*') if p.is_file()}

def put(name, value):
    p = RAW / 'completion-codex' / name
    data = value if isinstance(value, str) else json.dumps(value, indent=2, ensure_ascii=False) + '\n'
    if p.exists():
        assert p.read_text() == data, 'Refuse changed existing completion output: ' + str(p)
        return
    p.parent.mkdir(parents=True, exist_ok=True)
    p.write_text(data)

check('new final report/export paths', not FINAL.exists() and not EXPORT.exists())
if (RAW / 'completion-codex').exists():
    attempt = json.loads(Path('/tmp/mc002-inta-readiness-attempt1.json').read_text())
    check('resume only exact own3partial completion files', len(attempt['retained_new_files']) == 3 and {str(p) for p in (RAW / 'completion-codex').rglob('*') if p.is_file()} == {x['path'] for x in attempt['retained_new_files']} and all(digest(Path(x['path']).read_bytes()) == x['sha256'] for x in attempt['retained_new_files']))
branch = command(['git', 'branch', '--show-current']).decode().strip()
head = command(['git', 'rev-parse', 'HEAD']).decode().strip()
check('coordination identity', branch == 'codex/unified-project-flow' and head == 'a62d838791ba188838c4ff00b7b6e265ac775056')
partial = json.loads((ROOT / 'docs/testing/zcode-recovery-20261026/inta-partial-inventory.json').read_text())
check('exact original24 partial file set', len(partial) == 24 and {str(p) for p in RAW.rglob('*') if p.is_file() and 'completion-codex' not in p.parts} == {x['raw_partial'] for x in partial})
for row in partial:
    check('retained partial ' + Path(row['raw_partial']).name, digest(Path(row['raw_partial']).read_bytes()) == row['sha256'] == digest(Path(row['origin']).read_bytes()))
expected = {}
for line in (ROOT / 'docs/testing/inta-returns/frontend/runtime-intamvnmoems3pd/stage7/05-ledger-after.sha256').read_text().splitlines():
    h, n = line.split(None, 1)
    expected[n.strip().removeprefix('./')] = h
before = snapshot_ledger()
check('59file ledger matches frozen stage7', len(before) == 59 and before == expected)
sources = []
for path, sha in [('/tmp/mc002-inta-be', '52b60a4617081c41b949f2242e1784238c170f75'), ('/tmp/mc002-inta-fe', '3e5a642479acb789eb210e73fba956f3e85082e3'), ('/tmp/mc002-inta-harness', '48cc03e949d66fc47a7d304413621eb79804e6c1')]:
    actual = command(['git', 'rev-parse', 'HEAD'], path).decode().strip()
    status = command(['git', 'status', '--porcelain'], path).decode()
    check('pinned clean source ' + path, actual == sha and not status.strip())
    sources.append({'path': path, 'head': actual, 'status': status, 'observedUTC': UTC})
put('source-state.json', sources)
shutil.copyfile('/tmp/mc002-inta-readiness-current-observation-20261026.json', RAW / 'completion-codex/resource-observation.json')

# Existing files only: line-numbered excerpts retain whole-source hashes, not re-created source claims.
source_ranges = {
    '/tmp/mc002-inta-harness/src/guards.ts': [(1, 114)],
    '/tmp/mc002-inta-harness/next.config.ts': [(1, 12)],
    '/tmp/mc002-inta-harness/app/harness/case/route.ts': [(1, 110)],
    '/tmp/mc002-inta-harness/src/schemas.ts': [(1, 110)],
    '/tmp/mc002-inta-harness/src/executor.ts': [(1, 6), (90, 128), (200, 212)],
    '/tmp/mc002-inta-harness/src/driver.ts': [(206, 245), (471, 500), (1128, 1195)],
    '/tmp/mc002-inta-harness/src/envelope.ts': [(1, 8), (91, 154)],
    '/tmp/mc002-inta-harness/src/request-id.ts': [(27, 45), (77, 110)],
    '/tmp/mc002-inta-fe/tsconfig.json': [(1, 40)],
    '/tmp/mc002-inta-fe/vitest.config.mts': [(1, 22)],
    '/tmp/mc002-inta-fe/.github/workflows/ci.yml': [(1, 70)],
}
excerpts = []
for path, ranges in source_ranges.items():
    lines = Path(path).read_text().splitlines()
    row = pin(path)
    row['segments'] = [{'start_line': start, 'end_line': min(end, len(lines)), 'text': '\n'.join(lines[start-1:end])} for start, end in ranges]
    if path.endswith('executor.ts'):
        row['fixed_case_labels'] = [{'line': i, 'text': line.strip()} for i, line in enumerate(lines, 1) if re.search(r"case '\S+':", line)]
    row['author_basis'] = 'Antigravity R4 source at48cc03e, or unchanged product template3e5a642; current read-only pin by Codex'
    excerpts.append(row)
put('source-excerpts.json', excerpts)

package_pins = []
for package in ['next', 'react', 'react-dom', 'zod', 'typescript', 'vitest']:
    p = Path('/tmp/mc002-inta-fe/node_modules') / package / 'package.json'
    row = pin(p)
    row.update({'package': package, 'installed_version': json.loads(p.read_text())['version']})
    package_pins.append(row)
for p in ['/tmp/mc002-inta-fe/package.json', '/tmp/mc002-inta-fe/pnpm-lock.yaml', '/tmp/mc002-inta-harness/package.json', '/tmp/mc002-inta-harness/pnpm-lock.yaml', '/tmp/mc002-inta-fe/src/lib/api/http-client.ts']:
    package_pins.append(pin(p))
binary = pin('/tmp/mc002-inta-be/bin/userapi')
identity = re.search(r'binary sha256: ([0-9a-f]{64})', (ROOT / 'docs/testing/inta-returns/backend/runtime-intamvnmoems3pd/go-restart-01/23-restart-identity.txt').read_text()).group(1)
check('native binary retained identity', binary['sha256'] == identity)
put('dependency-and-binary-pins.json', {'observedUTC': UTC, 'packages_and_tracked_files': package_pins, 'binary': binary, 'native_product_build_equivalence': 'NOT_CLAIMED'})

# Scan fixture markers in application logs, separately from permitted synthetic bodies in envelopes.
fixture_source = Path('/tmp/mc002-inta-harness/src/fixtures.ts').read_text()
names = sorted(set(x for x in re.findall(r"name:\s*'([^']*)'", fixture_source) if x))
emails = sorted(set(x.replace('${runId}', RUN) for x in re.findall(r'email:\s*`([^`]+)`', fixture_source)))
controls = re.findall(r"export const \w+ = '([^']+)'", fixture_source)
check('complete fixture body marker categories', len(names) == 8 and len(emails) == 5)
markers = [('name', x) for x in names] + [('email', x) for x in emails] + [('control_literal', x) for x in controls]
log_paths = set()
for root in [ROOT / 'docs/testing/inta-returns/backend/runtime-intamvnmoems3pd', ROOT / 'docs/testing/inta-returns/frontend/runtime-intamvnmoems3pd', Path('/tmp/mc002-inta-evidence/backend/runtime-intamvnmoems3pd'), Path('/tmp/mc002-inta-evidence/frontend/runtime-intamvnmoems3pd')]:
    for p in root.rglob('*.log'):
        if 'closeout-readiness' not in p.parts and re.search(r'go-|next-|server[-.]|restart[.-]', p.name):
            log_paths.add(p)
for n in ['go-stdout-observed.log', 'go-stderr-observed.log', 'next-stdout-observed.log']:
    log_paths.add(ROOT / 'docs/testing/inta-stage7-intake' / n)
log_rows = []
for p in sorted(log_paths):
    b = p.read_bytes()
    row = pin(p)
    row['marker_counts'] = [{'category': kind, 'marker_sha256': digest(value.encode()), 'occurrences': b.count(value.encode())} for kind, value in markers]
    row['body_marker_hits'] = sum(x['occurrences'] for x in row['marker_counts'] if x['category'] != 'control_literal')
    log_rows.append(row)
check('zero fixture body markers in scoped application logs', all(x['body_marker_hits'] == 0 for x in log_rows))
put('application-log-marker-scan.json', {'observedUTC': UTC, 'command': 'rtk proxy python3 /tmp/mc002-inta-readiness-assemble.py', 'names': len(names), 'emails': len(emails), 'additional_control_literals': len(controls), 'marker_source': pin('/tmp/mc002-inta-harness/src/fixtures.ts'), 'logs': log_rows, 'coverage': 'Named owned runtime application stdout/stderr and retained copies only; whole logs read, counts only, no private config. runId/requestId are permitted metadata, not body markers.', 'actual_secret_value_scan': 'NOT_ESTABLISHED'})
for label, src in [('go-initial-stdout.log', '/tmp/mc002-inta-evidence/backend/runtime-intamvnmoems3pd/20-server.stdout.log'), ('go-initial-stderr.log', '/tmp/mc002-inta-evidence/backend/runtime-intamvnmoems3pd/20-server.stderr.log'), ('go-final-stdout.log', '/tmp/mc002-inta-evidence/backend/runtime-intamvnmoems3pd/go-restart-01/20-restart.stdout.log'), ('go-final-stderr.log', '/tmp/mc002-inta-evidence/backend/runtime-intamvnmoems3pd/go-restart-01/21-restart.stderr.log'), ('next-current-stdout.log', '/tmp/mc002-inta-evidence/frontend/runtime-intamvnmoems3pd/02-next-stdout.log'), ('next-current-stderr.log', '/tmp/mc002-inta-evidence/frontend/runtime-intamvnmoems3pd/02-next-stderr.log')]:
    shutil.copyfile(src, RAW / 'completion-codex' / label)

envelopes = []
request_ids = []
for p in sorted((LEDGER / 'envelopes' / RUN).glob('*.json')):
    values = json.loads(p.read_text())
    for v in values:
        serialized = json.dumps(v, ensure_ascii=False, separators=(',', ':')).encode()
        check('retained complete bounded envelope ' + v['requestId'], len(serialized) <= 16384 and v['truncated'] is False)
        request_ids.append(v['requestId'])
    row = pin(p)
    row.update({'logical_case': p.stem, 'attempt_count': len(values), 'max_compact_utf8_envelope_bytes': max(len(json.dumps(v, ensure_ascii=False, separators=(',', ':')).encode()) for v in values), 'all_not_truncated': all(v['truncated'] is False for v in values)})
    envelopes.append(row)
check('23logical cases27unique attempts', len(envelopes) == 23 and len(request_ids) == len(set(request_ids)) == 27)
put('envelope-audit.json', {'observedUTC': UTC, 'files': envelopes, 'scope': 'Read retained envelope files only; compact UTF8 audit does not claim original response byte sizes or execute driver', 'actual_product_semantics': 'NOT_CLAIMED'})

uncovered = ['API_TOKEN', 'API_BASE_URL', 'AUTH_ALLOW_ANONYMOUS', 'API_TIMEOUT_MS', 'AUTH_SECRET', 'NEXTAUTH_SECRET', 'CLERK_SECRET_KEY', 'SESSION_SECRET', 'COOKIE_SECRET', 'DATABASE_URL', 'JWT_SECRET']
guard_argv = ['rtk', 'proxy', 'env', '-i', 'PATH=<explicit approved local tool path>', 'HOME=<dedicated empty temporary home>', 'NODE_ENV=development', 'MC_INTA_ENABLE=1', 'MC_INTA_GO_BASE_URL=http://127.0.0.1:18086', 'MC_INTA_STATE_DIR=<new validation-only state path>', '<one key>=INTA_GUARD_SENTINEL', '/tmp/mc002-inta-harness/node_modules/.bin/next', 'dev', '-H', '127.0.0.1', '-p', '18085', '--webpack']
plan = {'status': 'PROPOSED_NOT_EXECUTED', 'owner': 'Local Codex temporary engineering owner', 'reviewer': 'Actual nonauthor OpenCode', 'preconditions': ['A recorded disposition acknowledges historical Next termination NOT_OBSERVED; new checks are a separate attempt, never historical teardown proof.', 'Recheck exact heads, existing59ledger hashes and unused18085/18086; fail closed on drift/conflict. No existing process is signalled.', 'No Go/PG lifecycle or private config; no network install, product config/lockfile/source patch, provider or real credentials. New evidence and state paths must be absent.'], 'guard': {'canonical_id': 'INT-ENV-05', 'minimal_required_variants': [{'key': k, 'value_class': 'nonempty synthetic sentinel'} for k in uncovered], 'additional_source_claim_variants': 'One empty-value variant for each11key tests the documented including-empty stronger claim; additional evidence under the same canonical ID, no renumbering.', 'argv_template': guard_argv, 'expected': 'Finite nonzero normal process exit, precise key-name-only startup refusal, no listener ever acquired on18085, synthetic observer at18086 sees zero HTTP requests. Record start/end UTC, argv, exit and separate streams per variant. A timeout kill is not PASS.', 'bounds': '15seconds per child; abort whole validation on unexpected listener/request/hang. Capture child ownership before any bounded cleanup; no blanket kill.', 'runner_warning': 'Do not run existing scripts/live-guards.ts: it repeats historical checks and writes fixed .run-state/PID provenance. Prepare only the targeted ephemeral runner after scope release.'}, 'artifact': {'canonical_ids': ['INT-ISO-02', 'INT-ENV-07'], 'cwd': 'New disposable exact3e5a642 source snapshot; do not generate outputs in historical frontend or harness checkout.', 'dependencies': 'Use verified already-installed pinned dependencies without writing through to their originals; no install/lockfile update. Check supported Node/pnpm and installed guidance before execution.', 'commands': [['rtk', 'proxy', 'pnpm', 'exec', 'vitest', 'list', '--filesOnly', '--json'], ['rtk', 'proxy', 'pnpm', 'build']], 'outputs': ['New test-list.json, separate stdout/stderr, argv/UTC/exit per command', 'Only new snapshot .next and compiler outputs; retain build manifests, NFT traces, route/module maps and relevant emitted JS/assets inventory'], 'assertions': ['Resolve each collected test/module path: none points to mc002-inta-harness, @harness, harness route/executor/driver or their copied equivalents.', 'Compare source import graph/config/glob findings with emitted files/traces; no harness module or /harness/case route in product build. Absence of a token alone is not complete dependency-graph proof.', 'If build fails on local dependency/tool/bundler requirements, report limitation; do not change product config/dependencies or switch bundler silently.', 'Local collection/build does not mean hosted CI ran; retain CI source pin and report hosted result NOT_RUN.'], 'docs': 'Vitest5.0.3 official docs (Context7) verify list --filesOnly/--json; installed5.x help/source remains final command compatibility prerequisite. https://github.com/vitest-dev/vitest/blob/v5.0.3/docs/guide/cli.md'}, 'dynamic_cache': {'canonical_id': 'INT-ENV-07', 'existing_proof': 'Historical real A changes and repeated recovery reads show observed values at those instants; source no-store flags and guard header runtime are scoped subevidence.', 'optional_narrow_validation': 'If reviewer needs repeat/no-cache network proof: separate synthetic upstream observer and new Next attempt/state/runId; two explicit identical fixed T3 read requests, unique request IDs, upstream counter2 and no-store response headers. No original run/driver construction, mutations or actual Go/PG access. This proves that new synthetic attempt only.'}, 'private_scan': {'canonical_id': 'INT-PRIV-01', 'status': 'Actual-secret-value coverage remains incomplete. Private backend.env access is not granted by this task; an explicitly scoped secret-safe process must record counts without outputting values. Pattern scan is no substitute.'}, 'teardown': {'canonical_id': 'INT-ISO-03', 'status': 'Separate exact-owned lifecycle cue still required. Historical Next exit cannot be reconstructed; samePG remains running/retained. No stop or removal here.'}}
put('minimal-validation-plan.json', plan)

references = []
for i, row in enumerate(partial):
    x = dict(row)
    x.update({'id': 'P%02d' % i, 'package_path': str(Path(row['raw_partial']).relative_to(RAW)), 'line_range': [1, max(1, len(Path(row['raw_partial']).read_text().splitlines()))], 'time_basis': 'Verbatim metadata timestamps where present; no invented per-file execution time', 'owner_basis': 'ZCode live backend/runtime or Antigravity R4 frontend preparation, as named by original metadata'})
    references.append(x)
def ids(fragment):
    return [x['id'] for x in references if fragment in x['origin']]
rows = [
    ('INT-ENV-02', ids('/09-migrate') + ids('/10-migrate'), 'Attempt1 failed before connection; attempt2 exit0 with six applied migration rows, UTC09:49:07.720638-.829182Z. No migrate replay.'),
    ('INT-ENV-03', ids('/20-server-start') + ids('/23-restart-identity') + ids('/10-stop-record'), 'Native52b60a4 binary/source retained. Go wait exit NOT_OBSERVED; signal delivery and graceful log messages are distinct.'),
    ('INT-ENV-04', ids('harness/app/harness/case/route') + ids('harness/src/schemas') + ids('harness/src/guards'), 'Source strict controls/fixed URL/no-store plus original R4 refusal observations; no fresh endpoint execution.'),
    ('INT-ENV-05', ids('/12-live-guards.log') + ids('harness/src/guards'), 'API_MODE and production startup proven historically;11other key startup negatives remain NOT_RUN. Empty-value source claim explicitly retained.'),
    ('INT-ENV-06', ids('/request-correlation.json'), 'Driver failclosed ranges and fixed labels in source-excerpts;23logical files27unique attempts/26Go rows plus unreachableT12. Retained surfaces bounded, no replay.'),
    ('INT-ENV-07', ids('/03-launch-meta') + ids('/01-next-stderr') + ids('/13-template-isolation'), 'Default Turbopack failure retained; webpack cross-root actual run. No-store source/observations are not complete caching/build proof.'),
    ('INT-ISO-01', ids('/pnpm-lock.yaml') + ids('/package.json') + ids('/http-client.ts'), 'Three pinned clean trees, binary and shared client/package locks unchanged; exact hashes in dependency-and-binary-pins.'),
    ('INT-ISO-02', ids('/ci.yml') + ids('/13-template-isolation'), 'Product default test glob src/**/*.test.{ts,tsx}; sibling harness outside root. Historical typecheck/lint only; production artifact exclusion remains NOT_RUN.'),
]
check('8unique procedure dispositions', len({x[0] for x in rows}) == 8)
put('evidence-index.json', {'author': 'Local Codex', 'observedUTC': UTC, 'source_revisions': sources, 'references': references, 'source_excerpts': 'source-excerpts.json, each whole-file SHA256 and exact lines', 'procedures': [{'id': i, 'references': refs, 'disposition': text, 'formal_result': 'NOT_RUN', 'independent_verdict': 'PENDING'} for i, refs, text in rows]})

# Inspect only the previously reviewed source archive, without extraction or reading private member names.
patterns = {'private_key': rb'-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----', 'credential_dsn': rb'postgres(?:ql)?://[^\s"<>:@]+:[^\s"<>@]+@', 'provider_key': rb'\bsk-(?:ant-)?[A-Za-z0-9_-]{30,}'}
archive = Path('/tmp/mc002-inta-evidence/frontend/r4/harness-source.tar.gz')
archive_scan = {'status': 'NOT_AVAILABLE', 'path': str(archive)}
if archive.exists():
    check('R4 source archive hash retained', digest(archive.read_bytes()) == '78823fab1f96a00113585b7a080b88bd6a143af88de39628cb4606ea35404f44')
    allowed = set(command(['git', 'ls-files'], '/tmp/mc002-inta-harness').decode().splitlines())
    archive_scan = {**pin(archive), 'status': 'SCANNED_TRACKED_SOURCE_MEMBERS_ONLY', 'members': []}
    with tarfile.open(archive, 'r:gz') as tar:
        for member in tar.getmembers():
            if not member.isfile():
                continue
            name = member.name.removeprefix('./')
            check('archive member in tracked source allowlist ' + name, name in allowed and member.size <= 1024*1024)
            b = tar.extractfile(member).read()
            counts = {k: len(re.findall(v, b)) for k, v in patterns.items()}
            check('archive source credential patterns ' + name, not any(counts.values()))
            archive_scan['members'].append({'path': name, 'bytes': len(b), 'sha256': digest(b), 'pattern_counts': counts})
put('archive-credential-pattern-scan.json', archive_scan)

matrix = ROOT / 'docs/testing/inta-stage7-intake/canonical-case-checkpoint.json'
canonical = json.loads(matrix.read_text())['cases']
check('51formal rows unchanged NOT_RUN/PENDING', len(canonical) == 51 and all(x['execution_result'] == 'NOT_RUN' and x['independent_verdict'] == 'PENDING' for x in canonical))
put('ledger-preservation.json', {'observedUTC': UTC, 'before': before, 'canonical_checkpoint': pin(matrix), 'counts': {'ledger_files': 59, 'logical_endpoint_files': 23, 'unique_attempts': 27, 'formal_rows': 51}, 'formal_results': 'NOT_RUN, independent PENDING; executed subevidence retained separately'})

report = '''# INT-A — final source/evidence readiness return

Actual author/executor: Local Codex, temporary engineering owner under direct PO reassignment. Task MC-002-INTA-CLOSEOUT-READINESS, P0; requirements NFR-002/003/008/009, selected INTA-1 and original procedure IDs. Branch codex/unified-project-flow; base/head a62d838791ba188838c4ff00b7b6e265ac775056. IN_REVIEW / CLOSEOUT_READINESS_RETURNED / WAITING_CODEX_GAP_DISPOSITION. Read-only assembly finished; live continuation BLOCKED_FOR_RECONCILIATION. No independent PASS or MC-002 DONE.

This completes the requested packet/export that the earlier Codex continuation had not supplied. The original24 ZCode partial files remain byte-identical. Additions are isolated under completion-codex; the entire raw directory is exported identically, including retained originals. No historical author/time/dispatch label is changed. The original task prompt and earlier Codex return remain evidence, with this final return taking precedence for readiness delivery.

## Evidence and exact source references

[Evidence index](../testing/inta-returns/frontend/runtime-intamvnmoems3pd/closeout-readiness/completion-codex/evidence-index.json) supplies complete original paths, package paths, full SHA256/byte counts, line ranges, owner/revision/time attribution and8procedure dispositions. [Source excerpts](../testing/inta-returns/frontend/runtime-intamvnmoems3pd/closeout-readiness/completion-codex/source-excerpts.json) pin whole-file hashes and numbered segment ranges. Pinning at the current read time is not historical execution proof.

| Procedure | Observation | Remaining limitation |
|---|---|---|
| INT-ENV-02 | Original failed migrate attempt preserved; successful second attempt09:49:07.720638-.829182Z,exit0,six migration log entries. | No migration rerun; independent acceptance pending. |
| INT-ENV-03 | Native52b60a4/source/binary, start/restart/stop records preserved; Go remains absent. | Direct final process wait status NOT_OBSERVED. |
| INT-ENV-04 | Route lines23-88/93-110, schemas, guards and fixed executor case labels; historical live405/400/default-off404. | Source controls and original observed cases are distinct from exhaustive current runtime validation. |
| INT-ENV-05 |12guard keys enumerated; original R4 proves API_MODE and NODE_ENVproduction startup refusal,8guard observations,zero synthetic upstream requests. |11other keys lack live startup proof; source refuses even empty values despite stale non-empty wording in the top comment. No source patch. |
| INT-ENV-06 | Driver intent/stage gates, request-ID persistence and cap source pinned;23logical files/27unique attempts/26Go rows plus one unreachableT12. Retained complete envelopes audited. | No driver invocation/retry; formal results unchanged. |
| INT-ENV-07 | Next16.4.2/webpack real cross-root run; default Turbopack failure retained; no-store flags and historical observations pinned. | CurrentNextabsent; universal dynamic/cache behavior and product artifact exclusion not proved. |
| INT-ISO-01 | Backend52b60a4/template3e5a642/harness48cc03e clean; shared client, package/lockfile/binary hashes retained. | Source integrity is not product/security conformance. |
| INT-ISO-02 | Sibling harness outside product tsconfig/default-test root; product CI source pinned, historical typecheck/lint evidence preserved. | No product production-build/module graph or hosted CI result. NOT_RUN, not FAIL. |

The installed dependency versions and exact shared-client/binary hashes are in dependency-and-binary-pins.json; package metadata is read-only, not dependency installation. The shared client is the actual unchanged template import. No product build/test/source/config/lockfile changed.

## Privacy, bounded evidence and runtime drift

[Application log scan](../testing/inta-returns/frontend/runtime-intamvnmoems3pd/closeout-readiness/completion-codex/application-log-marker-scan.json) derives all8nonempty fixture names and5unique run-specific emails directly from fixtures.ts; it also records3control-literal counts. Whole selected owned application logs are scanned, with exact paths/hashes and counts; runId/requestId metadata is permitted. Synthetic bodies in controlled envelopes/source fixtures are expected and not confused with application logs. Current log snapshots are current Codex observations, not replacements for missing owner stage7 snapshots. Envelope audit checks27retained complete nontruncated envelopes within16KiB using compact UTF8 serialization; this is not an original HTTP byte-size measurement.

Credential-pattern scan covers the completed export payloads, retained envelopes and the known reviewed R4source archive where available, without extraction/private configuration. Pattern-only zero hits cannot establish absence of actual credential values. INT-PRIV-01 remains incomplete for that required secret-value coverage; no backend.env, Config.Env or environment dump was read.

Fresh selected metadata at2026-10-26T03:49:42Z again shows Go98134/Next88444/88453 absent, no18085/18086listener; exactPG04552c273cb6be564d8c1deab7498c9f3f0b522e6dc84c1ac5163134ab85bd01 running/healthy, original image/volume/StartedAt/caps/loopback binding unchanged. No Next signal/exit/cause evidence exists. Record TERMINATION_NOT_OBSERVED; do not claim graceful cleanup or reconstruct it by restarting. SamePG is retained running; no lifecycle or HTTP/SQL performed. Resource-observation.json contains exact argv/UTC/exits/selected fields.

Errata retained: previous22assertion records did not refreshT2 in stage7; original19-file stage7packet lacked immutable Next-after, and later Codex capture is separately attributed. Logical cases, attempts and Go rows remain distinct counts. A baselinev1/currentv2,B and XOUTCOME_UNKNOWN remain unchanged; no Xlookup/rePOST.

## Minimal remaining validation and delivery

[Exact proposed plan](../testing/inta-returns/frontend/runtime-intamvnmoems3pd/closeout-readiness/completion-codex/minimal-validation-plan.json) names the11missing guard startup variants, optional empty-value variants under the same ID, isolated child argv/environment/state/output boundaries and measurable zero-upstream/closed-port conditions. It avoids the existing broad live-guards runner, which writes fixed provenance/state and repeats prior work. No runner is executed here.

For product exclusion, the plan pins only default test collection and the existing package build command in a new disposable exact-source snapshot, with installed dependencies and generated outputs isolated. Inspect actual collected file paths, route/module maps/NFT traces and emitted files against harness imports. A failed prerequisite remains a limitation; no bundler switch/config patch/install. Hosted CI remains NOT_RUN. Optional repeat-read no-cache validation is a separate synthetic attempt, never a reset or replay of the historical run.

ENV01/COR/PRIV/ISO03/CONF remain Codex evidence/independent-review responsibilities. OriginalENVprovisioning and27-attempt correlation are cross-referenced; this return does not award them PASS. Teardown requires a separately recorded exact-owned lifecycle cue; unknown historical Next termination remains a limitation. OpenCode independently reviews the36required rows;14product rows deferred and1production row blocked remain. All51formal rows stay NOT_RUN/independentPENDING while actual owner subevidence remains retained. Architecture review remains conditional on material deviations per approved assignment; no compulsory repeated Claude round is introduced.

Tools: Local Codex shell with RTK/Python standard library; exact invocation, versions, read/hash checks and packet identity recorded in completion metadata. No ZCode/Claude/OpenCode invocation or paid/provider/model change. Manifest.json excludes itself from payload hashes and includes all other raw/export files. [Final checks](../testing/zcode-recovery-20261026/inta-readiness-final-checks.json) verify copy equality, original preservation, ledger/source integrity and links. Proposed next state is author return IN_REVIEW, not independent acceptance. Exact next action: disposition the residual narrow validation plan and the unobserved Next termination before a new runtime attempt, then complete remaining privacy/owned teardown and independent conformance review.

Skipped: new guard/build/runtime tests, driver/help/status, HTTP/SQL/private secrets, process/container lifecycle, provider dispatch and commit. Risk: missing live guard/artifact/actual-secret proof, unobserved Next termination and retained runningPG prevent full INT-A closure.
'''
put('report.md', report)
FINAL.write_text(report)
meta = {'actor': 'Local Codex', 'utc': UTC, 'base': head, 'branch': branch, 'task': 'MC-002-INTA-CLOSEOUT-READINESS', 'command': 'rtk proxy python3 /tmp/mc002-inta-readiness-assemble.py', 'python': sys.version.split()[0], 'rtk_version': subprocess.run(['rtk', '--version'], capture_output=True, text=True, check=True).stdout.strip(), 'scope': 'Read-only source/evidence; append new completion-codex and export. No tests/build/requests/lifecycle/index/history/provider actions.', 'original_partial_count': 24, 'original_partial_manifest': pin(ROOT / 'docs/testing/zcode-recovery-20261026/inta-partial-inventory.json')}
put('completion-meta.json', meta)
put('assembly-attempts.json', {'initial_attempt': json.loads(Path('/tmp/mc002-inta-readiness-attempt1.json').read_text()), 'current_attempt': 2, 'correction': 'Read explicit binary SHA256 rather than process identity field; retained own3partial outputs verified before continuation.'})
payload_scan = []
for p in sorted(x for x in RAW.rglob('*') if x.is_file()):
    counts = {k: len(re.findall(v, p.read_bytes())) for k, v in patterns.items()}
    check('payload credential patterns ' + str(p.relative_to(RAW)), not any(counts.values()))
    payload_scan.append({**pin(p), 'counts': counts})
for p in sorted((LEDGER / 'envelopes' / RUN).glob('*.json')):
    counts = {k: len(re.findall(v, p.read_bytes())) for k, v in patterns.items()}
    check('retained envelope credential patterns ' + p.name, not any(counts.values()))
    payload_scan.append({**pin(p), 'counts': counts})
put('credential-pattern-scan.json', {'observedUTC': UTC, 'patterns': {k: v.decode() for k, v in patterns.items()}, 'files': payload_scan, 'self_coverage': 'Scan report contains patterns/counts only; final checks rescan all exported files including this report/manifest.', 'actual_secret_values': 'NOT_ESTABLISHED; no private configuration read'})
check('59file ledger unchanged after read-only assembly', snapshot_ledger() == before)
for row in partial:
    check('original partial preserved after completion ' + Path(row['raw_partial']).name, digest(Path(row['raw_partial']).read_bytes()) == row['sha256'])
files = [{**pin(p), 'path': str(p.relative_to(RAW))} for p in sorted(RAW.rglob('*')) if p.is_file()]
manifest = {'task': 'MC-002-INTA-CLOSEOUT-READINESS', 'actor': 'Local Codex', 'utc': UTC, 'files': files, 'payload_files': len(files), 'payload_bytes': sum(x['bytes'] for x in files), 'excluded_from_own_hash': ['manifest.json'], 'original24_unchanged': True}
(RAW / 'manifest.json').write_text(json.dumps(manifest, indent=2) + '\n')
shutil.copytree(RAW, EXPORT)
for row in files:
    a, b = RAW / row['path'], EXPORT / row['path']
    check('raw/export equality ' + row['path'], a.read_bytes() == b.read_bytes() and digest(b.read_bytes()) == row['sha256'])
check('manifest raw/export equality', (RAW / 'manifest.json').read_bytes() == (EXPORT / 'manifest.json').read_bytes())
check('report raw/governance equality', FINAL.read_bytes() == (RAW / 'completion-codex/report.md').read_bytes())
check('full raw/export same relative file set', {str(p.relative_to(RAW)) for p in RAW.rglob('*') if p.is_file()} == {str(p.relative_to(EXPORT)) for p in EXPORT.rglob('*') if p.is_file()})
for p in EXPORT.rglob('*'):
    if p.is_file():
        check('final exported credential patterns ' + str(p.relative_to(EXPORT)), not any(re.search(v, p.read_bytes()) for v in patterns.values()))
for target in re.findall(r'\]\(([^\s)]+)\)', report):
    if '://' not in target:
        check('report link ' + target, (FINAL.parent / target).exists() or target.endswith('inta-readiness-final-checks.json'))
check('ledger remains unchanged after export', snapshot_ledger() == before)
output = ROOT / 'docs/testing/zcode-recovery-20261026/inta-readiness-final-checks.json'
assert not output.exists()
output.write_text(json.dumps({'actor': 'Local Codex', 'utc': datetime.datetime.now(datetime.timezone.utc).isoformat(), 'kind': 'SOURCE_EVIDENCE_EXPORT_CHECKS_ONLY', 'checks': checks, 'pass': len(checks), 'fail': 0, 'manifest': pin(EXPORT / 'manifest.json'), 'payload_files': len(files), 'original_partial_files': 24, 'new_payload_files': len(files)-24, 'application_log_files_scanned': len(log_rows), 'runtime_execution': 'NONE', 'formal_case_results': 'UNCHANGED_NOT_RUN', 'independent_verdict': 'PENDING'}, indent=2) + '\n')
print(json.dumps({'checks_pass': len(checks), 'payload_files': len(files), 'payload_bytes': manifest['payload_bytes'], 'export_files_including_manifest': len(files)+1, 'app_log_files_scanned': len(log_rows), 'fixture_markers': len(markers), 'status': 'CLOSEOUT_READINESS_RETURNED_IN_REVIEW'}))
