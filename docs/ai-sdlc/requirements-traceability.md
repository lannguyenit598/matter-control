# Requirements Traceability

Direction: source → requirement → task → output/design/ADR → test → independent review → release evidence. Update links on every handoff; affected test/review results become stale when their subject changes.

Historical subject below: Step 00 documentation baseline. Current Step 00A mappings follow in separate tables. [Requirement register](../requirements/README.md). [Task MC-000](../implementation/tasks/MC-000.md). [Test report](../testing/step-00-validation.md). [Review packet](../reviews/step-00-review.md). [Release status](../release/README.md).

| Requirement | Task | Output evidence | Test ID | Review | Release |
|---|---|---|---|---|---|
| REQ-S00-001 | MC-000 | charter, product baseline, Git diff | DOC-01 | REV-00 pending Human | REL-00 N/A: documentation-only, no runtime release |
| REQ-S00-002 | MC-000 | agent-capabilities + tooling verification | TOOL-01 | REV-00 pending Human | REL-00 N/A |
| REQ-S00-003 | MC-000 | operating-model | DOC-02 | REV-00 pending Human | REL-00 N/A |
| REQ-S00-004 | MC-000 | charter, RACI, gates, risks, changes, decisions, status | DOC-03 | REV-00 pending Human | REL-00 N/A |
| REQ-S00-005 | MC-000 | task-template + orchestration-protocol | DOC-04 | REV-00 pending Human | REL-00 N/A |
| REQ-S00-006 | MC-000 | source-of-truth + local Git baseline | DOC-05 | REV-00 pending Human | REL-00 N/A |
| REQ-S00-007 | MC-000 | root AGENTS.md, CLAUDE.md, capabilities/formats | DOC-06 | REV-00 pending Human | REL-00 N/A |
| REQ-S00-008 | MC-000 | this matrix + task/test/review/release records | DOC-07 | REV-00 pending Human | REL-00 N/A |
| REQ-S00-009 | MC-000 | project-status + MC-00A packet | DOC-08 | REV-00 pending Human | REL-00 N/A |

A structural PASS is not agent runtime success or independent review. Product direction and capability priorities are approved inputs from Step 00A; implementation acceptance is not claimed.

Future rows must link actual test cases/results, PR/reviewer decisions and release manifests containing tested/deployed backend/frontend SHAs, environment, date, approval and runtime evidence. Use PENDING until evidence exists; N/A requires rationale and reviewer acceptance.

## Step 00A artifact traceability — baseline subject 20f12fe

Source: SRC-00A + SRC-00A1; task: [MC-00A](../implementation/tasks/MC-00A.md); tests: [S00A report](../testing/step-00a-validation.md); review: [REV-00A](../reviews/step-00a-review.md) PASS_WITH_LIMITATIONS received during Step 01. Runtime release: N/A, documentation only.

| Requirement | Artifact | Check | Remaining gate |
|---|---|---|---|
| REQ-S00A-001 | source-brief.md + context-provenance.md | S00A1-01 / S00A1-SEM | Original A archival optional, not directly verified |
| REQ-S00A-002 | product-reality-addendum.md + context-provenance.md | S00A1-01 / S00A1-SEM | Original B archival optional, not directly verified |
| REQ-S00A-003 | canonical-product-context.md | S00A1-02 / S00A1-SEM | Seven JTBD traced below and in canonical §3; rules Step 01 |
| REQ-S00A-004 | domain-glossary.md + canonical state axes | S00A1-02 / S00A1-SEM | Detailed domain rules Step 01 |
| REQ-S00A-005 | three-golden-workflows.md | S00A1-04 | Detailed criteria Step 01; execution NOT_RUN |
| REQ-S00A-006 | project-atlas-dataset.md | S00A1-05 | Synthetic proposal; no runtime fixtures/tests |
| REQ-S00A-007 | requirements-delta-analysis.md | S00A1-06 / S00A1-SEM | Prompt-based delta recorded; original comparison optional |
| REQ-S00A-008 | p0-p1-p2-priorities.md | S00A1-03 | No implementation acceptance yet |
| REQ-S00A-009 | open-business-decisions.md | S00A1-06 | Decisions/clarifications remain open |
| REQ-S00A-010 | scope-rebaseline.md + status/risk/decision records | S00A1-07 / S00A1-SEM | Stage COMPLETED; Step 01 READY_FOR_BUSINESS_ANALYSIS |

## P0 capability to candidate acceptance

For every row: source = SRC-00A Task 3 + SRC-00A1 §5; specification task = MC-00A; implementation task = NOT_PLANNED (Step 00A forbids code); test results = NOT_RUN; review = REV-00A PASS for baseline 20f12fe only; runtime release evidence = PENDING, no product release.

| Capability requirement | Atlas acceptance candidate | Workflow / UX context |
|---|---|---|
| REQ-MC-P0-01 | AT-STATE / AT-IO | All workflows; Requirement vs Action |
| REQ-MC-P0-02 | AT-BLOCK | GW-01 milestones |
| REQ-MC-P0-03 | AT-BLOCK / AT-UX | Next Action across workflows |
| REQ-MC-P0-04 | AT-FILING / AT-UX | Waiting On, GW-02/03 |
| REQ-MC-P0-05 | AT-STATE / AT-BLOCK | Dependency chain |
| REQ-MC-P0-06 | AT-EVIDENCE | Missing criteria/evidence |
| REQ-MC-P0-07 | AT-STATE / AT-EVIDENCE | Independent verification |
| REQ-MC-P0-08 | AT-HISTORY | Domain changes across workflows |
| REQ-MC-P0-09 | AT-BLOCK / AT-TIME / AT-UX | Control Room |
| REQ-MC-P0-10 | AT-UX | My Actions |
| REQ-MC-P0-11 | AT-TIME / AT-UX | Operational Grid |
| REQ-MC-P0-12 | AT-UX | Bulk editing |
| REQ-MC-P0-13 | AT-IO | Excel/CSV import |
| REQ-MC-P0-14 | AT-IO | Excel export |
| REQ-MC-P0-15 | AT-DOC / AT-EVIDENCE | Document/version awareness |
| REQ-MC-P0-16 | AT-FILING / AT-GW | GW-03 filing lifecycle |
| REQ-MC-P0-17 | AT-FILING | External party waiting |
| REQ-MC-P0-18 | AT-ROLE | Simple roles, ownership and permissions |
| REQ-MC-P0-19 | AT-BRIEF | Delta-based Status Brief |
| REQ-MC-P0-20 | AT-STATE / AT-TIME | All workflows; five independent dimensions |

P1/P2 baseline IDs: all 14 REQ-MC-P1 and 7 REQ-MC-P2 rows in the priority register trace to SRC-00A Task 3 and SRC-00A1 §5.6/5.7 and MC-00A/S00A1-03 for faithful classification. Implementation tasks, product tests, implementation reviews and release evidence are DEFERRED because these capabilities are outside the approved P0 MVP. REV-00A still covers their documentation. No inferred DONE status.

Seven JTBD trace: [canonical §3](../product/canonical-product-context.md) maps JTBD-01..07 to stable REQ-MC IDs and Atlas candidates. Source SRC-00A1 §5.2 → MC-00A → S00A1-02 / S00A1-SEM → REV-00A PASS for baseline 20f12fe; no implementation task or runtime release claimed.

## Step 01 requirements chain — MC-001

Source: [SRC-01](step-01-request.md) + approved baseline `20f12fe`. Current contracts: [PRD](../requirements/prd.md), [SRS](../requirements/srs.md), [stories](../requirements/user-stories.md), [criteria](../requirements/acceptance-criteria.md), [rules](../requirements/business-rules.md). Baseline Step 00A tables above are historical context mappings; they do not claim current rule approval.

ID ownership: BR-001..007 defined only in PRD, FR-001..020 and NFR-001..014 in SRS, RULE-001..021 in rule register, US-001..020 in stories, AC-101..160 in criteria, AC-161..163 in workflow acceptance. Existing REQ-MC/JTBD/OBD IDs unchanged. Atlas AC-01..12 identify Actions, task-local AC-1..7 identify historical task criteria; neither is renumbered or reused as Step 01 acceptance ID.

For every row: specification task MC-001; Architecture = [Claude handoff](../architecture/solution-architecture-handoff.md), **PENDING_STEP_02**; Design = **PENDING_STEP_03** (OpenDesign); Implementation Task = **NOT_CREATED** (planning later); Test Evidence = **NOT_RUN**; independent testability review REV-01 = **PASS (round 2; document testability only)**. These explicit downstream placeholders are not approvals or fabricated tasks. All contracts referencing proposed RULEs are conditional on their OBD gates.

| JTBD / Business | Parent capability | Functional requirement | Story | Criteria | Rules / decision dependencies |
|---|---|---|---|---|---|
| JTBD-05 / BR-005 | REQ-MC-P0-01 | FR-001 | US-001 | AC-101, AC-121, AC-159 | RULE-001, RULE-002, RULE-020; see RULE status → OBD |
| JTBD-02 / BR-002 | REQ-MC-P0-02 | FR-002 | US-002 | AC-102, AC-141 | RULE-008, RULE-003, RULE-010; see RULE status → OBD |
| JTBD-03 / BR-003 | REQ-MC-P0-03 | FR-003 | US-003 | AC-103, AC-144 | RULE-021, RULE-003; see RULE status → OBD |
| JTBD-03 / BR-003 | REQ-MC-P0-04 | FR-004 | US-004 | AC-104, AC-130 | RULE-002, RULE-012, RULE-021; see RULE status → OBD |
| JTBD-04 / BR-004 | REQ-MC-P0-05 | FR-005 | US-005 | AC-105, AC-122, AC-123, AC-124, AC-125, AC-146 | RULE-003, RULE-004, RULE-018; see RULE status → OBD |
| JTBD-05 / BR-005 | REQ-MC-P0-06 | FR-006 | US-006 | AC-106, AC-127 | RULE-005, RULE-007; see RULE status → OBD |
| JTBD-05 / BR-005 | REQ-MC-P0-07 | FR-007 | US-007 | AC-107, AC-121, AC-126, AC-127, AC-140 | RULE-005, RULE-006, RULE-007; see RULE status → OBD |
| JTBD-06 / BR-006 | REQ-MC-P0-08 | FR-008 | US-008 | AC-108, AC-136, AC-149, AC-153 | RULE-019, RULE-018; see RULE status → OBD |
| JTBD-01 / BR-001 | REQ-MC-P0-09 | FR-009 | US-009 | AC-109, AC-137 | RULE-002, RULE-008, RULE-010, RULE-016; see RULE status → OBD |
| JTBD-03 / BR-003 | REQ-MC-P0-10 | FR-010 | US-010 | AC-110, AC-144, AC-147 | RULE-017, RULE-021; see RULE status → OBD |
| JTBD-03 / BR-003 | REQ-MC-P0-11 | FR-011 | US-011 | AC-111, AC-139, AC-150 | RULE-002, RULE-013, RULE-018; see RULE status → OBD |
| JTBD-03 / BR-003 | REQ-MC-P0-12 | FR-012 | US-012 | AC-112, AC-133, AC-139 | RULE-013, RULE-018; see RULE status → OBD |
| JTBD-03 / BR-003 | REQ-MC-P0-13 | FR-013 | US-013 | AC-113, AC-131, AC-132, AC-148 | RULE-014, RULE-015, RULE-018; see RULE status → OBD |
| JTBD-07 / BR-007 | REQ-MC-P0-14 | FR-014 | US-014 | AC-114, AC-148, AC-147 | RULE-015, RULE-017; see RULE status → OBD |
| JTBD-06 / BR-006 | REQ-MC-P0-15 | FR-015 | US-015 | AC-115, AC-128 | RULE-011, RULE-007; see RULE status → OBD |
| JTBD-05 / BR-005 | REQ-MC-P0-16 | FR-016 | US-016 | AC-116, AC-129, AC-145 | RULE-012, RULE-005, RULE-011; see RULE status → OBD |
| JTBD-03 / BR-003 | REQ-MC-P0-17 | FR-017 | US-017 | AC-117, AC-130 | RULE-001, RULE-017, RULE-020; see RULE status → OBD |
| JTBD-01 / BR-001 | REQ-MC-P0-18 | FR-018 | US-018 | AC-118, AC-134, AC-135, AC-140, AC-147, AC-149 | RULE-017, RULE-006, RULE-018; see RULE status → OBD |
| JTBD-07 / BR-007 | REQ-MC-P0-19 | FR-019 | US-019 | AC-119, AC-138 | RULE-016, RULE-019, RULE-017; see RULE status → OBD |
| JTBD-01 / BR-001 | REQ-MC-P0-20 | FR-020 | US-020 | AC-120, AC-121, AC-139, AC-142, AC-143, AC-160 | RULE-002, RULE-003, RULE-004, RULE-009, RULE-010; see RULE status → OBD |

### Complete scenario-to-contract coverage

| Criterion | Functional contract(s) | Acceptance definition / evidence |
|---|---|---|
| AC-101 | FR-001 | acceptance-criteria.md: Typed Requirement/Action; NOT_RUN |
| AC-102 | FR-002 | acceptance-criteria.md: Milestone readiness; NOT_RUN |
| AC-103 | FR-003 | acceptance-criteria.md: Next Action; NOT_RUN |
| AC-104 | FR-004 | acceptance-criteria.md: Waiting On; NOT_RUN |
| AC-105 | FR-005 | acceptance-criteria.md: AND gate; NOT_RUN |
| AC-106 | FR-006 | acceptance-criteria.md: Criterion distinct from proof; NOT_RUN |
| AC-107 | FR-007 | acceptance-criteria.md: Independent verification; NOT_RUN |
| AC-108 | FR-008 | acceptance-criteria.md: History provenance; NOT_RUN |
| AC-109 | FR-009 | acceptance-criteria.md: Control Room consistency; NOT_RUN |
| AC-110 | FR-010 | acceptance-criteria.md: My Actions; NOT_RUN |
| AC-111 | FR-011 | acceptance-criteria.md: Inline grid; NOT_RUN |
| AC-112 | FR-012 | acceptance-criteria.md: Bulk preview; NOT_RUN |
| AC-113 | FR-013 | acceptance-criteria.md: Typed import; NOT_RUN |
| AC-114 | FR-014 | acceptance-criteria.md: Useful export; NOT_RUN |
| AC-115 | FR-015 | acceptance-criteria.md: Version authority; NOT_RUN |
| AC-116 | FR-016 | acceptance-criteria.md: Filing tracking; NOT_RUN |
| AC-117 | FR-017 | acceptance-criteria.md: External context; NOT_RUN |
| AC-118 | FR-018 | acceptance-criteria.md: Scoped membership; NOT_RUN |
| AC-119 | FR-019 | acceptance-criteria.md: Delta brief; NOT_RUN |
| AC-120 | FR-020 | acceptance-criteria.md: Independent axes; NOT_RUN |
| AC-121 | FR-001, FR-007, FR-020 | acceptance-criteria.md: Completed but Unverified; NOT_RUN |
| AC-122 | FR-005, FR-020 | acceptance-criteria.md: Blocked Requirement; NOT_RUN |
| AC-123 | FR-005, FR-007 | acceptance-criteria.md: Upstream verification unlocks; NOT_RUN |
| AC-124 | FR-005, FR-007, FR-020 | acceptance-criteria.md: Reopen re-blocks transitive work; NOT_RUN |
| AC-125 | FR-005 | acceptance-criteria.md: Cycle rejected; NOT_RUN |
| AC-126 | FR-007 | acceptance-criteria.md: Rejected or expired evidence; NOT_RUN |
| AC-127 | FR-006, FR-007 | acceptance-criteria.md: Missing mandatory evidence; NOT_RUN |
| AC-128 | FR-007, FR-015 | acceptance-criteria.md: Superseded document; NOT_RUN |
| AC-129 | FR-016 | acceptance-criteria.md: Supplement cycle; NOT_RUN |
| AC-130 | FR-004, FR-017 | acceptance-criteria.md: External Waiting On; NOT_RUN |
| AC-131 | FR-013 | acceptance-criteria.md: Invalid import rows; NOT_RUN |
| AC-132 | FR-013 | acceptance-criteria.md: Safe import retry; NOT_RUN |
| AC-133 | FR-012 | acceptance-criteria.md: Bulk partial failure; NOT_RUN |
| AC-134 | FR-018 | acceptance-criteria.md: Viewer write denied; NOT_RUN |
| AC-135 | FR-018 | acceptance-criteria.md: Cross-workspace attempt; NOT_RUN |
| AC-136 | FR-008 | acceptance-criteria.md: Correct audit; NOT_RUN |
| AC-137 | FR-009 | acceptance-criteria.md: Manager comprehension target; NOT_RUN |
| AC-138 | FR-019 | acceptance-criteria.md: Report boundaries; NOT_RUN |
| AC-139 | FR-011, FR-012, FR-020 | acceptance-criteria.md: Concurrent state change; NOT_RUN |
| AC-140 | FR-007, FR-018 | acceptance-criteria.md: Verifier permissions; NOT_RUN |
| AC-141 | FR-002 | acceptance-criteria.md: Readiness edge cases; NOT_RUN |
| AC-142 | FR-020 | acceptance-criteria.md: Timing boundaries; NOT_RUN |
| AC-143 | FR-020 | acceptance-criteria.md: Attention precedence; NOT_RUN |
| AC-144 | FR-003, FR-010 | acceptance-criteria.md: No actionable work; NOT_RUN |
| AC-145 | FR-016 | acceptance-criteria.md: Filing negative path; NOT_RUN |
| AC-146 | FR-005, FR-020 | acceptance-criteria.md: Cancellation and waiver; NOT_RUN |
| AC-147 | FR-010, FR-014, FR-018 | acceptance-criteria.md: Revoked access; NOT_RUN |
| AC-148 | FR-013, FR-014 | acceptance-criteria.md: Spreadsheet safety; NOT_RUN |
| AC-149 | FR-008, FR-018 | acceptance-criteria.md: History integrity; NOT_RUN |
| AC-150 | FR-011 | acceptance-criteria.md: Keyboard and error recovery; NOT_RUN |
| AC-151 | FR-009, FR-011 | acceptance-criteria.md: Accessible comprehension; NOT_RUN |
| AC-152 | FR-014, FR-020 | acceptance-criteria.md: Localization and time; NOT_RUN |
| AC-153 | FR-008, FR-012 | acceptance-criteria.md: Failure consistency; NOT_RUN |
| AC-154 | FR-009, FR-011 | acceptance-criteria.md: Performance baseline; NOT_RUN |
| AC-155 | FR-008, FR-015, FR-018 | acceptance-criteria.md: Backup recovery; NOT_RUN |
| AC-156 | FR-009, FR-011 | acceptance-criteria.md: Unavailable vs empty; NOT_RUN |
| AC-157 | FR-007, FR-020 | acceptance-criteria.md: Dispute resolution; NOT_RUN |
| AC-158 | FR-018 | acceptance-criteria.md: Membership safeguards; NOT_RUN |
| AC-159 | FR-001 | acceptance-criteria.md: Basic domain context; NOT_RUN |
| AC-160 | FR-020, FR-007, FR-016, FR-018 | acceptance-criteria.md: Invalid transitions; NOT_RUN |
| AC-161 | FR-001, FR-002, FR-005, FR-007, FR-008, FR-009, FR-011, FR-014, FR-015, FR-016, FR-018, FR-019, FR-020 | golden-workflow-acceptance.md: GW-01; NOT_RUN |
| AC-162 | FR-001, FR-004, FR-006, FR-007, FR-008, FR-009, FR-011, FR-014, FR-015, FR-017, FR-018, FR-019, FR-020 | golden-workflow-acceptance.md: GW-02; NOT_RUN |
| AC-163 | FR-004, FR-006, FR-007, FR-008, FR-009, FR-011, FR-014, FR-015, FR-016, FR-017, FR-018, FR-019, FR-020 | golden-workflow-acceptance.md: GW-03; NOT_RUN |

### NFR evidence and downstream ownership

| NFR | AC / validation protocol | Architecture / test evidence |
|---|---|---|
| NFR-001 | AC-134, AC-135, AC-140, AC-147, AC-158 | Claude Step 02 decisions pending; OpenCode product validation NOT_RUN |
| NFR-002 | AC-118, AC-135, AC-147 | Claude Step 02 decisions pending; OpenCode product validation NOT_RUN |
| NFR-003 | AC-132, AC-133, AC-153, AC-156 | Claude Step 02 decisions pending; OpenCode product validation NOT_RUN |
| NFR-004 | AC-108, AC-136, AC-149 | Claude Step 02 decisions pending; OpenCode product validation NOT_RUN |
| NFR-005 | AC-125, AC-128, AC-131, AC-132, AC-139 | Claude Step 02 decisions pending; OpenCode product validation NOT_RUN |
| NFR-006 | AC-111, AC-137, AC-154 | Claude Step 02 decisions pending; OpenCode product validation NOT_RUN |
| NFR-007 | AC-150, AC-151 | Claude Step 02 decisions pending; OpenCode product validation NOT_RUN |
| NFR-008 | AC-156 | Claude Step 02 decisions pending; OpenCode product validation NOT_RUN |
| NFR-009 | AC-131, AC-133, AC-139, AC-150, AC-153 | Claude Step 02 decisions pending; OpenCode product validation NOT_RUN |
| NFR-010 | AC-152 | Claude Step 02 decisions pending; OpenCode product validation NOT_RUN |
| NFR-011 | AC-142, AC-152 | Claude Step 02 decisions pending; OpenCode product validation NOT_RUN |
| NFR-012 | AC-121, AC-139, AC-160 | Claude Step 02 decisions pending; OpenCode product validation NOT_RUN |
| NFR-013 | AC-160 | Claude Step 02 decisions pending; OpenCode product validation NOT_RUN |
| NFR-014 | AC-155 | Claude Step 02 decisions pending; OpenCode product validation NOT_RUN |

JTBD cross-links: [JTBD register](../product/jtbd.md) includes additional FR relationships beyond each FR primary BR above. P1/P2 remain deferred with original IDs; no new implementation task is implied. RULE-to-OBD authority is defined in business-rules.md and open-business-decisions.md.

Workflow AC-161..163 are cross-JTBD acceptance for BR-001..007 / JTBD-01..07. For each workflow, capture a checkpoint at each named stage: accepted mutation/state/proof → history → Grid/Control Room → scoped delta/export; attribute failures to the corresponding FR, rather than report only one overall screen PASS.
