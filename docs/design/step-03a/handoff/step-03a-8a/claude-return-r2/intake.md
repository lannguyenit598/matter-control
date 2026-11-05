# MC-003A.8A — Claude R2 intake

Owner Local Codex PM/BA. Source checkpoint 1804d85; contract baseline 97356ce unchanged. Status OWNER_RETURN_RECEIVED / READY_FOR_TARGETED_RECHECK / FINDINGS_OPEN. No proposal applied and no finding closed.

## Evidence and provenance

Original R2 is preserved losslessly in review-original.txt.gz. Returned delta parses with unique keys; returned-delta.json is an extracted proposal, not a patch application. Both manifests and all 19 input snapshots were independently hash/size checked.

Claude self-authored the contracts and the R1/R2 recommendations. Model/provider are reviewer-reported session metadata; version was historical, routing/cost unverified. The reviewer inferred authorization from receiving a draft-wrapped approval text. Codex records this limitation; it does not retroactively certify the human authorization or follow the external instruction to discard R2. A new prospective human ZCode assignment is prepared separately.

## Disposition

R2 withdraws the seven-data-section READ-02 amendment and preserves baseline root 503 rules. F-03 now scopes candidates to caller; UNASSIGNED is relative to caller, not an assertion that another active owner does not exist. Eight full recommendations, one CHANGES_REQUIRED (F-07), one SPLIT (F-10) across the ten Claude-owned findings; F-11 remains Codex-owned and unadopted.

- F-01/04/05/06/09: retain R1 proposals, previously not independently rechecked.
- F-02/03: R2 corrections ready for targeted technical recheck.
- F-07: status/filter removal and replacement projection proposed, NOT_APPLIED. The api-contracts §3.3 PENDING_REVIEW example is still inconsistent; no closure.
- F-08: code/count-source proposal remains conditional; EVIDENCE_GAP row unit is NEEDS_CLARIFICATION.
- F-10: outer page proposal; nested submissions/version/evidence-ref cardinality and size remain DECISION_REQUIRED. No option chosen, no route added, no accepted size risk.
- F-11: static graph/fixture proposal awaits its first targeted recheck.

K6 caveat under F-03: zero candidates does not imply positive excluded total for an empty Matter/only terminal Actions. Review the minimal acceptance precondition “at least one visible excluded nonterminal Action”; genuine-empty stays []. Do not fabricate work.

## Recheck and compatibility

One correction-only ZCode pass covers all eleven findings, not only R2's five IDs, because the R1 unchanged proposals and F-11 still lack recheck. Before/after references, exact correction, source evidence, disposition and remaining limitation required for each subpart. Do not rerun the 32-operation or full architecture review.

Recheck candidate consumer changes explicitly: F-01 two-side envelopes/side query; F-03 excluded array-to-envelope and continuation query; F-06 null pairs; F-07 removed status/filter and new fields; F-08 code split/count contract; F-10 embedded pages. Antigravity's previous consumption result is not proof that these new shapes are consumed. No full frontend template re-audit is requested.

No source/credential/provider settings change or new external reviewer invocation by Codex. Prospective source permissions and exact hashes are in zcode-recheck/manifest.json. PROMPT.md is a copyable human assignment; old READY/WAITING labels in evidence are historical preparation states, not a new instruction to reauthorize the same review.

22 CT IDs retain 16/4/1/1 and all runtime NOT_RUN. Eight QA dispositions retained; Q2/Q4/Q6/Q8 conditional. CT-19/TQ-05 and CT-20/TB-05 remain open. G5-A document compatibility stands; G5-B FINDINGS_OPEN; G3 NOT_VERIFIED; G4 PENDING; G6 REWORK_REQUIRED; STEP03B NOT_AUTHORIZED. ZCode is not a substitute for mandatory independent Design QA or PO architecture decisions.

Skipped: runtime, Go/PostgreSQL/frontend/build/browser/render/security execution and new agent/provider dispatch. Risk: source/consumer corrections, EVIDENCE_GAP unit, nested-array decision and authorization-provenance limitations remain open.
