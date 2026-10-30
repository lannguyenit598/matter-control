# syntax=docker/dockerfile:1

# Production image of the MatterControl web app (Next.js standalone server, Node, no adapter).
# Build:  docker build -t mc-web apps/frontend
# Run:    needs the API_* / OIDC_* / APP_ORIGIN variables (see src/lib/env.ts); none is baked in.
#
# One instance only for now: sign-in sessions and unresolved Data attempts live in process
# memory (docs/architecture/adr/ADR-004), so a restart signs everyone out. Do not scale out.

ARG NODE_VERSION=24.22.1

# ---- dependencies ----
FROM node:${NODE_VERSION}-slim AS deps
WORKDIR /app
RUN corepack enable
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
# Scripts stay off: `prepare` installs git hooks, which a container build has no use for.
RUN --mount=type=cache,target=/root/.local/share/pnpm/store \
    pnpm install --frozen-lockfile --ignore-scripts

# ---- build ----
FROM node:${NODE_VERSION}-slim AS build
WORKDIR /app
RUN corepack enable
ENV NEXT_TELEMETRY_DISABLED=1
COPY --from=deps /app/node_modules ./node_modules
COPY . .
# `build` also fails the image if Tailwind did not compile (scripts/check-built-css.mjs).
RUN pnpm build && mkdir -p public

# ---- runtime ----
FROM node:${NODE_VERSION}-slim AS runtime
WORKDIR /app
ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    HOSTNAME=0.0.0.0 \
    PORT=8080
# The standalone output holds the server and only the files it needs; static assets go beside it.
COPY --from=build --chown=node:node /app/.next/standalone ./
COPY --from=build --chown=node:node /app/.next/static ./.next/static
COPY --from=build --chown=node:node /app/public ./public
USER node
EXPOSE 8080
CMD ["node", "server.js"]
