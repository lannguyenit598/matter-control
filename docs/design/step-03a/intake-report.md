# MC-003A — Recovered design draft intake

Codex orchestration/intake, 2026-10-25. Governance base/head at intake: e377568ac47f8f1b88e3875a8f13d7e57fc30667; branch task/MC-002-solution-architecture. Concurrent Step02.3 changes remain outside this intake. No commit, push or PO design approval recorded.

## Result and actual identity

Actual OpenDesign Cloud run b54045a0-53a9-4968-a5b1-1d28e8454bf0 **FAILED**, exit130, response timeout after1800000ms; terminal result also records unfinished work and deliverableValid=false. Model metadata reports deepseek-v4.1-flash. Skill0.5.3; agent discovery reported cloud runtime0.1.7, not a verified application version. The original run was not canceled or silently switched to Local Codex.

Three existing outputs were recovered and copied byte-identically into [export/](export/). Their SHA256 values and source comparison are in [export-manifest.json](export-manifest.json). This is a preserved draft, not successful run delivery. Author claims of completion or readiness do not override the terminal failure or this intake. No charged amount is inferred from the account balance observed before generation.

## Available review material

- HTML concept artifact: IA/personas, Control Room/Grid, three contrasting visual boards, preliminary design system, workflow/screen specifications, responsive/accessibility strategy, usability plan, architecture dependencies and decision log.
- UX specifications and author handoff Markdown. Author inventory identifies nine interactive surfaces/partials and four specification-only surfaces (Matter List, My Actions, Waiting On, Filing Detail). Codex has not exhaustively verified all nine.
- Author recommendation: Direction A foundation, impact rail from B and compact density from C. This remains a proposal.
- The entire evidence-submit→verify→requirement-satisfaction→downstream-unblock→brief-update workflow is **not** implemented as a connected stateful prototype: upload/review controls demonstrate feedback; source explicitly leaves aggregates unchanged. Three workflow specifications do not prove workflow execution.

## Codex findings — source-confirmed, independent QA pending

| ID | Priority | Finding and exact evidence | Required disposition |
|---|---|---|---|
| UX-R01 | High | HTML2852/3258/3312 permits bulk Workstream and HTML2404 labels owner/date/workstream as baseline. Approved RULE-013 permits title/description, assigned internal owner and due date; type/links/state/criteria/roles are excluded. | Align UI/spec/tests with the approved allowlist. Workstream reassignment is exploration only pending a real policy change, not approved P0 bulk behavior. Restore title/description in the specification. |
| UX-R02 | High | HTML2329 calls per-row vs all-or-nothing undecided; HTML2331/3037 and handoff§7/8 reopen export permissions. RULE-013 already defines per-record atomic change+audit with partial success; permission matrix allows scoped VIEWER export; RULE-014/016 settle import-group and draft-brief business behavior. | Preserve decided business behavior; leave only technical mechanisms PENDING_ARCHITECTURE. Do not ask PO to approve these policies again. |
| UX-R03 | Medium | HTML2399 uses D-01 for a design proposal; HTML2428 uses D-01 for Atlas readiness timing. Handoff§7 calls the two fictional Atlas questions open product decisions. | Separate design IDs (e.g. UX-DEC-*) from synthetic DEC-AT-01/02; remove fictional scenario questions from actual PO approval requests. |
| UX-R04 | Medium | HTML1405/2401 says COMPLETED+VERIFIED or NOT_REQUIRED; source3446 correctly requires COMPLETED AND (VERIFIED OR NOT_REQUIRED). | Make all explanatory copies equally explicit; retain dependency READY and approved per-edge gate semantics. No legal waiver or proof satisfaction from NOT_REQUIRED alone. |
| UX-R05 | Medium | HTML3248 truncates mobile to first8 rows with desktop referral. HTML1814 discloses no real inline edit/copy-paste. Upload/review does not recalculate downstream. | Disclose preview limits in coverage inventory; specify access/search/paging to every mobile record without requiring desktop for read/triage. Label complete versus illustrative connected flows accurately. |

Codex's commissioned wrapper incorrectly narrowed bulk fields to owner/date/workstream and did not supply full RULE-013. This contributed to UX-R01. The [commissioned brief](commissioned-brief.md) is preserved as historical input; the correction packet supplies the actual business rules. No approved requirement has changed.

## Checks and limits

[local-checks.json](local-checks.json): inline JS syntax exit0; no duplicate HTML IDs; no broken fragment targets; three local file links exist. Actual IAB observation confirmed rendering and a Control Room→Grid switch at the current narrow viewport. No full desktop matrix, 50–200-row task test, end-to-end golden workflow execution, accessibility audit, user usability session, API/auth/persistence or production check ran. None of these static checks imply semantic approval.

Actual OpenCode CLI2.1.4 route was prepared; current models list exposes opencode/glm-5.3-flash-free. The attempted independent-review invocation was rejected **before execution** by automatic approval review because exporting this exact internal artifact/policy payload to the external model service lacked specific authorization. Therefore independent QA is NOT_RUN, not PASS or an OpenCode finding. No provider/auth/global settings were changed and no workaround transmission was attempted.

## Next gate

MC-003A: **REWORK_REQUIRED**, with external QA payload approval pending. No DONE, no PO direction approval and no high-fidelity implementation. PO may inspect the recovered draft for discussion, but baseline corrections and independent review remain required before treating it as the approved design handoff. The exact source-only QA packet is described in [qa-input-manifest.json](qa-input-manifest.json); focused owner rework is in [owner-correction-prompt.md](owner-correction-prompt.md).

Skipped: successful-run retry, external QA (egress approval pending), owner correction, high-fidelity, product implementation/deployment and usability testing. Remaining risk: recovered drafts contain the known policy conflicts above and are not independently validated.
