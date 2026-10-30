# MC-P0-LOCAL-ADMIN-MEDUSA-R1

Owner: actual Local Codex; priority P0 presentation follow-up. PO described the UI/UX as poor and explicitly supplied https://medusajs.com/admin as the reference. Status: IMPLEMENTED_SELF_TESTED / VISUAL_VERIFICATION_PENDING. Local runtime is serving the new presentation; no product/release/independent-design acceptance awarded.

## Intent and scope

The first question is: which workspace can I work in, or how do I create the first one? Real workspace and Matter names/roles/counts continue to come from the REST repositories. No sample rows, fake metrics, invented routes, simulated authentication or placeholder search was introduced.

Product inventory used for the visual pass:
1. Workspaces: authenticated list of actual memberships and caller roles.
2. Matters: accessible records, titles and caller roles from the API.
3. Users: the signed-in principal remains truthful, including a subject when no display name exists.
4. Work: the next operation is opening a workspace/Matter or creating a workspace.
5. Scope: workspace membership and Matter access remain distinct.
6. State axes: execution, proof, dependencies, timing and attention retain independent semantics.
7. Density: a new account may have zero rows; the layout must still carry a useful next action.
8. Devices: desktop labelled navigation, mobile native dialog navigation and visible preferences.
9. Content: long legal names may wrap, never clipped by a new overflow rule.
10. Feedback: existing IntentForm validation, CAS, receipts, UNKNOWN and access-loss recovery remain unchanged.

Used design-taste-frontend app-screen workflow; selected `framed-sheet`, seed1159487496, under the user's Medusa reference. Direction lives in `.taste-skill/mattercontrol-admin/direction.json`. The face is a restrained legal-blue Scale mark and independent semantic state colors on neutral chrome. Existing system font stack retained explicitly; no remote font, Medusa component library or new dependency added. Source product features stay in features; shared UI remains domain-free.

## Implemented presentation

- Labelled228px sidebar and header share a quiet neutral frame; main content is a white sheet inset8px, radius16, with24/32px content gutters rather than a dark header against a bare page.
- Sentence-case compact navigation with neutral active state; language/time-zone/theme preferences live in the desktop sidebar footer. Mobile retains navigation and puts preferences in native details. No false search/notification/switcher controls.
- System sans typography,24px headings,14px body, neutral primary actions, legible input borders and40px form inputs. Semantic blue/green/red/amber roles remain separate from action color; dark dependency-ready blue is explicit rather than inherited from the neutral primary.
- Workspace list and compact create panel use a two-column layout at xl; narrow viewports stack. Empty copy explains the real next step. Existing forms stay mounted inline, avoiding a new modal-unmount/idempotency risk.
- Workspace/Matter rows have a larger single link target, actual role and an arrow; no duplicate tab stops or permission inference. Account identifier is visibly truncated with full title, not replaced by a fabricated person.
- Login has a coherent brand/title/form hierarchy; existing OIDC route and safe return-path handling are unchanged.

Sixteen presentation files changed relative to the prior721-file CSS-fix candidate; see source-delta.json. No backend, contract, business action, schema, permission, IdP policy or R9 historical artifact changed. The new721-entry source manifest is `f43738bf6c1779811259a15160ab4445c1627997a1fdb2c33ec887f921401028`; older manifests remain immutable and independent review must refresh pins for this delta.

## Validation and runtime

- Final `pnpm check`: exit0,48 files/482 tests after the last CSS radius/comment adjustment. Typecheck, lint, formatting and agent-config checks pass. No new functional logic was added by the visual changes.
- Final `pnpm build:webpack`: exit0, including compiled stylesheet assertions. Build contains24 prerendered pages and dynamic product routes; build success does not establish authenticated browser behavior.
- `pnpm build-storybook`: exit0; existing nonfatal mdx/use-client bundler warnings retained.
- Design skill source lint on five selected shell/entry files:0 FAIL/0 WARN. This is source lint, not the browser inspector or a visual score.
- `git diff --check`: exit0.
- Snapshot built from current selected public files plus production artifacts at `/private/tmp/mc-local-login-cij0dm22/frontend-medusa-r1`; no `.env.local`, credential or auth-session files copied. Cached dependencies linked; primary build cache excluded from the snapshot.
- Ownership-checked previous frontend listener65281 (parent65279,start22:40:44,cwd prior snapshot) received SIGTERM. New frontend parent72013 started2026-10-28T15:54:20.820003Z, loopback3000, serving the isolated new snapshot. Old process/resources retained in runtime history; backend listener49105 and the same database/object roots unchanged.
- Local login HTTP200; actual response contains the new login copy and stylesheet `/_next/static/css/1151d4ec691f5f8c.css`. API `/healthz` still returns `{"status":"ok"}`. Runtime.json contains public ownership/start/source identity. HTTP status/content checks are not rendered geometry evidence.

## Limits and next action

Medusa reference page text was fetched through the web tool; its hero image fetch was unavailable. No claim of pixel matching. Skill browser inspection, screenshots at1440/768/390, keyboard/focus/touch/screen-reader and final human visual critique remain NOT_RUN because browser use is disabled in Work settings. No alternate renderer/headless/OS capture was used to bypass that setting. Actual human hard-refresh and visual feedback are needed before claiming the new screen is good.

The earlier user screenshot established a signed-in shell on the preceding build; this restart clears process-memory sessions and may require sign-in again. User was given the existing local URL. Independent review of the sixteen-path presentation delta remains pending; CR-002 and the broader Cloud/recovery/release gates remain open. No commit/push/deploy or external-agent dispatch performed.
