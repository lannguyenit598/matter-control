# M2 — Mimosa PreToolUse findings and dispositions (non-blocking)

Scanner: Mimosa (independent security tool), PreToolUse hook, 2026-10-31/11-01 runs.
All findings were "建议关注 (非阻断)" — advisory. Dispositions:

| # | File | Finding | Disposition |
|---|---|---|---|
| 1 | `up.sh` | 命令注入 (command injection) — `kill "$(cat pidfile)"` | **FIXED in code**: PIDs are read into a variable and validated as plain numeric (`case` guard) before `kill`; non-numeric content is ignored, never executed (`stop_pid_from`). Same hardening applied in `down.sh` (`stop_pidfile`). |
| 2 | `up.sh` | 命令注入 — `$(dirname "${BASH_SOURCE[0]}")` | **Assessed false positive**: standard script-path self-resolution idiom; the input is the script's own invocation path, and a command-substitution result is never re-parsed as a shell command. Matches the repo's documented Mimosa false-positive precedent (UIUX session cross-verification of the Storybook-chunk flag). |
| 3 | `down.sh` | 命令注入 — `rm -rf "$STATE"` / `docker rm -f "$PG_NAME"` | **Assessed already-hardened / false positive**: `rm -rf` is gated by a `case` guard that only matches `*/mc-walkthrough*` paths (unexpected paths are refused with a note); `docker rm -f` targets the exact constant name `mc-walkthrough-pg`. Neither consumes untrusted input. |
