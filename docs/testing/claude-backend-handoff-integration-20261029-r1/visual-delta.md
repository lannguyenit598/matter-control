# Visual delta for Codex — product My Work vs reference `http://localhost:4176/`

Status: **BROWSER_OBSERVED** (author), measured while Codex was editing the same files; I made **no** edit to shell, `globals.css` or My Work files. Capture: 1487×1058 CSS px, light theme, English, route `/my-actions`, UTC 2026-10-29 ~08:35, real authenticated product data (synthetic) vs synthetic prototype. Screenshots: `screenshots/`. The product at capture had 2 Ready items, 1 History item.

| Area | Reference | Product at capture | Suggested correction (not applied by me) |
|---|---|---|---|
| Page description | one line "One task at a time, with the context you need." | wrapped to two lines because of the added "Only ready Actions are recommended.", pushing everything ~27 px down | keep the one-line text; put the "only ready is next" semantics in the Ready queue/empty-state copy |
| Sidebar top | "Corporate Legal" workspace line, nav starts at y=148 | no workspace line (none exists on My Work), nav at y=123 | keep honest (no fake label); optionally keep the 25 px offset |
| Sidebar bottom | compact account row (name + role) | account row + "Preferences" + two selects + toggle (heavier, and the Next dev badge overlaps it in dev) | put preferences behind a collapsed disclosure; keep one account line |
| Top right | weekday, date and time | absent | optional: show the read instant (real) in the viewer's zone |
| Breadcrumb | folder · Matter › Tasks (14 px) | folder · Matter | optional "› Work" linking to the Matter's Work grid |
| "View matter" | 16 px, muted grey, no heavier weight | 14 px, darker | 16 px muted |
| "Expected outcome" label | 16 px muted | 14 px | 16 px |
| Disclosure rows | leading icons (list, history), 17 px | no leading icons in the screenshot | add icons |
| Disabled Previous | light grey (opacity .4) | darker (contrast token) | opacity-based disabled style |
| Queue rail, title 40 px, Up next width 256 px, dark primary button 200×56, separators | match | match within a few px | none |

Semantic differences kept on purpose: real reason sentence, real counts, no simulated Start/Complete.

NOT_RUN by me this pass: 1100 px, 800 px, 390 px and 320 px comparisons of the new shell, dark theme comparison, keyboard/focus audit of the new shell. SOURCE_VERIFIED only for the pre-Codex My Work (earlier return).
