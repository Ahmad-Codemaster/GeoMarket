# GeoMarket — Page-by-Page Technical Specifications

> **Architecture Module:** 02 — Comprehensive Page Specifications & Route Matrix  
> **System Version:** 2.1.0 (Production Verified Baseline)  

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
