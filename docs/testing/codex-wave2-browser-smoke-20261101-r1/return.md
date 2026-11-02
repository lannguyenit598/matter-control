# Wave2 browser smoke checkpoint — 2026-11-01

- Task: MC-CODEX-WAVE2-BROWSER-SMOKE-20261101; owner actual Local Codex; priority P1; status **PARTIAL_BROWSER_VERIFICATION / WAITING_SCOPED_AUTHORIZATION**.
- Requirement coverage: Wave2 G1 OV-F1-01; G7 F8/P-09 runtime precondition; no new business semantics.
- Candidate: `codex/unified-project-flow` HEAD `978d8fc694a47e9beee528076bcf1af9473997e3`. Browser now works after the operator changed Settings/restarted the desktop app. Human authenticated as **cloud-synthetic-b**, observed from UI; no password/token/cookie read.
- Outputs: this return, [case record](checks.json), [runtime/source intake](intake.json), five AX snapshots and four PNG screenshots. Actual QA fixture is retained for continuation. No screenshots or evidence contain real legal material.
- Reviewer needed: actual nonauthor OpenCode for independent runtime acceptance. These are actual Local Codex observations, not independent closure or screen-reader speech proof.

## What ran through the actual browser

Created **QA Wave2 synthetic 20261101** workspace and **QA G1 Filing PACKAGE SIGNATURE** Matter; all writes were confined to this new synthetic workspace/Matter. Added a synthetic Requirement and authority, then created **QA G1 purpose split browser smoke** Filing with outcome verification required. The Filing is at [this QA URL](http://localhost:3000/matters/01a19674-85e3-7261-a268-65ca800ae616/filings/01a19676-e4fd-7877-9c1a-c2c282b202c6).

Created mandatory criteria through the actual form: PACKAGE, SIGNATURE and OUTCOME. **SIGNATURE appears in the selector, persists, and the returned checklist parses/renders all three axes.** Offered one explicit synthetic external reference from B for PACKAGE/SIGNATURE only. Both remain offered/pending independent verification; OUTCOME has no evidence. [Observed proof](01-proof-offered.ax.txt) / [screenshot](01-proof-offered.png).

Advanced REQUIREMENT→PACKAGE_PREPARATION→SIGNATURE, with an explicit QA external reference. Submission with pending evidence was refused with the localized combined evidence/signature explanation. After closing and a fresh reload, **Signature remains current**, **Not submitted yet**, OUTCOME remains pending, and the timeline contains only the two prior successful stage transitions. [Refusal](03-submission-refused.ax.txt) / [screenshot](03-submission-refused.png) / [readback](04-after-refusal.ax.txt). This proves refusal/no observed submission, not individual guard precedence: there is also no observed signed document in this fixture.

## New defect W2-BROWSER-01 — P2, OPEN / REPRODUCED

After completing a stage and reopening Record the next step without a hard reload, AdvanceForm retains its prior `to` state. At PACKAGE_PREPARATION the selector showed **Signature**, but the button still said **Record package preparation** and the reference/version inputs were absent. Hard reload showed the correct **Record signature** and package inputs. [AX evidence](02-stage-caption-mismatch.ax.txt) / [screenshot](02-stage-caption-mismatch.png).

Runtime and current primary `filing-forms.tsx` bytes are identical (`d595d841…e3b017`). Read-only inspection confirms `AdvanceForm` initializes `useState(detail.next[0])` once; `to` drives the submit label, fields and `advanceFilingAction` command. This is more than a caption issue: a retained invalid target can be submitted. No incorrect-stage command was sent to prove it; reload was used to prepare each later stage correctly. Required fix: synchronize/remount the advance form when the stage changes, preserve valid same-stage intent, add a rerender regression for selection/fields/command. No source fix was performed in this browser checkpoint.

## Authorization boundary / preserved checkpoint

The human logged in as B. Through the new synthetic workspace/Matter UI, synthetic A was added as workspace **MEMBER** and this Matter's **EDITOR**. Those operations completed. The separate **Designate verifier** operation was rejected by automatic approval review because explicit authorization did not identify A, the Matter and verifier scope. No alternate route/retry was attempted. Final readback still says **No verifier is designated** ([snapshot](05-awaiting-verifier.ax.txt)).

Required scoped approval: designate **cloud-synthetic-a** as independent verifier of this QA Filing in Matter **QA G1 Filing PACKAGE SIGNATURE** (`01a19674-85e3-7261-a268-65ca800ae616`), without widening any other scope. After that, the human must sign in as A to accept B's PACKAGE/SIGNATURE evidence. Continue the positive submission path only with valid signature/document prerequisites, keeping OUTCOME pending. No bypass, actor forgery, direct DB acceptance or token reuse.

## G7 runtime and remaining gates

Active :3000 listener PID39127 uses `/private/tmp/mc-controls-lists-20261101/frontend`, build `GTHSyIj-CqnrEwppMEIa5`. Its G1 proof schema/panel match primary; **layout has no ActionAnnouncer mount**, so it predates the committed G7 integration. Do not call this G7 regression/PASS. Current manual runtime was explicitly protected and was not refreshed here. A separately scoped refreshed candidate runtime is needed for G7 browser checks; actual assistive-technology/speech smoke remains NOT_RUN.

Browser connection is no longer the blocker. G1 now has real partial browser evidence, but positive independent verification/submission is pending authorization, A sign-in and signature prerequisites. New stage-state defect also needs remediation/retest. G2–G6 prior independent closures stay within their accepted scopes; Wave2/P0/MC-002 is not DONE.

Skipped: source changes, tests/builds, runtime restarts, cleanup/deletion, credential/IdP administration, Git commit/push, provider/deploy and actual screen-reader speech. Remaining risks: wrong retained stage target, stale G7 runtime, incomplete positive/two-actor G1 path and no nonauthor acceptance of these new browser observations.
