# MatterControl workbench

## Visual authority

The Product Owner selected the shared-shell, panel and list treatment inspired by the live Pane demo on 2026-11-01. The reference supplies composition and material cues, not source, assets, template data or business behavior. The approved MatterControl product model and existing application wiring remain authoritative.

Mode: **Operate**. Legal teams need to identify scope, understand the independent state axes, and take the next permitted action. Visual effects must never suggest that completion means verification.

## System

- Keep the self-hosted **Be Vietnam Pro** family and the existing fixed, compact type scale: 26px page title, 24px on narrow screens, 13–14px controls/body, 12px metadata. Do not replace Vietnamese lettering with a different display face.
- Neutral canvas in both themes. State colors are reserved for actual execution, verification, dependency, timing and attention semantics; navigation uses a neutral selected surface.
- One floating sidebar and one always-visible workspace toolbar. The toolbar contains the existing page search and theme controls; account/locale live in the sidebar, with the established mobile preferences path retained.
- Surface tokens live in `apps/frontend/src/app/pane-workbench.css`; existing semantic tokens remain in `globals.css`. No literal colors in component markup.
- Pane-inspired depth comes from a neutral translucent face, top rim and short offset shadow. This intentionally preserves the PO's glass direction despite generic design-skill bans on glass. Never refract/blur text or require animation to understand a control.
- Shared lists/tables use one outer panel and subtle row rules. Nested lists do not gain another panel rim. Keep existing identity columns, actions, names and truthful totals.
- Data tools are a single task list with four existing actions. Inactive editors stay mounted so drafts, frozen attempts and unknown outcomes survive switching. Recovery alerts remain outside the task selector.

## Geometry and behavior

- Desktop shell caps at 1680px. Sidebar slot 248px; main gutters 28px. At 1440px: 1440 − 248 − 2×28 = 1136px content. Data tool area uses that width as `1fr + 20px gap + 260px guidance`.
- Below 1100px, data guidance stacks. At/below 800px, the sidebar becomes a floating bottom navigation with the same four destinations and active-route rules; main gutters become 16px and the toolbar remains available. Preferences/account remain available at the same breakpoint. At 320px, the brand becomes the existing scale mark with an accessible text name.
- Bottom navigation includes icon and full label, honors the safe-area bottom inset, and reserves 136px plus safe-area space after content so the last row/save action can scroll above it. Its real links retain keyboard/new-tab behavior; the existing drawer component remains available for other compositions.
- No whole-page horizontal overflow. Wide operational tables and Matter tabs scroll within their own frame. Do not clip legal content to hide bad geometry.
- Preserve default/hover/focus/selected/disabled/loading/error states. The search trigger keeps an explicit accessible label even when its visible label is hidden.
- Reduced-transparency mode uses opaque faces; forced colors use system colors. Existing reduced-motion and stable GlassSurface subtree behavior remain intact.

## Truth and verification

No demo rings, task counts, people, notifications, artificial trends or focus timer are imported from Pane. All product data and permissions continue to come from existing repositories/actions/API.

Visual QA must record the actual URL, viewport, theme and language. Hidden cached route DOM is not current-page evidence. A screenshot filename is not proof of its dimensions. Static skill output, browser observations and product acceptance are separate results.

This document records the selected direction and implementation rules. It does not certify WCAG, independent QA, business acceptance, security or deployment readiness.
