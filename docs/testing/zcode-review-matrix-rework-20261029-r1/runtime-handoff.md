# Runtime handoff — corrected candidate

Safe, sanitized; no secret values, no process-kill instructions.

## Source and build identity

- Workspace: `/Users/nguyenvanlan/Documents/code/pet-projects/matter-control`, branch `codex/unified-project-flow`, HEAD `20feedbf06c859a9806055d609f5b132fe8bb086`, all changes **uncommitted working-tree bytes** (26 source files — see `final-source-manifest.csv`). A binary/running uptake of these bytes requires the runtime owner's own build/deploy decision; nothing here authorizes commit/merge/deploy.
- Backend: corrected bytes verified via `make check` (exit 0) with a disposable PostgreSQL 18.6 fixture (since removed). The retained API process (healthz/readyz 200 during intake) is **not** running this corrected source; any live uptake is the runtime owner's lifecycle action.
- Frontend: both production engines verified in a private scratch copy (Turbopack 1 CSS asset, webpack 2 assets, CSS guard pass). The retained Next dev server keeps serving its own state; it was not restarted or rebuilt.

## Pending operator checks (NOT_RUN — each needs the runtime owner's context)

1. OWNER/EDITOR records an answer; a VIEWER reads the same grid and sees no write controls.
2. While a cell detail is open, the member is removed/revoked by another OWNER; the person's next command shows the denial and the whole review surface (grid name, matrix, detail, history, citations) clears to the notice with Back/Sign-in; unrelated users and grids unaffected. A 412 conflict and an unknown outcome must NOT clear anything.
3. Controlled lost response with possible commit: refresh the props (another answer recorded elsewhere in view) or navigate away and back; the retry must resend the ORIGINAL key and payload (original receipt, `Idempotent-Replayed: true`, no second answer).
4. >100 synthetic answers in a disposable owned test context: "Older answers" walks every page, oldest answer reachable, no duplicate/missing rows, exact old wording/citations, Back/filter context preserved.
5. Keyboard reachability of "Older answers"/retry controls, EN/VI strings, desktop/390px/320px rendering of the touched surfaces. No legal data, tokens or cookies in screenshots.

Recommended order: 4 and 5 on the retained runtime first (read-only + synthetic writes), then 1, then 2 and 3 (they require a controlled second user/revocation scenario in an owned disposable context per the COMMON contract).

## Known environment note for whoever runs the gates

`pnpm format:check` currently fails on two untracked Mimosa plugin session-state files at the repo root (`.mimosa/hook-state/session_*.json`). They are not source; either let the plugin session end/recreate them or have the repo owner decide whether to ignore `.mimosa/` in `.prettierignore`. Everything tracked passes formatting.
