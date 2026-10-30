# Addendum (post-audit user input, 2026-10-29 ~23:58+0700) — "Open task" differs between the Ready and History workbench states

Source of input: the owner's screenshots of the My Work workbench — Ready queue ("Ready 1 of 2") shows the dark primary "Open task"; History queue ("History 1 of 1", reason "completed or cancelled") shows an outline "Open task". Owner's words: the buttons are "not synchronized".

## Diagnosis (source-confirmed)

`apps/frontend/src/features/work/components/my-actions-view.tsx:268-270`:

```tsx
buttonVariants({ variant: a.class === 'ELIGIBLE' ? 'primary' : 'outline' }),
'work-primary',
```

The CTA variant follows the assignment class: **ELIGIBLE → primary** (Ready, the recommended next action); **WAITING / BLOCKED / HISTORICAL → outline**. Both states share the identical `.work-primary` geometry (min 160×44, padding 10/16, font 14, radius 6) — the two screenshots differ only in surface color, not size or layout. This rule was not explicitly listed in the audit's do-not-normalize list (that list covered the CTA's size authority), so the owner's perception is legitimate audit input.

## Classification

**INTENTIONAL_VARIANT_CANDIDATE — pending owner decision.** The distinction encodes an approved semantic: "One task at a time... Only ready Actions are recommended" — the dark CTA marks the one recommended action; a History item is a listed record ("Why this is listed: completed or cancelled"), and the quieter outline keeps the recommendation signal meaningful. The approved reference (concept-3/prototype) evidences the dark CTA only on the Ready current task; no populated-History reference state exists in prototype evidence, so the outline-on-History choice is an implementation decision consistent with, but not dictated by, the reference.

## Options (for the owner; no fix applied — file owned by the UI-fidelity writer)

- **A (keep, recommended):** leave the rule; the emphasis difference is the recommendation signal. Optionally add nothing further.
- **B (unify):** both states use `primary` — one-line change at the cited lines. Cost: "History" gains the same visual weight as the recommended next action, weakening the Ready recommendation cue that the page copy states.
- **C (relabel):** keep variants; relabel the History CTA (e.g. "View task"/"Xem tác vụ") so the different weight reads as a different kind of action rather than an inconsistent button. Copy decision + LocalizedText change only.

Affected if changed: `my-actions-view.tsx` (1 line for B; label strings for C); `my-actions-view.test.tsx` asserts the link by name/role (lines 150-159, 241) — no variant-class assertion found in the grep, so B is test-safe at first check (re-run the suite on change). Owner of the file: the UI-fidelity/density writer (MC-P0-CODEX-UI-FIDELITY-20261029); any change goes through that writer handoff, not this audit session.

## Related notes
- The audit's `button-metrics.csv` M-18/M-19 measured the Ready-state pair (primary 160×44 vs ghost 36) — the History-state pair shares M-18's geometry with the outline surface.
- Phase A system audit (r2) is unaffected; this is presentation-only feedback routed to the visual plan owner for the UI-F01..12 disposition table's follow-up.
