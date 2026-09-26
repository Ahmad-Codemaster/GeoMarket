# GeoMarket 🌍🛒

> **High-Accuracy, Location-First Multi-Vendor Commerce Platform**  
> An enterprise-grade marketplace connecting customers with local physical merchants via PostGIS geospatial discovery, single-store cart invariants, and full order lifecycle fulfillment.

[![Live Demo](https://img.shields.io/badge/Live%20Demo-Render-46E3B7?style=flat-square&logo=render&logoColor=white)](https://geomarket-docker.onrender.com)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.4-blue.svg?style=flat-square&logo=typescript)](https://www.typescriptlang.org/)
[![Node.js](https://img.shields.io/badge/Node.js-20+-339933.svg?style=flat-square&logo=node.js)](https://nodejs.org/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-4169E1.svg?style=flat-square&logo=postgresql)](https://www.postgresql.org/)
[![PostGIS](https://img.shields.io/badge/PostGIS-3.4-008000.svg?style=flat-square)](https://postgis.net/)
[![Prisma](https://img.shields.io/badge/Prisma-5.22-2D3748.svg?style=flat-square&logo=prisma)](https://www.prisma.io/)
[![React](https://img.shields.io/badge/React-18-61DAFB.svg?style=flat-square&logo=react)](https://react.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-3.4-38BDF8.svg?style=flat-square&logo=tailwind-css)](https://tailwindcss.com/)
[![Tests](https://img.shields.io/badge/Vitest-200%2B%20tests-success.svg?style=flat-square&logo=vitest)](https://vitest.dev/)

---

## ⚡ Overview

**GeoMarket** is built around **real-time physical proximity**. Unlike conventional commerce platforms that display a static, global catalog, GeoMarket dynamically evaluates customer coordinates against merchant delivery perimeters using native spatial database indexing (`ST_DWithin`).

Customers discover stores actively serving their exact location, browse live inventory, and place orders with seamless Cash on Delivery (COD) workflows. The platform enforces strict transactional guarantees—such as single-store cart constraints and atomic inventory locks—preventing multi-merchant delivery conflicts and race conditions.

🌐 **Live Application**: [https://geomarket-docker.onrender.com](https://geomarket-docker.onrender.com)

---

## ✨ Key Capabilities

- **📍 Geospatial Store Discovery**: Native PostGIS geography points (`Point, 4326`) paired with GiST spatial indexes evaluate customer delivery eligibility entirely in SQL (`ST_DWithin`). Store operating hours and timezone offsets are evaluated concurrently.
- **🗺️ High-Precision Maps & Geocoding**: Interactive Leaflet maps powered by Humanitarian OpenStreetMap (OSM France) and ESRI tiles (zero rate limits, zero watermarks). Features GPS auto-detection and resilient geocoding with multi-provider failover (Photon & Nominatim).
- **🛒 Single-Store Cart Invariant**: Carts are strictly anchored to a single physical store (`Cart.storeId`). Adding items from another merchant triggers an explicit conflict resolution dialog (`409 CART_STORE_CONFLICT`), ensuring clean, single-point logistics.
- **⚡ Frictionless Guest Experience**: Visitors can browse stores, curate carts, and check out without mandatory upfront registration. Upon sign-in or registration, guest carts and session data transfer automatically into the authenticated profile.
- **📦 Resilient Order Lifecycle (FSM)**: Orders follow a strict 6-stage finite state machine (`PLACED` → `CONFIRMED` → `PREPARING` → `READY` → `OUT_FOR_DELIVERY` → `DELIVERED`). Concurrency-safe atomic inventory deductions (`SELECT ... FOR UPDATE`) occur at checkout, with automatic replenishment on cancellations.
- **⭐ Verified-Purchase Reviews**: Review submissions are strictly locked to confirmed `DELIVERED` orders (enforced by `UNIQUE(order_id)`), with atomic recalculation of store ratings and privacy-sanitized public displays.
- **📊 Multi-Role Portals**:
  - **Customer**: Interactive location picker, nearby stores catalog, multi-criteria product filtering, order tracking timeline, and guest order lookup (`/orders/track`).
  - **Vendor**: Store profile & delivery radius configurator, weekly operating hours matrix, inventory management with stock locks, and localized revenue analytics.
  - **Admin**: Platform KPI dashboard, live order telemetry, vendor store approval queue, and searchable user role management.

---

## 🛠️ Architecture & Tech Stack

```
ecom/
├── client/          # Frontend SPA (React 18, Vite, TypeScript, Tailwind CSS, TanStack Query, Zustand, Leaflet)
├── server/          # Backend API (Node.js, Express, TypeScript, Prisma ORM, PostGIS, Zod, BCrypt, JWT)
├── shared/          # Shared domain models, DTOs, and TypeScript contracts (@geomarket/shared)
├── docs/            # Architectural blueprints, ERDs, FSM definitions, and viva defense materials
└── docker-compose.yml # PostgreSQL 16 + PostGIS local container setup
```

| Layer | Technologies |
|---|---|
| **Frontend** | React 18, Vite, TypeScript, Tailwind CSS, TanStack Query, Zustand, Leaflet / React-Leaflet, Radix UI |
| **Backend** | Node.js 20+, Express, TypeScript, Prisma ORM, Zod Validation, BCrypt, JWT (HttpOnly Cookies) |
| **Database & Spatial** | PostgreSQL 16 + PostGIS 3.4 (`geography(Point, 4326)`, GiST indexes, `ST_DWithin`, `ST_Distance`) |
| **DevOps & Testing** | Docker (multi-stage container), Docker Compose, pnpm workspaces, Render, Vitest, Supertest |

---

## 🚦 Getting Started

### Prerequisites
- **Node.js** $\ge$ 20.0.0
- **pnpm** $\ge$ 9.0.0
- **Docker & Docker Compose**

### 1. Clone & Install
```bash
git clone https://github.com/Ahmad-Codemaster/GeoMarket.git
cd GeoMarket
pnpm install
```

### 2. Configure Environment
Create the server environment file:
```bash
cp .env.example server/.env
```

### 3. Spin Up PostGIS & Database
```bash
# Start PostgreSQL 16 + PostGIS 3.4 container
docker compose up -d

# Run Prisma migrations & generate client
pnpm db:migrate
pnpm db:generate

# (Optional) Seed verified stores, products, and reviews
pnpm seed
```

### 4. Start Development Servers
```bash
# Start backend API (http://localhost:3001)
pnpm dev:server

# In a separate terminal, start frontend client (http://localhost:5173)
pnpm dev:client
```

---

## 🧪 Testing & Verification

```bash
# Run backend test suite (requires active PostGIS container)
pnpm test

# Type-check client and server
pnpm --filter @geomarket/client exec tsc --noEmit
pnpm --filter @geomarket/server exec tsc --noEmit

# Production build test
pnpm build
```

---

## ⚙️ Environment Configuration

| Variable | Description | Default (Local) |
|---|---|---|
| `DATABASE_URL` | PostgreSQL connection string with PostGIS enabled | `postgresql://geomarket:geomarket_secret@localhost:5432/geomarket_db` |
| `JWT_SECRET` | Secret key for signing authentication tokens | *Required in production* |
| `JWT_EXPIRES_IN` | Token validity duration in seconds | `3600` |
| `NODE_ENV` | Application runtime environment (`development` / `production`) | `development` |
| `PORT` | Backend HTTP port | `3001` |
| `CLIENT_ORIGIN` | Allowed CORS origin for frontend requests | `http://localhost:5173` |
| `COOKIE_SECURE` | Enforce secure HTTPS cookie flag | `false` (set `true` in production) |

---

## 📚 Documentation & Specifications

Detailed architectural specifications, system diagrams, and academic viva preparation documents are organized in [`docs/`](docs/):

- 📐 **[Master Architecture Document](docs/master_document.md)** — Architectural index, system topology, and component breakdown.
- 📋 **[Functional & Data Requirements](docs/requirements/01_system_overview_and_scope.md)** — Core scope, user stories, and business logic.
- 🗄️ **[Database Architecture & ERD](docs/requirements/03_database_and_erd.md)** — Schema definitions, PostGIS spatial indices, and entity relationships.
- 🔒 **[Order FSM & Security Specifications](docs/requirements/04_order_fsm_and_security.md)** — State machine diagrams, anti-enumeration, and row-level locks.
- 🛡️ **[Security Audit Report](docs/security/SECURITY_AUDIT_REPORT.md)** — Vulnerability assessment, mitigation strategies, and auth audits.

---

## 📄 License
© [@Ahmad-Codemaster](https://github.com/Ahmad-Codemaster). All rights reserved.
