# GeoMarket — Academic Defense, Viva Preparation & Glossary

> **Architecture Module:** 05 — Academic Defense & Viva Blueprint  
> **System Version:** 2.1.0 (Production Verified Baseline)  

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
