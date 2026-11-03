// The root segment: re-exports the shell implementation so the Worker build can resolve it to
// root-shell.worker.tsx (no `instant` segment config, which it cannot carry) through
// next.config.ts's turbopack resolveAlias, while the Node build uses root-shell.tsx with
// `instant = false` (D-2, UX-L-02). `export *` keeps the segment-config validator honest in both
// builds: the flag name never appears in this file.
export * from '@/app/root-shell'
export { default } from '@/app/root-shell'
