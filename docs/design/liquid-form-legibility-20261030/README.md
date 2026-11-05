# Readable Liquid Glass form — appearance proposal

Actual Local Codex,2026-10-30. Skill: frontend-design. Status PROPOSED_NOT_APPLIED / VISUAL_VERIFICATION_PENDING. Current business-flow writer: actual Claude Code; no application file or runtime changed by this proposal. This is a bounded material correction, not a new design direction.

## What the screenshot and source show

The screenshot shows a gray translucent form pane, light helper text, an opaque white text field, and a blue focus outline around the whole dialog. Current Dialog uses frost0.35, refraction24px and bezel28px; Input/Select/Textarea use an opaque card fill with only an inset rim. These are two conflicting material densities in one form.

The existing Vietnamese font is self-hosted Be Vietnam Pro,400/500/600/700. The problem is primarily surface density/contrast and hierarchy, not missing font support. Do not replace the font or give legal text transparent, refracted, glowing or gradient-filled glyphs.

## Chosen direction

Quiet thick glass for the reading/form plane; optical depth at its perimeter; a subtle inset field on the same color system. Title, body, user-entered value, hint and error remain opaque and readable. Keep the current compact typography and native controls. No animated shader per input, no new dependency and no form/workflow rewrite.

## Concrete candidate

`proposed-appearance.patch` changes only two existing paths:

- globals.css: light/dark dialog-description and field-fill tokens; modal-scoped inset Input/Textarea/Select material,10px radius, readable placeholder, hover/disabled/fallback states. Existing invalid/focus semantics stay authoritative.
- components/molecules/dialog.tsx: regular form frost0.84, rim refraction12px, bezel18px, blur18px, matched16px pane/filter radius. Remove pointer-light tracking in this modal; retain the static edge light and suppress the broad specular pseudo-element that could wash across descriptions. Other GlassSurface consumers are unchanged.

No heading/copy/submit identity changes. A white field is a valid fallback, but the enhanced form receives its own quiet inset material. Do not darken the page scrim to manufacture a stronger glass effect.

## Focus observation needing actual verification

The outer blue frame in the screenshot is an observation, not a proven root cause. The dialog already calls focus on data-autofocus after showModal. GlassSurface changes wrapper structure between frost and liquid tiers; if that transition happens after focus, investigate whether it replaces the focused input and drops focus to the dialog. Current unit tests use the opaque tier, so they do not prove liquid-tier focus continuity.

Do not blindly delete the global/dialog outline or remove keyboard focus visibility. Reproduce initial focus, typing during tier resolution, Escape and trigger-focus return with a permitted browser; add a targeted regression if a component-lifecycle problem is confirmed. Preserve keepMounted, draft/UNKNOWN identity and native focus trapping.

## Checks and limitations

- Read-only git apply --check passed on the pinned two-file candidate; patch NOT applied. Source pins unchanged after proposal preparation.
- Existing installed PostCSS parsed the candidate; TypeScript transpile reported no syntax errors. No dependency installation. This is not full semantic typecheck or an application build.
-28/28 selected numerical contrast pairs pass: description/body/input/placeholder>=4.5 and field/focus>=3, light/dark, with both black and white backdrops. Light description worst4.909; dark description worst4.657 in this model. The probe assumes encoded-sRGB compositing, bounds the background, and excludes the broad specular wash removed by the candidate. It does not certify computed browser interpolation, SVG filter output, accessibility, keyboard, zoom or device performance.
- Full pnpm check, application/Storybook builds and browser verification belong to the integrating writer after source settles. Browser tooling was disabled in Work settings at the previous attempt; no alternate capture/headless bypass attempted here.
- An initial direct PostCSS lookup and root-level formatter attempts failed; existing transitive PostCSS and frontend-local Prettier/config resolved without installing anything. checks.json records these limitations/corrections.

## Integration

Consume the matching addendum at `docs/implementation/handoffs/MC-CLAUDE-LIQUID-FORM-LEGIBILITY-20261030-ADDENDUM.md` in the already-running business-flow assignment. Verify current input bytes before applying; if either file has advanced, merge the narrow appearance delta manually without replacing the latest file wholesale.

Skipped: application source/runtime edits, full build/unit/browser execution and independent acceptance. Risk: proposed material is numerically checked but visually unverified; the screenshot's focus anomaly is still a hypothesis requiring reproduction.
