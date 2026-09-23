# System Requirements — Functional Requirements Specification

> **Module Classification:** System Requirements & Architecture Specification (SRAS)  
> **Document Code:** `REQ-02`  
> **System Version:** 2.1.0  

---

## 1. Authentication & Authorization (AUTH)

* **FR-AUTH-001:** The system shall allow users to register by providing an email, password, full name, phone number, and account type (`CUSTOMER` or `VENDOR`).
* **FR-AUTH-002:** The system shall hash user passwords exclusively using the **BCrypt** cryptographic hashing algorithm with a minimum cost factor of 12 prior to persistence.
* **FR-AUTH-003:** Upon successful authentication, the system shall issue a digitally signed JSON Web Token (JWT) transmitted to the client exclusively within a **Secure, HttpOnly, SameSite cookie**.
* **FR-AUTH-004:** The system shall prohibit the storage of authentication credentials in client-side `localStorage` or `sessionStorage` to eliminate token exfiltration via Cross-Site Scripting (XSS).
* **FR-AUTH-005:** The system shall automatically create a `vendor_profiles` record for any user registered with the `VENDOR` role.
* **FR-AUTH-006:** The system shall enforce Role-Based Access Control (RBAC) on all protected API endpoints and screen routes.
* **FR-AUTH-007:** The system shall restrict vendors to accessing and mutating only the stores, products, inventory records, and orders that belong to their owned `VendorProfile`.

---

## 2. Customer & Profile Management (CUST)

* **FR-CUST-001:** The system shall allow customers to manage personal profile attributes including phone number and contact details.
* **FR-CUST-002:** The system shall allow customers to save multiple labeled delivery addresses (e.g., "Home", "Work") containing human-readable address lines, city, and explicit geographic coordinates.
* **FR-CUST-003:** The system shall allow customers to set one saved address as their primary/default location, guaranteed by a database partial unique index.

---

## 3. Location Services & Provider Abstraction (LOC)

* **FR-LOC-001:** The system shall define a `GeocodingProvider` interface to resolve text addresses to coordinates (forward geocoding) and coordinates to text addresses (reverse geocoding).
* **FR-LOC-002:** The system shall provide a default implementation of `GeocodingProvider` adhering to third-party usage limits and supporting configuration-driven swapping (Nominatim, Photon, Mock).
* **FR-LOC-003:** The system shall capture the customer's current geographic coordinates (latitude, longitude) using the browser Geolocation API upon receiving explicit user consent, providing visual loading spinner feedback.
* **FR-LOC-004:** The system shall allow customers to manually enter an address or move a map pin to establish reference coordinates if geolocation permissions are denied or unavailable.
* **FR-LOC-005:** The system shall validate that provided coordinates conform to valid geographic boundaries (latitude between $-90.0$ and $+90.0$, longitude between $-180.0$ and $+180.0$).

---

## 4. Store Discovery & Spatial Filtering (DISC)

* **FR-DISC-001:** The system shall evaluate store eligibility using a **4-tier criteria check**:
  1. Store approval status is `APPROVED`.
  2. Store administrative status is `is_active = TRUE`.
  3. Store operational status is `is_accepting_orders = TRUE` and current local time falls within configured `store_operating_hours`.
  4. Geodesic distance $d$ between customer coordinates and store coordinates satisfies $d \le R_{\text{delivery}}$.
* **FR-DISC-002:** Proximity filtering shall execute via isolated database repository methods executing parameterized raw SQL utilizing PostGIS functions (`ST_DWithin`, `ST_Distance`, `ST_SetSRID`, `ST_MakePoint`) over spatial GiST indexes.
* **FR-DISC-003:** The system shall allow customers to filter discoverable nearby stores by one or more `StoreCategory` entities.
* **FR-DISC-004:** The system shall allow customers to sort discoverable stores by proximity (nearest first), average rating (highest first), or minimum order amount.

---

## 5. Categories & Taxonomy (CAT)

* **FR-CAT-001:** The system shall maintain independent database entities for **Store Categories** (classifying retail store types) and **Product Categories** (classifying items within stores).
* **FR-CAT-002:** The system shall allow platform administrators to perform CRUD operations on global Store Categories (e.g., Groceries, Bakeries, Electronics, Pharmacy).
* **FR-CAT-003:** The system shall allow platform administrators to perform CRUD operations on global Product Categories, and allow vendors to associate products with relevant product categories.
* **FR-CAT-004:** The system shall require every store to be associated with at least one primary Store Category upon registration.

---

## 6. Vendor & Multi-Store Management (VEND)

* **FR-VEND-001:** The system shall permit a single `VendorProfile` to create and manage multiple independent stores ($1:N$).
* **FR-VEND-002:** The system shall require each store to be registered with: Store Name, Legal/Business Registration Number, Contact Phone, Physical Address, Coordinates (Lat/Lon), Primary Store Category, Delivery Radius (in km), and Base Delivery Fee.
* **FR-VEND-003:** The system shall automatically assign newly registered stores an initial status of `PENDING_APPROVAL`.
* **FR-VEND-004:** The system shall allow vendors to configure weekly operating schedules (opening time and closing time for each day of the week) for each owned store.
* **FR-VEND-005:** The system shall allow vendors to toggle an emergency `is_accepting_orders` switch for each owned store.

---

## 7. Product & Catalog Management (PROD)

* **FR-PROD-001:** The system shall allow vendors to create, edit, view, and delete products belonging exclusively to their owned stores.
* **FR-PROD-002:** The system shall require products to have a Name, Description, Product Category, Price (positive numeric), SKU (unique within the store), and at least one image URL.
* **FR-PROD-003:** The system shall allow vendors to toggle product visibility (`is_available = TRUE / FALSE`).
* **FR-PROD-004:** The system shall prevent vendors from viewing private catalog data or modifying products associated with other vendors' stores.
* **FR-PROD-005:** The system shall provide cross-store product discovery (`/products`) with vertical left-sidebar filtering across all eligible stores in delivery vicinity.
* **FR-PROD-006:** The system shall provide a dedicated single product view (`/products/:id`) displaying stock levels, price, store card, quantity stepper, and related recommendations.

---

## 8. Inventory Control (INV)

* **FR-INV-001:** The system shall maintain an integer `stock_quantity` attribute for each product.
* **FR-INV-002:** The system shall prevent customers from adding a quantity of a product to their cart exceeding the available `stock_quantity`.
* **FR-INV-003:** The system shall atomically decrement the product's `stock_quantity` upon successful order placement within an ACID database transaction using pessimistic row locks (`SELECT ... FOR UPDATE`).
* **FR-INV-004:** The system shall restore the deducted `stock_quantity` if an order is cancelled or rejected prior to fulfillment.

---

## 9. Shopping Cart Architecture (CART)

* **FR-CART-001:** The system shall associate a customer's or guest's active cart with exactly one store at any given time.
* **FR-CART-002:** The system shall allow customers to add products, adjust quantities, or remove items from their active cart.
* **FR-CART-003:** When a customer attempts to add a product from Store B while the cart contains items from Store A, the system shall intercept the action and present an explicit confirmation prompt: *"Your cart contains items from Store A. Discard existing items and start a new cart with Store B?"*
* **FR-CART-004:** The system shall clear existing cart items only upon explicit customer confirmation of the multi-store replacement prompt.

---

## 10. Checkout & Immutable Snapshotting (CHK)

* **FR-CHK-001:** The system shall allow checkout only if the store satisfies all 4 discovery eligibility criteria and the selected delivery address falls within the store's delivery radius.
* **FR-CHK-002:** The system shall support Cash on Delivery (COD) as the primary payment method for the MVP.
* **FR-CHK-003:** The system shall snapshot the complete delivery address (recipient name, contact phone, address line, city, latitude, longitude) into the order record at the moment of checkout, ensuring historical orders are immune to subsequent address edits or deletions.
* **FR-CHK-004:** The system shall snapshot product unit prices and product names into `order_items` at the moment of checkout, ensuring historical orders are immune to subsequent product price updates.

---

## 11. Order Status Tracking & Fulfillment FSM (ORD)

* **FR-ORD-001:** The system shall initialize new orders in the `PLACED` state.
* **FR-ORD-002:** The system shall enforce deterministic state transitions validated against both transition legitimacy and actor permissions (`PLACED` $\rightarrow$ `CONFIRMED` $\rightarrow$ `PREPARING` $\rightarrow$ `READY` $\rightarrow$ `OUT_FOR_DELIVERY` $\rightarrow$ `DELIVERED`).
* **FR-ORD-003:** The system shall permit the customer to track the order status via a stepped progression interface.
* **FR-ORD-004:** The system shall record a complete audit trail (timestamp, previous state, new state, user ID) for every status transition in `order_status_history`.
* **FR-ORD-005:** The system shall present an order celebration confirmation page (`/orders/:id/success`) with an itemized receipt and printable invoice upon checkout completion.

---

## 12. Guest Checkout & Session Tracking (GST)

* **FR-GST-001:** The system shall allow unauthenticated visitors to initialize a guest session (`POST /api/v1/auth/guest-session`) and shop without upfront account creation.
* **FR-GST-002:** The system shall support inline delivery address capture during checkout for guest sessions without requiring saved address records.
* **FR-GST-003:** The system shall provide a public guest order lookup portal (`/orders/track`) requiring Order ID and recipient phone number verification.
* **FR-GST-004:** The system shall display appropriate guest badges in navigation headers and hide registered customer links to avoid session confusion.

---

## 13. Admin Governance, Analytics & Security (ADM)

* **FR-ADM-001:** The system shall provide a real-time administrative platform overview displaying aggregate GMV revenue (today, week, month, total), order volume, user tallies, active stores, and live orders feed.
* **FR-ADM-002:** The system shall provide platform-wide telemetry and reports (`/admin/analytics`) showing order volume timelines and merchant performance ranking.
* **FR-ADM-003:** The system shall provide a searchable user management console (`/admin/users`) with role filter tabs, vendor-owned store discovery modal, role modification, and account deletion.
* **FR-ADM-004:** The system shall provide an administrative settings interface (`/admin/settings`) to verify privileges and securely update admin credentials with BCrypt hashing.
