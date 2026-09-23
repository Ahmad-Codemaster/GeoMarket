# GeoMarket — Master Application Flow, Page Structure & Data Architecture

> **Document Classification:** Master Architectural Specification & Academic Evaluation Blueprint  
> **Target Audience:** University Evaluators, Academic Examiners, System Architects, Full-Stack Developers  
> **System Version:** 2.1.0 (Production Verified Baseline)  
> **Author:** Senior Software Architect & Engineering Team  

---

## 1. PROJECT OVERVIEW

### 1.1 Project Identity & Academic Context
* **Project Name:** **GeoMarket**
* **Project Type:** Location-Aware Dynamic Multi-Vendor E-Commerce Platform
* **Academic Scope:** Enterprise Software Engineering Capstone Project
* **Architecture Style:** Clean Modular Monolith (Single deployable unit, cleanly decoupled domain modules, shared transactional database, unified TypeScript typing)

### 1.2 The Problem Being Solved
Traditional e-commerce platforms (such as Amazon, eBay, or Daraz) are designed around **national or regional distribution logistics**. In these platforms:
1. A customer browses products that may be located in distant warehouses hundreds or thousands of kilometers away.
2. Orders incur multi-day shipping transit delays.
3. Local brick-and-mortar merchants are either excluded or compete on an unfair footing against massive centralized distribution centers.
4. Perishable goods, immediate groceries, local pharmacy items, and same-day retail purchases cannot be reliably serviced.

Conversely, traditional food delivery applications solve local delivery, but are tightly locked to single restaurant meals and do not provide an extensible multi-vendor product catalog, store-scoped inventory tracking, or flexible merchant governance.

### 1.3 What GeoMarket Does
GeoMarket introduces a **hyperlocal spatial commerce paradigm**. It transforms physical retail stores across a metropolitan area into dynamic digital storefronts discoverable strictly by customers who are physically located within each store's custom delivery boundary.

Instead of browsing an abstract catalog of items shipped from unknown locations, a customer opens GeoMarket, sets their current physical delivery pin, and instantly sees only verified local stores whose physical delivery vehicles can reach their doorstep. The customer browses the store's live catalog, adds items to a store-anchored cart, places an order with Cash on Delivery (COD), and tracks the delivery progression in real time.

### 1.4 The Core Differentiator: Dynamic Spatial Discovery
Unlike primitive web applications that rely on static database strings (e.g., `WHERE store.city = 'Faisalabad' AND store.area = 'D Ground'`), GeoMarket uses **mathematical geodesics and native PostGIS spatial computing**:
* **No Hardcoded Area Names:** Delivery zones are not based on subjective neighborhood text strings that break when spelling varies.
* **Geographic Centroids:** Every store defines an exact geographic coordinate centroid $(Lat_S, Lon_S)$ and an operational delivery radius $R_{\text{delivery}}$ measured in kilometers.
* **Point-in-Circle Geodesic Evaluation:** A customer at coordinates $(Lat_C, Lon_C)$ can discover a store if and only if the geodesic distance $d(C, S)$ across the Earth's ellipsoidal surface satisfies:
  $$d(\text{Customer}, \text{Store}) \le R_{\text{delivery}}$$
* **The 4-Tier Store Discovery Rule:** Physical proximity alone is insufficient. For a store to appear in a customer's marketplace, it must satisfy four simultaneous criteria:
  1. **Governance Approval:** Store status is `APPROVED` by a platform administrator.
  2. **Administrative State:** Store administrative flag `isActive` is `true`.
  3. **Operational State & Operating Hours:** Store operational flag `isAcceptingOrders` is `true`, and the current timestamp falls strictly within the store's configured weekly operating hours in the store's local timezone.
  4. **Spatial Reachability:** The customer's delivery coordinates fall within the store's delivery radius calculated via PostGIS `ST_DWithin`.

### 1.5 Main User Roles
GeoMarket implements strict Role-Based Access Control (RBAC) with three primary actors:
1. **CUSTOMER:** Discovers nearby stores based on coordinates, manages saved delivery addresses, browses store-specific catalogs, maintains an active single-store shopping cart, places Cash on Delivery orders, tracks live order status, and submits verified-purchase store reviews.
2. **VENDOR:** Operates physical stores under a 1:1 `VendorProfile` identity. Onboards new physical stores with custom delivery radii and weekly operating hours, manages product catalogs and SKUs, performs concurrency-safe stock adjustments, handles incoming customer orders through a Finite State Machine (FSM), and inspects real-time operational analytics and revenue.
3. **ADMIN:** Platform governance authority. Audits vendor store onboarding applications via interactive Leaflet map visualizers, approves or rejects stores with mandatory justification, suspends violating stores, and manages system-wide store and product category taxonomies.

### 1.6 High-Level Architecture
GeoMarket is built as a **Clean Modular Monolith** inside a `pnpm` monorepo workspace:
* **`client/`**: Single Page Application (SPA) built with React 18, Vite, TypeScript, Tailwind CSS, Radix UI, TanStack Query (React Query) for server-state caching, Zustand for UI state, and Leaflet / React-Leaflet for geospatial mapping.
* **`server/`**: RESTful API server built with Node.js, Express, TypeScript, Prisma ORM, Zod for runtime schema validation, BCrypt for password hashing, and signed JSON Web Tokens (JWT) stored in secure, `HttpOnly` cookies.
* **`shared/`**: Unified TypeScript package sharing Data Transfer Objects (DTOs), validation schemas, error codes, and enum definitions across frontend and backend, guaranteeing end-to-end type safety.
* **`database`**: PostgreSQL 16 relational engine augmented with the **PostGIS 3.4** spatial extension, running in an isolated Docker container.

### 1.7 Core Concept Flow
$$\begin{matrix}
\text{Customer Delivery Pin} & \longrightarrow & \text{PostGIS Spatial Query} & \longrightarrow & \text{Eligible Nearby Stores} \\
\downarrow & & & & \downarrow \\
\text{Delivery Revalidation} & \longleftarrow & \text{Single-Store Cart} & \longleftarrow & \text{Store Product Catalog} \\
\downarrow & & & & \\
\text{Atomic Checkout (COD)} & \longrightarrow & \text{FSM Order Lifecycle} & \longrightarrow & \text{Delivered \& Verified Review}
\end{matrix}$$

---

## 2. SYSTEM AT A GLANCE

```text
                                  ┌─────────────────────────┐
                                  │    GeoMarket Platform    │
                                  └────────────┬────────────┘
                                               │
             ┌─────────────────────────────────┼─────────────────────────────────┐
             │                                 │                                 │
             ▼                                 ▼                                 ▼
   ┌───────────────────┐             ┌───────────────────┐             ┌───────────────────┐
   │     CUSTOMER      │             │      VENDOR       │             │       ADMIN       │
   └─────────┬─────────┘             └─────────┬─────────┘             └─────────┬─────────┘
             │                                 │                                 │
   ┌─────────┴─────────┐             ┌─────────┴─────────┐             ┌─────────┴─────────┐
   │ Set Location Pin  │             │ Onboard Stores    │             │ Store Governance  │
   │ (GPS / Leaflet)   │             │ (Centroid+Radius) │             │ (Approve/Reject)  │
   └─────────┬─────────┘             └─────────┬─────────┘             └─────────┬─────────┘
             ▼                                 ▼                                 ▼
   ┌───────────────────┐             ┌───────────────────┐             ┌───────────────────┐
   │ Discover Stores   │             │ Manage Products   │             │ Category Control  │
   │ (PostGIS 4-Tier)  │             │ & Atomic Stock    │             │ (Store & Product) │
   └─────────┬─────────┘             └─────────┬─────────┘             └─────────┬─────────┘
             ▼                                 ▼                                 │
   ┌───────────────────┐             ┌───────────────────┐                       │
   │ Store Catalog &   │             │ FSM Order Intake  │                       │
   │ Single-Store Cart │             │ & Dispatch (COD)  │                       │
   └─────────┬─────────┘             └─────────┬─────────┘                       │
             ▼                                 ▼                                 │
   ┌───────────────────┐             ┌───────────────────┐                       │
   │ Atomic Checkout   │             │ Revenue Analytics │                       │
   │ & Row-Locked Stock│             │ & Review Feedback │                       │
   └─────────┬─────────┘             └───────────────────┘                       │
             ▼                                                                   │
   ┌───────────────────┐                                                         │
   │ FSM Tracking &    │                                                         │
   │ Verified Review   │                                                         │
   └───────────────────┘                                                         │
             │                                                                   │
             └─────────────────────────────────┬─────────────────────────────────┘
                                               │
                                               ▼
                              ┌─────────────────────────────────┐
                              │    PostgreSQL 16 + PostGIS 3.4   │
                              │    Prisma ORM + Spatial GiST    │
                              └─────────────────────────────────┘
```

---

## 3. COMPLETE PAGE TREE

```text
GeoMarket
│
├── Public & Authentication
│   ├── Home Page (`/`)
│   ├── Login Page (`/login`)
│   ├── Customer Registration (`/register`)
│   └── Vendor Registration (`/register/vendor`)
│
├── Public & Guest Shopping Discovery (No Login Required)
│   ├── Store Discovery (`/stores`)
│   ├── Store Details & Catalog (`/stores/:id`)
│   ├── Cross-Store Product Catalog (`/products`)
│   ├── Single Product Detail Page (`/products/:id`)
│   ├── Shopping Cart (`/cart`)
│   ├── Checkout (Guest & Customer) (`/checkout`)
│   ├── Order Confirmation & Receipt (`/orders/:orderId/success`)
│   ├── Guest Order Tracking Lookup (`/orders/track`)
│   └── Order Tracking & Review (`/orders/:orderId`)
│
├── Customer Domain (Protected: `role == CUSTOMER`)
│   ├── Customer Dashboard (`/dashboard`)
│   ├── Customer Profile (`/profile`)
│   ├── Saved Delivery Addresses (`/addresses`)
│   └── Order History (`/orders`)
│
├── Vendor Domain (Protected: `role == VENDOR`)
│   ├── Vendor Operations Dashboard & Analytics (`/vendor`)
│   ├── Vendor Legal Profile (`/vendor/profile`)
│   ├── Store Management (`/vendor/stores`)
│   ├── Store-Scoped Products (`/vendor/stores/:storeId/products`)
│   ├── All Vendor Products & Inventory (`/vendor/products`)
│   └── Incoming Orders & Fulfillment (`/vendor/orders`)
│
├── Admin Domain (Protected: `role == ADMIN`)
│   ├── Platform Overview Dashboard (`/admin`)
│   ├── Store Verification & Approvals Queue (`/admin/stores`)
│   ├── Store & Product Category Taxonomies (`/admin/categories`)
│   ├── Platform Analytics & Reports (`/admin/analytics`)
│   ├── User Management Console (`/admin/users`)
│   └── Admin Settings & Security (`/admin/settings`)
│
└── Common
    └── 404 Not Found Catch-All (`*`)
```

### Complete Page Index Table

| Route | Page Name | Parent / Layout | Access Level | Primary Purpose | Primary Data Sources | Primary Actions & Destinations |
|---|---|---|---|---|---|---|
| `/` | `HomePage` | Root Shell | Public (Guest/Auth) | Platform presentation, quick categories, featured stores & role entry | Client static assets & active auth state | Navigate to `/stores`, `/products`, `/login`, `/register`, `/register/vendor` |
| `/login` | `LoginPage` | Root Shell | Public (Unauthenticated) | Authenticate existing users with "Continue as Guest" option | `POST /api/v1/auth/login`, `POST /api/v1/auth/guest-session` | Log in, receive HttpOnly cookie, or enter guest session |
| `/register` | `RegisterCustomerPage` | Root Shell | Public (Unauthenticated) | Onboard new customers | `POST /api/v1/auth/register/customer` | Create customer account, auto-login, navigate to `/dashboard` |
| `/register/vendor` | `RegisterVendorPage` | Root Shell | Public (Unauthenticated) | Onboard new merchants | `POST /api/v1/auth/register/vendor` | Create user + `VendorProfile`, navigate to `/vendor` |
| `/stores` | `StoresDiscoveryPage` | `AppLayout` | Public / Customer | Spatial store discovery via PostGIS with GPS loading spinner | `GET /api/v1/discovery/stores`, `GET /api/v1/addresses` | Select address / GPS pin, filter categories, view stores grid/map, navigate to `/stores/:id` |
| `/stores/:id` | `StoreDetailPage` | `AppLayout` | Public / Customer | Store information & catalog browsing | `GET /api/v1/discovery/stores/:id`, `.../products`, `.../reviews` | Search products, add to cart (handles single-store conflicts), view verified reviews |
| `/products` | `ProductsCatalogPage` | `AppLayout` | Public / Customer | Cross-store product discovery across delivering merchants | `GET /api/v1/discovery/products`, `GET /api/v1/discovery/stores` | Filter by store, category, price range, stock; sort by price/newest; navigate to `/products/:id` |
| `/products/:id` | `ProductDetailPage` | `AppLayout` | Public / Customer | Dedicated product page with high-res imagery and store card | `GET /api/v1/discovery/products/:id` | Select quantity, add to cart (handles store conflicts), view store delivery info, browse related items |
| `/cart` | `CartPage` | `AppLayout` | Public / Customer | Review store-anchored cart items (works for guests & customers) | `GET /api/v1/cart` | Adjust quantities, delete items, clear cart, proceed to `/checkout` |
| `/checkout` | `CheckoutPage` | `AppLayout` | Public / Customer | Finalize Cash on Delivery purchase with dual-mode address support | `GET /api/v1/cart`, `POST /api/v1/checkout` | Select saved address (customer) or enter inline address (guest), place COD order, proceed to `/orders/:id/success` |
| `/orders/:orderId/success` | `OrderSuccessPage` | `AppLayout` | Public / Customer | Post-order celebration, itemized receipt & printable invoice | `GET /api/v1/orders/:id` | Print invoice, inspect order summary, navigate to `/orders/track` or `/stores` |
| `/orders/track` | `GuestOrderLookupPage` | `AppLayout` | Public | Look up guest order without logging in | `POST /api/v1/orders/lookup` | Enter Order ID & phone number, inspect live delivery status |
| `/orders` | `CustomerOrdersPage` | `AppLayout` | Customer | View customer order history | `GET /api/v1/orders` | Inspect orders list, view status badges, navigate to `/orders/:orderId` |
| `/orders/:orderId` | `OrderDetailPage` | `AppLayout` | Public / Customer | Track order progression & submit review | `GET /api/v1/orders/:id`, `GET /api/v1/reviews/order/:id` | View FSM timeline, cancel order (if PLACED/CONFIRMED), submit/edit 1-5 star review |
| `/dashboard` | `CustomerDashboardPage` | `AppLayout` | Customer | Customer hub & delivery pin setup | `GET /api/v1/addresses`, `GET /api/v1/orders` | Launch Leaflet location picker, view default address, navigate to `/stores`, `/orders` |
| `/profile` | `CustomerProfilePage` | `AppLayout` | Customer | Manage identity and contact info | `GET /api/v1/auth/me` | View user identity, navigate to `/addresses` |
| `/addresses` | `SavedAddressesPage` | `AppLayout` | Customer | Manage physical delivery locations | `GET /api/v1/addresses` | Add pin via Leaflet map, reverse geocode, set default address, delete address |
| `/vendor` | `VendorDashboardPage` | `AppLayout` | Vendor | Operational hub & business analytics | `GET /api/v1/vendor/analytics`, `.../stores`, `.../products` | Filter analytics (`today`, `last_7_days`, `all_time`), inspect revenue, view reviews |
| `/vendor/profile` | `VendorProfilePage` | `AppLayout` | Vendor | Manage merchant legal identity | `GET /api/v1/auth/me` | Inspect business legal name, tax ID, and bank account metadata |
| `/vendor/stores` | `VendorStoresPage` | `AppLayout` | Vendor | Onboard and configure physical stores | `GET /api/v1/vendor/stores`, `GET /api/v1/categories/stores` | Create store, set Leaflet pin & radius, configure operating hours, toggle order intake |
| `/vendor/stores/:storeId/products` | `VendorProductsPage` | `AppLayout` | Vendor | Manage catalog for a specific store | `GET /api/v1/vendor/stores/:storeId/products` | Create product, edit pricing/details, adjust stock, toggle active state |
| `/vendor/products` | `VendorProductsPage` | `AppLayout` | Vendor | Manage all owned products across stores | `GET /api/v1/vendor/products` | Filter by store/category, perform atomic stock adjustments (`SET`, `INC`, `DEC`) |
| `/vendor/orders` | `VendorOrdersPage` | `AppLayout` | Vendor | Live order fulfillment & dispatch | `GET /api/v1/vendor/orders`, `PATCH .../orders/:id/status` | Move order along FSM (`CONFIRM`, `PREPARE`, `READY`, `DISPATCH`, `DELIVER`), cancel |
| `/admin` | `AdminDashboardPage` | `AppLayout` | Admin | Real-time platform revenue & operations overview | `GET /api/v1/admin/stats` | Inspect revenue (total, monthly, weekly, today), order counts, live orders feed, top stores |
| `/admin/stores` | `AdminStoresPage` | `AppLayout` | Admin | Store auditing & lifecycle queue | `GET /api/v1/admin/stores` | Filter by status (`PENDING_APPROVAL`, `APPROVED`, `REJECTED`, `SUSPENDED`), launch audit modal |
| `/admin/categories` | `AdminCategoriesPage` | `AppLayout` | Admin | Category taxonomy management | `GET/POST/PUT/DELETE /api/v1/admin/categories/*` | Create, update, toggle, and delete Store Categories and Product Categories |
| `/admin/analytics` | `AdminAnalyticsPage` | `AppLayout` | Admin | Real-time platform metrics & revenue breakdowns | `GET /api/v1/admin/stats` | View revenue distribution, order timelines, merchant performance bars, recent order records |
| `/admin/users` | `AdminUsersPage` | `AppLayout` | Admin | Global user management console | `GET /api/v1/admin/users`, `PATCH .../role`, `DELETE .../:id` | Filter users by role, search by name/email, view vendor stores in modal, promote/demote role, delete user |
| `/admin/settings` | `AdminSettingsPage` | `AppLayout` | Admin | Admin security & password change | `GET /api/v1/auth/me`, `POST /api/v1/admin/change-password` | View privileges, change admin password with client validation and BCrypt hashing |
| `*` | `NotFoundPage` | Root Shell | Public (All) | Handle invalid URL requests | Client-side routing catch-all | Return to home page or role dashboard |

---
