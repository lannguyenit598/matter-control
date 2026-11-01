# R8 — Release preflight vs planted artifact (independent OpenCode leg 2)

- Anchor: HEAD `bb54d6e`, blob `apps/frontend/scripts/release-preflight.mjs` = `e4c1a9e…`; `worker-build-env.mjs` = `a468b92…`. Script bytes identical in the working tree and the pinned snapshot (sha256 `f3d590bd…`).
- Harness: copy of the real 1575-file `.open-next` artifact from the working tree (`apps/frontend/.open-next`), planted files in the copy only. Runs: `commands/verify-R8-preflight-plant/`, `commands/verify-R8-isolate/`.
- Environment: node v24.22.1, macOS. The pinned snapshot is not a git checkout, so the tracked-files scan is skipped with a warning (`not a git checkout`); the artifact scan is the subject.

## Result — FAIL

| probe | planted content | expected | actual |
|---|---|---|---|
| A | none (clean copy of `.open-next`) | clean, exit 0 | `release preflight: clean …`, exit 0 |
| B | `.env.local` + `nested/.dev.vars` + `nested/server.pem` + `trace.txt` sentinel | FAIL listing each finding, no values | **uncaught `TypeError: text.split is not a function`**, exit 1, zero findings printed |
| C | missing dir + `--require-artifacts` | FAIL | correct finding, exit 1 |
| D | missing dir without flag | warn + clean | correct, exit 0 |
| E | only `trace.txt` containing `MC-RELEASE-SENTINEL` | FAIL (release sentinel marker) | **clean, exit 0 — missed** |
| F | only `nested/leak.txt` containing `-----BEGIN PRIVATE KEY-----` | FAIL (PEM private key block) | **clean, exit 0 — missed** |
| G | only `.env.local` | FAIL with `env file` finding | **crash TypeError**, exit 1, no finding |

Secret-leak check: the planted value `QA-SENTINEL-VALUE-DO-NOT-PRINT-7f3a` appears **0 times** in all stdout/stderr captures (good — values are never printed, even in the crash path).

## Root cause (new finding OV-R8-01, P1)

`probeFactory(read)` (release-preflight.mjs L61-71) expects `read(rel)` to return the file **content string** and derives `name`/`key` itself. Both callbacks passed to it in `main()` instead return a full probe-result **object** `{ name, key, content }` (L108-111 for tracked files, L131-134 for artifacts). Consequences:

1. For normal filenames, `await read(rel)` returns an object, so `info.content` is an object; `shape.re.test(info.content)` coerces it to `"[object Object]"` and **content sentinels never match**. Both the repository scan and the artifact scan are content-blind: PEM blocks / `MC-RELEASE-SENTINEL` in any normally-named file pass as clean (probes E, F).
2. For a forbidden filename (`.env*`, `.dev.vars*`, `*.pem`, `*.key`, `api-key*.json`), `findRuntimeSecret(object)` throws; the uncaught exception aborts the whole preflight before any finding is formatted (probes B, G). The build still goes red (exit 1), so the name class is fail-closed, but the operator gets a stack trace and no file list, and every other finding in the same artifact is lost.

The unit tests do not catch this: `release-preflight.test.mjs` calls `scanFiles(files, probe)` directly with hand-built probe objects (the correct `scanFiles` contract) and never exercises `probeFactory` or `main()`. Green tests, broken CLI wiring.

Fix direction (not applied — read-only QA): make the two `read` callbacks return just `await readFile(..., 'utf8').catch(() => null)`, keep name/key derivation inside `probeFactory`, and add an integration test that runs `main()` (or `probeFactory`) against a temp artifact dir with a `.env.local` and a sentinel-in-`.txt`.

## Verdict

- **R8: FAIL.** The planted-sentinel expectation is not met (exit 0 clean), and the planted `.env.local` path crashes instead of reporting findings. The packet's "preflight catches planted `.env.local`/`.dev.vars`/sentinel in a real artifact" holds only as a fail-closed crash for the name class, and not at all for the content class.
- **OV-R8-01: OPEN, P1** — content scan effectively disabled in both scan paths; crash on first forbidden filename.
- No fix performed; artifact and source untouched (planted only in `/private/tmp/…/r8/`). Verdict binds `bb54d6e`.
