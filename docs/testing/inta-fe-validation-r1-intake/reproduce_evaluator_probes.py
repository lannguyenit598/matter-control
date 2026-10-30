"""Pure R1 evaluator probes. Expected rejection cases currently return PASS; exit1 demonstrates defects."""
from pathlib import Path
import importlib.util
import json
import tempfile
import sys

sys.dont_write_bytecode = True
source = Path(__file__).resolve().parents[1] / 'inta-returns/frontend/validation-r1-20261026/runner-scripts/guard_evaluator.py'
spec = importlib.util.spec_from_file_location('reviewed_r1_evaluator', source)
module = importlib.util.module_from_spec(spec)
spec.loader.exec_module(module)
cases = [
    ('unknown_listener', {'requestCount': 0, 'cleanShutdown': True}, None, None),
    ('bool_counter', {'requestCount': False, 'cleanShutdown': True}, False, False),
    ('string_clean_flag', {'requestCount': 0, 'cleanShutdown': 'false'}, False, False),
]
failures = []
with tempfile.TemporaryDirectory(prefix='inta-pure-evaluator-') as temporary:
    counter = Path(temporary) / 'observer.json'
    for name, payload, during, after in cases:
        counter.write_text(json.dumps(payload))
        result = module.evaluate_variant('API_TOKEN', 'nonempty', 1, False,
            'Harness startup refused: product auth/secret env vars present (API_TOKEN)', '',
            str(counter), during, after)
        if result['verdict'] == 'PASS':
            failures.append(name)
        print(json.dumps({'case': name, 'expected': 'NOT_PASS', 'actual': result['verdict']}))
print(json.dumps({'unsafe_passes': failures}))
sys.exit(1 if failures else 0)
