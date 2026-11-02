# instant-nav rig: matter-control-frontend

- BUILD: `EXPOSE_TESTING_API=1 pnpm build`
- EXPOSE: `process.env.EXPOSE_TESTING_API === '1'` in `next.config.ts` (`experimental.exposeTestingApiInProductionBuild`)
- RUN: `BASE_URL=http://localhost:3000 pnpm playwright test e2e/prefetch-optimization.spec.ts`
- TEST USER: public / authenticated session; state: locale `en`, theme default
- DRIFT: none known
- CONTRACTS:
  - Source `/my-actions` -> `<Link href="/my-reviews">`: Destination `/my-reviews` PageHeader ('Reviews due') and Suspense skeleton ready in App Shell before click; `<ReviewQueue>` deferred to navigation; Viewport trigger in primary navigation.
  - Source `/my-actions` -> `<Link href="/matters">`: Destination `/matters` PageHeader ('Matters') and Suspense skeleton ready in App Shell before click; `<MatterDiscovery>` deferred to navigation; Viewport trigger in primary navigation.
  - Source `/my-actions` -> `<Link href="/workspaces">`: Destination `/workspaces` PageHeader ('Workspaces') and ListSkeleton ready in App Shell before click; `<WorkspaceList>` deferred to navigation; Viewport trigger in primary navigation.
- LOOP: local build with testing API → start → Playwright test → stop server
- LIVENESS: n/a; local build and start
- WALLS: Production server checks `API_MODE=rest` (TB-12); testing harness uses local test server or configured mock endpoint.
