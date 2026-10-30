# Session prompts — parallel implementation continuation

Use one prompt per session. Keep the existing Claude session running; do not start a second live writer.

| Session | Prompt | Start condition |
|---|---|---|
| Codex backend | 01-CODEX-BACKEND-RESUME.md | Can start now; existing frozen code, finalize verification/return |
| Codex frontend | 02-CODEX-FRONTEND-RESUME.md | Can start now; repeat final checks without HOME override, no new code scope |
| Codex reviewer (nonauthor) | 03-CODEX-INDEPENDENT-REVIEW.md | Can read frozen code now; qualify final evidence if corrected FE receipts pending |
| Existing Claude implementation | 04-CLAUDE-CONTINUE-AND-INTEGRATE.md | Continue immediately; integrate only reviewed still-applicable hunks after current-byte reconciliation |

All implementations remain isolated until Claude explicitly integrates reviewed changes. Durable source before/after and patches: ../delivery/. These prompts are prepared, not new external-session dispatch. Existing internal subagent work hit quota on final verification/review; it is not silently completed.
