# MatterControl focused-workbench prototype

Selected concept: displayed option3, approved by the user on 2026-10-29. Exact source image: ../../docs/design/legal-team-experience-20261029/concepts/concept-3.png.

This isolated frontend design prototype uses synthetic in-memory data only. It does not connect to MatterControl API, auth, legal files, PostgreSQL or cloud services. Refresh restores sample state. English matches the selected visual; production EN/VI localization remains part of integration.

Run npm run dev -- --host 127.0.0.1 --port 4176 --strictPort. Build with npm run build. Model and scaffold checks: node --test tests/model.test.mjs tests/sites-worker.test.mjs.

Working interactions: queue switch; bounded previous/next and up-next; details/history disclosure; task dialog, preview start/complete; matter list/context; button-opened matter form with temporary draft kept across close/reopen. Preview completion explicitly leaves proof unverified. All forms and write-like actions identify themselves as simulation.

Assets: official Lucide React1.59.0 icons match the selected reference and existing product library. Inter variable font from the public LegalWork page's observed font asset; official Inter OFL accompanies it in public/assets/INTER-LICENSE.txt. No raster image assets are required by this text-and-icon design. No AI art, brand graphics or screenshot-as-interface used.

No product source or backend changed, no commit/push/deployment. npm installation affects this isolated folder only. See design-qa.md for rendered comparison and limitations.
