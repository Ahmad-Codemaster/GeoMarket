# syntax=docker/dockerfile:1

# ── Stage 1: Install all dependencies ─────────────────────────────────────────
FROM node:22-alpine AS deps
WORKDIR /app

# Install pnpm globally (same version as packageManager field)
RUN corepack enable && corepack prepare pnpm@9.15.4 --activate

# Copy workspace manifests first (for layer caching)
COPY pnpm-workspace.yaml ./
COPY package.json pnpm-lock.yaml ./
COPY shared/package.json ./shared/
COPY client/package.json ./client/
COPY server/package.json ./server/

# Install ALL deps (including devDeps — needed to build)
RUN pnpm install --frozen-lockfile

# ── Stage 2: Build shared types ───────────────────────────────────────────────
FROM deps AS build-shared
COPY shared/ ./shared/
RUN pnpm --filter @geomarket/shared build

# ── Stage 3: Build React client ───────────────────────────────────────────────
FROM build-shared AS build-client
COPY client/ ./client/
# No VITE_API_URL env var needed — same origin, requests go to /api/v1
RUN pnpm --filter @geomarket/client build

# ── Stage 4: Build Express server ─────────────────────────────────────────────
FROM build-client AS build-server
COPY server/ ./server/
RUN pnpm --filter @geomarket/server build

# ── Stage 5: Production image ─────────────────────────────────────────────────
FROM node:22-alpine AS runner
WORKDIR /app

RUN corepack enable && corepack prepare pnpm@9.15.4 --activate

# Copy workspace manifests
COPY pnpm-workspace.yaml ./
COPY package.json pnpm-lock.yaml ./
COPY shared/package.json ./shared/
COPY client/package.json ./client/
COPY server/package.json ./server/

# Install production deps only
RUN pnpm install --frozen-lockfile --prod

# Copy built shared package
COPY --from=build-shared /app/shared/dist ./shared/dist

# Copy built server
COPY --from=build-server /app/server/dist ./server/dist
COPY --from=build-server /app/server/prisma ./server/prisma

# Copy React build into the location Express will serve it from
# (matches `path.resolve(__dirname, '../public/client')` in app.ts
#  where __dirname = /app/server/dist/  → ../public = /app/server/public)
COPY --from=build-client /app/client/dist ./server/public/client

# Ensure uploads directory exists
RUN mkdir -p ./server/public/uploads

# Prisma: generate client from the copied schema
RUN pnpm --filter @geomarket/server exec prisma generate --schema=prisma/schema.prisma

EXPOSE 3001

CMD ["node", "server/dist/server.js"]
