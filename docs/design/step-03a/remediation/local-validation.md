# MC-003A local R1 validation

Identity: Local Codex. Base 3ebc0f0, original preservation commit cef67c4. This is author validation, not independent QA. Exact timestamp/command/exit in validation/execution.json; result files and check scripts beside it. No production/backend/frontend suite is relevant to this design-only change.

| Check actually executed | Result | Evidence / limits |
|---|---|---|
| `rtk proxy python3 docs/design/step-03a/remediation/validation/structural-checks.py` | PASS,48 checks | HTML explicit tag balance, unique/static fragment/asset paths, no external executable resources, frozen3design+13normative integrity,24exact Atlas field comparisons, retained flow sections, old bulk/evidence IDs absent and extracted script syntax. Standard-library parser is not W3C conformance validation. |
| `rtk proxy node docs/design/step-03a/remediation/validation/local-checks.cjs` | PASS,11 groups | Node24.22.1 VM with DOM stubs:72predicate input combinations; timing48h boundaries/no due/terminal; allowlist/invalid/stale writes preserve values/audit; unchanged defaults; owner-only date preservation; mixed success+conflict+denial retained; canonical evidence and blocked acceptance; inline shared path;200mobile generated rows/AC-12 search/empty reset; arrows ignore nested controls. |
| `rtk proxy node --check /tmp/mc003a-r1.js` | PASS | Exact inline script extracted from revised HTML by structural validator. |
| Hallmark installed static app audit `--scope app --genre modern-minimal --json`, cwd /tmp | exit1, heuristic findings | Original243/302/7 → revised245/302/7. Render off. See raw JSON and skill review; no count-as-defects or zero-score gate. |
| Original→revision Git no-index diff | REVIEWED, differences expected | Scope: HTML/spec/handoff plus interaction guidance; original hashes preserved. New canonical data expands HTML; no product source/framework changes. |
| Protected tracked paths vs cef67c4 | PASS when final Git audit recorded | No requirements/product/architecture/Step02.3 mutations. Primary checkout belongs to another session; its advancing HEAD is not ours to reset or merge. |

Source assertions passed; actual browser behavior is untested. The VM intentionally removes final startup and exposes closure functions; it does not execute a browser, load fonts, fetch resources, measure geometry or establish accessibility. No screenshots or viewport/contrast measurements exist.

VISUAL_VALIDATION_NOT_EXECUTED: prior file:// control rejection respected; no alternate-browser/server workaround. Remaining checks: long Vietnamese type/fallback, contrast all states, touch target spacing/geometry,200% zoom/reflow, native dialog focus/restoration, origin-tab return, keyboard/screen reader, actual mobile last-row scrolling, representative dense data task completion/performance. Full W3C validator, participant testing, production auth/API/audit/import/export/concurrency and independent OpenCode review NOT_RUN.

No CLOSED/QA PASS/DONE/design approval follows from these local results.

Git whitespace check exception: the verbatim agent A report contains12 Markdown two-space hard line breaks. Full `git diff --cached --check` reports those as trailing whitespace; they are intentionally preserved to keep the returned report byte-exact. The same check excluding only that immutable report passes; no authored-code whitespace error is waived.
