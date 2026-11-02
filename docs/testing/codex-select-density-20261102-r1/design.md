# Select and density correction

Owner actual Local Codex. Match the existing Pane/legal-work identity rather than introducing another visual system.

Palette references: reading face #FFFFFF, cool canvas #F1F4F8, ink #202124, secondary #677083, edge #D4D9E2, focus #315FA8. Implementation uses existing foreground/popover/accent/ring tokens, not literal new colors; dark counterparts remain inherited. Be Vietnam Pro stays unchanged,13–14px control/body, clear regular/medium weights.

Layout, left aligned:
```
Field label
[ Current choice                 v ]
[ Option A                         ]
[ Chosen option                  ✓ ]
[ Option C                         ]
```
A quiet top-layer list replaces platform-native picker appearance. Keep the native select as the single real form field, with current values, required/disabled/reset, ref and change/input events. The popup is presentation plus explicit option selection; it creates no second submitted field or business command. Keyboard arrows/Home/End/typeahead/Enter/Escape, outside dismissal and parent-dialog behavior remain supported. Unsupported Popover API keeps native selection functional.

Density is a reading preference: comfortable12px/20px cell padding; compact6px/12px. Keep every state/content column and action, preserving44px touch controls. Scope the Pane override by data-density; do not shrink the whole app or discard metadata.

Critique: native OS menu styling and a single invariant table padding defeated the intended material and density. Fix those shared roots; no extra gradient, typography reset, new package or form/API rewrite.
