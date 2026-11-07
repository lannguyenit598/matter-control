# ERRATUM-1 — W4 NOT_FOUND reversed (2026-11-07)

- Recorded by: coordinator ZCode session, on the OpenCode confirmation adjudication (Task B, `confirmation.md` in this dir — CONFIRMED_WITH_NOTES).
- The fix-wave W4 row ("`apps/backend/docs/api.md.orig` NOT_FOUND on disk and in git history; ERRATUM-1 claim stale/sai") is **reversed**. OpenCode probes: file exists on disk (13.4K, mode 644), tracked at HEAD (`ls-files --error-unmatch` exit 0), present at `276a1e68` (`cat-file -e` exit 0), and no branch deletes it (`--diff-filter=D` empty). The ERRATUM-1/§12 observation (from `git ls-files` at `276a1e68`) was correct; the fix-wave's NOT_FOUND observation was wrong.
- Recommended corrections applied 2026-11-07:
  1. Hygiene disposition executed — `api.md.orig` removed, chore commit `9fb155ce` (0 references outside docs prose, verified before removal). W4 closes as DONE-with-corrected-observation.
  2. Register §13 W4 row annotated with the reversal; §14 discrepancy note updated to adjudicated (see register §16).
  3. This file; `return.md` itself is left unmodified (sealed author evidence — corrections live here and in the register, not by rewriting the return).
- W1–W3 dispositions unchanged (all CONFIRMED by OpenCode). Nothing else in the wave's evidence was modified.
