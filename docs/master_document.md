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

## 4. PAGE-BY-PAGE EXPLANATION

---

### Page: Home Page

**Route:** `/`  
**Role:** Public (Unauthenticated Guests & Authenticated Users)  
**Parent:** Root Application Shell (`App.tsx`)

#### Purpose
The Home Page serves as the public landing page and brand showcase for GeoMarket. It introduces prospective customers and merchants to the concept of location-first shopping and directs users to registration, login, or direct marketplace browsing.

#### What the user sees
* Navigation bar with GeoMarket logo, "Browse Stores" button, "Sign In" link, and "Get Started" call-to-action button.
* Hero section highlighting "Local Shopping, Delivered Instantly" with dynamic entry points.
* Value proposition cards explaining the difference between GeoMarket's local delivery reach and traditional multi-day e-commerce shipping.
* Direct action buttons allowing users to jump straight into store discovery (`/stores`) or onboard as a merchant (`/register/vendor`).

#### Data displayed
* Static platform branding and value propositions.
* Active authenticated user session (if logged in, navbar renders the user's avatar, name, and role dashboard shortcut).

#### User actions
* Click "Browse Stores" $\rightarrow$ Navigates to `/stores`.
* Click "Sign In" $\rightarrow$ Navigates to `/login`.
* Click "Get Started" $\rightarrow$ Navigates to `/register`.
* Click "Become a Vendor" $\rightarrow$ Navigates to `/register/vendor`.

#### Data flow
```text
Browser loads URL '/'
    ↓
React Router matches HomePage component
    ↓
useCurrentUser hook checks cache / issues GET /api/v1/auth/me
    ↓
If session exists: Header displays UserMenu & role-specific links
If session null: Header displays Guest Sign in / Register buttons
```

#### Next possible pages
* `/stores`
* `/login`
* `/register`
* `/register/vendor`
* `/dashboard` (if customer clicks logo while logged in)
* `/vendor` (if vendor clicks logo while logged in)
* `/admin` (if admin clicks logo while logged in)

---

### Page: Login Page

**Route:** `/login`  
**Role:** Public (Unauthenticated)  
**Parent:** Root Application Shell (`App.tsx`)

#### Purpose
Enables registered customers, vendors, and administrators to securely authenticate and establish an active session via an encrypted, secure cookie.

#### What the user sees
* Centered authentication card with GeoMarket branding.
* Form fields: Email Address and Password.
* Submit button with loading spinner during authentication.
* Quick links to Customer Registration (`/register`) and Vendor Registration (`/register/vendor`).
* Error notification banner for invalid credentials or inactive accounts.

#### Data displayed
* Form input fields and real-time validation error text.

#### User actions
* Enter email and password.
* Click "Sign In" to submit credentials.
* Click link to register as a new customer or vendor.

#### Data flow
```text
User enters email & password and submits form
    ↓
LoginPage calls authApi.login({ email, password })
    ↓
HTTP POST /api/v1/auth/login
    ↓
Express Route: authRouter.post('/login')
    ↓
Controller: authController.login() validates body with loginSchema (Zod)
    ↓
Service: authService.login() queries database via authRepository.findUserByEmail()
    ↓
Password Verification: bcrypt.compare(password, user.passwordHash)
[Timing attack protection: executes dummy bcrypt hash if email not found]
    ↓
JWT Creation: jwt.sign({ sub: user.id, role: user.role, vendorProfileId })
    ↓
Response: Sets HttpOnly, Secure, SameSite=Lax cookie named 'token'
Returns JSON { user: AuthUser }
    ↓
Frontend: TanStack Query cache invalidates 'currentUser' query
    ↓
Navigate: Redirects user to role dashboard (/dashboard, /vendor, or /admin)
```

#### Next possible pages
* `/dashboard` (if `role == CUSTOMER`)
* `/vendor` (if `role == VENDOR`)
* `/admin` (if `role == ADMIN`)
* `/register`
* `/register/vendor`

---

### Page: Customer Registration Page

**Route:** `/register`  
**Role:** Public (Unauthenticated)  
**Parent:** Root Application Shell (`App.tsx`)

#### Purpose
Allows new consumers to create a personal customer account to enable delivery address management, cart operations, checkout, and order tracking.

#### What the user sees
* Registration form card with fields: First Name, Last Name, Email, Phone Number, Password, Confirm Password.
* Client-side validation indicators (password length $\ge$ 8 characters, phone number format).
* Submit button with loading spinner.
* Link to switch to Vendor Registration (`/register/vendor`) or Login (`/login`).

#### Data displayed
* Blank input fields and validation feedback messages.

#### User actions
* Fill out customer personal information.
* Submit registration form.

#### Data flow
```text
User fills registration fields and submits
    ↓
RegisterCustomerPage calls authApi.registerCustomer(input)
    ↓
HTTP POST /api/v1/auth/register/customer
    ↓
Controller: Validates input with registerCustomerSchema (Zod)
    ↓
Service: Checks for email duplication (throws 409 if exists)
Hashes password using bcrypt.hash(password, 12)
    ↓
Database: prisma.user.create({ role: 'CUSTOMER', ... })
    ↓
JWT generated and issued in HttpOnly cookie 'token'
    ↓
Response: 201 Created with JSON { user: AuthUser }
    ↓
Frontend: Updates auth state and redirects directly to /dashboard
```

#### Next possible pages
* `/dashboard`
* `/login`
* `/register/vendor`

---

### Page: Vendor Registration Page

**Route:** `/register/vendor`  
**Role:** Public (Unauthenticated)  
**Parent:** Root Application Shell (`App.tsx`)

#### Purpose
Enables merchant business owners to register their merchant identity, creating both their foundational `User` record and their associated 1:1 `VendorProfile` record in a single atomic database transaction.

#### What the user sees
* Merchant registration card with two distinct sections:
  1. Personal Contact Details: First Name, Last Name, Email, Phone, Password.
  2. Merchant Entity Information: Business Legal Name.
* Submit button and redirection links.

#### Data displayed
* Form input fields and merchant validation messages.

#### User actions
* Input merchant contact information and legal business name.
* Submit merchant registration form.

#### Data flow
```text
Merchant submits form
    ↓
RegisterVendorPage calls authApi.registerVendor(input)
    ↓
HTTP POST /api/v1/auth/register/vendor
    ↓
Controller: Validates input with registerVendorSchema (Zod)
    ↓
Service: Verifies email uniqueness; hashes password with BCrypt (cost 12)
    ↓
Database: prisma.$transaction creates:
  1. User (role: 'VENDOR')
  2. VendorProfile (linked to User.id via user_id)
    ↓
JWT generated with sub: User.id, role: 'VENDOR', vendorProfileId: VendorProfile.id
    ↓
Response: Sets HttpOnly cookie and returns 201 Created
    ↓
Frontend: Redirects newly onboarded merchant to /vendor
```

#### Next possible pages
* `/vendor`
* `/login`
* `/register`

---

### Page: Stores Discovery Page

**Route:** `/stores`  
**Role:** Public / Customer  
**Parent:** Application Shell (`AppLayout.tsx`)

#### Purpose
The primary discovery interface of GeoMarket. It implements the core value proposition of the system: allowing customers to view only verified physical stores that are currently capable of delivering to their selected physical location.

#### What the user sees
* **Location Bar:** Displays the current active delivery location coordinates, an address dropdown of the customer's saved addresses, a "GPS Current Location" button, and a "Change Pin" button that opens an interactive Leaflet map modal.
* **Search & Taxonomy Bar:** Live search input for store names and category pill filters (`ALL`, `Groceries`, `Bakery`, `Pharmacy`, etc.).
* **View Toggle:** Switch between "Grid View" (responsive store cards) and "Map View" (interactive Leaflet map showing customer pin and store delivery radius circles).
* **Store Cards:** Each card displays store name, category badge, computed geodesic distance in kilometers (e.g., `1.42 km away`), configured delivery radius, base delivery fee, minimum order amount, average star rating, review count, and real-time open/closed status.

#### Data displayed
* Customer's saved addresses from `GET /api/v1/addresses`.
* Store category list from `GET /api/v1/categories/stores`.
* Paginated list of eligible discovered stores from `GET /api/v1/discovery/stores?latitude=X&longitude=Y&...`.

#### User actions
* Select an address from the dropdown $\rightarrow$ Updates coordinates and triggers discovery refetch.
* Click "GPS" $\rightarrow$ Queries browser `navigator.geolocation` and updates coordinates.
* Click "Change Pin" $\rightarrow$ Launches `LocationPickerModal` to drop a pin anywhere on the Leaflet map.
* Type in store search input $\rightarrow$ Debounces and queries matching store names.
* Click a category pill $\rightarrow$ Filters discovered stores by store category.
* Toggle between Grid and Map view.
* Click a store card $\rightarrow$ Navigates to `/stores/:id`.

#### Data flow
```text
User selects location (e.g., Lat: 31.4187, Lon: 73.0791)
    ↓
StoresDiscoveryPage updates discoveryParams state
    ↓
useDiscoveredStores hook issues HTTP GET /api/v1/discovery/stores?latitude=31.4187&longitude=73.0791
    ↓
Backend Route: discoveryRouter.get('/stores')
    ↓
Controller: discoveryController.getDiscoveredStores() validates query params via Zod
    ↓
Service: discoveryService.discoverStores()
    ↓
Repository: discoveryRepository.findDiscoveredStores() executes parameterized raw SQL:
  - Bounding box index pre-filter: ST_DWithin on stores.location using GiST index
  - Geodesic radius check: ST_DWithin(s.location, customerPoint, s.delivery_radius_km * 1000)
  - Operating hours check: safe_timestamptz_at_tz verifies store is open on current day and time
  - Status check: status = 'APPROVED' AND is_active = true AND is_accepting_orders = true
  - Distance calculation: ST_Distance(s.location, customerPoint) / 1000.0 AS distance_km
    ↓
Database returns matching stores sorted deterministically by distance_km ASC
    ↓
Response: 200 OK with DiscoveredStoresResponseDto
    ↓
Frontend renders store cards with live badges and distance tags
```

#### Next possible pages
* `/stores/:id` (Store details and product catalog)
* `/cart`
* `/dashboard`

---

### Page: Store Detail & Product Catalog Page

**Route:** `/stores/:id`  
**Role:** Public / Customer  
**Parent:** Application Shell (`AppLayout.tsx`)

#### Purpose
Presents comprehensive store details (address, operating hours, delivery radius, ratings) and the store's complete product catalog. It is the primary page where items are added to the customer's cart.

#### What the user sees
* **Store Header Card:** Store title, category badge, full physical address, base delivery fee, minimum order amount, overall rating with review count, and weekly operating hours schedule.
* **Product Search Bar:** Search bar to find specific products within this store.
* **Product Catalog Grid:** Product cards showing item image, product name, unit specification (e.g., `1 kg`, `500 ml`), unit price in PKR, stock availability badge, quantity counter (`-` / `+`), and "Add to Cart" button.
* **Verified Reviews Section:** Customer reviews displaying star ratings, reviewer names, review submission dates, and comments.
* **Single-Store Conflict Dialog:** Modal that appears if a customer attempts to add a product from this store while their active cart already contains items from a different store.

#### Data displayed
* Store metadata and operating hours from `GET /api/v1/discovery/stores/:id`.
* Store catalog items from `GET /api/v1/discovery/stores/:id/products`.
* Verified store reviews from `GET /api/v1/reviews/store/:storeId`.
* Active cart state from `GET /api/v1/cart`.

#### User actions
* Search products by name within the store.
* Adjust product quantity counter.
* Click "Add to Cart" $\rightarrow$ Adds product to active cart.
* If conflict modal appears: click "Clear Cart & Add" $\rightarrow$ Clears old store items and adds item from the current store.
* Read verified customer reviews.

#### Data flow
```text
Customer clicks "Add to Cart" on a product
    ↓
StoreDetailPage calls useAddToCart mutation: POST /api/v1/cart/items
    ↓
Backend Cart Service locks user cart with SELECT ... FOR UPDATE
    ↓
Case 1: Cart is empty or belongs to THIS store
  → Adds item to cart, commits transaction, returns 200 OK with updated CartDto
  → Frontend updates cart badge in header and displays success toast

Case 2: Cart already contains items from ANOTHER store
  → Backend catches mismatch and aborts transaction
  → Throws CartServiceError with HTTP 409 and code 'CART_STORE_CONFLICT'
  → Response includes details: { currentStoreName, attemptedStoreName }
  → Frontend catches 409 error and opens Single-Store Conflict Dialog
  → If user confirms "Clear & Add":
      1. Calls DELETE /api/v1/cart (clears cart)
      2. Calls POST /api/v1/cart/items (adds new store product)
      3. Closes dialog and updates UI
```

#### Next possible pages
* `/cart`
* `/stores`
* `/login` (if unauthenticated user attempts to add to cart)

---

### Page: Products Catalog Page

**Route:** `/products`  
**Role:** Public / Customer  
**Parent:** Application Shell (`AppLayout.tsx`)

#### Purpose
Cross-store product discovery and exploration engine. Enables users to browse items across all verified, open merchants delivering to their active delivery vicinity, with comprehensive sidebar filtering and URL synchronization.

#### What the user sees
* **Active Delivery Toolbar:** Current address coordinates, address dropdown, GPS detection button with spinner, and Leaflet location picker launcher.
* **Vertical Left-Sidebar Filters (Desktop & Mobile Drawer):**
  - Search input for matching product names.
  - Store Filter list: Displays all delivering stores in range with radio selection.
  - Product Category filters.
  - Price Range filter sliders (Min / Max PKR).
  - "In Stock Only" toggle.
  - Reset filters button.
* **Product Sorting Controls:** Sort by Price (Low to High, High to Low), Newest, and Name.
* **Product Catalog Cards:** High-resolution product images, title, store badge with distance, price in PKR, stock badge, and "View Product" button.
* **Pagination Controls:** Previous/Next buttons and page indices.

#### Data displayed
* Discovered products list from `GET /api/v1/discovery/products?...`.
* In-range stores list from `GET /api/v1/discovery/stores?...`.
* Product categories from `GET /api/v1/categories/products`.

#### User actions
* Filter products by store, category, price, and stock status.
* Sort products by price, newest arrivals, or alphabetical name.
* Click product card $\rightarrow$ Navigates to `/products/:id`.

#### Data flow
```text
User applies filters or sorts products
    ↓
URL query parameters update automatically (?storeId=...&minPrice=...&inStockOnly=true)
    ↓
useDiscoveredProducts hook fetches GET /api/v1/discovery/products with active coordinates and filters
    ↓
PostGIS re-verifies stores in radius and returns matching catalog items
    ↓
Frontend renders responsive product grid
```

#### Next possible pages
* `/products/:id`
* `/stores/:id`
* `/cart`

---

### Page: Single Product Detail Page

**Route:** `/products/:id`  
**Role:** Public / Customer  
**Parent:** Application Shell (`AppLayout.tsx`)

#### Purpose
Deep-dive single product page providing complete specifications, stock visibility, merchant identity, direct cart controls, and related recommendations.

#### What the user sees
* **Breadcrumb Navigation:** Home $\rightarrow$ Products $\rightarrow$ Category $\rightarrow$ Product Name.
* **Product Visual Showcase:** High-resolution product image gallery with zoom capability.
* **Product Overview & Metadata:** Product name, price in PKR, unit size (e.g., `1 kg`, `500 ml`), SKU code, category badge, and in-stock / out-of-stock badge.
* **Merchant Card:** Originating physical store name, category, computed distance (km), delivery fee, and link to store details.
* **Interactive Quantity Stepper:** Increment / decrement controls respecting real-time available stock.
* **"Add to Cart" Button:** Adds item to active cart or launches single-store conflict modal if cart is anchored to another store.
* **Single-Store Conflict Modal:** Prompts user to clear existing cart or keep current merchant items.
* **Related Products Carousel:** Showcase of other products from the same category or merchant.

#### Data displayed
* Product details from `GET /api/v1/discovery/products/:id`.
* Related items from store catalog.

#### User actions
* Select quantity and click "Add to Cart".
* Resolve single-store cart conflicts if prompted.
* Click merchant card to visit `/stores/:id`.
* Click related product cards to navigate to other products.

#### Data flow
```text
User opens /products/:id
    ↓
GET /api/v1/discovery/products/:id
    ↓
Returns DiscoveredProductDetailDto with store coordinates and real-time inventory
    ↓
User clicks "Add to Cart"
    ↓
POST /api/v1/cart/items (handles single-store invariant check)
```

#### Next possible pages
* `/cart`
* `/stores/:storeId`
* `/products`

---

### Page: Customer Dashboard Page

**Route:** `/dashboard`  
**Role:** Customer (`role == CUSTOMER`)  
**Parent:** Application Shell (`AppLayout.tsx`)

#### Purpose
Acts as the central command center for the customer. It displays their active delivery location status, recent orders, and quick access navigation cards.

#### What the user sees
* Welcome banner personalized with the customer's first name.
* **Active Delivery Pin Card:** Displays the customer's current default delivery address label, address line, city, and coordinates. Includes a button to launch the Leaflet location picker modal.
* **Quick Access Grid:** Three navigation cards:
  1. "My Profile": Account name, email, phone number, link to manage profile.
  2. "Delivery Addresses": Saved address count, default location summary, link to address manager.
  3. "Recent Orders": Latest order count, link to full order history.
* **Store Discovery Callout:** Prominent banner directing the customer to discover nearby stores.

#### Data displayed
* User identity from `useCurrentUser`.
* Customer addresses from `GET /api/v1/addresses`.
* Recent customer orders from `GET /api/v1/orders`.

#### User actions
* Click "Change Delivery Location" $\rightarrow$ Opens interactive Leaflet location picker.
* Click "Discover Stores" $\rightarrow$ Navigates to `/stores`.
* Click "Manage Profile" $\rightarrow$ Navigates to `/profile`.
* Click "Manage Addresses" $\rightarrow$ Navigates to `/addresses`.
* Click "View All Orders" $\rightarrow$ Navigates to `/orders`.

#### Data flow
```text
Dashboard mounts
    ↓
Issues parallel TanStack Query requests:
  - GET /api/v1/addresses
  - GET /api/v1/orders?page=1&pageSize=5
    ↓
Renders location card using default address (isDefault == true)
Renders recent orders timeline
```

#### Next possible pages
* `/stores`
* `/addresses`
* `/orders`
* `/profile`
* `/cart`

---

### Page: Customer Profile Page

**Route:** `/profile`  
**Role:** Customer (`role == CUSTOMER`)  
**Parent:** Application Shell (`AppLayout.tsx`)

#### Purpose
Provides the customer with visibility into their account identity, contact information, and role designation.

#### What the user sees
* Personal profile card showing First Name, Last Name, Email Address, Phone Number, Account Role badge (`Customer`), and account registration date.
* Security information banner explaining that authentication credentials are encrypted using BCrypt.
* Shortcut button to view saved delivery addresses.

#### Data displayed
* `AuthUser` object provided by `useCurrentUser` (`GET /api/v1/auth/me`).

#### User actions
* Review personal information.
* Navigate to address management.

#### Data flow
```text
Page reads currentUser from React Query cache (hydrated from /auth/me)
Renders read-only identity cards
```

#### Next possible pages
* `/addresses`
* `/dashboard`
* `/orders`

---

### Page: Saved Delivery Addresses Page

**Route:** `/addresses`  
**Role:** Customer (`role == CUSTOMER`)  
**Parent:** Application Shell (`AppLayout.tsx`)

#### Purpose
Enables customers to create, inspect, edit, set default, and delete physical delivery addresses with exact geographic coordinates. This page is fundamental to GeoMarket's spatial discovery and checkout validation.

#### What the user sees
* List of saved delivery address cards.
* Each card shows address label (e.g., "Home", "Office"), recipient name, phone, full street address line, city, latitude and longitude, and a green "Default" badge if active.
* Action buttons on each card: "Set as Default" (if not already default) and "Delete".
* "Add New Address" button that launches the interactive Leaflet Map Modal.
* Interactive Leaflet Location Picker Modal:
  - Full-screen interactive map with draggable pinpoint marker.
  - Search bar with forward geocoding (search by street or landmark).
  - Reverse geocoding feedback (moving the pin automatically resolves street address and city via Nominatim / Photon providers).
  - Manual input fields to refine label, recipient details, and address text.

#### Data displayed
* Array of `CustomerAddressDto` items from `GET /api/v1/addresses`.

#### User actions
* Click "Add New Address" $\rightarrow$ Opens map modal.
* Pan and click on map $\rightarrow$ Drops pin, triggers reverse geocoding to fill address fields.
* Save new address $\rightarrow$ Submits coordinates and address metadata.
* Click "Set as Default" on an address $\rightarrow$ Sets address as primary delivery location.
* Click "Delete" $\rightarrow$ Removes address from customer account.

#### Data flow
```text
User drops pin on Leaflet map and clicks "Save Address"
    ↓
POST /api/v1/addresses
    ↓
Controller: Validates input with createAddressSchema (Zod)
    ↓
Service: Checks address count; if first address, automatically sets isDefault = true
    ↓
Repository: If isDefault == true, executes Prisma transaction:
  1. Sets isDefault = false on all existing addresses for this user
  2. Creates new CustomerAddress with isDefault = true
[Guaranteed by DB partial unique index: UNIQUE(user_id) WHERE is_default = true]
    ↓
Response: 201 Created with CustomerAddressDto
    ↓
Frontend refetches addresses and updates default delivery pin across the app
```

#### Next possible pages
* `/dashboard`
* `/stores`
* `/checkout`

---

### Page: Shopping Cart Page

**Route:** `/cart`  
**Role:** Customer (`role == CUSTOMER`)  
**Parent:** Application Shell (`AppLayout.tsx`)

#### Purpose
Displays items currently selected for purchase. Enforces the strict single-store cart invariant, computes live subtotal and delivery charges, and verifies stock availability before checkout.

#### What the user sees
* **Store Header:** Identifies the single physical store this cart is anchored to, along with its base delivery fee and minimum order amount.
* **Itemized List:** Cart item rows displaying product image, title, unit price, quantity adjustment controls (`-` / `+`), line total, available stock indicator, and delete trash icon.
* **Order Summary Card:** Subtotal, Store Base Delivery Fee, Minimum Order Shortfall notice (if subtotal is below minimum order amount), and Total Amount.
* **Validation Alerts:** Warning notices if an item has become out of stock or if the store has stopped accepting orders.
* **Action Buttons:** "Clear Cart" button (opens confirmation dialog) and "Proceed to Checkout" button (disabled if cart is invalid or minimum order amount is unmet).

#### Data displayed
* Active cart details from `GET /api/v1/cart`.

#### User actions
* Click `+` or `-` to increment or decrement item quantity.
* Click trash icon to remove an individual product from the cart.
* Click "Clear Cart" to delete all items and detach the store anchor.
* Click "Proceed to Checkout" $\rightarrow$ Navigates to `/checkout`.

#### Data flow
```text
User adjusts quantity on a cart item
    ↓
CartPage calls useUpdateCartItem: PATCH /api/v1/cart/items/:itemId { quantity: N }
    ↓
Controller validates quantity >= 1
    ↓
Service verifies cart ownership, locks row, and checks real-time product stock
    ↓
Database updates cart_items record
    ↓
Cart service formats cart, evaluates allAvailable and isStoreAccepting flags
    ↓
Response: 200 OK with recalculated CartDto
    ↓
Frontend updates subtotal, item totals, and checkout button enablement state
```

#### Next possible pages
* `/checkout`
* `/stores/:id` (to add more items from the same store)
* `/stores` (if cart is empty)

---

### Page: Checkout Page

**Route:** `/checkout`  
**Role:** Public / Customer  
**Parent:** Application Shell (`AppLayout.tsx`)

#### Purpose
The final purchase confirmation screen where customers or guests confirm delivery information and commit their order via Cash on Delivery (COD). It coordinates the final pre-order verification pipeline across both registered and guest sessions.

#### What the user sees
* **Dual-Mode Delivery Address Section:**
  - *Registered Customer Mode:* Radio cards of all saved addresses with "Deliver to this Address" selection, or inline "Add New Address" option.
  - *Guest Checkout Mode:* Inline address form prompting for Recipient Full Name, Recipient Phone Number, Street Address Line, City, and interactive Map Pin selection with GPS coordinate geocoding.
* **Order Review Card:** List of items being ordered, quantities, and line totals.
* **Store & Dispatch Information:** Name and physical location of the originating merchant store.
* **Payment Method Card:** Cash on Delivery (COD) pre-selected with a description explaining cash is collected at doorstep upon arrival.
* **Price Breakdown Card:** Subtotal, Authoritative Base Delivery Fee, and Final Total.
* **"Place Order (Cash on Delivery)" Button:** Initiates atomic order placement with loading spinner and error alerts.

#### Data displayed
* Active cart items and store fees from `GET /api/v1/cart`.
* Customer's saved delivery addresses from `GET /api/v1/addresses` (if authenticated customer).

#### User actions
* Choose saved address or input guest delivery information.
* Review order items and financial breakdown.
* Click "Place Order (Cash on Delivery)".

#### Data flow
```text
Customer or Guest clicks "Place Order"
    ↓
CheckoutPage calls checkoutMutation: POST /api/v1/checkout
Payload:
  - If Registered Customer: { addressId: "uuid" }
  - If Guest: { inlineAddress: { recipientName, recipientPhone, addressLine, city, latitude, longitude } }
    ↓
Express Route: checkoutRouter.post('/', checkoutController)
    ↓
Backend Service executes authoritative validation:
  1. If addressId: Validates ownership by authenticated customer
  2. If inlineAddress: Validates coordinates and creates temporary/default address record
  3. Validates cart exists, contains items, and has an active storeId
  4. Validates store is APPROVED, isActive, and isAcceptingOrders
  5. Validates store is open right now in local timezone (safe_timestamptz_at_tz)
  6. PostGIS spatial check: ST_DWithin(store.location, addressPoint, store.delivery_radius_km * 1000)
  7. Pre-validates product active states and stock levels
    ↓
Database Transaction (orderRepository.createCheckoutOrderTransaction):
  - Pessimistic locks on cart and product rows (SELECT ... FOR UPDATE ORDER BY id)
  - Re-verifies stock and verifies subtotal >= store.minOrderAmount under lock
  - Creates Order record (status: PLACED, paymentMethod: COD, paymentStatus: PENDING)
  - Creates OrderItem records with immutable productNameSnapshot and unitPriceSnapshot
  - Creates OrderAddressSnapshot with immutable recipient, address, and coordinates
  - Atomically decrements product stock quantities (stockQuantity = stockQuantity - quantity)
  - Clears cart items and resets cart.storeId = null
    ↓
Transaction commits atomically
    ↓
Response: 201 Created with full OrderDto
    ↓
Frontend navigates customer or guest to /orders/:orderId/success
```

#### Next possible pages
* `/orders/:orderId/success` (Immediate redirection upon order placement)
* `/cart` (if customer clicks back)
* `/addresses` (to manage addresses)

---

### Page: Customer Orders History Page

**Route:** `/orders`  
**Role:** Customer (`role == CUSTOMER`)  
**Parent:** Application Shell (`AppLayout.tsx`)

#### Purpose
Displays a chronological log of all orders placed by the customer, their current lifecycle status, and links to detailed tracking.

#### What the user sees
* Header: "My Orders" and historical order count.
* Order Cards list, each showing:
  - Order ID (shortened 8-character hash).
  - Store name where order was placed.
  - Creation date and time.
  - Order status badge (`PLACED`, `CONFIRMED`, `PREPARING`, `READY`, `OUT_FOR_DELIVERY`, `DELIVERED`, `CANCELLED`).
  - Total item count and total amount in PKR.
  - "View Order Details & Tracking" button.
* Empty state card if no orders have ever been placed.

#### Data displayed
* Paginated array of customer orders from `GET /api/v1/orders`.

#### User actions
* Browse past and active orders.
* Click on an order card $\rightarrow$ Navigates to `/orders/:orderId`.

#### Data flow
```text
Page mounts
    ↓
useCustomerOrders hook issues GET /api/v1/orders?page=1&pageSize=20
    ↓
Backend queries prisma.order.findMany where userId == req.user.id
    ↓
Orders returned with store summary, items count, snapshots, and timestamps
    ↓
Frontend renders ordered list with dynamic color-coded status badges
```

#### Next possible pages
* `/orders/:orderId`
* `/stores`

---

### Page: Customer Order Detail & Tracking Page

**Route:** `/orders/:orderId`  
**Role:** Public / Customer  
**Parent:** Application Shell (`AppLayout.tsx`)

#### Purpose
Provides real-time visibility into an active or completed order. Shows the visual Finite State Machine (FSM) timeline, immutable snapshot details, allows order cancellation if eligible, and provides verified review submission upon delivery.

#### What the user sees
* **FSM Progress Tracker:** Horizontal step progression visualizing:
  `Order Placed` $\rightarrow$ `Confirmed` $\rightarrow$ `Preparing` $\rightarrow$ `Ready for Pickup` $\rightarrow$ `Out for Delivery` $\rightarrow$ `Delivered`.
  (If cancelled, renders a red `Cancelled` state banner).
* **Order Cancellation Section:** If the order is in `PLACED` or `CONFIRMED` status, a red "Cancel Order" button is visible.
* **Immutable Address Snapshot Card:** Delivery recipient name, phone number, street address, and city exactly as snapshotted at checkout.
* **Immutable Items Snapshot Card:** List of items purchased, with original snapshot unit prices and quantities, immune to subsequent vendor catalog edits.
* **Payment Summary Card:** Subtotal, delivery fee, total amount, Cash on Delivery badge, and payment status (`PENDING` or `PAID`).
* **Verified Store Review Card (Delivered Orders Only):**
  - If unreviewed: 5-star interactive rating picker, text comment box, and "Submit Review" button.
  - If reviewed: Displays submitted star rating, comment, submission date, and options to edit or delete the review.

#### Data displayed
* Order entity and snapshots from `GET /api/v1/orders/:orderId`.
* Review entity from `GET /api/v1/reviews/order/:orderId` (if status is `DELIVERED`).

#### User actions
* Track delivery progress.
* Cancel order (if eligible) $\rightarrow$ Opens confirmation dialog, restores inventory, and cancels order.
* Submit 1–5 star review and comment for delivered orders.
* Edit or delete existing review.

#### Data flow
```text
Submitting a Verified Review:
Customer selects 5 stars, types comment, and clicks "Submit Review"
    ↓
POST /api/v1/reviews { orderId, rating: 5, comment: "Excellent service" }
    ↓
Service verifies:
  1. Order exists and belongs to authenticated customer (order.userId == req.user.id)
  2. Order status is strictly DELIVERED
  3. No existing review exists for this order (UNIQUE constraint on order_id)
  4. Vendor cannot review own store
    ↓
Database Transaction (reviewRepository.createReviewTransaction):
  - Inserts Review record
  - Computes new store aggregates: averageRating and totalReviews via prisma.review.aggregate
  - Updates Store record with new averageRating and totalReviews
    ↓
Response: 201 Created with ReviewDto
    ↓
UI updates to show published review with Edit/Delete controls
```

#### Next possible pages
* `/orders`
* `/stores/:id` (Store page reflecting updated average rating)
* `/orders/:orderId/success`

---

### Page: Order Success Confirmation Page

**Route:** `/orders/:orderId/success`  
**Role:** Public / Customer  
**Parent:** Application Shell (`AppLayout.tsx`)

#### Purpose
Immediate post-purchase confirmation screen. Welcomes the customer or guest with a celebration banner, presents a clean itemized receipt, displays recipient delivery details, and provides instant invoice printing capability.

#### What the user sees
* **Celebration Banner:** Success checkmark animation, "Order Placed Successfully!" greeting, and generated Order ID reference code.
* **Order Status Pill:** Real-time badge indicating current status (`Placed`, `Confirmed`, etc.).
* **Itemized Receipt Card:** Full listing of all ordered items, snapshot unit prices, quantities, and line totals.
* **Financial Summary:** Subtotal, Store Delivery Fee, and Final Payable Amount in PKR.
* **Delivery Destination Card:** Recipient name, phone number, and physical street address.
* **Action Buttons:**
  - "Print Invoice": Opens the browser's native print dialog with styled printable layout.
  - "Track Live Order": Direct link to `/orders/:orderId`.
  - "Continue Shopping": Direct link back to `/stores`.

#### Data displayed
* Order details from `GET /api/v1/orders/:orderId`.

#### User actions
* Click "Print Invoice" to generate physical/PDF copy of order receipt.
* Click "Track Live Order" to monitor FSM progression.
* Click "Continue Shopping" to browse more stores.

#### Data flow
```text
Checkout succeeds → React Router navigates to /orders/:orderId/success
    ↓
Component loads order details via useCustomerOrder(orderId)
    ↓
Renders printable receipt and delivery coordinates
```

#### Next possible pages
* `/orders/:orderId`
* `/stores`
* `/orders/track`

---

### Page: Guest Order Lookup Page

**Route:** `/orders/track`  
**Role:** Public (No Authentication Required)  
**Parent:** Application Shell (`AppLayout.tsx`)

#### Purpose
Enables guest customers who placed orders without creating an account to look up and track their order status using their Order ID and recipient phone number.

#### What the user sees
* **Tracking Input Form:** Order ID field (UUID or short code) and Recipient Phone Number field.
* **"Track Order" Button:** Submits query with loading spinner.
* **Active Order Status Summary (upon match):** Order status badge, merchant store name, ordered items preview, total payable amount, and direct link to full tracking timeline (`/orders/:orderId`).
* **Error Banner:** Informative alert if the order ID and phone number combination is not found.

#### Data displayed
* Order summary matching credentials via `POST /api/v1/orders/lookup`.

#### User actions
* Enter Order ID and phone number.
* Inspect order progression without authenticating.
* Click through to full order details.

#### Data flow
```text
Guest enters orderId and phone → Clicks "Track Order"
    ↓
POST /api/v1/orders/lookup { orderId, phone }
    ↓
Backend validates phone matches order address snapshot
    ↓
Returns matching OrderDto
    ↓
Frontend renders tracking summary card and link to /orders/:orderId
```

#### Next possible pages
* `/orders/:orderId`
* `/stores`
* `/login`

---
---

### Page: Vendor Operations Dashboard & Analytics Page

**Route:** `/vendor`  
**Role:** Vendor (`role == VENDOR`)  
**Parent:** Application Shell (`AppLayout.tsx`)

#### Purpose
The operational headquarters for merchants. Provides high-level store telemetry, real-time performance analytics calculated directly from finalized orders, review metrics, and operational quick links.

#### What the user sees
* **Vendor Identification Banner:** Shows merchant legal profile ID and active physical store count.
* **Operational Performance Controls:**
  - Store selector dropdown ("All Owned Stores" or filter to a specific store).
  - Time period selector dropdown (`Today`, `Last 7 Days`, `Last 30 Days`, `All Time`).
* **Operational Analytics Metric Cards:**
  1. **Total Revenue:** Sum of `totalAmount` from strictly `DELIVERED` orders in PKR.
  2. **Delivered Orders:** Count of fulfilled customer deliveries.
  3. **Average Order Value (AOV):** `Revenue / Delivered Orders`.
  4. **Average Rating & Review Count:** Computed store rating with total reviews.
  5. **Cancelled Orders:** Count of cancelled transactions.
* **Recent Customer Reviews Card:** Displays the 5 latest customer reviews with star ratings, sanitized customer names (`FirstName L.`), comments, and timestamps.
* **Quick Navigation Hub:** Cards linking to My Stores (`/vendor/stores`), Products & Inventory (`/vendor/products`), and Incoming Orders (`/vendor/orders`).

#### Data displayed
* Vendor store list from `GET /api/v1/vendor/stores`.
* Aggregated metrics from `GET /api/v1/vendor/analytics?storeId=X&period=Y`.

#### User actions
* Change time period filter $\rightarrow$ Dynamically recalculates metrics.
* Switch store filter $\rightarrow$ Scopes metrics to a single physical location.
* Navigate to store management, product inventory, or live orders.

#### Data flow
```text
Vendor changes period filter to 'last_7_days'
    ↓
GET /api/v1/vendor/analytics?period=last_7_days
    ↓
Backend Analytics Service:
  - Validates vendorProfileId from JWT
  - Computes timezone-aware startDate (7 days prior in store's local timezone)
  - Queries database:
      * prisma.order.count (total, delivered, cancelled)
      * prisma.order.aggregate for sum(totalAmount) WHERE status = 'DELIVERED'
      * prisma.review.aggregate for avg(rating) and count(id)
      * prisma.review.findMany (take 5, order by createdAt desc)
  - Computes AOV = revenue / deliveredOrders
  - Sanitizes customer names to prevent privacy leaks
    ↓
Response: 200 OK with VendorAnalyticsDto
    ↓
Frontend renders metric cards and review feed
```

#### Next possible pages
* `/vendor/stores`
* `/vendor/products`
* `/vendor/orders`
* `/vendor/profile`

---

### Page: Vendor Legal Profile Page

**Route:** `/vendor/profile`  
**Role:** Vendor (`role == VENDOR`)  
**Parent:** Application Shell (`AppLayout.tsx`)

#### Purpose
Enables merchants to review their legal business identity and registered merchant profile data.

#### What the user sees
* Business legal name, user contact email, phone, registered tax identification number (if provided), and banking metadata.
* Multi-tenant security notice explaining that vendor authorization is strictly scoped to `vendor_profile_id`.

#### Data displayed
* `AuthUser` data and `VendorProfile` record from `GET /api/v1/auth/me`.

#### User actions
* Review business credentials.

#### Data flow
```text
Page renders user and vendor profile data from authentication state
```

#### Next possible pages
* `/vendor`
* `/vendor/stores`

---

### Page: Vendor Store Management Page

**Route:** `/vendor/stores`  
**Role:** Vendor (`role == VENDOR`)  
**Parent:** Application Shell (`AppLayout.tsx`)

#### Purpose
Allows vendors to create, configure, and operate multiple physical store locations. Includes setting coordinates, delivery radius, operating hours, and order intake toggles.

#### What the user sees
* **Store List:** Cards for every store owned by the vendor showing:
  - Store name, category, address, and city.
  - Lifecycle Status Badge: `Approved` (Green), `Pending Review` (Amber), `Rejected` (Red), or `Suspended` (Gray).
  - Rejection / Suspension Reason alert box if applicable.
  - "Accepting Orders" toggle switch (allows instant emergency order pausing).
  - Delivery Radius (km), Base Delivery Fee, and Minimum Order Amount.
  - Action buttons: "Manage Products", "Configure Hours", "Edit Settings", and "Resubmit Store" (if rejected).
* **"Create New Store" Modal:**
  - Form fields: Store Name, Category, Address Line, City, Base Delivery Fee, Minimum Order Amount, Timezone.
  - Interactive Leaflet Map: Droppable pin to establish exact store centroid coordinates.
  - Configurable Delivery Radius slider with live Leaflet visualizer circle showing exact geographical coverage.
* **Operating Hours Modal:**
  - 7-day schedule matrix (Sunday through Saturday).
  - Opening time and Closing time inputs (`HH:MM` 24-hour format).
  - "Closed" checkbox per day.
  - Chronological validation (opening time must precede closing time).

#### Data displayed
* Vendor's owned stores from `GET /api/v1/vendor/stores`.
* Store category list from `GET /api/v1/categories/stores`.

#### User actions
* Create a new store with map pin and delivery radius.
* Toggle "Accepting Orders" switch $\rightarrow$ Instantly pauses/resumes customer ordering.
* Configure weekly operating hours schedule.
* Resubmit a rejected store for administrative re-review.
* Navigate to store-scoped product management.

#### Data flow
```text
Vendor creates new store
    ↓
POST /api/v1/vendor/stores { name, latitude, longitude, deliveryRadiusKm, ... }
    ↓
Controller validates input with createStoreSchema (Zod)
    ↓
Service generates store-scoped slug and inserts store record with:
  status: 'PENDING_APPROVAL', isActive: false, isAcceptingOrders: true
    ↓
PostGIS location column is automatically populated by PostgreSQL STORED generated expression:
  geography(Point, 4326) GENERATED ALWAYS AS (ST_SetSRID(ST_MakePoint(longitude, latitude), 4326)::geography) STORED
    ↓
Response: 201 Created with StoreDto
    ↓
Store appears in vendor portal with 'Pending Review' badge and enters Admin Approval Queue
```

#### Next possible pages
* `/vendor/stores/:storeId/products`
* `/vendor/products`
* `/vendor`

---

### Page: Vendor Products & Inventory Management Page

**Route:** `/vendor/products` (and `/vendor/stores/:storeId/products`)  
**Role:** Vendor (`role == VENDOR`)  
**Parent:** Application Shell (`AppLayout.tsx`)

#### Purpose
Provides merchants with catalog management and inventory control. Features concurrency-safe stock adjustments powered by PostgreSQL row-level locks.

#### What the user sees
* **Filters & Controls:** Store filter dropdown, Category filter, live search bar, and "Add New Product" button.
* **Product Inventory Table:** Columns for Image, Product Name, Category, SKU, Unit, Price (PKR), Stock Quantity, Availability Toggle, and Actions.
* **Stock Adjustment Popover / Modal:**
  - Operations: `SET` (override stock to exact value), `INCREMENT` (add incoming stock shipment), or `DECREMENT` (record stock removal).
  - Input field for adjustment quantity.
  - "Update Stock" button.
* **"Add / Edit Product" Modal:**
  - Form fields: Name, Category, SKU, Price, Initial Stock, Unit, Description, Image URL, Active status checkbox.

#### Data displayed
* Vendor products from `GET /api/v1/vendor/products` (or `/vendor/stores/:storeId/products`).
* Product categories from `GET /api/v1/categories/products`.

#### User actions
* Search and filter products across stores.
* Create a new catalog product.
* Edit product details and price.
* Toggle product active/inactive state.
* Perform concurrency-safe stock adjustments (`SET`, `INCREMENT`, `DECREMENT`).
* Delete a product (restricted if historical orders reference it).

#### Data flow
```text
Vendor adjusts stock (e.g., INCREMENT +25)
    ↓
PATCH /api/v1/vendor/products/:productId/stock { operation: 'INCREMENT', quantity: 25 }
    ↓
Controller validates operation and quantity >= 0
    ↓
Service verifies store belongs to authenticated vendor (tenant isolation)
    ↓
Database Transaction (productRepository.updateProductStockTransaction):
  - SELECT id, store_id, stock_quantity FROM products WHERE id = :productId FOR UPDATE
  - Evaluates newStock = currentStock + 25
  - Asserts newStock >= 0 (INSUFFICIENT_STOCK guard)
  - Updates product stockQuantity = newStock
    ↓
Transaction commits
    ↓
Response: 200 OK with updated ProductDto
    ↓
Frontend table updates stock quantity immediately
```

#### Next possible pages
* `/vendor/stores`
* `/vendor/orders`

---

### Page: Vendor Incoming Orders & Fulfillment Page

**Route:** `/vendor/orders`  
**Role:** Vendor (`role == VENDOR`)  
**Parent:** Application Shell (`AppLayout.tsx`)

#### Purpose
The live order dispatch and fulfillment console for merchants. Enables vendors to progress incoming orders through the strict Finite State Machine (FSM) from placement to delivery.

#### What the user sees
* **Filter Bar:** Store selector dropdown and Order Status filter tabs (`All`, `PLACED`, `CONFIRMED`, `PREPARING`, `READY`, `OUT_FOR_DELIVERY`, `DELIVERED`, `CANCELLED`).
* **Order Cards Table:**
  - Order number and creation timestamp.
  - Customer recipient name and contact phone number.
  - Delivery address snapshot.
  - Item count, ordered items preview, and total amount (PKR).
  - Current status badge.
  - **Dynamic FSM Action Buttons:** Context-sensitive actions corresponding to valid state transitions:
    * If `PLACED`: "Confirm Order" (Indigo button) and "Reject" (Outline button).
    * If `CONFIRMED`: "Start Preparing" (Amber button) and "Cancel" (Outline button).
    * If `PREPARING`: "Mark as Ready" (Teal button).
    * If `READY`: "Dispatch Order" (Purple button).
    * If `OUT_FOR_DELIVERY`: "Mark as Delivered (Collect COD)" (Green button).
    * If `DELIVERED` / `CANCELLED`: Terminal state indicator (no action buttons).
* **Order Detail Modal:** Detailed inspection modal displaying full item snapshots, delivery coordinates, and customer details.

#### Data displayed
* Incoming orders list from `GET /api/v1/vendor/orders`.

#### User actions
* Filter orders by store and status.
* Advance order to next state along the FSM.
* Reject or cancel order (restores product inventory atomically).
* Mark order as Delivered upon receiving cash payment.

#### Data flow
```text
Vendor clicks "Mark as Delivered (Collect COD)"
    ↓
PATCH /api/v1/vendor/orders/:orderId/status { status: 'DELIVERED' }
    ↓
Controller validates status via Zod
    ↓
Service verifies order belongs to vendor's store (tenant isolation)
Validates FSM transition: OUT_FOR_DELIVERY → DELIVERED is valid
    ↓
Database Transaction (orderRepository.updateOrderStatusTransaction):
  - Locks order row: SELECT ... FROM orders WHERE id = :id FOR UPDATE
  - Re-verifies FSM under lock
  - Updates order status: 'DELIVERED'
  - Automatically updates paymentStatus: 'PAID' (COD settlement)
    ↓
Transaction commits
    ↓
Response: 200 OK with updated OrderDto
    ↓
Vendor UI updates to show order as Delivered; unlocks verified review submission for customer
```

#### Next possible pages
* `/vendor`
* `/vendor/stores`

---

### Page: Admin Overview Dashboard Page

**Route:** `/admin`  
**Role:** Admin (`role == ADMIN`)  
**Parent:** Application Shell (`AppLayout.tsx`)

#### Purpose
Production-grade real-time operational and financial overview for platform administrators. Provides high-level visibility into platform GMV / revenue, order throughput, user acquisition, active merchants, live order feed, and top-performing physical stores.

#### What the user sees
* **Header & Scope:** Title "Platform Overview" and real-time activity status.
* **Revenue KPI Cards (Row 1):**
  - Total Revenue: Cumulative platform volume in PKR from finalized non-cancelled orders.
  - This Month's Revenue: Volume generated since month start.
  - This Week's Revenue: Volume generated in the rolling 7-day period.
  - Today's Revenue: Volume collected since midnight local time.
* **Platform Activity KPI Cards (Row 2):**
  - Total Orders across the marketplace.
  - Orders Placed Today.
  - Orders Placed This Week.
  - Total Registered Platform Users.
  - Active Operating Stores count.
  - Total Registered Merchants (Vendors).
* **Live Recent Orders Feed:** Latest 10 orders across all stores, customer name, merchant name, timestamp, total PKR, and real-time status badge (`Placed`, `Confirmed`, `Delivered`, etc.).
* **Top Stores Leaderboard:** Stores ranked by total order volume and aggregate revenue.
* **Administrative Navigation Panel:** Quick-access links with descriptions to:
  - Store Management (`/admin/stores`)
  - Category Taxonomies (`/admin/categories`)
  - User Management (`/admin/users`)
  - Analytics & Reports (`/admin/analytics`)
  - Admin Settings (`/admin/settings`)

#### Data displayed
* Platform-wide aggregated telemetry and lists from `GET /api/v1/admin/stats`.

#### User actions
* Inspect real-time platform revenue and order activity.
* Jump to store verification, category curation, user governance, or analytics.
* Monitor latest incoming orders across all vendors.

#### Data flow
```text
Admin loads /admin
    ↓
useQuery(['admin', 'stats']) issues GET /api/v1/admin/stats
    ↓
Backend Admin Controller aggregates in parallel:
  - Cumulative & time-bounded order sums and counts
  - Non-guest user counts partitioned by role (Customer, Vendor)
  - Active stores count
  - Top 5 stores by order volume via prisma.order.groupBy
  - Recent 10 orders with user and store relational joins
    ↓
Response: 200 OK with comprehensive stats JSON payload
    ↓
Frontend renders KPI cards, feed, and leaderboard
```

#### Next possible pages
* `/admin/stores`
* `/admin/categories`
* `/admin/analytics`
* `/admin/users`
* `/admin/settings`

---

### Page: Admin Store Verification & Governance Queue Page

**Route:** `/admin/stores`  
**Role:** Admin (`role == ADMIN`)  
**Parent:** Application Shell (`AppLayout.tsx`)

#### Purpose
The central governance and compliance portal. Platform administrators audit new merchant store applications, inspect physical location centroids and delivery radius circles on an interactive Leaflet map, and execute lifecycle state changes (`APPROVE`, `REJECT`, `SUSPEND`, `RESTORE`).

#### What the user sees
* **Filter Tabs:** `All Stores`, `Pending Approval` (with badge counter), `Approved`, `Rejected`, `Suspended`.
* **Search Bar:** Live search across store names, merchant business legal names, and cities.
* **Stores Table:** Columns for Store Name, Merchant Legal Name, City, Centroid Coordinates, Delivery Radius (km), Creation Date, Status Badge, and "Audit Store" action button.
* **Interactive Store Audit Modal (`StoreAuditModal`):**
  - Store overview: Name, slug, category, address, timezone.
  - Merchant legal information: Business legal name, user contact, tax ID number, banking details.
  - Operating Hours Matrix: Full weekly schedule.
  - Interactive Leaflet Map Visualizer: Renders exact store centroid pin and semi-transparent delivery radius circle.
  - Administrative Action Controls:
    * "Approve Store": Sets status to `APPROVED` and activates store (`isActive = true`).
    * "Reject Store": Prompts for mandatory rejection reason (min 5 characters), sets status to `REJECTED`, deactivates store.
    * "Suspend Store": Prompts for mandatory suspension reason, sets status to `SUSPENDED`, deactivates store.
    * "Restore Store": Restores suspended store to `APPROVED` and reactivates it.

#### Data displayed
* Filtered store list from `GET /api/v1/admin/stores?status=...`.
* Detailed store inspection payload from `GET /api/v1/admin/stores/:id`.

#### User actions
* Filter stores by onboarding status.
* Open audit modal to inspect merchant credentials and map coverage.
* Approve, reject, suspend, or restore a physical store.

#### Data flow
```text
Admin reviews store and clicks "Approve Store"
    ↓
PATCH /api/v1/admin/stores/:storeId/approve
    ↓
Express Route: adminStoreRouter.patch('/:id/approve', requireAuth, requireRole(ADMIN), ...)
    ↓
Service: adminStoreService.approveStoreAdmin(id)
  - Validates current status is PENDING_APPROVAL or SUSPENDED
  - Updates Store record: status = 'APPROVED', isActive = true, rejectionReason = null, suspensionReason = null
    ↓
Response: 200 OK with updated StoreDto
    ↓
Store is immediately discoverable to customers whose delivery pins fall within its radius
```

#### Next possible pages
* `/admin`
* `/admin/categories`

---

### Page: Admin Categories Management Page

**Route:** `/admin/categories`  
**Role:** Admin (`role == ADMIN`)  
**Parent:** Application Shell (`AppLayout.tsx`)

#### Purpose
Allows administrators to manage platform-wide category taxonomies for both Stores (e.g., Grocery, Pharmacy, Electronics) and Products (e.g., Dairy, Produce, Beverages).

#### What the user sees
* **Tab Switcher:** Toggle between "Store Categories" and "Product Categories".
* **Category Tables:**
  - Store Categories Table: Name, Slug, Description, Active Status (`Active` / `Inactive`), and Actions (Edit, Delete).
  - Product Categories Table: Name, Slug, Description, and Actions (Edit, Delete).
* **"Add Category" Modal:** Form to input category name, description, icon URL (for store categories), and active status toggle.
* **"Edit Category" Modal:** Form to modify existing category attributes.
* **Delete Confirmation Dialog:** Warning dialog to confirm category deletion (prevented if foreign key constraints exist on stores or products).

#### Data displayed
* Store categories from `GET /api/v1/categories/stores`.
* Product categories from `GET /api/v1/categories/products`.

#### User actions
* Create, update, toggle active status, or delete store categories.
* Create, update, or delete product categories.

#### Data flow
```text
Admin creates store category "Supermarket"
    ↓
POST /api/v1/admin/categories/stores { name: "Supermarket", description: "..." }
    ↓
Backend validates input, generates unique slug "supermarket", and inserts into store_categories table
    ↓
Response: 201 Created
    ↓
Category immediately appears in customer filter pills on /stores and vendor onboarding dropdowns
```

#### Next possible pages
* `/admin/stores`
* `/admin`

---

### Page: Admin Analytics & Reports Page

**Route:** `/admin/analytics`  
**Role:** Admin (`role == ADMIN`)  
**Parent:** Application Shell (`AppLayout.tsx`)

#### Purpose
Provides platform administrators with deep-dive performance telemetry, revenue breakdowns, order frequency distribution, and merchant performance analytics across the entire marketplace.

#### What the user sees
* **Revenue Breakdown Section:** All-time revenue, monthly volume, rolling 7-day revenue, and today's collections.
* **Order Volume Distribution:** Total orders placed, monthly order volume, rolling weekly volume, and orders placed today.
* **Users & Merchants Telemetry:** Registered users count, customers tally, active merchant vendors, and approved active physical stores.
* **Top Stores Performance Chart:** Visual rank comparison of the highest performing merchant stores by total order count, complete with visual progress bars and exact totals.
* **Recent Platform Orders Table:** Live order stream displaying customer details, merchant store name, ordered total in PKR, and current order status.

#### Data displayed
* Platform analytics from `GET /api/v1/admin/stats`.

#### User actions
* Review platform revenue velocity and order distribution.
* Inspect top-selling merchant stores.
* Track recent platform activity.

#### Data flow
```text
Admin accesses /admin/analytics
    ↓
useQuery(['admin', 'stats']) fetches real-time telemetry
    ↓
Renders financial cards, order volume counters, and store performance bar charts
```

#### Next possible pages
* `/admin`
* `/admin/stores`
* `/admin/users`
* `/admin/settings`

---

### Page: Admin User Management Console Page

**Route:** `/admin/users`  
**Role:** Admin (`role == ADMIN`)  
**Parent:** Application Shell (`AppLayout.tsx`)

#### Purpose
Global user governance and role management console. Enables platform administrators to view, search, filter, promote/demote roles, inspect vendor-owned physical stores, and manage user accounts across all platform roles (`CUSTOMER`, `VENDOR`, `ADMIN`).

#### What the user sees
* **Search & Filter Toolbar:**
  - Real-time search bar (searches across user first name, last name, and email).
  - Role Filter Pills: `All Roles`, `Customer`, `Vendor`, `Admin`.
  - Total registered user counter.
* **User Accounts Table:**
  - User Column: User initials avatar, full name, email address, and "(you)" indicator for active session.
  - Role Badge: Color-coded role indicators (`Customer`, `Vendor`, `Admin`).
  - Contact Phone number.
  - Registration Date (formatted locally).
  - Actions Column:
    * For Vendors: "Stores (N)" button launching the Vendor Stores Modal.
    * Role Modification Icon: Opens role-change dialog.
    * Account Deletion Icon: Opens permanent account deletion confirmation modal (self-deletion disabled).
* **Vendor Stores Inspection Modal:** Shows all physical stores owned by the selected vendor, their active/inactive status, slug, and direct audit link.
* **Change Role Modal:** Dropdown to select new role with instant confirmation.
* **Delete User Confirmation Modal:** Destructive confirmation warning explaining permanent data removal.
* **Pagination Bar:** Previous/Next navigation and total pages indicator.

#### Data displayed
* Paginated user list from `GET /api/v1/admin/users?role=...&search=...&page=...`.

#### User actions
* Search users by name or email address.
* Filter users by role.
* Click "Stores (N)" on a vendor to audit their physical store locations.
* Change user role (Customer $\leftrightarrow$ Vendor $\leftrightarrow$ Admin).
* Permanently delete a user account.

#### Data flow
```text
Admin searches or changes role
    ↓
GET /api/v1/admin/users?search=...&role=...
    ↓
Admin clicks "Change Role" → Selects 'VENDOR'
    ↓
PATCH /api/v1/admin/users/:userId/role { role: 'VENDOR' }
    ↓
Admin Controller validates target is not self-demotion, updates Prisma User record
    ↓
Invalidates React Query cache and refreshes user table
```

#### Next possible pages
* `/admin`
* `/admin/stores`
* `/admin/settings`

---

### Page: Admin Settings & Security Page

**Route:** `/admin/settings`  
**Role:** Admin (`role == ADMIN`)  
**Parent:** Application Shell (`AppLayout.tsx`)

#### Purpose
Security and profile management center for platform administrators. Displays administrative privileges and provides a secure password update facility.

#### What the user sees
* **Account Information Card:** First name, last name, email address, role designation (`Admin`), and security notice confirming full administrative privileges.
* **Change Password Card:**
  - Current Password input with show/hide password visibility toggle.
  - New Password input with minimum 8-character validation.
  - Confirm New Password input with real-time match verification.
  - "Update Password" action button with loading state.

#### Data displayed
* Active admin identity from `useCurrentUser()`.

#### User actions
* Inspect administrative account metadata.
* Change admin password.

#### Data flow
```text
Admin submits new password
    ↓
POST /api/v1/admin/change-password { currentPassword, newPassword }
    ↓
Admin Controller:
  - Fetches admin record with passwordHash
  - Compares currentPassword using bcrypt.compare
  - If valid: hashes newPassword with BCrypt (cost factor 12)
  - Updates prisma.user record with new passwordHash
    ↓
Response: 200 OK with success message
    ↓
Frontend displays success toast and resets form fields
```

#### Next possible pages
* `/admin`
* `/admin/users`
* `/admin/stores`

---

### Page: Not Found Page

**Route:** `*` (Catch-All)  
**Role:** Public (All Users)  
**Parent:** Root Application Shell (`App.tsx`)

#### Purpose
Handles invalid URL requests gracefully, preventing application crashes and providing clear navigation paths back to safety.

#### What the user sees
* Centered 404 illustration, title "Page Not Found", description explaining the URL does not exist, and a "Return Home" button.

#### Data displayed
* Static error text.

#### User actions
* Click "Return Home" $\rightarrow$ Navigates to `/` (or role dashboard if authenticated).

#### Data flow
* Client-side catch-all routing.

#### Next possible pages
* `/` or `/dashboard` / `/vendor` / `/admin`

---

## 5. CUSTOMER APPLICATION TREE

```text
Customer Lifecycle
│
├── 1. Registration & Authentication
│   ├── Register Account (`/register`)
│   │   └── Submits email, password, name, phone → BCrypt hash → User record created
│   └── Login (`/login`)
│       └── Verifies credentials → Receives signed JWT in HttpOnly cookie → Authenticated
│
├── 2. Location Management (Prerequisite for Spatial Discovery)
│   ├── Customer Dashboard (`/dashboard`)
│   │   └── Inspects active delivery location; triggers location configuration
│   └── Saved Delivery Addresses (`/addresses`)
│       ├── Opens Interactive Leaflet Map Modal
│       ├── Drops pin marker on exact delivery doorstep coordinates
│       ├── Reverse Geocoding automatically populates street address and city
│       └── Saves Address (DB partial index ensures strictly one isDefault = true)
│
├── 3. Hyperlocal Store Discovery
│   ├── Stores Discovery Page (`/stores`)
│   │   ├── Selects saved address from dropdown or activates GPS location
│   │   ├── PostGIS executes spatial query using ST_DWithin and GiST index
│   │   ├── Evaluates 4-Tier Discovery Eligibility (Approved, Active, Open, In Radius)
│   │   ├── Filters results via search query or category pills
│   │   └── Switches between Grid View and Map View (Leaflet circles)
│   └── Selects Store Card
│       └── Navigates to `/stores/:id`
│
├── 4. Catalog Browsing & Cart Construction
│   ├── Store Detail Page (`/stores/:id`)
│   │   ├── Inspects store operating hours, delivery radius, ratings, and reviews
│   │   ├── Browses store-specific product catalog
│   │   └── Adds Product to Cart
│   │       ├── Checks Single-Store Invariant
│   │       ├── IF cart matches store: Item added successfully; cart badge updates
│   │       └── IF cart contains items from another store:
│   │           └── Triggers 409 CART_STORE_CONFLICT Dialog
│   │               ├── Customer chooses "Cancel" (cart remains unchanged)
│   │               └── Customer chooses "Clear & Add" (clears old cart, adds new item)
│   └── Shopping Cart Page (`/cart`)
│       ├── Inspects cart items, unit prices, quantities, and line totals
│       ├── Dynamically verifies stock availability and store operational state
│       ├── Adjusts quantities or removes items
│       └── Validates Minimum Order Amount shortfall
│
├── 5. Authoritative Checkout & Fulfillment
│   ├── Checkout Page (`/checkout`)
│   │   ├── Selects target saved delivery address
│   │   ├── Server revalidates address ownership, store status, hours, and PostGIS radius
│   │   ├── Reviews immutable price totals and confirms Cash on Delivery (COD)
│   │   └── Submits Order
│   │       ├── Backend acquires exclusive row locks (SELECT ... FOR UPDATE)
│   │       ├── Re-verifies stock levels under lock
│   │       ├── Creates Order, OrderItem snapshots, and OrderAddressSnapshot
│   │       ├── Atomically decrements product inventory
│   │       └── Clears customer shopping cart
│   └── Immediate Navigation to Order Tracking (`/orders/:orderId`)
│
├── 6. Order Tracking & Verified Review
│   ├── Customer Orders Page (`/orders`)
│   │   └── Chronological history of all orders with live status badges
│   └── Order Detail & Tracking Page (`/orders/:orderId`)
│       ├── Observes FSM step progression:
│       │   PLACED → CONFIRMED → PREPARING → READY → OUT_FOR_DELIVERY → DELIVERED
│       ├── Optional Cancellation: Customer can cancel while PLACED or CONFIRMED
│       │   └── Cancelling atomically restores inventory to product catalog
│       └── Upon Reaching DELIVERED Status:
│           ├── Customer receives goods and pays COD cash to courier
│           └── Verified Review card unlocks:
│               ├── Customer rates store 1–5 stars and writes comment
│               ├── Database enforces UNIQUE(order_id) (strictly 1 review per order)
│               └── Store averageRating and totalReviews recalculate atomically
```

---

## 6. CUSTOMER COMPLETE DATA FLOW

This walkthrough tracks a complete transaction from initial pin drop to verified review submission.

```text
[1. LOCATION SELECTION]
Customer drops map pin at Coordinates: (31.4187, 73.0791)
    ↓
Input: Latitude: 31.4187, Longitude: 73.0791, Label: "Home", Address: "House 14, Street 5"
Processing: CustomerAddress record created; isDefault set to true
Database: customer_addresses table updated; partial unique index enforces single default
Output: Active delivery coordinates established
Next Step: Store Discovery

[2. STORE DISCOVERY]
Customer navigates to /stores
    ↓
Input: Customer coordinates (31.4187, 73.0791) sent to GET /api/v1/discovery/stores
Processing: PostGIS evaluates ST_DWithin(store.location, customerPoint, delivery_radius_km * 1000)
            Checks store.status = 'APPROVED', is_active = true, is_accepting_orders = true
            Checks safe_timestamptz_at_tz falls within store_operating_hours
Database: stores, store_categories, store_operating_hours queried with GiST index
Output: List of eligible stores with calculated distance_km (e.g., "Al-Madina Mart", 1.25 km away)
Next Step: Store Selection

[3. PRODUCT SELECTION & CART]
Customer opens "Al-Madina Mart" (/stores/:id) and adds "Nestle Milk 1L" (Qty: 2, Price: Rs. 280)
    ↓
Input: productId, quantity: 2 sent to POST /api/v1/cart/items
Processing: Cart row locked with SELECT ... FOR UPDATE
            Checks Cart.storeId: If null, sets storeId = Al-Madina Mart
            If Cart.storeId == Al-Madina Mart, upserts cart_items
Database: carts and cart_items updated; stock is verified but NOT decremented yet
Output: Cart updated: Subtotal = Rs. 560, Delivery Fee = Rs. 80, Total = Rs. 640
Next Step: Checkout

[4. CHECKOUT REVALIDATION & ORDER PLACEMENT]
Customer navigates to /checkout, selects saved address, and clicks "Place Order"
    ↓
Input: addressId sent to POST /api/v1/checkout
Processing: Authoritative 7-step server validation:
            1. Verifies addressId belongs to customer
            2. Verifies cart belongs to customer and contains items
            3. Verifies store is approved, active, and accepting orders
            4. Verifies store is open right now in its local timezone
            5. Verifies address coordinates fall within store delivery radius via PostGIS ST_DWithin
            6. Locks cart row and product rows with SELECT ... FOR UPDATE ORDER BY id
            7. Re-verifies stock under lock (stockQuantity >= 2)
Database Transaction:
  - Inserts orders record (status: PLACED, paymentMethod: COD, paymentStatus: PENDING)
  - Inserts order_items record with snapshots: productNameSnapshot: "Nestle Milk 1L", unitPriceSnapshot: 280.00
  - Inserts order_address_snapshots record with recipient and coordinates
  - Decrements products.stock_quantity = stock_quantity - 2
  - Deletes cart_items and sets carts.store_id = null
Output: Order #ORD-84920 created
Next Step: Order Fulfillment Lifecycle

[5. FULFILLMENT LIFECYCLE]
Merchant fulfills order via /vendor/orders
    ↓
Transitions: PLACED → CONFIRMED → PREPARING → READY → OUT_FOR_DELIVERY → DELIVERED
Processing: Courier arrives at customer doorstep, hands over milk, and collects Rs. 640 cash
            Vendor clicks "Mark as Delivered (Collect COD)"
Database: orders.status updated to DELIVERED; orders.payment_status updated to PAID
Output: Order finalized; review submission unlocked
Next Step: Verified Review

[6. REVIEW SUBMISSION]
Customer visits /orders/:orderId and submits a 5-star review
    ↓
Input: orderId, rating: 5, comment: "Fast delivery, fresh milk!" sent to POST /api/v1/reviews
Processing: Validates customer owns order, status == DELIVERED, no prior review exists
Database Transaction:
  - Inserts reviews record
  - Computes aggregate average rating and review count across all reviews for this store
  - Updates stores.average_rating and stores.total_reviews
Output: Store public rating updated across marketplace
```

---

## 7. VENDOR APPLICATION TREE

```text
Vendor Hierarchy & Architecture Chain
│
└── USER (role == 'VENDOR')
     │
     └── VENDOR_PROFILE (1:1 with User)
          │  ├── businessLegalName
          │  ├── taxIdNumber
          │  └── bankAccountInfo
          │
          ├── STORES (1:N with VendorProfile)
          │    ├── id, name, slug, description, addressLine, city
          │    ├── Centroid Coordinates: latitude, longitude
          │    ├── Spatial generated column: location (geography(Point, 4326))
          │    ├── deliveryRadiusKm (geodesic coverage circle)
          │    ├── baseDeliveryFee, minOrderAmount, timezone
          │    ├── Status: PENDING_APPROVAL → APPROVED | REJECTED | SUSPENDED
          │    ├── Flags: isActive (governance), isAcceptingOrders (merchant pause)
          │    │
          │    ├── STORE_OPERATING_HOURS (1:N with Store, 7 records: days 0-6)
          │    │    └── dayOfWeek, openingTime, closingTime, isClosed
          │    │
          │    ├── PRODUCTS (1:N with Store)
          │    │    ├── name, slug (scoped composite unique: store_id + slug)
          │    │    ├── price, sku, unit, imageUrl, isActive
          │    │    └── stockQuantity (concurrency-safe atomic inventory)
          │    │
          │    ├── ORDERS (1:N with Store)
          │    │    ├── subtotal, deliveryFee, totalAmount
          │    │    ├── status (FSM progression: PLACED → ... → DELIVERED)
          │    │    ├── paymentMethod (COD), paymentStatus (PENDING → PAID)
          │    │    ├── OrderItems (immutable catalog snapshots)
          │    │    └── OrderAddressSnapshot (immutable delivery snapshot)
          │    │
          │    └── REVIEWS (1:N with Store)
          │         └── rating (1-5), comment, customerName (sanitized)
          │
          └── OPERATIONAL ANALYTICS (Aggregated across owned stores)
               ├── Total Revenue (sum of totalAmount from DELIVERED orders)
               ├── Order Volumes (total, delivered, cancelled)
               ├── Average Order Value (AOV = Revenue / Delivered Orders)
               ├── Store Average Rating & Review Count
               └── Filterable by Store and Period (Today, 7 Days, 30 Days, All Time)
```

### Multi-Tenant Isolation & Anti-Enumeration Protections
In a multi-vendor marketplace, preventing unauthorized access across merchants is a non-negotiable security requirement. GeoMarket enforces strict tenant isolation:
1. **No Direct Request Parameter Trust:** The backend never trusts a client-supplied `vendorProfileId` in request bodies. The requesting vendor's identity is derived strictly from the verified JWT payload (`req.user.vendorProfileId`).
2. **Server-Side Store Ownership Verification:** Every operation targeting a store (creating products, updating operating hours, toggling orders) validates:
   ```typescript
   const store = await prisma.store.findUnique({ where: { id: storeId } });
   if (!store || store.vendorProfileId !== req.user.vendorProfileId) {
     throw new Error('STORE_NOT_FOUND'); // 404 Anti-Enumeration
   }
   ```
3. **Anti-Enumeration 404 Protection:** If Vendor A attempts to inspect or mutate an order or product belonging to Vendor B, the server responds with a generic `404 Not Found` rather than `403 Forbidden`. This prevents malicious actors from probing the database to map out other merchants' store IDs, order IDs, or product IDs.

---

## 8. ADMIN APPLICATION TREE

```text
Platform Governance & Operations (Admin Domain)
│
└── ADMIN USER (role == 'ADMIN')
     │
     ├── Platform Overview Dashboard (`/admin`)
     │    ├── Real-time financial KPIs (Total, Monthly, Weekly, Today's Revenue in PKR)
     │    ├── Operational volume metrics (Total, Today's, Weekly Orders)
     │    ├── User & merchant distribution counts
     │    ├── Live recent orders feed across all platform merchants
     │    ├── Top stores leaderboard by order volume and revenue
     │    └── Quick-access administrative navigation hub
     │
     ├── Store Verification & Governance Queue (`/admin/stores`)
     │    ├── Inspects pending store onboarding applications
     │    ├── Audits merchant business legal name, tax ID, and banking details
     │    ├── Audits physical store centroid on interactive Leaflet map
     │    ├── Evaluates delivery radius coverage circle against municipal boundaries
     │    └── Executes Store Lifecycle State Transitions:
     │         ├── APPROVE: Sets status = APPROVED, isActive = true (store goes live)
     │         ├── REJECT: Prompts mandatory reason, sets status = REJECTED, isActive = false
     │         ├── SUSPEND: Prompts mandatory reason, sets status = SUSPENDED, isActive = false
     │         └── RESTORE: Clears suspension, sets status = APPROVED, isActive = true
     │
     ├── Taxonomy & Category Management (`/admin/categories`)
     │    ├── Store Categories:
     │    │    ├── Create Store Category (name, slug, description, iconUrl, isActive)
     │    │    ├── Update Store Category details and toggle active status
     │    │    └── Delete Store Category (restricted if referenced by stores)
     │    └── Product Categories:
     │         ├── Create Product Category (name, slug, description)
     │         ├── Update Product Category details
     │         └── Delete Product Category (restricted if referenced by products)
     │
     ├── Platform Analytics & Reports (`/admin/analytics`)
     │    ├── In-depth revenue breakdowns across multiple rolling windows
     │    ├── Order volume trends and throughput timelines
     │    ├── User and active merchant store breakdowns
     │    └── Visual store performance progress bars
     │
     ├── User Management Console (`/admin/users`)
     │    ├── Paginated, searchable listing of all platform accounts
     │    ├── Role filter tabs (`All Roles`, `Customer`, `Vendor`, `Admin`)
     │    ├── Vendor Store Discovery Modal ("Stores (N)" direct audit popup)
     │    ├── User Role Modification Dialog (promoting/demoting privileges)
     │    └── Account Deletion Dialog with permanent confirmation safeguards
     │
     └── Admin Settings & Security (`/admin/settings`)
          ├── Administrator account information & privilege verification
          └── Secure password change interface with validation and BCrypt hashing
```

### The Admin as the Platform Governance Layer
The Administrator does not participate in the daily commerce transactions (they do not buy items or fulfill orders). Instead, the Admin functions as the **system's regulatory authority**:
* **Merchant Quality Control:** Prevents fraudulent, illegal, or non-existent businesses from appearing on the marketplace.
* **Spatial Integrity:** Ensures that store delivery radii are realistic and do not overlap inappropriately with hazardous or unserviceable geographical zones.
* **Consumer Protection:** Immediately suspends stores that receive fraud complaints or violate platform guidelines.
* **Taxonomy Standardization:** Maintains consistent categorization across the platform so customers can easily filter stores and items.
* **User & Merchant Governance:** Oversees customer, merchant, and staff accounts, adjusting roles and inspecting merchant physical holdings.

---

## 9. ROLE COMPARISON

| System Capability | Guest / Visitor | Customer | Vendor | Admin | Architectural Enforcement |
|---|:---:|:---:|:---:|:---:|---|
| **Public Self-Registration** | N/A | Yes (`/register`) | Yes (`/register/vendor`) | No (Direct DB Seed) | Dedicated auth endpoints; Admin accounts cannot be self-registered publicly |
| **Login & JWT Session** | Optional (`isGuest: true`) | Yes | Yes | Yes | All roles receive secure HttpOnly cookie containing signed JWT payload |
| **Discover Nearby Stores** | Yes | Yes | Yes | Yes | Public discovery endpoint `/api/v1/discovery/stores` open to all roles |
| **Browse Product Catalog** | Yes (`/products`) | Yes (`/products`) | Yes | Yes | Public catalog endpoint `/api/v1/discovery/products` |
| **Inspect Single Product** | Yes (`/products/:id`)| Yes (`/products/:id`)| Yes | Yes | Public product endpoint `/api/v1/discovery/products/:id` |
| **Maintain Shopping Cart** | Yes | Yes | No | No | Anchored single-store cart strictly enforced for all shoppers |
| **Checkout (Cash on Delivery)** | Yes (Inline Address) | Yes (Saved Address) | No | No | `/api/v1/checkout` handles both inline guest and saved customer addresses |
| **Print Order Invoice** | Yes (`/orders/:id/success`) | Yes (`/orders/:id/success`) | No | No | Client-side styled print engine |
| **Track Order Status** | Yes (`/orders/track`) | Yes (`/orders/:id`) | Yes (`/vendor/orders`) | Yes (`/admin`) | Guest phone lookup or authenticated customer order timeline |
| **Save Delivery Addresses** | No | Yes (`/addresses`) | No | No | `requireRole(CUSTOMER)` on `/api/v1/addresses` |
| **Set Delivery Pin on Map** | Yes (Temporary) | Yes (Saved Default)| No | No | Interactive Leaflet modal; coordinates validated and stored |
| **Cancel Placed Order** | No | Yes | Yes | Yes | Customer can cancel during `PLACED` / `CONFIRMED`; Vendor can reject/cancel |
| **Fulfill & Advance Orders** | No | No | Yes | No | Vendor advances FSM: `CONFIRMED` $\rightarrow$ `PREPARING` $\rightarrow$ `READY` $\rightarrow$ `OUT_FOR_DELIVERY` $\rightarrow$ `DELIVERED` |
| **Collect COD Payment** | No | No | Yes | No | Vendor marks order `DELIVERED`, automatically flipping paymentStatus to `PAID` |
| **Submit Store Reviews** | No | Yes | No | No | `requireRole(CUSTOMER)` on `/api/v1/reviews`; strictly verified for delivered orders |
| **Onboard Physical Stores** | No | No | Yes | No | `requireRole(VENDOR)` on `/api/v1/vendor/stores`; stores enter `PENDING_APPROVAL` queue |
| **Configure Operating Hours**| No | No | Yes | No | Vendor configures 7-day schedule matrix for owned stores |
| **Manage Product Catalog** | No | No | Yes | No | `requireRole(VENDOR)` on `/api/v1/vendor/products`; store-scoped unique slugs |
| **Adjust Product Inventory** | No | No | Yes | No | Concurrency-safe atomic adjustments (`SET`, `INC`, `DEC`) with row-level locks |
| **View Operational Analytics**| No | No | Yes | No | Vendor operational dashboard calculates revenue, AOV, ratings, and order counts |
| **Approve / Reject Stores** | No | No | No | Yes | `requireRole(ADMIN)` on `/api/v1/admin/stores/:id/approve` and `.../reject` |
| **Suspend / Restore Stores** | No | No | No | Yes | `requireRole(ADMIN)` on `/api/v1/admin/stores/:id/suspend` |
| **Manage Category Taxonomies**| No | No | No | Yes | `requireRole(ADMIN)` on `/api/v1/admin/categories/*` |
| **Inspect Platform Telemetry** | No | No | No | Yes | `requireRole(ADMIN)` on `/api/v1/admin/stats` |
| **Manage Platform Users** | No | No | No | Yes | `requireRole(ADMIN)` on `/api/v1/admin/users` |
| **Update Admin Security** | No | No | No | Yes | `requireRole(ADMIN)` on `/api/v1/admin/change-password` |

---

## 10. AUTHENTICATION & AUTHORIZATION FLOW

```text
User Submits Email & Password
    ↓
POST /api/v1/auth/login
    ↓
[AUTHENTICATION] "Who are you?"
1. Controller validates request body structure with loginSchema (Zod)
2. Database query: findUserByEmail(email)
3. If user not found: executes dummy BCrypt hash to consume equal time (prevents timing attacks)
4. If user found: verifies password via bcrypt.compare(password, user.passwordHash)
5. Verifies user.isActive == true
6. Signs JSON Web Token (JWT) with payload: { sub: user.id, role: user.role, vendorProfileId }
7. Sets cookie in HTTP response header:
   Set-Cookie: token=<jwt>; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=604800
    ↓
User Sends Authenticated Request (e.g., POST /api/v1/checkout)
    ↓
Cookie sent automatically by browser (credentials: 'include')
    ↓
[MIDDLEWARE 1: requireAuth] "Is your session valid?"
1. Extracts req.cookies.token
2. Verifies cryptographic signature using JWT_SECRET
3. Queries database via findUserById(payload.sub) to ensure account is still active
4. Attaches hydrated user to Express request: req.user = user
    ↓
[MIDDLEWARE 2: requireRole] "What are you allowed to do?"
1. Reads req.user.role (derived securely from backend token, NOT client request body)
2. Evaluates: permittedRoles.includes(req.user.role)
3. If role matches: calls next() to enter business controller
4. If role does not match: aborts request with HTTP 403 Forbidden { error: 'Insufficient permissions' }
```

### The Difference Between Authentication and Authorization
* **Authentication ("Who are you?"):** The process of verifying a user's claimed identity. In GeoMarket, authentication is achieved when the user supplies a valid email and BCrypt-matching password. The server acknowledges this identity by issuing an encrypted JWT inside a secure cookie.
* **Authorization ("What are you allowed to do?"):** The process of verifying whether the authenticated identity possesses the permissions required to perform a specific action. In GeoMarket, authorization is implemented via Role-Based Access Control (RBAC) middleware (`requireRole(UserRole.CUSTOMER)`, `requireRole(UserRole.VENDOR)`, `requireRole(UserRole.ADMIN)`) and tenant isolation checks (`store.vendorProfileId === req.user.vendorProfileId`).

### Why HttpOnly Cookies Over LocalStorage
GeoMarket explicitly prohibits storing authentication tokens in browser `localStorage`:
* **XSS Exfiltration Prevention:** If a malicious script is injected into a web page (via Cross-Site Scripting or a compromised third-party npm package), JavaScript can easily read `localStorage.getItem('token')` and transmit the credentials to an attacker.
* **HttpOnly Security Boundary:** A cookie flagged with `HttpOnly: true` is completely inaccessible to browser JavaScript. Even if an XSS vulnerability exists on the page, malicious scripts cannot read the session token.
* **CSRF Mitigation:** Configured with `SameSite: 'Lax'`, modern browsers strictly refuse to send the cookie during cross-site post requests, eliminating Cross-Site Request Forgery vulnerabilities.

---

## 11. LOCATION DATA FLOW

```text
Customer Sets Pin on Leaflet Map
Coordinates: Lat = 31.4187, Lon = 73.0791
    ↓
Frontend issues GET /api/v1/discovery/stores?latitude=31.4187&longitude=73.0791
    ↓
Express Controller passes coordinates to Discovery Service
    ↓
PostgreSQL 16 + PostGIS 3.4 Spatial Query
    ↓
ST_SetSRID(ST_MakePoint(73.0791, 31.4187), 4326)::geography
[Note: ST_MakePoint takes Longitude first, then Latitude]
    ↓
Evaluation of 4 Discovery Eligibility Conditions:
1. s.status = 'APPROVED'
2. s.is_active = true
3. s.is_accepting_orders = true
   AND safe_timestamptz_at_tz(NOW(), s.timezone) falls within store_operating_hours
4. ST_DWithin(s.location, customerPoint, s.delivery_radius_km * 1000)
    ↓
GiST Spatial Index (stores_location_gist_idx) accelerates search
    ↓
Distance Computed: ROUND(ST_Distance(s.location, customerPoint) / 1000.0, 2) AS distance_km
    ↓
Results sorted by distance_km ASC
    ↓
Eligible stores rendered on Customer Marketplace
```

### The Four Store Discovery Eligibility Conditions
A store appears in a customer's discovery catalog if and only if all four conditions are met simultaneously:
1. **Administrative Approval:** `stores.status == 'APPROVED'`. Stores in `PENDING_APPROVAL`, `REJECTED`, or `SUSPENDED` states are completely excluded.
2. **Administrative Active Flag:** `stores.is_active == true`. Platform administrators can deactivate a store globally without altering its approval status.
3. **Operational State & Local Operating Hours:**
   * `stores.is_accepting_orders == true`: The merchant can temporarily pause incoming orders during kitchen rushes or stock reorganizations.
   * **Weekly Operating Schedule:** The store must have an active `StoreOperatingHours` record for the current day of the week (`0 = Sunday, ..., 6 = Saturday`) where `is_closed == false`, and the current time in the store's configured timezone (`safe_timestamptz_at_tz`) falls strictly between `opening_time` and `closing_time`.
4. **Spatial Geodesic Reachability:** The geodesic distance between the customer's delivery coordinates and the store's centroid must be less than or equal to the store's delivery radius:
   $$d(\text{Customer}, \text{Store}) \le R_{\text{delivery}}$$

### Why PostGIS is Authoritative and Leaflet is the UI Layer
* **Leaflet is purely a presentation layer:** It runs inside the customer's browser to render OpenStreetMap tiles, capture click coordinates, and visually draw delivery radius circles for intuitive human interaction. Leaflet cannot enforce business rules because client-side code can be modified or bypassed.
* **PostGIS is the authoritative backend engine:** PostGIS is an enterprise-grade spatial database extension running inside PostgreSQL. It calculates distances using the WGS 84 ellipsoidal model of the Earth (`SRID 4326`), utilizing spatial **GiST (Generalized Search Tree) indexes**. It evaluates distances in milliseconds across thousands of stores without memory-intensive in-memory loops. The server-side PostGIS check is the sole authority that permits or denies store discovery and checkout.

---

## 12. CART DATA FLOW

```text
Customer clicks "Add to Cart" (Product P, Store S1)
    ↓
POST /api/v1/cart/items { productId, quantity }
    ↓
Backend begins PostgreSQL transaction (prisma.$transaction)
    ↓
1. Verifies Product P exists, is active, and Store S1 is approved & accepting orders
    ↓
2. Atomic Cart Row Creation / Lock:
   INSERT INTO carts (id, user_id, store_id, ...) VALUES (...)
   ON CONFLICT (user_id) DO NOTHING;
   SELECT id, user_id, store_id FROM carts WHERE user_id = :userId FOR UPDATE;
    ↓
3. Strict Single-Store Invariant Evaluation:
   ┌────────────────────────────────────────────────────────┐
   │ Is cart empty OR does Cart.storeId equal S1?           │
   └───────────┬────────────────────────────────┬───────────┘
               │ YES                            │ NO (Cart belongs to Store S2)
               ▼                                ▼
   Add / Update Cart Item               Abort Transaction
   Set Cart.storeId = S1                Throw CartServiceError
   Commit Transaction                   HTTP 409 Conflict: 'CART_STORE_CONFLICT'
   Return 200 OK with CartDto           Return { currentStoreName, attemptedStoreName }
               │                                │
               ▼                                ▼
   Frontend updates cart badge          Frontend catches 409 error
   Displays success notification        Opens Single-Store Conflict Modal
                                        Asks customer: "Clear cart and switch stores?"
```

### The Single-Store Cart Invariant
In physical retail and on-demand local commerce, allowing a customer to add products from multiple physical stores into a single checkout creates an impossible fulfillment scenario:
* Two different delivery couriers would need to be dispatched from different physical locations.
* Delivery fees and minimum order amounts would conflict.
* Delivery arrival times would diverge completely.

GeoMarket enforces the **Single-Store Cart Invariant** both in the database schema (`Cart.storeId`) and in the application business logic. A customer's active cart can belong to **at most one physical store at any given time**.

If a customer with items from "Store A" attempts to add an item from "Store B", the server immediately halts the transaction with HTTP 409 Conflict. The client renders an informative dialog allowing the customer to either retain their current cart or explicitly clear it and establish a new order context with Store B.

### Dynamic Availability Without Premature Stock Decrement
Adding an item to a cart **does not reserve or decrement inventory**. Inventory is decremented exclusively when an order is finalized during checkout.

However, to prevent customers from proceeding to checkout with unavailable items, every time `GET /api/v1/cart` is called, the cart service dynamically re-evaluates:
* Real-time product `stockQuantity >= item.quantity`.
* Product `isActive == true`.
* Store `isActive == true`, status is `APPROVED`, and `isAcceptingOrders == true`.

If any item fails these checks, it is flagged as `out_of_stock` or `unavailable`, the cart's overall `isValid` flag becomes `false`, and the checkout button is disabled with an explanatory banner.

---

## 13. CHECKOUT DATA FLOW

```text
Customer Clicks "Place Order (Cash on Delivery)"
    ↓
POST /api/v1/checkout { addressId }
    ↓
Backend Service executes authoritative Pre-Transaction Validations:
1. Address Ownership: customer_addresses.user_id == req.user.id
2. Cart Status: Cart exists, contains items, and storeId is not null
3. Store Eligibility: Store is APPROVED, is_active = true, is_accepting_orders = true
4. Timezone-Safe Operating Hours: isStoreCurrentlyOpen(store, timezone, NOW()) == true
5. PostGIS Delivery Radius: ST_DWithin(store.location, addressPoint, radius * 1000) == true
6. Pre-check: Product active flags and available stock quantities
    ↓
Prisma Transaction Initiated (orderRepository.createCheckoutOrderTransaction)
    ↓
1. Exclusive Cart Lock:
   SELECT id, user_id, store_id FROM carts WHERE id = :cartId FOR UPDATE;
    ↓
2. Deterministic Product Row Locking:
   SELECT id, store_id, name, price, stock_quantity, is_active
   FROM products
   WHERE id = ANY(:productIds)
   ORDER BY id
   FOR UPDATE;
    ↓
3. Re-verify under Lock:
   - Every product belongs to the store
   - Every product is active
   - product.stock_quantity >= item.quantity
   - Subtotal >= store.minOrderAmount
    ↓
4. Create Immutable Order Record:
   - status: 'PLACED'
   - paymentMethod: 'COD'
   - paymentStatus: 'PENDING'
   - subtotal, deliveryFee, totalAmount
    ↓
5. Create Immutable OrderItem Snapshots & Atomically Deduct Stock:
   For each item:
     - Insert order_items (productNameSnapshot, unitPriceSnapshot, quantity, lineTotal)
     - UPDATE products SET stock_quantity = stock_quantity - :qty WHERE id = :productId
    ↓
6. Create Immutable OrderAddressSnapshot:
   - Insert order_address_snapshots (recipientName, phone, addressLine, city, coordinates)
    ↓
7. Clear Cart:
   - DELETE FROM cart_items WHERE cart_id = :cartId
   - UPDATE carts SET store_id = null WHERE id = :cartId
    ↓
Transaction Commits Atomically
    ↓
Return 201 Created with OrderDto → Redirect to /orders/:orderId
```

### Why Checkout Revalidates Everything
A common question asked by evaluators is:
> "Why does checkout revalidate the delivery radius, operating hours, and product stock when the cart already checked them?"

In distributed web systems, **time elapses between adding an item to the cart and clicking checkout**:
1. A customer might add an item to their cart at 8:00 PM when a store is open, but click checkout at 10:05 PM after the store has closed.
2. A customer might add an item while in the office, but select their home address at checkout, which is outside the store's delivery radius.
3. Another customer might have purchased the remaining stock in the intervening minutes.
4. The merchant might have updated product prices or disabled the item.

Therefore, checkout treats the cart strictly as an untrusted intent. The server authoritatively re-validates the entire business invariant chain under exclusive database locks at the exact millisecond of checkout.

### Why Prices and Addresses Are Stored as Snapshots
E-commerce databases must maintain **strict historical immutability**:
* **Catalog Price Decoupling:** If a store sells Milk for Rs. 250 on Monday and raises the catalog price to Rs. 280 on Tuesday, orders placed on Monday must permanently display Rs. 250 on historical receipts and financial ledgers. Therefore, `OrderItem` stores `productNameSnapshot` and `unitPriceSnapshot`.
* **Address Decoupling:** If a customer edits their saved address next month, past orders delivered to their previous residence must retain the original delivery street name and coordinates. Therefore, `OrderAddressSnapshot` stores an immutable copy of the address data.

---

## 14. ORDER LIFECYCLE

### 14.1 Order State Machine Diagram

```text
               ┌───────────────────────┐
               │        [NULL]         │
               └───────────┬───────────┘
                           │ Customer Checkout
                           ▼
               ┌───────────────────────┐
        ┌─────►│        PLACED         ├──────┐
        │      └───────────┬───────────┘      │
        │                  │ Vendor Confirms  │
        │                  ▼                  │
        │      ┌───────────────────────┐      │
        │      │       CONFIRMED       ├──────┤
        │      └───────────┬───────────┘      │
        │                  │ Vendor Prepares  │
        │                  ▼                  │
        │      ┌───────────────────────┐      │
        │      │       PREPARING       │      │
        │      └───────────┬───────────┘      │
        │                  │ Packaging Done   │
        │                  ▼                  │
        │      ┌───────────────────────┐      │
        │      │         READY         │      │
        │      └───────────┬───────────┘      │
        │                  │ Dispatch Courier │
        │                  ▼                  │
        │      ┌───────────────────────┐      │
        │      │   OUT_FOR_DELIVERY    │      │
        │      └───────────┬───────────┘      │
        │                  │ Deliver & COD    │
        │                  ▼                  │
        │      ┌───────────────────────┐      │
        │      │       DELIVERED       │      │
        │      │ (paymentStatus: PAID) │      │
        │      └───────────────────────┘      │
        │             Terminal State          │
        │                                     │
        │ Cancelled by Customer or Vendor     │
        │ (Stock Atomically Restored)         │
        │                                     │
        │      ┌───────────────────────┐      │
        └─────►│       CANCELLED       │◄─────┘
               └───────────────────────┘
                    Terminal State
```

### 14.2 Transition Authorization Matrix

| From State | To State | Permitted Actor | Authorization Rule & Business Guard | Database Side Effects |
|---|---|---|---|---|
| `[NULL]` | `PLACED` | **Customer** | Validated cart, address in PostGIS radius, store open, stock verified under lock | Decrement inventory, snapshot prices & address, clear cart |
| `PLACED` | `CONFIRMED` | **Vendor** | Verified store ownership (`order.store.vendorProfileId === vendorProfileId`) | Order status advances to `CONFIRMED` |
| `PLACED` | `CANCELLED` | **Customer** | `order.userId === req.user.id`. Permitted only while order is `PLACED` or `CONFIRMED` | Atomic inventory replenishment (`increment: qty`), status $\rightarrow$ `CANCELLED` |
| `PLACED` | `CANCELLED` | **Vendor** | Verified store ownership (`order.store.vendorProfileId === vendorProfileId`) | Atomic inventory replenishment (`increment: qty`), status $\rightarrow$ `CANCELLED` |
| `CONFIRMED` | `PREPARING` | **Vendor** | Verified store ownership | Order status advances to `PREPARING` |
| `CONFIRMED` | `CANCELLED` | **Customer** | `order.userId === req.user.id` | Atomic inventory replenishment, status $\rightarrow$ `CANCELLED` |
| `CONFIRMED` | `CANCELLED` | **Vendor** | Verified store ownership | Atomic inventory replenishment, status $\rightarrow$ `CANCELLED` |
| `PREPARING` | `READY` | **Vendor** | Verified store ownership; packaging complete | Order status advances to `READY` |
| `READY` | `OUT_FOR_DELIVERY` | **Vendor** | Verified store ownership; courier departs | Order status advances to `OUT_FOR_DELIVERY` |
| `OUT_FOR_DELIVERY` | `DELIVERED` | **Vendor** | Courier hands over order and collects Cash on Delivery (COD) | Status $\rightarrow$ `DELIVERED`, `paymentStatus` $\rightarrow$ `PAID`, unlocks review |
| *Any Locked State* | `CANCELLED` | *Blocked* | Orders in `PREPARING`, `READY`, `OUT_FOR_DELIVERY`, or `DELIVERED` cannot be cancelled | Throws HTTP 400 `CANNOT_CANCEL_ORDER` |

### Terminal & Locked States
* **Terminal States:** `DELIVERED` and `CANCELLED` are terminal states in the FSM. No further transitions can occur from either state.
* **Cancellation Lockdown:** Once an order moves into `PREPARING`, neither the customer nor the vendor can cancel it through normal channels. This protects the merchant from absorbing losses on prepared food or packaged custom goods already handed to a courier.

---

## 15. INVENTORY DATA FLOW

```text
[SCENARIO: HIGH-CONTENTION CONCURRENCY]
Store has exactly 1 unit of "Organic Honey" in stock (stockQuantity = 1).
Customer A and Customer B both click "Place Order" at the exact same millisecond.
    ↓
Both requests enter POST /api/v1/checkout concurrently
    ↓
Database Server receives Request A and Request B in parallel transactions:
Tx A: Begins Prisma Transaction
Tx B: Begins Prisma Transaction
    ↓
[CONCURRENCY PROTECTION: DETERMINISTIC ROW-LEVEL LOCKING]
Tx A executes: SELECT id, stock_quantity FROM products WHERE id = 'honey-id' FOR UPDATE;
Tx B executes: SELECT id, stock_quantity FROM products WHERE id = 'honey-id' FOR UPDATE;
    ↓
PostgreSQL Row-Level Lock Resolution:
- Transaction A acquires the exclusive lock on the 'honey-id' row.
- Transaction B is instantly forced to WAIT at the database level.
    ↓
Execution of Transaction A (Under Lock):
1. Reads stock_quantity = 1
2. Evaluates: 1 >= 1 (Sufficient Stock)
3. Decrements stock: stockQuantity = 1 - 1 = 0
4. Creates Order for Customer A
5. Commits Transaction A
6. Exclusive lock on 'honey-id' is RELEASED
    ↓
Execution of Transaction B (Wakes Up and Re-reads Locked Row):
1. Transaction B acquires lock on 'honey-id'
2. Re-reads current committed state: stock_quantity = 0
3. Evaluates: 0 >= 1 (FALSE!)
4. Aborts Transaction B and throws Error('INSUFFICIENT_STOCK')
5. Database rolls back Transaction B cleanly
    ↓
Outcome:
- Customer A receives confirmed Order #ORD-101.
- Customer B receives HTTP 400 Error: "Insufficient stock for Organic Honey (Available: 0)".
- Invariant Preserved: Stock NEVER drops below 0; overselling is mathematically impossible.
```

### Deterministic Lock Ordering Against Deadlocks
When an order contains multiple products (e.g., Product X and Product Y), locking rows in arbitrary order can cause a classic **database deadlock**:
* Transaction 1 locks Product X and attempts to lock Product Y.
* Transaction 2 locks Product Y and attempts to lock Product X.
* Both transactions freeze permanently waiting for each other until the database detects a deadlock and aborts one.

GeoMarket completely eliminates deadlocks by enforcing **deterministic lock ordering**:
```sql
SELECT id, store_id, name, price, stock_quantity, is_active
FROM products
WHERE id = ANY($1)
ORDER BY id ASC
FOR UPDATE;
```
Because both transactions request row locks in the exact same sorted alphabetical order of product IDs, cyclical wait conditions cannot occur.

### Concurrency-Safe Stock Replenishment on Cancellation
When an order is cancelled, inventory must be returned to the store catalog. To prevent race conditions during cancellation:
1. The cancellation service locks the order row (`SELECT ... FOR UPDATE`).
2. It locks the corresponding product rows (`SELECT ... FOR UPDATE ORDER BY id`).
3. It increments the stock quantities:
   ```typescript
   await tx.product.update({
     where: { id: productId },
     data: { stockQuantity: { increment: quantity } }
   });
   ```
4. It sets the order status to `CANCELLED` and commits the transaction.

---

## 16. REVIEW & RATING FLOW

```text
Customer Order Reaches DELIVERED Status
    ↓
Verified Purchase Review Card unlocks on /orders/:orderId
    ↓
Customer selects rating (1–5 Stars), enters comment, and clicks "Submit"
    ↓
POST /api/v1/reviews { orderId, rating, comment }
    ↓
Backend Review Service Validations:
1. Order Exists & Ownership: order.userId === req.user.id
2. Verified Delivery Guard: order.status === 'DELIVERED'
3. Anti-Fraud Guard: order.store.vendorProfile.userId !== req.user.id (Vendors cannot review own stores)
4. Invariant: One review per order (enforced by DB UNIQUE(order_id) constraint)
    ↓
Database Transaction (reviewRepository.createReviewTransaction):
  - INSERT INTO reviews (id, order_id, user_id, store_id, rating, comment, ...)
    [CHECK constraint verifies 1 <= rating <= 5]
  - Aggregate query on reviews table:
      SELECT AVG(rating)::numeric(3,2) as avg_rating, COUNT(id)::int as count
      FROM reviews WHERE store_id = :storeId
  - Atomically updates store denormalized metrics:
      UPDATE stores
      SET average_rating = :avg_rating, total_reviews = :count
      WHERE id = :storeId
    ↓
Transaction Commits
    ↓
Customer Identity Sanitized for Public Display: "Ahmad K." (never leaks user_id or order_id)
Store Average Rating reflects immediately on /stores and /stores/:id
```

---

## 17. VENDOR ANALYTICS DATA FLOW

```text
Database Entities
┌─────────────────┐       ┌─────────────────┐
│     ORDERS      │       │     REVIEWS     │
└────────┬────────┘       └────────┬────────┘
         │                         │
         ▼                         ▼
┌────────────────────────────────────────────────────────┐
│               Vendor Analytics Service                 │
│                 (Timezone-Aware)                       │
└────────────────────────┬───────────────────────────────┘
                         │
        ┌────────────────┼────────────────┐
        ▼                ▼                ▼
┌──────────────┐ ┌──────────────┐ ┌──────────────┐
│ Order Counts │ │   Revenue    │ │ Rating Stats │
└───────┬──────┘ └───────┬──────┘ └───────┬──────┘
        │                │                │
        └────────────────┼────────────────┘
                         ▼
        ┌────────────────────────────────┐
        │       VendorAnalyticsDto       │
        │ - totalOrders: 42              │
        │ - deliveredOrders: 38          │
        │ - cancelledOrders: 4           │
        │ - revenue: Rs. 48,250.00       │
        │ - averageOrderValue: Rs. 1,269 │
        │ - averageRating: 4.85          │
        │ - reviewCount: 26              │
        │ - recentReviews: [...]         │
        └────────────────────────────────┘
```

### Authoritative Calculation Rules
Every metric in GeoMarket vendor analytics originates directly from database records without synthetic estimates:
* **Total Orders:** Count of all orders placed for the vendor's stores within the selected period (`prisma.order.count({ where: orderWhere })`).
* **Delivered Orders:** Count of orders with `status == 'DELIVERED'`.
* **Cancelled Orders:** Count of orders with `status == 'CANCELLED'`.
* **Total Revenue:** The sum of `totalAmount` strictly from orders with `status == 'DELIVERED'`. In-transit, pending, or cancelled orders never contribute to revenue.
* **Average Order Value (AOV):** Calculated as:
  $$\text{AOV} = \frac{\text{Total Revenue}}{\text{Delivered Orders}}$$
  (Returns `0` if delivered orders equal zero).
* **Average Rating & Review Count:** Calculated via PostgreSQL aggregate function `AVG(rating)` and `COUNT(id)` on the `reviews` table.
* **Period Filtering:** Supports `today` (midnight in store's local timezone via `Intl.DateTimeFormat`), `last_7_days`, `last_30_days`, and `all_time`.

---

## 18. DATABASE RELATIONSHIP OVERVIEW

```text
USER (users)
 │
 ├── (1:1)── VENDOR_PROFILE (vendor_profiles)
 │            │
 │            └── (1:N)── STORE (stores)
 │                         │
 │                         ├── (1:N)── STORE_OPERATING_HOURS (store_operating_hours)
 │                         ├── (1:N)── PRODUCT (products)
 │                         ├── (1:N)── ORDER (orders)
 │                         └── (1:N)── REVIEW (reviews)
 │
 ├── (1:N)── CUSTOMER_ADDRESS (customer_addresses)
 │            [Partial Unique: UNIQUE(user_id) WHERE is_default = true]
 │
 ├── (1:1)── CART (carts)
 │            [UNIQUE(user_id)]
 │            └── (1:N)── CART_ITEM (cart_items)
 │                         └── (N:1)── PRODUCT
 │
 └── (1:N)── ORDER (orders)
              │
              ├── (1:N)── ORDER_ITEM (order_items)
              │            └── (N:1)── PRODUCT (ON DELETE SET NULL)
              │
              ├── (1:1)── ORDER_ADDRESS_SNAPSHOT (order_address_snapshots)
              │
              └── (1:1)── REVIEW (reviews)
                           [UNIQUE(order_id), CHECK(rating >= 1 AND rating <= 5)]

TAXONOMIES:
 STORE_CATEGORY (1:N)── STORES (ON DELETE RESTRICT)
 PRODUCT_CATEGORY (1:N)── PRODUCTS (ON DELETE RESTRICT)
```

### Explanations of Key Schema Design Decisions
1. **`VendorProfile` Decoupling ($1:1$):** A `User` is an authentication identity. A `VendorProfile` represents a commercial business entity with tax and banking information. Decoupling them allows customers to upgrade to merchants cleanly and ensures store ownership is tied to a commercial profile.
2. **PostGIS `STORED` Generated Column:** The `stores` table stores `latitude DECIMAL(10, 8)` and `longitude DECIMAL(11, 8)` for standard tabular reads, but automatically generates and persists a PostGIS point:
   ```sql
   ALTER TABLE "stores" ADD COLUMN "location" geography(Point, 4326)
   GENERATED ALWAYS AS (ST_SetSRID(ST_MakePoint("longitude", "latitude"), 4326)::geography) STORED;
   CREATE INDEX "stores_location_gist_idx" ON "stores" USING GIST ("location");
   ```
   This guarantees the spatial index is always perfectly synchronized with coordinates without application-level overhead.
3. **Partial Unique Index on Default Addresses:** To ensure a customer can have strictly one default address without table-wide locking, a partial unique index is enforced in PostgreSQL:
   ```sql
   CREATE UNIQUE INDEX "customer_addresses_user_id_is_default_unique"
   ON "customer_addresses"("user_id") WHERE "is_default" = true;
   ```
4. **Snapshot Tables (`order_items` & `order_address_snapshots`):** Orders decouple completely from mutable catalog rows. If a product is renamed, re-priced, or deleted, historical order items preserve their exact purchase data.
5. **Strict Review Constraints:** Reviews enforce `UNIQUE(order_id)` to prevent review duplicate spamming and a database check constraint `CHECK (rating >= 1 AND rating <= 5)` to guarantee data validity at the storage layer.

---

## 19. END-TO-END SYSTEM DATA FLOW

```text
                               ┌───────────────────────────┐
                               │   Customer / Merchant     │
                               │   React SPA (Vite / TS)   │
                               └─────────────┬─────────────┘
                                             │ HTTP Requests + HttpOnly Cookie
                                             ▼
                               ┌───────────────────────────┐
                               │    Express API Gateway    │
                               │         (/api/v1)         │
                               └─────────────┬─────────────┘
                                             │
                       ┌─────────────────────┼─────────────────────┐
                       │                     │                     │
                       ▼                     ▼                     ▼
             ┌───────────────────┐ ┌───────────────────┐ ┌───────────────────┐
             │ Auth & Middleware │ │ Zod Validation    │ │ Modular Services  │
             │ JWT / RBAC Check  │ │ Runtime Schemas   │ │ Business Logic    │
             └─────────┬─────────┘ └─────────┬─────────┘ └─────────┬─────────┘
                       │                     │                     │
                       └─────────────────────┼─────────────────────┘
                                             │
                                             ▼
                               ┌───────────────────────────┐
                               │   Domain Repositories     │
                               │   Data Access Layer       │
                               └─────────────┬─────────────┘
                                             │
                       ┌─────────────────────┴─────────────────────┐
                       │                                           │
                       ▼                                           ▼
             ┌───────────────────┐                       ┌───────────────────┐
             │    Prisma ORM     │                       │ Raw SQL ($query)  │
             │ Typed CRUD Access │                       │ PostGIS Operators │
             └─────────┬─────────┘                       └─────────┬─────────┘
                       │                                           │
                       └─────────────────────┬─────────────────────┘
                                             │
                                             ▼
                               ┌───────────────────────────┐
                               │  PostgreSQL 16 + PostGIS  │
                               │  - GiST Spatial Indexes   │
                               │  - Row Locks (FOR UPDATE) │
                               │  - ACID Transactions      │
                               │  - Partial Unique Indexes │
                               └───────────────────────────┘
```

---

## 20. "HOW I WOULD EXPLAIN GEOMARKET TO MY TEACHER"

*(A practical guide written in clear, articulate spoken language for a project presentation or viva defense).*

### "What is GeoMarket?"
> "GeoMarket is a location-aware multi-vendor e-commerce platform. Unlike standard online shopping sites where products are shipped from distant warehouses over several days, GeoMarket connects customers with physical brick-and-mortar stores in their immediate local neighborhood for fast, same-day delivery."

### "What core problem does it solve?"
> "Traditional e-commerce platforms like Amazon or Daraz ignore the physical location of local retail shops. If I want fresh milk, bread, or medicine delivered within an hour, ordering from a national marketplace makes no sense because their logistics take days. GeoMarket bridges digital commerce with local retail by making stores discoverable only to customers who are physically within their local delivery range."

### "How does a customer use it?"
> "A customer opens GeoMarket and sets their delivery location by dropping a pin on an interactive map or using GPS. The system queries our PostGIS database and shows only the nearby stores that can actually deliver to that pin. The customer opens a store, selects items, adds them to a store-anchored cart, and checks out using Cash on Delivery. They can watch their order progress from confirmation to delivery in real time and leave a verified review once it arrives."

### "How does a vendor use it?"
> "A merchant registers a vendor account and creates their physical store. They drop a pin on the map to set their store's location, specify how far their delivery drivers can travel—say, 5 kilometers—and set their weekly operating hours. Then they upload their products and stock levels. When customer orders arrive, the vendor uses their fulfillment dashboard to confirm the order, prepare it, dispatch it with their delivery driver, and record that cash was collected."

### "What does the admin do?"
> "The administrator is the quality and governance authority. When a vendor creates a store, it does not immediately go live. It enters the admin queue as 'Pending Approval'. The admin reviews the merchant's legal credentials and inspects the store's location and delivery radius on a map. If everything is verified, the admin approves the store. The admin can also reject or suspend stores with mandatory reasons and manage product and store categories."

### "How does location-based discovery work mathematically?"
> "We don't use hardcoded neighborhood names like 'D Ground' or 'Gulberg' because string matching is fragile. Instead, we use mathematical coordinates. Every store has a latitude and longitude centroid and a delivery radius in kilometers. When a customer sets their location pin, our backend executes a PostGIS spatial query using `ST_DWithin`. PostGIS calculates the geodesic distance across the curved surface of the Earth. If the distance from the customer to the store is less than or equal to the store's delivery radius, and if the store is approved, active, and currently open according to its weekly schedule, the store appears in the customer's marketplace."

### "Why is the cart limited to a single store?"
> "In an on-demand local delivery model, you cannot combine items from two different physical stores into one delivery bag. If a customer buys milk from Store A and a burger from Restaurant B, they would require two separate delivery drivers, two separate delivery fees, and two different arrival times. To prevent impossible fulfillment conflicts, our cart enforces a Single-Store rule. If a customer tries to add an item from a new store, our system detects the conflict, prompts the customer, and asks if they want to clear their old cart and start an order with the new store."

### "How is inventory protected against overselling?"
> "We protect inventory by locking database rows during checkout. If two customers try to buy the last remaining item at the exact same moment, both transactions attempt to run. However, our database query uses PostgreSQL's `SELECT ... FOR UPDATE` with deterministic lock ordering. The first transaction locks the product row, confirms the stock is available, decrements the quantity to zero, and commits. When the second transaction wakes up, it re-reads the updated stock, sees zero items left, and is rejected with an 'Insufficient Stock' error. Stock can never drop below zero."

### "Why do you store prices and addresses as snapshots?"
> "If a store sells an item for Rs. 200 today, and the merchant raises the price to Rs. 250 tomorrow, the customer's historical receipt and the store's sales records from today must permanently show Rs. 200. If we just linked to the product row, past receipts would incorrectly change price whenever the merchant edited their catalog. By taking immutable snapshots of the product name, unit price, and delivery address at the moment of checkout, historical records remain permanently accurate."

### "How does authentication work?"
> "We use BCrypt to hash passwords with a cost factor of 12 before saving them in the database. When a user logs in, we verify the password and generate a signed JSON Web Token containing their user ID and role. We store this token in a secure, `HttpOnly`, `SameSite=Lax` cookie. Because it is marked `HttpOnly`, JavaScript cannot access it, which completely protects our users from token theft via Cross-Site Scripting (XSS) attacks."

### "What makes the architecture clean and reliable?"
> "We organized the application as a Clean Modular Monolith. The frontend and backend are completely decoupled, communicating over a structured REST API with shared TypeScript interfaces. We use PostgreSQL transactions for all critical operations, native PostGIS spatial indexing for high-performance geospatial queries, and strict state machines for store governance and order fulfillment. Everything is type-safe, validated with Zod, and backed by automated tests."

---

## 21. TEACHER / VIVA QUESTIONS & DEFENSE ANSWERS

### Q1: Why did you choose a Modular Monolith instead of Microservices?
**Answer:**  
"A modular monolith provides clean domain decoupling without the massive operational overhead, network latency, distributed transaction complexity (e.g., Saga patterns, two-phase commits), and deployment fragility of microservices. In GeoMarket, operations like checkout require atomic ACID guarantees across carts, products, orders, and addresses. Running this within a modular monolith allows us to use native database transactions (`prisma.$transaction`) with row-level locks, ensuring 100% data consistency while keeping the codebase cleanly organized into independent domain modules."

### Q2: Why did you use PostGIS instead of writing a Haversine formula in TypeScript?
**Answer:**  
"Calculating distance in application code with the Haversine formula requires pulling every store from the database into Node.js memory and looping through them one by one ($O(N)$). As the platform grows to thousands of stores, this causes severe CPU and memory bottlenecks. PostGIS operates directly inside the database engine and uses a **Spatial GiST Index** (`stores_location_gist_idx`). It uses bounding box pre-filtering to evaluate spatial proximity in logarithmic time ($O(\log N)$) and leverages SIMD hardware acceleration, executing spatial checks in milliseconds."

### Q3: How do you prevent Vendor A from accessing or modifying Vendor B's data?
**Answer:**  
"We enforce server-side Multi-Tenant Isolation. We never accept or trust a `vendorProfileId` passed in from the client request body. Instead, our authentication middleware extracts the vendor identity strictly from the verified, cryptographically signed JWT. Whenever a vendor requests, edits, or deletes a store, product, or order, the database query includes an explicit tenant check (`WHERE vendorProfileId = req.user.vendorProfileId`). If a vendor attempts to access an entity belonging to another merchant, the server returns a generic `404 Not Found` to prevent entity enumeration."

### Q4: Why is coordinate order in PostGIS `ST_MakePoint(longitude, latitude)` reversed compared to common speech?
**Answer:**  
"In everyday language, people say 'Latitude, Longitude'. However, in Cartesian coordinate mathematics and GIS standards (such as OpenGIS / OGC specifications), coordinates represent an $(X, Y)$ plane. The $X$-axis represents East-West (Longitude), and the $Y$-axis represents North-South (Latitude). Therefore, PostGIS spatial constructors strictly require `ST_MakePoint(X, Y)`, which translates to `ST_MakePoint(longitude, latitude)`."

### Q5: How do you handle store timezones when verifying operating hours?
**Answer:**  
"Stores can operate across different timezones. If a server is running in UTC, querying `NOW()` directly would compare against UTC rather than the store's local solar time. We wrote a custom PostgreSQL function `safe_timestamptz_at_tz(t, tz, fallback)` that converts the current UTC timestamp into the store's local timezone (e.g., `'Asia/Karachi'`). This ensures that opening and closing time comparisons reflect the actual local time of the physical shop, with resilient fallback to prevent database exceptions if an invalid timezone string is encountered."

### Q6: Why do you store `location` as a `STORED` generated column in PostgreSQL?
**Answer:**  
"If latitude and longitude are updated in the tabular columns, a manually managed spatial point could get out of sync if an application bug omitted the spatial update. By declaring `location` as `geography(Point, 4326) GENERATED ALWAYS AS (...) STORED`, PostgreSQL guarantees that the spatial geography column is updated automatically at the storage engine level whenever coordinates change. It also enables us to build a persistent GiST index directly on the generated point."

### Q7: How does your system prevent race conditions during high-concurrency checkouts?
**Answer:**  
"We use pessimistic row-level locking via PostgreSQL's `SELECT ... FOR UPDATE`. When checkout begins, the server locks the product rows being purchased in deterministic alphabetical order of their primary keys (`ORDER BY id`). Any concurrent checkout transaction attempting to purchase the same products is queued by the database until the first transaction commits or rolls back. The second transaction then re-reads the updated stock and aborts if inventory has reached zero, guaranteeing that overselling cannot occur."

### Q8: What happens if an admin suspends a store while customers have active orders?
**Answer:**  
"When a store is suspended (`status = SUSPENDED, isActive = false`), its products immediately disappear from discovery and search, preventing any new orders from being placed. However, existing orders already in `PLACED`, `CONFIRMED`, `PREPARING`, `READY`, or `OUT_FOR_DELIVERY` retain their historical records and snapshots. The vendor can still fulfill their remaining active orders, and customers can still track their deliveries and submit reviews upon delivery."

### Q9: Why did you implement Cash on Delivery (COD) instead of credit cards?
**Answer:**  
"In developing markets and local on-demand physical retail, Cash on Delivery accounts for over 80% of consumer transactions due to low credit card penetration and consumer trust preferences. COD also avoids external payment gateway webhooks during the core capstone demonstration. Our database schema explicitly defines `paymentMethod: COD` and `paymentStatus: PENDING | PAID | CANCELLED`. When the merchant marks an order as `DELIVERED`, the system automatically transitions `paymentStatus` to `PAID`, accurately modeling doorstep cash collection."

### Q10: How do you ensure reviews are genuine and not faked?
**Answer:**  
"We enforce a **Verified-Purchase Review Model**. A customer cannot review a store arbitrarily. A review can only be submitted if:
1. The customer actually placed an order with that store.
2. The order has progressed all the way to `DELIVERED` status.
3. The customer owns the order (`order.userId === req.user.id`).
4. The merchant cannot review their own store.
5. The database enforces `UNIQUE(order_id)`, guaranteeing that an order can only be reviewed exactly once."

### Q11: What is the purpose of the partial unique index on `customer_addresses`?
**Answer:**  
"A customer can have multiple saved addresses (Home, Office, Parents' House), but exactly one must be designated as the active `default`. In standard SQL, enforcing 'only one default per user' requires complex triggers or table-wide locking. PostgreSQL supports partial indexes:
`CREATE UNIQUE INDEX ... ON customer_addresses(user_id) WHERE is_default = true;`
This allows multiple rows with `is_default = false`, but the database physically rejects any attempt to insert or update a second row with `is_default = true` for the same user, providing unbreakable concurrency safety."

### Q12: Why do you validate input with Zod on both client and server?
**Answer:**  
"Client-side validation provides immediate visual feedback to the user, preventing unnecessary HTTP requests when forms are incomplete. However, client-side code can easily be bypassed using curl or Postman. Server-side Zod validation acts as a strict security barrier, validating every incoming request body and query parameter before it reaches controllers or database repositories, preventing SQL injection, type confusion, and malformed data."

---

## 22. IMPORTANT TERMINOLOGY GLOSSARY

| Term | Technical Meaning | Specific Usage in GeoMarket |
|---|---|---|
| **Clean Modular Monolith** | A software architecture where all domain modules reside in a single deployable repository but maintain strict boundary encapsulation and isolated concerns. | GeoMarket runs as a single Node.js/Express service, but separates domains into `auth`, `address`, `store`, `product`, `discovery`, `cart`, `order`, `review`, and `analytics`. |
| **RBAC (Role-Based Access Control)** | A security paradigm that restricts system access based on assigned user roles. | GeoMarket defines `CUSTOMER`, `VENDOR`, and `ADMIN`. Handled via `requireAuth` and `requireRole` middleware derived from the backend JWT. |
| **Tenant Isolation** | Architectural isolation ensuring one organization/merchant cannot view or modify another merchant's data. | Vendors are restricted strictly to stores, products, and orders matching their `vendorProfileId`, protected with 404 anti-enumeration responses. |
| **JWT (JSON Web Token)** | An open standard (RFC 7519) defining a compact, self-contained method for securely transmitting verified claims as a JSON object. | Used for session authentication. Contains `{ sub: userId, role, vendorProfileId }`, signed with a 256-bit secret. |
| **HttpOnly Cookie** | An HTTP response header cookie attribute that forbids client-side JavaScript from accessing the cookie value. | Used to store the JWT `token` cookie, completely neutralizing Cross-Site Scripting (XSS) session theft. |
| **SameSite Cookie** | A cookie attribute that controls whether cookies are sent with cross-site requests. | Configured as `SameSite: 'Lax'`, protecting the platform against Cross-Site Request Forgery (CSRF). |
| **PostGIS** | An open-source spatial database extender for PostgreSQL that adds support for geographic objects and spatial indexing. | Powers GeoMarket's spatial engine, storing store centroid points and evaluating delivery reachability via `ST_DWithin`. |
| **GiST Index** | Generalized Search Tree; an indexing method that allows hierarchical spatial bounding box searches in $O(\log N)$ time. | Applied to `stores.location` (`stores_location_gist_idx`), allowing the database to discover nearby stores in milliseconds without full table scans. |
| **`ST_DWithin`** | A PostGIS spatial function that returns true if two geometries/geographies are within a specified distance of each other. | Evaluates whether a customer's coordinates fall within a store's configured delivery radius ($R_{\text{delivery}} \times 1000$ meters). |
| **`ST_Distance`** | A PostGIS spatial function that calculates the shortest geodesic distance between two points across the Earth's ellipsoidal surface. | Used during store discovery to compute and display the exact distance in kilometers (e.g., `1.42 km away`). |
| **`safe_timestamptz_at_tz`** | A custom PL/pgSQL database function that safely converts UTC timestamps to a target timezone with error handling. | Converts `NOW()` to the store's local timezone (e.g., `'Asia/Karachi'`) during discovery and checkout to evaluate operating hours safely. |
| **ACID Transaction** | A set of database operations that guarantee Atomicity, Consistency, Isolation, and Durability. | Used via `prisma.$transaction` during checkout, stock adjustments, store review aggregations, and order cancellations. |
| **Row-Level Lock (`FOR UPDATE`)** | A database locking mechanism that exclusively locks specific table rows against concurrent reads or writes until transaction completion. | Used in checkout (`SELECT ... FOR UPDATE`) to prevent overselling and race conditions when multiple customers buy the last item. |
| **Deterministic Lock Ordering** | Sorting records by a fixed sequence (e.g., primary key) before acquiring exclusive locks. | Product rows in cart are sorted with `ORDER BY id` before locking, mathematically eliminating database deadlocks. |
| **Data Snapshot** | Copying data attributes at a specific point in time into an immutable historical record. | Used in `order_items` (`productNameSnapshot`, `unitPriceSnapshot`) and `order_address_snapshots` to preserve historic records against catalog edits. |
| **FSM (Finite State Machine)** | A mathematical model of computation consisting of a set of states, inputs, and transition rules. | Governs store onboarding (`PENDING_APPROVAL` $\rightarrow$ `APPROVED` ...) and order fulfillment (`PLACED` $\rightarrow$ `CONFIRMED` $\rightarrow$ ... $\rightarrow$ `DELIVERED`). |
| **Single-Store Invariant** | A business rule dictating that a specific entity can only be associated with one parent entity at a time. | Enforces that a customer's active cart contains products from exactly one store, preventing impossible multi-store delivery dispatches. |
| **Cash on Delivery (COD)** | A payment mechanism where goods are paid for in cash upon physical arrival at the customer's address. | GeoMarket's payment model; orders start in `PENDING` payment status and transition to `PAID` upon vendor delivery confirmation. |
| **Prisma ORM** | A modern type-safe object-relational mapping tool for Node.js and TypeScript. | Translates TypeScript domain calls into optimized SQL queries, manages migrations, and enforces schema relationships. |
| **TanStack Query** | An asynchronous state management library for React that automates caching, background fetching, and synchronization. | Powers frontend server-state caching for stores, carts, orders, addresses, and vendor analytics. |
| **Zustand** | A lightweight, unopinionated client-state store for React. | Powers client-side transient state in GeoMarket, such as mobile navigation drawer toggling (`ui.store.ts`). |
| **Zod** | A TypeScript-first schema declaration and runtime data validation library. | Validates all incoming API payloads, form submissions, and URL parameters across client and server. |

---

## 23. FINAL "ONE-PAGE" SYSTEM MAP

```text
====================================================================================================
                                      GEOMARKET SYSTEM MAP
====================================================================================================

1. APPLICATION ENTRY & ROLES
   ├── FRONTEND: React 18 SPA (Vite + Tailwind CSS + Radix UI + TanStack Query + Leaflet)
   ├── BACKEND:  Node.js + Express Modular Monolith + TypeScript + Zod
   ├── DATABASE: PostgreSQL 16 + PostGIS 3.4 (Docker) + Prisma 5.14 ORM
   └── USER ROLES:
       ├── GUEST:    Location Setup, Store & Product Discovery (/products), Single-Store Cart, COD Checkout, Printable Invoice, Order Lookup
       ├── CUSTOMER: Discovery, Saved Addresses, Single-Store Cart, Checkout (COD), Order Tracking, Verified Reviews
       ├── VENDOR:   Store Onboarding, Operating Hours, Catalog, Atomic Inventory, FSM Dispatch, Analytics
       └── ADMIN:    Platform Overview & Revenue KPIs, Store Verification Queue, Taxonomy Management, Analytics, User Governance, Security

2. AUTHENTICATION & SECURITY
   ├── Passwords: BCrypt (Cost Factor 12) + Timing Attack Defense
   ├── Sessions:  JWT signed with 256-bit secret, stored in HttpOnly, Secure, SameSite=Lax Cookie (supports optional isGuest: true sessions)
   ├── RBAC:      requireAuth + requireRole middleware validating token claims on every request
   └── Isolation: Multi-tenant server-side scoping (vendor_profile_id) + 404 anti-enumeration guards

3. HYPERLOCAL GEOSPATIAL ENGINE
   ├── Representation: ST_MakePoint(longitude, latitude)::geography (SRID 4326) STORED Generated Column
   ├── Indexing:       GiST Spatial Index (stores_location_gist_idx)
   ├── Discovery:      PostGIS ST_DWithin(store.location, customerPoint, radius * 1000)
   ├── 4-Tier Check:   1. status == 'APPROVED'
   │                   2. is_active == true
   │                   3. is_accepting_orders == true AND safe_timestamptz_at_tz within operating_hours
   │                   4. geodesic distance <= delivery_radius_km
   └── Presentation:   Leaflet & React-Leaflet (interactive map pin drop & delivery radius circle, GPS loader)

4. COMMERCE & INVENTORY PIPELINE
   ├── Cross-Store Catalog: /products with vertical left-sidebar filtering (categories, stores, price range, stock, sorting)
   ├── Product Detail:     /products/:id with high-res imagery, store card, stock counter, single-store conflict modal
   ├── Single-Store Cart:  Cart.storeId anchor. Mismatches trigger HTTP 409 CART_STORE_CONFLICT
   ├── Dual-Mode Checkout: Authoritative revalidation; supports saved customer addresses or inline guest addresses
   ├── Order Confirmation: /orders/:id/success with itemized receipt, celebration banner, and printable invoice
   ├── Guest Tracking:     /orders/track lookup by Order ID + recipient phone number
   ├── Concurrency Locks:  SELECT ... FOR UPDATE ORDER BY id (Pessimistic locking, deadlock-free)
   ├── Data Immutability:  OrderItem snapshots (name, price) + OrderAddressSnapshot (address, coords)
   ├── Order FSM:          PLACED ──► CONFIRMED ──► PREPARING ──► READY ──► OUT_FOR_DELIVERY ──► DELIVERED
   │                       └──► CANCELLED (Restores stock atomically; permitted from PLACED/CONFIRMED)
   ├── Payment Model:      Cash on Delivery (COD); paymentStatus: PENDING ──► PAID upon DELIVERED
   ├── Verified Reviews:   1-5 stars, strictly for DELIVERED orders, UNIQUE(order_id), atomic aggregates
   ├── Vendor Analytics:   Live calculations for Total Revenue, Delivered Orders, AOV, Ratings, Reviews
   └── Admin Operations:   Revenue telemetry, live order stream, user management, and password security

5. KEY DATABASE ENTITIES & CONSTRAINTS
   ├── users                   (id PK, email UNIQUE, password_hash, role, is_active, is_guest)
   ├── vendor_profiles         (id PK, user_id FK UNIQUE, business_legal_name, tax_id, bank_info)
   ├── customer_addresses      (id PK, user_id FK, coords, is_default, UNIQUE(user_id) WHERE is_default)
   ├── stores                  (id PK, vendor_profile_id FK, status, is_active, location geography)
   ├── store_operating_hours   (id PK, store_id FK, day_of_week 0-6, opening_time, closing_time)
   ├── products                (id PK, store_id FK, UNIQUE(store_id, slug), price, stock_quantity)
   ├── carts                   (id PK, user_id FK UNIQUE, store_id FK NULLABLE)
   ├── cart_items              (id PK, cart_id FK, product_id FK, UNIQUE(cart_id, product_id))
   ├── orders                  (id PK, user_id FK, store_id FK, status, payment_method, payment_status)
   ├── order_items             (id PK, order_id FK, product_name_snapshot, unit_price_snapshot)
   ├── order_address_snapshots (id PK, order_id FK UNIQUE, recipient_name, address, coordinates)
   └── reviews                 (id PK, order_id FK UNIQUE, rating CHECK(1-5), comment, sanitized user)
====================================================================================================
```
