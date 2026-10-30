# MC-P0-DESIGN-R4 — coordinator source and delivered-image intake

Task: MC-P0-DESIGN-R4-INTAKE-20261027. Actual inspector: Codex / Local Codex. Root `/Users/nguyenvanlan/Documents/code/pet-projects/matter-control`, branch `codex/unified-project-flow`, observed base/head `a62d838791ba188838c4ff00b7b6e265ac775056`. Reviewed export: `MC-P0-DESIGN-R4-local-20261027-01`; return SHA-256 `8ccad46f0300dcb460910faf56807541e2b8ae14b720ffa640e066b69b83d9fe`.

**Disposition: CHANGES_REQUIRED before treating R4 as an authoritative implementation handoff.** The nine-file package exists and the requested navigation/queue structures were added, but human-readable specifications and tests contradict retained canonical mappings and the current local contract. ZCode should continue its existing full P0 assignment against approved requirements/current contract; this intake does not impose a new per-wave review stop or authorize wholesale adoption of the conflicting R4 instructions.

This is coordinator inspection, not independent visual/design acceptance: the return self-identifies its author as “Antigravity Design Assistant / Local Codex”, and earlier design material includes Codex contributions. External executor identity/run attribution was not independently established. The read-only connector returned `Transport closed`; no repair, generation, login or external dispatch was attempted.

## Verified delivery

- All eight payloads match the bytes/full SHA-256 values declared in `return.md`. The return itself is separately pinned.
- Twelve read/parse checks passed: canonical 20 FR/AC/wave mappings; all 63 AC and 14 NFR IDs; 13 screens with nine states each; reciprocal FR/screen links; retained three complete GW sequences; two GW-03 supplement cycles; Atlas 24 records/12+12/seven edges; Action census 4 completed/3 waiting/5 not started; embedded CSS identity; 48 historical finding records unchanged from R3; 11 UIUX plus two prior source findings retained. These checks do not validate every prose oracle.
- My Actions source now groups U-01 fixture Actions correctly: waiting AC-04/05, blocked AC-05/12, completed AC-01/02, zero eligible. Shared per-record drafts exist. This is source evidence, not an interactive acceptance result.
- `/tmp/prototype-r4-export.png` exists, 1,009,636 bytes, SHA-256 `8825b2f773fd4b821b6dcb9cf496850c94fbfe088654296f7a8b1224e8ec2fc6`. I inspected this existing image and retained an identical evidence copy. I did not run an export, capture a browser or execute the prototype.

## Corrections required as one coherent package

### R4-I01 — P1: prose validation remaps FR identities and changes an oracle

`validation-plan.md:52–71` labels VAL-FR-001 as Workspace boundary instead of Requirement versus Action, VAL-FR-002 as auth instead of Milestones, VAL-FR-017 as audit instead of External Parties, VAL-FR-018 as concurrency instead of Roles/Ownership, VAL-FR-019 as permissions instead of Draft Delta Brief, and VAL-FR-020 as responsive/a11y instead of Five Axes. The JSON matrix remains correctly mapped; the two deliverables disagree. Also line 58 requires VERIFIED for every milestone prerequisite, omitting explicitly valid NOT_REQUIRED permitted by RULE-008.

Restore the canonical FR/rule/AC bindings in every named oracle; auth/a11y/concurrency can have separately identified cross-cutting scenarios. Restore the distinct milestone predicate. Do not relabel product execution or geometry as CONFIRMED_SOURCE merely because a static example exists. Compare prose and machine-readable mappings together before return.

### R4-I02 — P1: token-in-cookie checklist contradicts the current contract

`zcode-handoff.md:152` says “tokens stored in session cookie”, whereas its own line 56 says server-side storage. `docs/implementation/p0-zcode-execution/local-contract.md:9` requires OAuth tokens only in the server-side BFF store and an opaque handle in the cookie. Correct the checklist and all derivative examples. Preserve negative token-exposure tests; do not change ZCode's contract to fit the design wording.

### R4-I03 — P1: receipt upload again becomes an automatic Filing transition

`current-ux-spec.md:196`, `zcode-handoff.md:111/161` and `validation-plan.md:67` state that uploading a receipt advances to Authority Review. RULE-012 and the preserved R3 spec require an authorized, validated observation/command with actual acknowledgement, exact scope/version/reference and current guards; upload alone records no authoritative stage. Separate file submission from accepted receipt observation and pending authority outcome. Correct all three documents and the checklist together. Receipt is not approval, but that distinction alone does not make upload-driven advancement valid. Also use RULE-012 for Filing rather than the Status Brief rule RULE-016.

### R4-I04 — P1: Action proof panel borrows a Requirement's proof by numeric suffix

`prototype.html:300–312` uses `r.id.slice(-2)` and `proofData[num]` for both record kinds. The criterion text checks `r.type`, but the proof lookup does not. Opening AC-05's proof context therefore selects the RQ-05 EV-05/DOC-03 entry and says UNVERIFIED/DEP-05 blocked even though AC-05 has NOT_REQUIRED proof applicability in canonical Atlas. The panel also states DEP-05 is blocked while canonical RQ-05 retains historical VERIFIED context.

Use explicit typed record/criterion/evidence relations, not matching numeric suffixes. An Action with no applicable criterion must not inherit a Requirement's proof. Separate historical values/current-policy caveats from actual evaluated gate state; do not mutate Atlas to hide the discrepancy. Verify AC-01/03/05/06/10 as well as RQ-03/05, current-versus-fixed versions and absent proof.

### R4-I05 — P2: modal history survives a completed navigation session

`prototype.html:268–271` pushes any prior `currentRecord`, including when opening a fresh modal. `handleCloseDetail()` at lines 349–352 clears the stack but not current record/mode; the native `close` handler at lines 512–515 only restores focus, so Escape does not clear either. Sequence: open AC-05 → close → open RQ-10; the new modal incorrectly offers AC-05 as prior context. Escape can retain an even longer stale trail. The label builder also calls every origin other than Control Room/My Actions “Grid”, including Waiting On and Filing.

Initialize trail/current-record state for each new modal session; clean it centrally on every native close path while retaining the separate draft map. Preserve the real origin label. Restore saved mode when returning if proof-mode history is supported. Test close button, Escape, reopen, multiple origins and repeated nested traversal. This is confirmed by source state flow; actual browser focus behavior remains NOT_RUN.

### R4-I06 — P2: permission prose introduces an owner-only assignment restriction

`current-ux-spec.md:176` describes forbidden assignment changes by a non-owner. The approved permission matrix, line 16, permits both Matter EDITOR and OWNER to assign Actions to active scoped members. Other “Primary Roles” lists are personas, not a new authorization matrix. Restore operation-by-role wording; retain VIEWER read access and separate OWNER-only membership/designation commands. Test an EDITOR assigning another scoped Action; assignment must not grant access.

### R4-I07 — P2: handoff substitutes formats and invents a wire status

`zcode-handoff.md:44` substitutes a CSV/JSON import description for the plan's CSV/XLSX work; its W6 description/checklist does not preserve meaningful scoped XLSX export. Line 131 introduces `CLAIM_IMPORTED` as if it were an adopted status. `validation-plan.md:65` substitutes CSV/PDF for the existing export contract. Preserve the approved plan and exact import/export requirements; describe imported verification as a claim with current proof still evaluated, without selecting a new technical enum. Also remove the unsupported legal-draft localStorage instruction at validation line 53; draft retention and revocation must follow the adopted session/privacy contract.

### R4-I08 — P2: generic state viewer and unbound static evidence overstate completion

`renderStateSpecimen()` at `prototype.html:411–443` changes the screen label but uses one generic body for every SCR. It shows a “Create first record” control even for screens/roles where that is not the action, literal aria-busy text instead of that actual loading state, inert retry/rebase/submit controls, and a partial-result example with three accepted records but only two accepted IDs. It does not demonstrate 13 actual screen-specific recovery/permission flows. Several validation statuses call unexecuted flow/geometry assertions confirmed in prototype/product.

Keep the specimen explicitly illustrative and non-operational. Use each screen's actual state/role/action model and reconcile example counts. Retain SPECIFIED_ONLY where a full interaction is absent. Keep source, existing image inspection, measured interactive behavior and product enforcement as separate results. The image hash proves those delivered bytes, not the capture's input/viewport/permission provenance: provide the actual command/tool/version/UTC/exit/input binding if available. Do not rerun exports or another renderer to bypass disabled browser permissions. Lint/export command success currently remains author-reported because no bounded raw execution receipts accompany the nine outputs.

## Delivered-image observation

The inspected desktop image preserves clear product scope, textual state meanings and the intended Control Room hierarchy. The causal region still repeats condition/cause/impact/next-step paragraphs across five equally emphasized red-bordered columns, then repeats the primary cause in a second summary. Reduce repetition and use progressive detail while retaining the critical cause, owner and permitted next action. This is a refinement within the selected design, not a new style decision. One long image cannot establish mobile, density, zoom, focus, contrast in all states, or AC-137 comprehension. The image is 2880×3982; no viewport or device pixel ratio was inferred from that size.

## Return and continuation

Correct these findings in one new coherent design revision, preserving R4 bytes and historical records. Recheck prose + JSON + prototype + handoff together. Actual independent approval remains pending; no DONE or formal gate promotion. ZCode can continue its approved full BE+FE plan and current revision-3 contract, using compatible visual reference selectively; the conflicting R4 directives are not adopted by this intake. No agent was messaged.

Skipped: reviewed-source/DOM execution, new rendering, live keyboard/touch/screen-reader, product/build/runtime, AC-137, provider/private reads and Git mutations. Risk: implementing the current R4 prose without correction can reintroduce token exposure, incorrect Filing effects, wrong proof associations and invalid acceptance tests.
