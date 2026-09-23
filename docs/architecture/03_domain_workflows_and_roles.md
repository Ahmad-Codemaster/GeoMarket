# GeoMarket — Domain Workflows, Application Trees & Role Matrix

> **Architecture Module:** 03 — Domain Workflows & Role Boundaries  
> **System Version:** 2.1.0 (Production Verified Baseline)  

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
