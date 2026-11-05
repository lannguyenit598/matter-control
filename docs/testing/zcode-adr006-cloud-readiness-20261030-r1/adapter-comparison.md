# §3 Workers adapter comparison — vinext vs OpenNext Cloudflare

Date of research: 2026-10-29 (UTC). Official sources fetched directly (registry + docs); Context7 was not consulted for these two (neither is indexed as the exact project — recorded limitation).

## Pinned candidate facts (fetched from the npm registry, 2026-10-29)

| Candidate | Version | License | Relevance to MatterControl (Next 16.4.2 / React 19.3.1) |
|---|---|---|---|
| `@opennextjs/cloudflare` | **1.20.14** | MIT | peerDeps `next >=15.5.28 <16 \|\| >=16.4.1` — **16.4.2 satisfies**. Official docs (opennext.js.org/cloudflare, fetched 2026-10-29): "All minor and patch versions of Next.js 16 and the latest minors of Next.js 14 and 15 are supported"; Next 14 support drops Q1 2026. Route Handlers and PPR listed supported; Node Middleware (15.2) **not yet supported**; `cacheComponents`/`partialPrefetching` **not mentioned** — unverified for this app. Worker size limits: 3 MiB (Free) / 10 MiB (Paid) gzip. |
| `vinext` | **1.4.0** | MIT | "Run Next.js apps on Vite. Drop-in replacement for the next CLI." peerDeps: `vite ^8.0.0`, `react ^19.3.1` (+react-dom, RSC webpack, plugin-rsc) — **React 19.3.1 matches exactly**. It is a Vite-based Next-compatible runtime, NOT itself a Workers adapter: Workers execution would require the Vite runtime to target workerd; support for `cacheComponents`/`partialPrefetching`/Server Actions on workerd is **unverified**. |

## What the application requires the adapter to prove (from the current source)

`cacheComponents: true` (next.config.ts:42), `partialPrefetching`, standalone Node output, RSC/streaming + Suspense + request-time `connection()`, Route Handlers, Server Actions with origin checks, `server-only` imports, Node crypto, multipart streaming (25 MiB uploads), Tailwind v4/local fonts, CSP/security headers, redirects, EN/VI localization, error boundaries. The stale `/` → `/dashboard` redirect (next.config.ts:49) targets a route that does not exist in the current tree (`(app)/{workspaces,my-actions,matters,requirements}`) — reconcile before any PoC so the entry journey is the real one.

## Executed comparison status: PREPARED, NOT_RUN (exact unblock recorded)

The two-candidate PoC was NOT executed in this session: isolated-copy installs of the adapter stacks (workerd preview, wrangler) are heavy and the session reached its execution budget; no adapter has been adopted and no shared file changed. The reproducible script is prepared at `adapter-poc.sh` (this directory): it materializes two isolated copies, installs each candidate at the exact pinned versions, runs `wrangler dev` (workerd — the intended runtime, not `next dev`), and drives a per-feature checklist (the §3 feature list above) plus the 1 MiB/25 MiB transfer flow. Run it when a session has the budget; both results (failures included) are the selection evidence. No remote bindings or account calls: the script pins `wrangler dev --local` emulation and asserts no `CLOUDFLARE_API_TOKEN` is set.

## Interim selection guidance (implementation evidence, not a decision)

- **OpenNext Cloudflare is the leading candidate on documented evidence**: explicit Next 16 support statement dated 2026-10-29, active maintenance, shadcn-ecosystem-proven RSC/Server Actions support, and an upstream path that keeps the Next CLI build (`next build` → OpenNext converts). Its unknowns for THIS app: `cacheComponents`/`partialPrefetching` behavior on workerd and the 3 MiB free worker size with the current bundle (server bundle, not client, counts — must be measured).
- **vinext is the challenger**: exact React/peer match and a simpler dev story, but Next-16-compatibility depth and workerd execution are undocumented for the features that matter here; selecting it would bet the BFF on an unproven path.
- Either adoption requires: stable PoC result + the §4 durable-state implementation + the writer handoff for `next.config.ts`/package.json/lockfile + a security review of the Worker BFF boundary. Neither is done; nothing in shared source references an adapter today.
