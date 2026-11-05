# MC-002-INTA-FE-FAST-REFUSAL-PROOF-BASIS-R4

**Document ID**: MC-002-INTA-FE-FAST-REFUSAL-PROOF-BASIS-R4  
**Status**: PROPOSED_FOR_INDEPENDENT_REVIEW / SOURCE_VERIFIED_IN_MOCKS / LIVE_RUNTIME_NOT_RELEASED  
**Author**: Antigravity (Frontend Execution Owner)  
**Coordinating Role**: Codex (PM / Coordination Owner)  
**Independent Review**: OpenCode  
**Normative Reference**: INTA-1-LAUNCH-01, OpenCode R3 Review Finding NF-4

---

## 1. Problem Statement: Fast-Refusal Cadence & Evidence Basis (NF-4)

In startup refusal variants (e.g. `API_TOKEN_nonempty`, `NODE_ENV_production`), the supported launcher executes `validateHarnessStartup` in-process synchronously. If a forbidden variable is present, the launcher outputs the refusal phrase to stderr and calls `process.exit(1)` immediately (typically within 20–50ms).

Under the strict fail-closed evaluation rules of `guard_evaluator.py`:
- `during_sample_count <= 0` results in `LISTENER_UNKNOWN` (FEVAL-F02).
- An unobserved window cannot be assumed to be listener-free.
- Conversely, artificial test delays (`time.sleep` in the launcher) or fabricated sample counts violate evidence integrity and are prohibited.

OpenCode finding NF-4 correctly observes:
> *"No returned proposal/evidence establishes that every real refusal run records ≥1 during-sample; a binding-record decision on how refusal-variant PASS is guaranteed is required before runtime."*

---

## 2. Measurement Architecture in R4

To eliminate timing race conditions where a fast-exiting child might be polled before the monitoring loop samples port 18085:

### 2.1 Loop-Entry Probe Ordering (Code-Level Fix in `coordinator.py`)
In `coordinator.py`, the monitoring loop structure is ordered such that:
```python
while time.time() < deadline:
    # 1. Probe listener immediately at loop entry during child execution window
    listening, err = probe_tcp_listener(self.port, self.subprocess_runner)
    during_sample_count += 1
    if listening is True:
        # Immediate abort on listener acquisition
        ...
    # 2. Check live counter
    ...
    # 3. Check child exit status
    poll_ret = child_proc.poll()
    if poll_ret is not None:
        child_exit = poll_ret
        break
    time.sleep(0.05)
```
By taking `probe_tcp_listener` at loop entry before evaluating `child_proc.poll()`, every launched child process has at least one active during-run listener observation recorded (`during_sample_count >= 1`), resolving the zero-sample race condition in standard execution cadence.

---

## 3. Comprehensive Multi-Point Proof Basis for Fast Refusal

A passing verdict for a fast-refusal variant (`VALID_COMPLETE_INPUT`) requires the concurrent convergence of **five independent evidence points**:

1. **Pre-Flight Listener Absence**:
   `probe_tcp_listener(18085)` returns `(False, None)` (rc=1, empty stderr) immediately prior to child creation, verifying port 18085 was not bound before spawn.
2. **Synchronous In-Process Refusal**:
   The launcher's stdout/stderr records the exact canonical refusal phrase (`product auth/secret env vars present (<KEY>)` or `NODE_ENV cannot be production`), with exit code exactly 1.
3. **Zero Child Spawn Proof**:
   The launcher's internal state confirms that Next.js dev server was never spawned (`spawnCalled: false`). Port 18085 is never touched by Next.js.
4. **Persisted Zero-Upstream HTTP Calls**:
   The background HTTP observer on port 18086 records:
   - `requestCount: 0` (strict non-boolean integer 0).
   - `cleanShutdown: true` (strictly boolean True).
   - `isFinal: true` (strictly boolean True).
   - `observerExitCode: 0`.
5. **Post-Probe Listener Absence**:
   `probe_tcp_listener(18085)` returns `(False, None)` immediately after child exit.

---

## 4. Retained Fail-Closed Policy

- **No Weakened Contracts**: If any real execution run fails to capture at least 1 during-run sample, it MUST continue to fail closed as `LISTENER_UNKNOWN`.
- **No Fabricated Retries**: The runner does not retry variants automatically to force a passing result.
- **Review Gate**: This proof basis is submitted for independent nonauthor review by OpenCode prior to the issuance of any live runtime cue by Codex.
