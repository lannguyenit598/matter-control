# Verification environment erratum — MC-P0-CODEX-FE-PATCH-20261028

Actual executor: Local Codex `/root` continuation, 2026-10-28 UTC. Original patch author and independent-review boundaries remain unchanged.

Historical `focused-final`, `typecheck-scoped-final`, `lint` and `format` receipts describe real successful executions but used `HOME=/private/tmp`, contrary to the command environment rule. Their logs/JSON remain intact. They are superseded as final verification by the new corrected-environment receipts linked from `../return.md`.

The four exact commands were rerun without assigning HOME, home or CODEX_HOME. The parent environment was not mutated; child environment was cleared and allowlisted to PATH, TMPDIR=/private/tmp and NO_COLOR=1. All three home variables were absent from children. Existing inspected Vitest/TypeScript configs were reused unchanged, with cacheDir outside linked node_modules and Vitest result/fsModule caches disabled. TypeScript incremental output was disabled; ESLint and Prettier were check-only.

Results: 41/41 tests across 4 files PASS; scoped TypeScript, ESLint and Prettier PASS; all exits 0. See [summary](corrected-env-20261028T034105457961Z-summary.json) and the four paired log/JSON receipts with prefix `corrected-env-20261028T034105457961Z-` for exact cwd, argv, real UTC timestamps, exits, source/config hashes and versions. Five patch source hashes and exported delivery bytes match; the isolated frontend inventory is unchanged; all 819 immutable baseline pins match before and after.

UNKNOWN recovery remains component-local and is lost on reload/tab close. Durable recovery NOT_FIXED; full F02 closure is not claimed. Claude follow-up is recorded in the return for receipt-backed recovery or an approved scoped persistence design, without ad hoc storage of raw file/legal payload/token data.

Skipped: full frontend check/build, browser reload/E2E, actual API/auth/PG/provider, independent review, live source integration and external agent dispatch. Risk: loss of UNKNOWN retry identity across reload remains open; integration requires current Claude source reconciliation.
