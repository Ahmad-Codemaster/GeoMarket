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
[![Tests](https://img.shields.io/badge/Vitest-167%20passed-success.svg)](https://vitest.dev/)

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
$$\text{USER} \longrightarrow \begin{cases} \text{CUSTOMER\_ADDRESSES} \\ \text{VENDOR\_PROFILE} \longrightarrow \text{STORE} \longrightarrow \text{PRODUCTS} \\ \text{CART} \longrightarrow \text{CART\_ITEMS} \longrightarrow \text{PRODUCT} \quad (\text{Single-Store Invariant: } \text{Product.storeId} = \text{Cart.storeId}) \end{cases}$$

* A `User` with role `VENDOR` owns exactly one `VendorProfile`.
* A `VendorProfile` can own multiple physical `Store` locations.
* Each `Product` belongs to exactly one physical `Store` and one `ProductCategory`.
* A `User` with role `CUSTOMER` maintains strictly one active persistent `Cart`.
* Every `CartItem` in a cart must strictly originate from the store assigned to that `Cart` (`Cart.storeId`).
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

### Phase 6: Shopping Cart & Single-Store Enforcement
- [x] Persistent single customer active cart with database constraints (`UNIQUE(cart.user_id)`, `UNIQUE(cart_item.cart_id, cart_item.product_id)`).
- [x] Strict Single-Store Invariant: Cart is anchored to one physical store (`Cart.storeId`). Products from different stores are rejected with `409 CART_STORE_CONFLICT` containing structured conflict details.
- [x] Concurrency-safe atomic cart upsert and additions (`SELECT ... FOR UPDATE`, `ON CONFLICT DO NOTHING`).
- [x] Dynamic availability checks: cart items reflect real-time stock levels, store active status, and order-accepting state without premature inventory decrements.
- [x] Non-trapping quantity controls (`PATCH /api/v1/cart/items/:id`) and automatic store detachment when cart is emptied (`DELETE /api/v1/cart` or final item removal resets `storeId = null`).
- [x] Customer cart UI (`/cart`), add-to-cart integration with single-store conflict modal on store pages, real-time Cart badge counter in navigation, and live subtotal/delivery calculations.

### Phase 7: Checkout, Cash on Delivery, and Order Fulfillment Lifecycle
- [x] Authoritative atomic checkout transaction (`POST /api/v1/checkout`) with deterministic row locks (`SELECT ... FOR UPDATE ORDER BY id`).
- [x] Immutable historical snapshots (`OrderItem.productNameSnapshot`, `OrderItem.unitPriceSnapshot`, `OrderAddressSnapshot`) decoupled from mutable catalog and address records.
- [x] PostGIS spatial validation enforcing customer address within store delivery radius (`ST_DWithin`) and timezone-safe operating hours verification prior to order creation.
- [x] Cash on Delivery (COD) payment flow with initial `PENDING` payment status.
- [x] Atomic inventory deduction during checkout and automatic cart clearing upon success.
- [x] Strict Order Finite State Machine (FSM):
  - `PLACED` → `CONFIRMED` → `PREPARING` → `READY` → `OUT_FOR_DELIVERY` → `DELIVERED`
  - Cancellation (`PLACED` / `CONFIRMED` → `CANCELLED`) with concurrency-safe atomic inventory replenishment.
  - Terminal / locked states (`PREPARING`, `READY`, `OUT_FOR_DELIVERY`, `DELIVERED`, `CANCELLED`) reject cancellation.
- [x] Multi-tenant RBAC: Customers access only their orders; Vendors manage only orders for their stores; 404 anti-enumeration protections.
- [x] Customer checkout UI (`/checkout`), customer order tracking timeline (`/orders/:id`), order history list (`/orders`), and vendor order fulfillment portal (`/vendor/orders`).

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

### 6. Seed sample visual data (optional)
```bash
pnpm seed
```

### 7. Start development servers
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
Test Files  7 passed (7)
     Tests  167 passed (167)
  ✓ tests/product.test.ts    (26 tests)
  ✓ tests/discovery.test.ts  (29 tests)
  ✓ tests/order.test.ts      (27 tests)
  ✓ tests/cart.test.ts       (32 tests)
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

- [x] **Phase 1: Authentication, RBAC & Monorepo Foundation**
  - Secure HttpOnly/SameSite JWT cookie session mechanism
  - BCrypt password hashing & `CUSTOMER` / `VENDOR` / `ADMIN` role-based access control
  - Clean modular monolith monorepo with `@geomarket/shared` contracts

- [x] **Phase 2: Customer Addresses & Location Abstractions**
  - Geographic delivery address management with coordinate precision
  - Database partial unique index enforcing strictly one default address per customer
  - Map tile and geocoding provider abstractions with interactive pin-drop modal

- [x] **Phase 3: Physical Store Onboarding & Governance**
  - Physical store entity with spatial coordinates & configurable delivery radius (km)
  - Operating hours matrix with same-day chronological validation
  - Store Status FSM (`PENDING_APPROVAL`, `APPROVED`, `REJECTED`, `SUSPENDED`)
  - Vendor store portal & Admin approval workflow

- [x] **Phase 4: Products & Inventory Management**
  - Store-scoped product catalog with unique slugs (`UNIQUE(store_id, slug)`)
  - Concurrency-safe atomic inventory adjustments powered by PostgreSQL row locks (`SELECT ... FOR UPDATE`)
  - Stock non-negativity invariant (`INSUFFICIENT_STOCK`)

- [x] **Phase 5: PostGIS Spatial Store Discovery & Customer Marketplace Browsing**
  - Native PostGIS geography point column (`Point, 4326`) and GiST spatial index (`stores_location_gist_idx`)
  - Spatial filtering (`ST_DWithin`, `ST_Distance`) enforcing delivery radius validation in SQL
  - Customer marketplace browsing UI (`/stores`), address selector, category filtering, and product viewing

- [x] **Phase 6: Shopping Cart & Single-Store Enforcement**
  - Persistent customer cart with database constraints (`UNIQUE(cart.user_id)`, `UNIQUE(cart_item.cart_id, cart_item.product_id)`)
  - Strict Single-Store Invariant: Cart is anchored to one physical store (`Cart.storeId`), rejecting cross-store additions with `409 CART_STORE_CONFLICT`
  - Concurrency-safe atomic cart upsert and additions (`SELECT ... FOR UPDATE`, `ON CONFLICT DO NOTHING`)
  - Real-time stock awareness, non-trapping steppers, and customer cart UI (`/cart`)

- [x] **Phase 7: Checkout, Cash on Delivery, and Order Fulfillment Lifecycle** *(Completed)*
  - **Authoritative Atomic Checkout**: Full transaction (`POST /api/v1/checkout`) with deterministic row locks (`SELECT ... FOR UPDATE ORDER BY id`) re-verifying stock and prices under lock.
  - **Immutable Snapshots**: `OrderItem.productNameSnapshot`, `OrderItem.unitPriceSnapshot`, and `OrderAddressSnapshot` decouple historical orders from mutable product catalog and address rows.
  - **Spatial & Timezone Validation**: PostGIS geospatial verification (`ST_DWithin`) enforcing customer address within store delivery radius and timezone-safe operating hours verification.
  - **Cash on Delivery (COD)**: Payment status lifecycle (`PENDING` $\rightarrow$ `PAID` / `CANCELLED`) with automatic cart clearing upon successful checkout.
  - **Order Finite State Machine (FSM)**:
    - Valid progression: `PLACED` $\rightarrow$ `CONFIRMED` $\rightarrow$ `PREPARING` $\rightarrow$ `READY` $\rightarrow$ `OUT_FOR_DELIVERY` $\rightarrow$ `DELIVERED`
    - Cancellation: `PLACED` / `CONFIRMED` $\rightarrow$ `CANCELLED` with concurrency-safe atomic inventory restoration.
    - Terminal / locked states: `PREPARING`, `READY`, `OUT_FOR_DELIVERY`, `DELIVERED`, `CANCELLED` reject cancellation.
  - **Role-Based Tenant Isolation**: Customer order tracking (`/orders/:id`), order history list (`/orders`), and vendor order fulfillment portal (`/vendor/orders`).
  - **27 Automated Tests**: Integration and concurrency tests covering checkout success, address security, store eligibility, PostGIS radius checks, stock deduction, rollback, cancellation restoration, FSM transitions, and historical snapshot immutability (167 tests total across the platform).

- [ ] **Phase 8: Reviews, Ratings & Vendor Analytics**
  - Verified-purchase product and store reviews
  - Aggregated 5-star rating computations
  - Vendor sales dashboards, revenue metrics, and performance analytics

---

## 📄 License
Private repository. All rights reserved.
