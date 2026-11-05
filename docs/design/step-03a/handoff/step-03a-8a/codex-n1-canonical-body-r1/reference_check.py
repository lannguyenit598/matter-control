"""Standalone synthetic model of the N1 candidate, never a product import."""
import hashlib
import json
import re
import sys
from pathlib import Path


class Number(str):
    pass


def reject_constant(value):
    raise ValueError('nonfinite constant')


def object_members(pairs):
    result = {}
    for key, value in pairs:
        if key in result:
            raise ValueError('duplicate decoded name')
        result[key] = value
    return result


def quoted(value):
    result = '"'
    for char in value:
        code = ord(char)
        if 0xD800 <= code <= 0xDFFF:
            raise ValueError('unpaired surrogate')
        if char in ('"', '\\'):
            result += '\\' + char
        elif code < 32:
            result += '\\u%04x' % code
        else:
            result += char
    return result + '"'


def encode(value):
    if isinstance(value, Number):
        return str(value)
    if isinstance(value, str):
        return quoted(value)
    if value is None:
        return 'null'
    if isinstance(value, bool):
        return 'true' if value else 'false'
    if isinstance(value, int):  # generated tuple metadata only
        return str(value)
    if isinstance(value, list):
        return '[' + ','.join(encode(v) for v in value) + ']'
    if isinstance(value, dict):
        return '{' + ','.join(quoted(k) + ':' + encode(value[k]) for k in sorted(value)) + '}'
    raise ValueError('unsupported/lossy model value')


def parsed(raw):
    value = json.loads(raw.decode('utf-8'), parse_int=Number, parse_float=Number,
                       parse_constant=reject_constant, object_pairs_hook=object_members)
    encode(value)  # scalar validity is generic admission, not domain validation
    return value


def canonical(raw):
    return encode(parsed(raw)).encode('utf-8')


def header(values):
    if values is None:
        return None
    if not values or not all(isinstance(v, bytes) for v in values):
        raise ValueError('present header requires field-value bytes')
    return [v.strip(b' \t').hex() for v in values]


def fingerprint(raw, method='POST', route='/candidate/filings/{filingId}/observations',
                path=None, if_match=None, if_none_match=None):
    body = parsed(raw)
    revisions = {'present': False}
    if isinstance(body, dict) and 'expectedRevisions' in body:
        revisions = {'present': True, 'value': body['expectedRevisions']}
    record = {'version': 1, 'method': method, 'routeTemplate': route,
              'path': {'filingId': 'synthetic-filing'} if path is None else path,
              'body': body,
              'preconditions': {'ifMatch': header(if_match),
                                'ifNoneMatch': header(if_none_match),
                                'expectedRevisions': revisions}}
    data = encode(record).encode('utf-8')
    return data, hashlib.sha256(data).hexdigest()


def positive_integer(value):
    if not isinstance(value, Number):
        return False
    # Exact selected-vector arithmetic; this model sets no product numeric limit.
    match = re.fullmatch(r'(-?)(\d+)(?:\.(\d+))?(?:[eE]([+-]?\d+))?', value)
    sign, whole, fraction, exponent = match.groups()
    digits = (whole + (fraction or '')).lstrip('0')
    if sign or not digits:
        return False
    shift = int(exponent or '0') - len(fraction or '')
    return shift >= 0 or len(digits) - len(digits.rstrip('0')) >= -shift


def ordinary_outcome(raw, authority=True, receipt_hash=None, if_match='current',
                     expected_cycle='current', cycle_required=False):
    # A small explicit ordering model, not a product command or real receipt.
    try:
        body = parsed(raw)
    except (ValueError, UnicodeError):
        return '400'
    if not authority:
        return '404'
    current_hash = fingerprint(raw)[1]
    if receipt_hash is not None:
        return 'REPLAY' if receipt_hash == current_hash else '422-reuse'
    if not isinstance(body, dict):
        return '422-body'
    cycle = body.get('cycleNo')
    if cycle is not None and not positive_integer(cycle):
        return '422-body'
    if cycle_required and cycle is None:
        return '422-body'
    if if_match == 'missing':
        return '428'
    if if_match == 'stale':
        return '412'
    if (cycle is not None and expected_cycle == 'missing') or expected_cycle == 'invalid':
        return '422-expected'
    if expected_cycle == 'stale':
        return '412'
    return 'PROCEED'


def main():
    vectors = json.loads(Path(__file__).with_name('vectors.json').read_text())
    results = []
    for case in vectors['canonical']:
        raw = bytes.fromhex(case['raw_hex']) if 'raw_hex' in case else case['input'].encode('utf-8')
        try:
            actual = canonical(raw).decode('utf-8')
            passed = 'expected' in case and actual == case['expected']
        except (ValueError, UnicodeError):
            actual = 'ADMISSION_400'
            passed = case.get('admission') == 400
        results.append({'id': case['id'], 'pass': passed, 'actual': actual})
    for case in vectors['relations']:
        left = fingerprint(case['left'].encode('utf-8'))
        right = fingerprint(case['right'].encode('utf-8'))
        results.append({'id': case['id'], 'pass': (left[0] == right[0]) == case['same']
                        and (left[1] == right[1]) == case['same'],
                        'left_sha256': left[1], 'right_sha256': right[1]})
    for case in vectors['numeric']:
        actual = positive_integer(parsed(case['input'].encode('utf-8')))
        results.append({'id': case['id'], 'pass': actual == case['valid_positive_integral'],
                        'actual': actual})
    baseline = fingerprint(b'{"cycleNo":1}')
    changes = [('method', {'method': 'PATCH'}), ('template', {'route': '/other/{filingId}'}),
               ('path', {'path': {'filingId': 'other-synthetic'}}),
               ('ifMatch', {'if_match': [b'"7"']}),
               ('ifNoneMatch', {'if_none_match': [b'*']})]
    for name, args in changes:
        results.append({'id': 'N1-TUPLE-' + name,
                        'pass': fingerprint(b'{"cycleNo":1}', **args)[1] != baseline[1]})
    header_checks = [
        ('OWS', fingerprint(b'{}', if_match=[b' \t"7"\t ']) == fingerprint(b'{}', if_match=[b'"7"'])),
        ('absent-v-empty', fingerprint(b'{}')[1] != fingerprint(b'{}', if_match=[b''])[1]),
        ('occurrence-order', fingerprint(b'{}', if_match=[b'"1"', b'"2"'])[1]
         != fingerprint(b'{}', if_match=[b'"2"', b'"1"'])[1])]
    for name, passed in header_checks:
        results.append({'id': 'N1-HEADER-' + name, 'pass': passed})
    for case in vectors['ordering']:
        args = dict(case.get('args', {}))
        if 'receipt_body' in case:
            args['receipt_hash'] = fingerprint(case['receipt_body'].encode('utf-8'))[1]
        actual = ordinary_outcome(case['input'].encode('utf-8'), **args)
        results.append({'id': case['id'], 'pass': actual == case['expected'], 'actual': actual})
    report = {'scope': 'Synthetic standalone reference model only; no product/HTTP/DB/independent QA execution',
              'checks': len(results), 'passed': sum(r['pass'] for r in results),
              'failed': sum(not r['pass'] for r in results), 'results': results,
              'example_tuple_utf8': baseline[0].decode('utf-8'), 'example_tuple_sha256': baseline[1]}
    Path(sys.argv[1]).write_text(json.dumps(report, ensure_ascii=False, indent=2) + '\n')
    print(json.dumps({k: report[k] for k in ['scope', 'checks', 'passed', 'failed']}))
    if report['failed']:
        raise SystemExit(1)


if __name__ == '__main__':
    main()
