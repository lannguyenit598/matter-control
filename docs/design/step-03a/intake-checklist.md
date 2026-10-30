# MC-003A — Design intake checks

Owner: Codex. These are planned intake checks, not independent QA or usability results. All results remain NOT_RUN until an actual artifact is available.

| Check | Observable evidence required |
|---|---|
| Provenance | Exact run/project, returned files, export hashes, input baseline and actual tool identity |
| PO first gate | IA, Control Room/Grid concepts, three visual directions, recommendation and trade-offs available together |
| Persona vs role | Manager/Contributor/Reviewer journeys do not grant OWNER/EDITOR/VIEWER permissions |
| State separation | Completed+Unverified, Waiting+Ready, Waiting+Blocked, timing and attention remain distinguishable |
| Proof integrity | Upload differs from accepted proof; exact criterion/version; independent designated verifier; no self-review |
| Dependency explanation | Source gate and downstream chain visible; only satisfied gates unblock; unavailable/stale is not Ready |
| Grid work | Dense desktop rows, context preserved on detail close, keyboard behavior, selection and bulk preview/error recovery |
| Responsive concept | Mobile task prioritization demonstrated; dense desktop grid retained; feature differences disclosed |
| Visual comparison | A/B/C contain comparable Atlas content and materially distinct layouts/density/navigation |
| Golden workflows | GW-01 proof/unblock, GW-02 mapping/preview/finding, GW-03 receipt/waiting/supplement/outcome are specified |
| Screen inventory | All 13 requested surfaces have goals, hierarchy, actions, states, navigation, recovery and responsive behavior |
| Architecture | Auth/API/loading/validation/concurrency/errors/persistence/realtime assumptions explicitly pending |
| Accessibility | Keyboard/focus, non-color state labels, contrast targets and reduced motion; test claims supported only by actual runs |
| Honest handoff | Interactive, static and specification-only coverage separated; no usability/production/architecture approval inferred |

Independent reviewer: OpenCode, pending actual artifact and separately recorded invocation. Human Product Owner: direction approval pending concrete design review. Antigravity: actual frontend reference verification and later implementation handoff pending.
