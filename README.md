# GeoMarket 🌍🛒

> **Location-Aware Dynamic Multi-Vendor Marketplace**  
> An enterprise-grade, location-first multi-vendor commerce platform built with a clean modular monolith architecture.

[![TypeScript](https://img.shields.io/badge/TypeScript-5.4-blue.svg)](https://www.typescriptlang.org/)
[![Node.js](https://img.shields.io/badge/Node.js-20+-green.svg)](https://nodejs.org/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-blue.svg)](https://www.postgresql.org/)
[![PostGIS](https://img.shields.io/badge/PostGIS-3.4-brightgreen.svg)](https://postgis.net/)
[![Prisma](https://img.shields.io/badge/Prisma-5.14-indigo.svg)](https://www.prisma.io/)
[![React](https://img.shields.io/badge/React-18-cyan.svg)](https://react.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-3.4-38bdf8.svg)](https://tailwindcss.com/)
[![Tests](https://img.shields.io/badge/Vitest-108%20passed-success.svg)](https://vitest.dev/)

---

## 🏛 Architecture Overview

GeoMarket is structured as a **Clean Modular Monolith** within a `pnpm` workspace:

```
ecom/
├── client/          # Frontend SPA (React 18 + Vite + Tailwind CSS + shadcn/ui + TanStack Query + Zustand)
├── server/          # Backend API (Node.js + Express + TypeScript + Prisma ORM + PostgreSQL 16 + PostGIS 3.4)
├── shared/          # Shared domain models, DTOs, and TypeScript interfaces
└── docs/            # Architecture specifications & system design documentation
```

### Domain Ownership Chain
$$\text{USER} \longrightarrow \text{VENDOR\_PROFILE} \longrightarrow \text{STORE} \longrightarrow \text{PRODUCTS}$$

* A `User` with role `VENDOR` owns exactly one `VendorProfile`.
* A `VendorProfile` can own multiple physical `Store` locations.
* Each `Product` belongs to exactly one physical `Store` and one `ProductCategory`.
* Multi-tenant isolation is enforced server-side with strict 404 anti-enumeration protections.

---

## 🚀 Implemented Phases & Feature Set

### Phase 1: Authentication & Role-Based Access Control
- [x] Secure JWT-in-cookie authentication (`HttpOnly`, `SameSite=Lax`, `Secure`).
- [x] BCrypt (cost factor 12) password hashing.
- [x] Role-Based Access Control (`CUSTOMER`, `VENDOR`, `ADMIN`).
- [x] Monorepo workspace configuration with shared typing.

### Phase 2: Customer Addresses & Location Abstractions
- [x] Customer delivery address management with coordinates (`latitude`, `longitude`).
- [x] Partial unique index enforcing strictly one default address per customer (`UNIQUE(user_id) WHERE is_default = true`).
- [x] Location provider abstractions (`MapTileProvider`, `GeocodingProvider` with Nominatim, Photon, and Mock providers).
- [x] Interactive Leaflet location picker modal with reverse geocoding pin-drop.

### Phase 3: Physical Store Onboarding & Governance
- [x] Store physical entity with geographic coordinates (`DECIMAL(10, 8)`, `DECIMAL(11, 8)`).
- [x] Configurable delivery radius (km) with interactive Leaflet visualizer circle (`react-leaflet`).
- [x] Store Operating Hours matrix with same-day chronological validation.
- [x] Store Status Finite State Machine:
  - `PENDING_APPROVAL` $\rightarrow$ `is_active = false`
  - `APPROVED` $\rightarrow$ `is_active = true`
  - `REJECTED` $\rightarrow$ `is_active = false` (requires mandatory reason)
  - `SUSPENDED` $\rightarrow$ `is_active = false` (requires mandatory reason)
- [x] Vendor store management portal and administrative governance queue.

### Phase 4: Products & Inventory Management
- [x] Product catalog schema with store-scoped composite slugs (`UNIQUE(store_id, slug)`).
- [x] Concurrency-safe atomic inventory adjustments (`SET`, `INCREMENT`, `DECREMENT`) powered by PostgreSQL row-level locking (`SELECT ... FOR UPDATE`).
- [x] Invariant enforcement: stock can never drop below zero (`INSUFFICIENT_STOCK`).
- [x] High-contention concurrency verified against race conditions and lost updates.
- [x] Vendor product management UI (`/vendor/stores/:storeId/products`) with search, category filtering, stock adjustments, and lifecycle toggles.

### Phase 5: PostGIS Spatial Store Discovery & Customer Marketplace Browsing
- [x] Native PostGIS spatial representation: `STORED` generated geography point column (`geography(Point, 4326)`) and pure **GiST spatial index** (`stores_location_gist_idx`).
- [x] Geographic distance & delivery radius filtering with `ST_DWithin` and `ST_Distance` (no in-memory Haversine loops).
- [x] Discovery eligibility rule strictly enforcing: `APPROVED`, `is_active`, `is_accepting_orders`, open during operating hours in store timezone, and customer inside delivery radius.
- [x] Timezone-safe SQL evaluation (`safe_timestamptz_at_tz`) preventing database crashes on unrecognised timezone strings.
- [x] Customer marketplace UI (`/stores`) with saved address dropdown, temporary map pin placement, category pills, live search, and store product catalog browsing (`/stores/:id`).

---

## 🛠 Tech Stack

| Layer | Technologies |
|---|---|
| **Frontend** | React 18, Vite, TypeScript, Tailwind CSS, Radix UI, TanStack Query, Zustand, Leaflet / React-Leaflet, Lucide Icons |
| **Backend** | Node.js, Express, TypeScript, Prisma ORM, Zod, BCrypt, jsonwebtoken, cookie-parser |
| **Database** | PostgreSQL 16 + PostGIS 3.4 (running via Docker Compose) |
| **Testing** | Vitest, Supertest (108 automated tests across all domain modules) |

---

## 🚦 Getting Started

### Prerequisites
- Node.js $\ge$ 20.0.0
- `pnpm` $\ge$ 9.0.0
- Docker & Docker Compose

### 1. Clone the repository
```bash
git clone https://github.com/Ahmad-Codemaster/GeoMarket.git
cd GeoMarket
```

### 2. Install dependencies
```bash
pnpm install
```

### 3. Start database infrastructure
```bash
docker compose up -d
```

### 4. Configure environment variables
Copy `.env.example` to `server/.env`:
```bash
cp .env.example server/.env
```

### 5. Run database migrations
```bash
pnpm db:migrate
pnpm db:generate
```

### 6. Start development servers
```bash
# Start backend server (http://localhost:3001)
pnpm dev:server

# Start frontend application (http://localhost:5173)
pnpm dev:client
```

---

## 🧪 Testing & Verification

The test suite runs against live PostgreSQL 16 + PostGIS 3.4 instances to guarantee real transactional isolation and spatial integrity.

```bash
# Run backend test suite
pnpm test
```

```
Test Files  5 passed (5)
     Tests  108 passed (108)
  ✓ tests/product.test.ts    (26 tests)
  ✓ tests/discovery.test.ts  (29 tests)
  ✓ tests/store.test.ts      (14 tests)
  ✓ tests/address.test.ts    (16 tests)
  ✓ tests/auth.test.ts       (23 tests)
```

```bash
# Build all workspace packages
pnpm build
```

---

## 🗺 Roadmap

- [x] **Phase 1**: Authentication, RBAC & Monorepo Foundation
- [x] **Phase 2**: Customer Addresses & Location Abstractions
- [x] **Phase 3**: Physical Store Onboarding & Governance
- [x] **Phase 4**: Products & Inventory Management
- [x] **Phase 5**: PostGIS Spatial Store Discovery & Customer Marketplace Browsing
- [ ] **Phase 6**: Shopping Cart & Single-Store Enforcement
- [ ] **Phase 7**: Checkout, Payments & Order Fulfillment Lifecycle
- [ ] **Phase 8**: Reviews, Ratings & Vendor Analytics

---

## 📄 License
Private repository. All rights reserved.
