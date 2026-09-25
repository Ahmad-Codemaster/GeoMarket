# Docker Unified Deploy Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the two-service Render deployment (separate static site + web service) with a single Docker container where Express serves both the API and the built React frontend — eliminating CORS, SPA routing hacks, and split-deploy complexity.

**Architecture:** A multi-stage Dockerfile builds the shared types, then the React client, then the Express server. The final image copies the client `dist/` into the server's `public/client/` folder. Express serves `/api/v1/*` as API routes and falls back to `public/client/index.html` for every other path. One Render Web Service (Docker runtime) replaces both current services.

**Tech Stack:** Node 22 Alpine (Docker), pnpm 9, Express 4, React + Vite (build only), Prisma 5, Supabase Postgres + PostGIS (external, unchanged).

**Spec:** This plan was derived from the conversation context and codebase analysis on 2026-09-25. The running backend is `https://geomarket.onrender.com` and the static frontend is `https://geomarket-1.onrender.com`. After this plan, both are replaced by a single URL: `https://geomarket.onrender.com`.

## Global Constraints

- Node version: `>=20.0.0 <23.0.0` (use `node:22-alpine` in Docker)
- pnpm version: `>=9.0.0` (pin `9.15.4` as in `package.json`)
- TypeScript: strict mode, `CommonJS` output for server
- Database: Supabase external Postgres — **do not touch DB config, migrations, or seed data**
- No new npm dependencies — use only what is already installed
- Keep `server/src/app.ts` `createApp()` function signature unchanged
- All env vars remain the same; only `CLIENT_ORIGIN` gets a new default value
- The Render service name stays `geomarket` (preserve the existing URL)
- `geomarket-1` static site must be **manually deleted** from the Render dashboard after this deploy succeeds

## Review Focus

- **Browser refresh on `/login`** — must return `index.html` (200), not Express 404. Test: `GET /login` → 200, body contains `<div id="root">`.
- **`/api/v1/*` routes still reachable** — the catch-all must not intercept API routes. Test: `GET /api/v1/health` → 200 plain text `OK`.
- **`/uploads/*` static files still served** — product image uploads must not be shadowed. Test: `GET /uploads/.gitkeep` → 200 or 404 (not Express JSON error).
- **`CLIENT_ORIGIN` validation** — env schema requires a valid URL; the new default (`https://geomarket.onrender.com`) must pass `new URL()`. Test: start server without `CLIENT_ORIGIN` set, verify it uses the default and does not crash.
- **Docker build cache correctness** — `pnpm-lock.yaml` copy must precede `pnpm install` so layer cache invalidates on lockfile change. Review the Dockerfile layer order.

---

## Task 1: Add CLIENT_ORIGIN default to env schema

**Files:**
- Modify: `server/src/config/env.ts:8-38`

**Interfaces:**
- Consumes: nothing (first task)
- Produces: `env.CLIENT_ORIGIN` — now has a default of `'https://geomarket.onrender.com'` so the server starts in Docker without that env var being required

- [ ] **Step 1: Open `server/src/config/env.ts` and locate the `CLIENT_ORIGIN` field (lines 8–38)**

Currently it looks like:
```ts
CLIENT_ORIGIN: z
  .string()
  .min(1, 'CLIENT_ORIGIN cannot be empty')
  .transform(...)
  .refine(...),
```

- [ ] **Step 2: Add `.default('https://geomarket.onrender.com')` before `.transform`**

Replace the `CLIENT_ORIGIN` field with:
```ts
CLIENT_ORIGIN: z
  .string()
  .default('https://geomarket.onrender.com')
  .transform((val) => {
    return val
      .split(',')
      .map((item) => {
        let trimmed = item.trim();
        if (trimmed === '*') return trimmed;
        if (!/^https?:\/\//i.test(trimmed)) {
          trimmed = `https://${trimmed}`;
        }
        return trimmed.replace(/\/+$/, '');
      })
      .join(',');
  })
  .refine(
    (val) => {
      const parts = val.split(',');
      return parts.every((p) => {
        if (p === '*') return true;
        try {
          new URL(p);
          return true;
        } catch {
          return false;
        }
      });
    },
    { message: 'CLIENT_ORIGIN must contain valid URL(s) (e.g. https://your-frontend.onrender.com)' }
  ),
```

> Note: `.min(1, ...)` is removed because `.default(...)` already guarantees a non-empty string.

- [ ] **Step 3: Verify TypeScript still compiles**

```bash
pnpm --filter server exec tsc --noEmit
```

Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add server/src/config/env.ts
git commit -m "fix: give CLIENT_ORIGIN a default value for Docker single-service deploy"
```

---

## Task 2: Serve React build from Express (SPA static + catch-all)

**Files:**
- Modify: `server/src/app.ts:45-55` (replace the root `GET /` JSON status endpoint with static serving + SPA catch-all)

**Interfaces:**
- Consumes: `env.NODE_ENV` from Task 1's `env` object
- Produces:
  - `app.use(express.static(...))` — serves `public/client/` as static files
  - `app.get('*', ...)` — catch-all that returns `public/client/index.html`
  - The API health check at `/health` and `/api/v1/health` is preserved unchanged

- [ ] **Step 1: Understand the current root `GET /` handler (lines 46–55 of `app.ts`)**

Currently it returns a JSON status object. In the Docker setup the React `index.html` will be served from `public/client/index.html`. The JSON status is no longer needed at `/` because React's `index.html` will be there.

- [ ] **Step 2: Replace the root JSON handler and add static + SPA catch-all**

In `server/src/app.ts`, after the `app.use('/api/v1', apiRouter)` line and before the global error handler, add:

```ts
// Serve React build (populated during Docker multi-stage build)
const clientDistDir = path.resolve(__dirname, '../public/client');
if (fs.existsSync(clientDistDir)) {
  app.use(express.static(clientDistDir));

  // SPA catch-all: any non-API, non-file route → React's index.html
  app.get('*', (_req, res) => {
    res.sendFile(path.join(clientDistDir, 'index.html'));
  });
} else {
  // Development fallback: no built client present
  app.get('/', (_req, res) => {
    res.json({
      name: 'GeoMarket API',
      status: 'running',
      version: '1.0.0',
      note: 'Run client separately with `pnpm dev:client` in development.',
      healthCheck: '/api/v1/health',
    });
  });
}
```

Also remove the old standalone `app.get('/', ...)` block (lines 46–55) since it is now inside the `else` branch.

The final structure of `app.ts` middleware chain must be in this exact order:
1. CORS
2. `express.json()`
3. `cookieParser()`
4. `/uploads` static
5. `/health` and `/api/v1/health` endpoints
6. `/api/v1` router
7. React static + SPA catch-all (new — Task 2)
8. Global error handler

- [ ] **Step 3: Verify TypeScript still compiles**

```bash
pnpm --filter server exec tsc --noEmit
```

Expected: no errors.

- [ ] **Step 4: Manually test the dev fallback path (no `public/client` dir)**

```bash
pnpm --filter server dev
# In a second terminal:
curl http://localhost:3001/
```

Expected: JSON `{ "name": "GeoMarket API", "status": "running", ... }` (the else-branch fires because `public/client/` does not exist in dev).

```bash
curl http://localhost:3001/api/v1/health
```

Expected: `OK`

- [ ] **Step 5: Commit**

```bash
git add server/src/app.ts
git commit -m "feat: serve React build from Express with SPA catch-all for Docker deploy"
```

---

## Task 3: Write the Dockerfile

**Files:**
- Create: `Dockerfile` (repo root)

**Interfaces:**
- Consumes: `pnpm-lock.yaml`, `pnpm-workspace.yaml`, `package.json`, `client/`, `server/`, `shared/`
- Produces: Docker image that, when run with env vars (`DATABASE_URL`, `JWT_SECRET`), starts the Express server on `PORT` (default 3001) and serves the React app at `/`

- [ ] **Step 1: Create `Dockerfile` at the repo root**

```dockerfile
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
COPY server/package.json ./server/

# Install production deps only
RUN pnpm install --frozen-lockfile --prod

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
```

- [ ] **Step 2: Verify the `__dirname` path resolves correctly**

`server/dist/server.js` is compiled from `server/src/server.ts`.
`__dirname` inside `dist/server.js` = `/app/server/dist`.
`path.resolve(__dirname, '../public/client')` = `/app/server/public/client`.
The `COPY` in Stage 5 puts the React build at `./server/public/client` = `/app/server/public/client`. ✅

- [ ] **Step 3: Add `.dockerignore` at the repo root**

```
node_modules
**/node_modules
**/.pnpm-store
**/dist
client/.env
server/.env
server/.env.test
*.log
.DS_Store
cloudflared*
server/public/uploads/*
!server/public/uploads/.gitkeep
```

- [ ] **Step 4: Build the image locally to verify it compiles**

```bash
docker build -t geomarket:local .
```

Expected: Build completes successfully through all 5 stages with no errors.

- [ ] **Step 5: Run the image locally with required env vars**

```bash
docker run --rm -p 3001:3001 \
  -e DATABASE_URL="<paste your Supabase DATABASE_URL from server/.env>" \
  -e JWT_SECRET="<paste your JWT_SECRET from server/.env>" \
  -e NODE_ENV=production \
  geomarket:local
```

Expected log output:
```
[GeoMarket Server] Running on http://0.0.0.0:3001 in production mode
```

- [ ] **Step 6: Test all three endpoints against the local container**

```bash
# Health check
curl http://localhost:3001/health
# Expected: OK

# React app (SPA catch-all)
curl -s http://localhost:3001/ | grep '<div id="root">'
# Expected: <div id="root"></div>

# React Router route (SPA catch-all)
curl -s http://localhost:3001/login | grep '<div id="root">'
# Expected: <div id="root"></div>

# API still reachable
curl http://localhost:3001/api/v1/health
# Expected: OK
```

- [ ] **Step 7: Commit**

```bash
git add Dockerfile .dockerignore
git commit -m "feat: add multi-stage Dockerfile — Express serves React build in production"
```

---

## Task 4: Update render.yaml for single Docker service

**Files:**
- Modify: `render.yaml` (full replacement)

**Interfaces:**
- Consumes: `Dockerfile` from Task 3
- Produces: `render.yaml` that defines ONE web service (`geomarket`) using Docker runtime. The `geomarket-1` static service definition is removed.

- [ ] **Step 1: Replace the contents of `render.yaml`**

```yaml
services:
  - type: web
    name: geomarket
    runtime: docker
    plan: free
    region: singapore
    dockerfilePath: ./Dockerfile
    envVars:
      - key: NODE_ENV
        value: production
      - key: DATABASE_URL
        sync: false          # Set manually in Render dashboard — DO NOT commit value
      - key: JWT_SECRET
        sync: false          # Set manually in Render dashboard — DO NOT commit value
      - key: JWT_EXPIRES_IN
        value: "3600"
      - key: PORT
        value: "3001"
      - key: COOKIE_SECURE
        value: "true"
      - key: MAX_DELIVERY_RADIUS_KM
        value: "500"
      # CLIENT_ORIGIN intentionally omitted — defaults to https://geomarket.onrender.com
      # (set by Task 1's env.ts change). Override here if you use a custom domain.
```

> `sync: false` means the value must be entered in the Render dashboard manually. `DATABASE_URL` and `JWT_SECRET` are already set on the existing `geomarket` service from the previous deploy, so they carry over.

- [ ] **Step 2: Commit**

```bash
git add render.yaml
git commit -m "chore: update render.yaml to Docker single-service deploy"
```

---

## Task 5: Remove VITE_API_URL dependency from client

**Files:**
- Modify: `client/src/lib/api.ts:46-56`
- Modify: `client/.env` (update for local dev)
- Modify: `client/.env.example` (update)

**Interfaces:**
- Consumes: nothing from previous tasks
- Produces: `getApiBaseUrl()` returns `''` (empty string = same-origin relative URL) in all production builds, and `http://localhost:3001` only for local dev via env var

The current `getApiBaseUrl()` in `client/src/lib/api.ts` checks for `onrender.com` in the hostname to auto-detect the backend URL. In the Docker setup the frontend and backend are the same origin, so the API base should simply be `''` (relative) in production — all requests go to `/api/v1/...` on the same host.

- [ ] **Step 1: Replace `getApiBaseUrl()` in `client/src/lib/api.ts` (lines 46-56)**

```ts
function getApiBaseUrl(): string {
  // In development, point to local Express server.
  // In Docker production, frontend and API share the same origin — use relative URLs.
  const envUrl = (import.meta as any).env?.VITE_API_URL as string | undefined;
  if (envUrl && envUrl.trim()) {
    return envUrl.trim().replace(/\/+$/, '');
  }
  return ''; // same-origin: /api/v1/... resolves correctly in production
}
```

- [ ] **Step 2: Update `client/.env` for local development**

```env
VITE_API_URL=http://localhost:3001
```

- [ ] **Step 3: Update `client/.env.example`**

```env
# Local development only. In Docker production this is not needed (same-origin).
VITE_API_URL=http://localhost:3001
```

- [ ] **Step 4: Verify TypeScript compiles in client**

```bash
pnpm --filter @geomarket/client exec tsc --noEmit
```

Expected: no errors.

- [ ] **Step 5: Commit**

```bash
git add client/src/lib/api.ts client/.env.example
git commit -m "fix: use relative API URL in production (same-origin Docker deploy)"
```

> `client/.env` is gitignored — update it locally but do not commit it.

---

## Task 6: Push and deploy on Render

**Files:**
- No code changes — this is the deployment task

**Interfaces:**
- Consumes: all previous tasks committed to `main`
- Produces: `https://geomarket.onrender.com` serving both API and React app from one Docker container

- [ ] **Step 1: Push all commits to `main`**

```bash
git push origin main
```

- [ ] **Step 2: Trigger deploy in Render dashboard**

1. Open **https://dashboard.render.com**
2. Click the **geomarket** service
3. Click **Manual Deploy → Deploy latest commit**
4. Wait for the Docker build to complete (first build: ~5–8 minutes due to `pnpm install` and multi-stage build)

- [ ] **Step 3: Watch the build log for these key lines (confirms each stage passed)**

```
=> [build-shared] pnpm --filter @geomarket/shared build
=> [build-client] pnpm --filter @geomarket/client build
=> [build-server] pnpm --filter @geomarket/server build
=> [runner] COPY --from=build-client ...
=> Successfully built ...
==> Build successful 🎉
```

- [ ] **Step 4: Watch the runtime log for the startup line**

```
[GeoMarket Server] Running on http://0.0.0.0:3001 in production mode
```

- [ ] **Step 5: Smoke test the live deployment**

```bash
# Health
curl https://geomarket.onrender.com/health
# Expected: OK

# React app root
curl -s https://geomarket.onrender.com/ | grep 'id="root"'
# Expected: <div id="root"></div>

# React Router deep link (was 404 before this plan)
curl -s https://geomarket.onrender.com/login | grep 'id="root"'
# Expected: <div id="root"></div>

# API endpoint
curl https://geomarket.onrender.com/api/v1/health
# Expected: OK

# Auth login
curl -s -X POST https://geomarket.onrender.com/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"customer@geomarket.test","password":"Password123!"}' \
  | grep '"role":"CUSTOMER"'
# Expected: match found
```

- [ ] **Step 6: Delete the old `geomarket-1` static site from Render dashboard**

1. Click **geomarket-1** in the Render dashboard
2. Go to **Settings → Delete Service**
3. Confirm deletion

> The `geomarket-1` URL will stop working after this. The live app is now exclusively at `https://geomarket.onrender.com`.

- [ ] **Step 7: Final commit — update README with the single live URL**

Update `README.md` (or any docs that mention `geomarket-1.onrender.com`) to reference `https://geomarket.onrender.com` as the single app URL.

```bash
git add README.md
git commit -m "docs: update live URL to single Docker service (geomarket.onrender.com)"
git push origin main
```
