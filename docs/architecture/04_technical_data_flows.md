# GeoMarket — Technical Data Flows & Transaction Pipelines

> **Architecture Module:** 04 — Technical Data Flows & Concurrency Controls  
> **System Version:** 2.1.0 (Production Verified Baseline)  

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
