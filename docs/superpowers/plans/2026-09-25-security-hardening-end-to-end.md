# End-to-End Security Hardening & Vulnerability Remediation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Remediate all critical, high, and medium security vulnerabilities identified in `docs/security/SECURITY_AUDIT_REPORT.md` across backend, client, and dependencies.

**Architecture:** Install and configure standard defense-in-depth middleware (`helmet`, `express-rate-limit`), eliminate wildcard CORS reflections, enforce strict RBAC and magic-byte validation on file uploads, update session cookies to `SameSite=lax`, stop duplicating JWT tokens in client `localStorage`, and patch vulnerable npm dependencies via `pnpm.overrides`.

**Tech Stack:** Express 4, TypeScript, helmet, express-rate-limit, Zod, React 18, pnpm 9 workspaces.

**Spec:** `docs/security/SECURITY_AUDIT_REPORT.md`

## Global Constraints

- Preserve all existing REST endpoints, route paths, and JSON contracts.
- No breaking changes for legitimate customer, vendor, and admin users.
- Single unified origin is `https://geomarket-docker.onrender.com`.
- Strict mode TypeScript across `@geomarket/shared`, `@geomarket/server`, and `@geomarket/client`.
- Maintain Docker container build compatibility for Render.

## Review Focus

- **Rate limit thresholds:** Normal checkout and navigation must not trigger 429 errors; brute force on `/api/v1/auth/login` must return 429 Too Many Requests.
- **Upload role restriction:** Customers and guests uploading to `/api/v1/upload` must receive 403 Forbidden; vendors and admins must succeed with valid image buffers.
- **Magic byte validation:** Uploading arbitrary files with `.png` or `.jpg` extension must fail with 400 if the byte header is not a genuine image (JPEG, PNG, WebP, GIF).
- **CORS safety:** When `origin` is not trusted or wildcard with credentials, cross-origin unauthorized access must be blocked.
- **Authentication continuity:** Removing `localStorage` token storage must not break authenticated client queries — the browser must send the `HttpOnly` cookie seamlessly on same-origin requests (`credentials: 'include'`).

---

## Task 1: Security Headers (Helmet) & CORS Hardening

**Files:**
- Modify: `server/package.json` (add `helmet`)
- Modify: `server/src/app.ts:1-35`

**Interfaces:**
- Consumes: `helmet`, `env.CLIENT_ORIGIN`
- Produces: Hardened HTTP headers (`X-Content-Type-Options`, `X-Frame-Options`, `Strict-Transport-Security`, disabled `X-Powered-By`), and strict CORS origin validation disallowing wildcard reflection when credentials are true.

- [ ] **Step 1: Install `helmet` in `@geomarket/server`**
```bash
pnpm --filter @geomarket/server add helmet
```

- [ ] **Step 2: Update `server/src/app.ts`**
Import `helmet` and mount it before any routes.
Disable `x-powered-by`.
Update CORS so `allowAllOrigins` only permits requests if `origin` is absent or explicitly matched; disallow wildcard reflection with `credentials: true` in production.

- [ ] **Step 3: Verify TypeScript builds without errors**
```bash
pnpm --filter server exec tsc --noEmit
```

- [ ] **Step 4: Commit**
```bash
git add server/package.json pnpm-lock.yaml server/src/app.ts
git commit -m "feat(security): mount helmet security headers and restrict credentialed CORS"
```

---

## Task 2: API Rate Limiting for Auth and Sensitive Endpoints

**Files:**
- Modify: `server/package.json` (add `express-rate-limit`)
- Create: `server/src/middleware/rateLimiter.ts`
- Modify: `server/src/modules/auth/auth.router.ts`
- Modify: `server/src/modules/order/order.router.ts`

**Interfaces:**
- Consumes: `express-rate-limit`
- Produces:
  - `authLimiter`: 10 requests per 15 minutes for `/api/v1/auth/login` and `/api/v1/auth/register`
  - `guestLimiter`: 15 requests per 15 minutes for `/api/v1/auth/guest-session`
  - `orderLookupLimiter`: 20 requests per 15 minutes for `/api/v1/orders/track`

- [ ] **Step 1: Install `express-rate-limit` in `@geomarket/server`**
```bash
pnpm --filter @geomarket/server add express-rate-limit
```

- [ ] **Step 2: Create `server/src/middleware/rateLimiter.ts`**
Export configured rate limiters returning standard JSON error payloads when limits are exceeded.

- [ ] **Step 3: Mount rate limiters on auth and tracking routes**
Attach `authLimiter` to `POST /login` and `POST /register`.
Attach `guestLimiter` to `POST /guest-session`.
Attach `orderLookupLimiter` to `POST /track` in order router.

- [ ] **Step 4: Verify TypeScript compilation**
```bash
pnpm --filter server exec tsc --noEmit
```

- [ ] **Step 5: Commit**
```bash
git add server/package.json pnpm-lock.yaml server/src/middleware/rateLimiter.ts server/src/modules/auth/auth.router.ts server/src/modules/order/order.router.ts
git commit -m "feat(security): apply rate limiting to authentication and order tracking endpoints"
```

---

## Task 3: Secure File Uploads (RBAC + Magic Byte Validation)

**Files:**
- Modify: `server/src/modules/upload/upload.router.ts`

**Interfaces:**
- Consumes: `requireRole(UserRole.VENDOR, UserRole.ADMIN)`
- Produces: Upload endpoint restricted to vendors/admins, validating image magic bytes (JPEG `FF D8 FF`, PNG `89 50 4E 47`, WebP `52 49 46 46`, GIF `47 49 46 38`).

- [ ] **Step 1: Add `requireRole(UserRole.VENDOR, UserRole.ADMIN)` to `POST /api/v1/upload`**

- [ ] **Step 2: Add magic-byte signature validation function**
Inspect the first bytes of the decoded Base64 buffer to verify genuine image file signatures before saving to disk.

- [ ] **Step 3: Test magic-byte validation with positive and negative test cases**

- [ ] **Step 4: Commit**
```bash
git add server/src/modules/upload/upload.router.ts
git commit -m "feat(security): enforce vendor/admin RBAC and magic-byte verification on uploads"
```

---

## Task 4: Cookie Hardening (SameSite=lax)

**Files:**
- Modify: `server/src/modules/auth/auth.controller.ts:6-15`

**Interfaces:**
- Consumes: `env.NODE_ENV`
- Produces: Cookies set with `sameSite: 'lax'` in both development and production.

- [ ] **Step 1: Update `getCookieOptions()` in `auth.controller.ts`**
Set `sameSite: 'lax'` (or `'strict'`) because frontend and backend now share the same Docker origin.

- [ ] **Step 2: Verify TypeScript compilation**
```bash
pnpm --filter server exec tsc --noEmit
```

- [ ] **Step 3: Commit**
```bash
git add server/src/modules/auth/auth.controller.ts
git commit -m "feat(security): configure SameSite=lax on authentication cookies"
```

---

## Task 5: Client-Side Token Storage Hardening

**Files:**
- Modify: `client/src/lib/api.ts`

**Interfaces:**
- Consumes: browser `fetch` with `credentials: 'include'`
- Produces: API client that relies on `HttpOnly` cookie for same-origin authentication and does not store bearer tokens in `localStorage`.

- [ ] **Step 1: Inspect `client/src/lib/api.ts` token storage functions**
Remove `localStorage.setItem('geomarket_auth_token')` and `localStorage.getItem()`.

- [ ] **Step 2: Ensure all `fetch` requests include `credentials: 'include'` or `credentials: 'same-origin'`**

- [ ] **Step 3: Verify client TypeScript compilation and build**
```bash
pnpm --filter @geomarket/client build
```

- [ ] **Step 4: Commit**
```bash
git add client/src/lib/api.ts
git commit -m "feat(security): eliminate localStorage token storage in favor of HttpOnly cookies"
```

---

## Task 6: Dependency Vulnerability Mitigation via Package Overrides

**Files:**
- Modify: `package.json` (add `pnpm.overrides`)

**Interfaces:**
- Consumes: `pnpm` resolution engine
- Produces: Enforced patched versions of `tar` (`>=7.5.19`) to eliminate the Critical archive decompression DoS vulnerability.

- [ ] **Step 1: Add `pnpm.overrides` in root `package.json`**
```json
"pnpm": {
  "overrides": {
    "tar": ">=7.5.19"
  }
}
```

- [ ] **Step 2: Run `pnpm install` to update lockfile**
```bash
pnpm install
```

- [ ] **Step 3: Run `pnpm audit` to verify critical vulnerabilities are resolved**
```bash
pnpm audit --audit-level critical
```

- [ ] **Step 4: Commit**
```bash
git add package.json pnpm-lock.yaml
git commit -m "fix(security): apply pnpm overrides for tar to resolve critical CVE"
```

---

## Task 7: Full Suite Build, Docker Container Verification & Deploy

**Files:**
- Verify: Full repo build and smoke test

- [ ] **Step 1: Run full workspace build**
```bash
pnpm build
```

- [ ] **Step 2: Push all commits to `origin main`**
```bash
git push origin main
```

- [ ] **Step 3: Verify Render deployment and run live automated smoke tests**
Verify health check, SPA routing, API routes, and login with the hardened security headers.
