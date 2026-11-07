# D-23 — Field-on-glass contrast: face-tint route is infeasible inside the Solid Glass intent (W1, UX-B-11 / P-10 / V-03)

- Raised by: actual ZCode executing MC-FE-FIXWAVE-20261107 W1; **the dispatch's LANE-A guard fired** ("if reaching 3:1 would break the Solid Glass intent → STOP, write the D-nn"). No code change was made to the field tokens.
- Base: `5a00dbc1` (pin, unmodified `globals.css:76-77,150-151`).
- Criterion under discussion: V-03 / P-10 — "Input field face vs composite glass background ≥ 3:1".

## Measured math (exact, both themes)

Method: token compositing identical to the design review's contrast sweep (`contrast-probe4` method; WCAG 2.x luminances, alpha composited over the underlying surface). Panel composite = `--panel` over `--background`; field composite = `--field-face` over the panel composite. Script: `evidence/fieldface-math-output.txt` (source `fieldface-math.mjs`).

| Quantity | Light | Dark |
|---|---|---|
| Panel-composite luminance | 0.9318 | 0.0093 |
| Current face-on-panel luminance | 0.9009 | 0.0159 |
| **Current face vs glass composite** | **1.033** | **1.111** |
| 3:1 requires field-composite lum | ≤ 0.277 (darker) | ≥ 0.128 (lighter; darker path negative → impossible) |
| Implied FACE luminance at α=0.9 | **L\* ≈ 59 (mid-grey)** | **L\* ≈ 52 (light-grey inverted field)** |
| Current rim vs glass composite | 1.062 | 1.246 |
| Current edge vs glass composite | 1.218 | 1.635 |

Also reproduced from the review sweep: face vs page background = 1.037 (light) / 1.188 (dark) — consistent.

## Why the literal fix breaks the intent (the guard condition)

- **Light**: a 3:1-distinct field face must be a **mid-grey (≈59L\*) inset on near-white glass**. The face is the text plane: near-white foreground on a 59L\* face lands at ≈4.2:1 — the "fix" for a non-text 3:1 criterion would push the field's own body text toward the WCAG AA floor. Solid Glass keeps faces near-opaque-light precisely "so dense legal text keeps its contrast" (`globals.css:50-55` token comment).
- **Dark**: the darker path is mathematically impossible (target luminance below black); the lighter path needs an **inverted light-grey field on near-black glass** — outside the adjudicated dark material ("darker translucent panes, faint lit rim, no saturation boost").
- Note: every field-boundary indicator (rim 1.06/1.25, edge 1.22/1.64) is ALSO below 3:1 vs the glass composite today — the field is currently identified by rim + hairline + inset shadow jointly, none of which alone meets 3:1 against the glass composite.

## Options for the PO

- **A — meet the criterion literally** (deepen the tint to the computed values): rejected by the W1 guard — breaks the near-opaque-light/dark-material intent in both themes and degrades field text contrast (light).
- **B — ratify the rim-only affordance** (dispatch's option): accept in the token comment that field identification on glass is carried by rim + hairline + inset shadow, with the recorded limitation that no single indicator reaches 3:1 vs the glass composite. Cheapest; leaves the a11y openness on record.
- **C — amend the criterion to the WCAG 1.4.11 boundary framing and strengthen the field edge to ≥3:1** (recommended): WCAG 1.4.11 requires the component's *boundary indicator* (not its face) to hit 3:1 vs adjacent colors. Moving the criterion from "face vs composite" to "edge vs composite" and darkening `--glass-field-rim`/`--glass-edge` **in field contexts only** (e.g. a darker cool edge on light, a brighter rim on dark) is achievable inside the approved material — the finish-at-the-edge rule is exactly where Solid Glass puts its finish. This is still a criterion amendment (V-03 was ratified with the face wording), hence a PO decision rather than an improvised change.

**Recommendation: C** (WCAG-correct, intent-preserving, small token delta in field contexts), with B as the fallback if the PO prefers zero visual change.

## Disposition — PO DECIDED (2026-11-07)

- **Option C adopted** (recorded by the coordinator ZCode session on the PO's explicit answer). A stays rejected by the guard math; B is recorded as the unchosen fallback.
- **Amended criterion wording (V-03 — replaces the face wording):** "On glass surfaces, a form field's **boundary indicator** (the rim/edge combination acting as the component boundary) achieves **≥3:1 against the adjacent glass composite** (WCAG 1.4.11 non-text contrast). The field **face** remains a near-opaque text plane per the Solid Glass intent and is exempt from the 3:1 non-text rule — it is not the boundary indicator."
- **Implementation scope (S — fold into the next FE dispatch):** darken `--glass-field-rim`/`--glass-edge` **in field contexts only** to reach edge-vs-composite ≥3:1 per theme (current edge 1.218 light / 1.635 dark); update the token comment + any active V-03 checklist instance to the amended wording at implementation time (this doc is the decision record; the original wording lives in lineage-pruned docs); re-measure with the same compositing method (`fieldface-math.mjs`); the D-1(b) on-dialog final measure stays the open limitation.
- OpenCode confirmation of the fix-wave (batch 2) must treat the D-23 decision as **post-dating** the wave: W1's no-code-change outcome is confirmed as correct process, not as a criterion closure.

## Known limitation (unchanged)

The final on-dialog measurement (populated dialog on Liquid Glass backdrop) still awaits the walkthrough env (D-1(b) — E-2 stub-IdP browser login, E-4 fault-injection remain unowned gaps). All numbers here are token-level composites, not populated-dialog measurements.
