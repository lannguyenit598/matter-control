# Provenance erratum — evidence/run-20261027T081038Z

An independent recheck found that the 11 receipt files under
`evidence/run-20261027T081038Z/*.receipt.json` have two defects:

1. **Malformed UTC timestamps.** Every `"utc"` field in that directory reads
   like `2026-10-27T08:10:50.6NZ`, which is not valid ISO-8601. Cause: the
   shell helper used `date -u +%Y-%m-%dT%H:%M:%S.%6NZ`. On this machine's
   BSD `date` (macOS/Darwin), `%N` is not a recognized format specifier —
   GNU `date` supports fractional-second `%N`, BSD `date` does not — so the
   literal characters `6N` were emitted instead of six digits of
   sub-second precision.
2. **A placeholder argv on one receipt.** `pin_verification.receipt.json`
   in that directory recorded `"argv": ["shasum", "-a", "256", "<four
   R8/R9-input pin files>"]` — a descriptive placeholder, not the four
   actual file path arguments that were really passed to the command.

**What this does and does not mean.** The `stdout.log`/`stderr.log`/`exit`
fields in that directory are real captured command output and exit codes
— they are not fabricated — and the checks themselves genuinely ran and
passed as logged. Only the **exact timestamp** and **one argv field** in
that specific directory are unreliable as precise provenance. Nothing in
that directory was deleted or silently rewritten to hide this.

**Correction.** A fresh, independently timestamped verification pass was
run and committed at `evidence/run-20261027T084209Z/`, using:

- `python3 -c "import datetime; print(datetime.datetime.now(datetime.timezone.utc).isoformat())"`
  for `utc_start`/`utc_end` (valid ISO-8601 with microsecond precision and
  an explicit `+00:00` offset), captured once before and once after each
  command so elapsed time is also visible.
- The real argv array for every command, including `pin_verification`,
  which now lists its four actual path arguments.

`evidence/run-20261027T084209Z/` is the directory `return.md` cites as the
current evidence of record. `evidence/run-20261027T081038Z/` is kept,
unmodified, as the first R9 attempt's record, with this erratum attached.
