<!-- source docs/requirements/business-rules.md, lines 1-8 -->
# Business Rules and Invariants

Owner: Codex — BA. Source: approved prompts plus explicit recommendations below. **APPROVED_INPUT rules retain original authority; formerly PROPOSED policy is now APPROVED_BY_PO** under OBD-02..08/10/11 at `572835a`, 2026-10-24; [approval record](../ai-sdlc/step-01-approval.md). Numeric workload/retention/RPO/RTO remain explicitly deferred; no implementation start is authorized. No jurisdiction-specific legal rule is asserted.

All mutations must satisfy RULE-017/018/019 and [permissions](permission-matrix.md). Detailed transitions are defined once in [state semantics](state-semantics.md); scenarios in [acceptance criteria](acceptance-criteria.md). Numbers/thresholds marked proposed are not benchmarks.

| ID | Status / gate | Business rule and observable invariant |
|---|---|---|

<!-- source docs/requirements/business-rules.md, lines 10-10 -->
| RULE-002 | APPROVED_INPUT | Five independent state vocabularies are preserved. COMPLETED is not VERIFIED; WAITING is not BLOCKED. Dependency is business-derived. UI cannot independently decide authoritative legal/operational state. |

<!-- source docs/requirements/business-rules.md, lines 11-11 -->
| RULE-003 | APPROVED_BY_PO / OBD-04 | Directed prerequisites link Requirements/Actions within one Matter. Each edge explicitly requires execution completion OR completed-and-verified proof; incoming edges combine AND in P0. Edge is satisfied only if upstream Dependency=READY, Execution=COMPLETED and, for proof gate, Verification=VERIFIED with valid evidence. No-edge target is dependency READY. Reject self-edge, duplicate edge and any cycle before saving. OR groups/cross-matter links need a future approved change, not an implicit interpretation. |

<!-- source docs/requirements/business-rules.md, lines 13-13 -->
| RULE-005 | APPROVED_BY_PO / OBD-02 | Mandatory evidence criteria explicitly state subject, acceptable proof, required version semantics and validity period if relevant. Submitted proof is UNVERIFIED until reviewed. All applicable mandatory criteria must have valid accepted proof to be VERIFIED; some → PARTIALLY_VERIFIED; none → UNVERIFIED. Zero criteria does not silently mean verified. OWNER may declare verification NOT_REQUIRED only from UNVERIFIED with explicit applicability rationale, no applicable mandatory criterion and no unresolved dispute. A reasoned criteria revision and aggregate recomputation precede this separate decision; resolve any dispute through the verifier first. Historical criteria remain visible, not silently removed. |

<!-- source docs/requirements/business-rules.md, lines 14-14 -->
| RULE-006 | APPROVED_BY_PO / OBD-02/08 | EDITOR/OWNER can submit proof. Only a matter-designated verifier who is EDITOR/OWNER may accept/reject/resolve dispute; submitter cannot verify their own evidence. OWNER status alone is not verifier authority. If no independent verifier exists, remain pending; no demo/admin override. Review decision records criterion, evidence version, actor, outcome and rationale. |

<!-- source docs/requirements/business-rules.md, lines 16-16 -->
| RULE-008 | APPROVED_BY_PO / OBD-04/10 | Milestone readiness is the conjunction of explicitly designated required Requirements being COMPLETED, VERIFIED (or explicitly NOT_REQUIRED) and dependency READY. A milestone with no declared prerequisites is unassessed, not ready. Display satisfied/total counts and unsatisfied reasons; percentages cannot establish readiness or permit closing. Required criteria/prerequisites changed by OWNER with reason. |

<!-- source docs/requirements/business-rules.md, lines 18-18 -->
| RULE-010 | APPROVED_BY_PO / OBD-06 | CRITICAL if object is an unsatisfied prerequisite on a designated critical milestone chain, or OWNER records explicit critical escalation and reason. Otherwise ATTENTION for overdue, missing/expired/disputed applicable proof, COMPLETED+UNVERIFIED, or WAITING; otherwise NORMAL. Critical designation/removal is audited. Do not infer legal severity from a document name or risk narrative. Derived severity changes are attributable to their inputs. |

<!-- source docs/requirements/business-rules.md, lines 19-19 -->
| RULE-011 | APPROVED_BY_PO / OBD-11 | Upload creates a distinct version and never auto-promotes it. OWNER explicitly promotes one authoritative current version per Document, with reason and expected prior revision; prior version becomes superseded, not deleted. Evidence and filing submission reference exact versions. Signature completeness is a separate observation/criterion, not inferred from current-version status or upload success. |

<!-- source docs/requirements/business-rules.md, lines 20-20 -->
| RULE-012 | APPROVED_BY_PO / OBD-05 | Filing stage is distinct from execution/verification. Package completeness requires declared applicable documents, signature criteria and evidence checks. Submission requires complete package and recorded submission reference/date; receipt requires acknowledgement proof; authority waiting requires pending external outcome. Supplement creates a new accountable cycle and preserves original submission. Approval requires authority outcome evidence; neither submission nor receipt implies approval. Software tracks assertions/evidence, not legal effectiveness. |

<!-- source docs/requirements/business-rules.md, lines 24-24 -->
| RULE-016 | APPROVED_BY_PO / OBD-07 | P0 Status Brief is a draft view/export: choose Matter scope, baseline t1 and as-of t2, t1≤t2. Changes in (t1,t2] are separate from outstanding at t2; stable ordering by event time then stable event order, with references. Same authorized source revisions/window yields same business facts; new data/rights changes must be identified. No-change is explicit. P0 does not offer managed issued-report approval or retained immutable snapshot retrieval; exported drafts carry provenance and can be shared under user responsibility. P1 owns managed issued reports/historical snapshots; no guarantee to reproduce an old issued artifact from mutable current data. |

<!-- source docs/requirements/business-rules.md, lines 25-25 -->
| RULE-017 | APPROVED_INPUT for isolation; APPROVED_BY_PO role policy / OBD-08 | Every read/write requires active Workspace membership plus Matter membership and operation permission, including indirect relations, search, counts, export/history and files. Workspace OWNER is not automatic confidential Matter reader; membership grants are audited. Record assignment does not grant access. Exact role mapping is approved in permission matrix; default deny unknown operations. |

<!-- source docs/requirements/business-rules.md, lines 26-26 -->
| RULE-018 | APPROVED_BY_PO / OBD-08/11 | A command must reference the current revision of affected state/scope. Stale or concurrently invalidated permissions/prerequisites produce conflict, no overwrite. Re-evaluate dependent invariants against the accepted revision. A successful mutation and its domain history are inseparable; failed change has no successful domain event. Retry of the same accepted operation returns its outcome without duplicate effect. Architecture chooses mechanism. |

<!-- source docs/requirements/business-rules.md, lines 27-27 -->
| RULE-019 | APPROVED_INPUT for traceable history; APPROVED_BY_PO history controls; retention/lifecycle parameters deferred / OBD-11 | Record actor, operation, target/scope, before/after, effective and recorded time, causal reference, reason for critical decisions and correlation to batch/import. Corrections append linked history; normal users cannot edit past events. Denied attempts are security audit, not fabricated domain successes; protect sensitive data in logs. Retention/deletion/legal holds require explicit policy approval, not a claim of infinite retention. |

<!-- source docs/requirements/business-rules.md, lines 28-28 -->
| RULE-020 | APPROVED_BY_PO / OBD-03 | P0 Decision has question/owner/outcome/rationale/time and related records; Finding has observed gap/owner/follow-up/resolution proof; Risk has description/owner/attention/response. Entity is a typed contextual reference. These can be linked in workflows and history without adding advanced legal ontology, ownership graph, scoring engine or decision automation. |

<!-- source docs/requirements/business-rules.md, lines 29-29 -->
| RULE-021 | APPROVED_BY_PO / OBD-04 | Next Action candidates are visible assigned Actions that are NOT_STARTED/IN_PROGRESS and dependency READY. WAITING actions belong to Waiting On; explicit follow-up Action may be actionable. Order critical-chain first, then due ascending (no due last), then stable ID. Show reason/owner; no candidate means explain missing assignment, waiting or blocker instead of inventing work. Human choice may differ without changing dependency truth. |
