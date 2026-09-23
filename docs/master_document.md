# GeoMarket — Master Architectural Specification & System Blueprint

> **Document Classification:** Master Architectural Specification & System Blueprint Hub  
> **Target Audience:** University Evaluators, Academic Examiners, System Architects, Full-Stack Developers  
> **System Version:** 2.1.0 (Production Verified Baseline)  
> **Architecture Style:** Clean Modular Monolith with PostGIS Spatial Engine  

---

## 🏛 Modular Architecture Hub

To ensure maintainability, clear academic evaluation, and focused developer onboarding, the comprehensive GeoMarket architectural specification is partitioned into 5 modular, focused documents:

| Module | Document | Sections Covered | Primary Architectural Focus |
|---|---|---|---|
| **ARCH-01** | [**01 — Overview, System Architecture & Page Tree**](file:///c:/Users/ahmad/AndroidStudioProjects/ecom/docs/architecture/01_overview_and_page_tree.md) | Sections 1–3 | Project Identity, Academic Context, PostGIS Geodesic Model, 4-Tier Discovery Rule, System at a Glance ASCII Topology, Complete Page Hierarchy & Route Index Table |
| **ARCH-02** | [**02 — Page-by-Page Technical Specifications**](file:///c:/Users/ahmad/AndroidStudioProjects/ecom/docs/architecture/02_page_specifications.md) | Section 4 | Deep-dive technical specifications for all 25 public, customer, vendor, and admin pages (routes, access control, state management, UI layouts, actions, data flows, and next states) |
| **ARCH-03** | [**03 — Domain Workflows, Application Trees & Role Matrix**](file:///c:/Users/ahmad/AndroidStudioProjects/ecom/docs/architecture/03_domain_workflows_and_roles.md) | Sections 5–9 | Customer lifecycle, Customer step-by-step data flow, Vendor lifecycle & fulfillment, Admin governance tree, Comprehensive 4-Role Permission Comparison Matrix |
| **ARCH-04** | [**04 — Technical Data Flows & Transaction Pipelines**](file:///c:/Users/ahmad/AndroidStudioProjects/ecom/docs/architecture/04_technical_data_flows.md) | Sections 10–19 | JWT Auth Flow, PostGIS Discovery Engine, Cart Invariants, Checkout Pessimistic Locks (`FOR UPDATE`), Order FSM, Inventory Concurrency, Verified Reviews, Vendor Analytics, Database Relations, End-to-End Pipeline |
| **ARCH-05** | [**05 — Academic Defense, Viva Preparation & Glossary**](file:///c:/Users/ahmad/AndroidStudioProjects/ecom/docs/architecture/05_academic_defense_and_glossary.md) | Sections 20–23 | "How to Explain to Teacher", 12 Viva Defense Questions & Answers, Complete Technical Glossary, Final "One-Page" System Map |

---

## 📚 Cross-Document Specification Map

```
docs/
├── master_document.md                                     <-- (You are here) Master Architecture Hub
├── SYSTEM_REQUIREMENTS_AND_ARCHITECTURE_SPECIFICATION.md  <-- Requirements Index & Specification Hub
├── PROJECT_PLAN_AND_REVIEW_DOCUMENT.md                    <-- Implementation Phases, Verification & Reviews
│
├── architecture/                                          <-- Modular Architecture Modules
│   ├── 01_overview_and_page_tree.md                       <-- Problem, PostGIS Theory, Page Tree
│   ├── 02_page_specifications.md                          <-- 25 Full Page Technical Specs
│   ├── 03_domain_workflows_and_roles.md                   <-- Customer/Vendor/Admin Trees & RBAC
│   ├── 04_technical_data_flows.md                         <-- Data Flows, Concurrency, FSM, Locks
│   └── 05_academic_defense_and_glossary.md                <-- Viva Defense, Q&A, Glossary, Map
│
└── requirements/                                          <-- Modular Functional & Data Requirements
    ├── 01_system_overview_and_scope.md                    <-- Problem, Objectives, In/Out Scope
    ├── 02_functional_requirements.md                      <-- 13 Domains (AUTH, CUST, LOC, CART...)
    ├── 03_database_and_erd.md                             <-- 14 Entities, Prisma + SQL, Mermaid ERD
    └── 04_order_fsm_and_security.md                       <-- FSM State Transitions, BCrypt, JWT
```

---

## 🚀 System Architecture at a Glance

```text
====================================================================================================
                                      GEOMARKET SYSTEM TOPOLOGY
====================================================================================================

      PUBLIC CLIENTS                 CUSTOMER PORTAL                VENDOR DASHBOARD              ADMIN CONSOLE
   (Guest / Unauthenticated)     (Mobile / Desktop Browser)    (Store & Inventory Control)     (Platform Governance)
              │                              │                              │                            │
              ▼                              ▼                              ▼                            ▼
  ┌────────────────────────────────────────────────────────────────────────────────────────────────────────┐
  │                                    REACT 18 SINGLE-PAGE APPLICATION                                    │
  │                      Vite • TypeScript • Tailwind CSS • Lucide Icons • React-Leaflet                    │
  └────────────────────────────────────────────────────────────────────────────────────────────────────────┘
                                                     │
                                       HTTPS / JSON REST API / HttpOnly JWT
                                                     │
                                                     ▼
  ┌────────────────────────────────────────────────────────────────────────────────────────────────────────┐
  │                                  EXPRESS.JS REST API MODULAR MONOLITH                                  │
  │                      Zod Schema Validation • Role-Based Access Control (RBAC)                           │
  │  ┌───────────────┐  ┌───────────────┐  ┌───────────────┐  ┌───────────────┐  ┌──────────────────────┐  │
  │  │  Auth / User  │  │  Discovery    │  │  Store / Cat  │  │  Cart / Order │  │  Admin / Analytics   │  │
  │  │    Module     │  │    Module     │  │    Module     │  │    Module     │  │       Module         │  │
  │  └───────┬───────┘  └───────┬───────┘  └───────┬───────┘  └───────┬───────┘  └──────────┬───────────┘  │
  └──────────┼──────────────────┼──────────────────┼──────────────────┼─────────────────────┼──────────────┘
             │                  │                  │                  │                     │
             ▼                  ▼                  ▼                  ▼                     ▼
  ┌────────────────────────────────────────────────────────────────────────────────────────────────────────┐
  │                                           PERSISTENCE TIER                                             │
  │                              PostgreSQL 16 + PostGIS 3.4 Spatial Database                              │
  │                                                                                                        │
  │  • PostGIS Geodesics: ST_DWithin(store.location, customer_pt, radius_meters)                           │
  │  • Concurrency Control: SELECT ... FOR UPDATE pessimistic row-level locking on inventory                │
  │  • Strict Relational Integrity: Foreign keys, CASCADE / RESTRICT rules, partial unique indexes         │
  │  • Temporal Verification: store_operating_hours weekly schedule matching with timezone offsets        │
  └────────────────────────────────────────────────────────────────────────────────────────────────────────┘
====================================================================================================
```

---

## 🔑 Core Technical Highlights

1. **Hyperlocal PostGIS Spatial Engine:** Dynamic store discovery via `ST_DWithin` on ellipsoidal WGS-84 coordinates (`geography(Point, 4326)`). No brittle text-based city or area filtering.
2. **4-Tier Store Discovery Rule:** Stores appear if and only if: (1) `status == 'APPROVED'`, (2) `isActive == true`, (3) `isAcceptingOrders == true` and current local time falls within weekly `store_operating_hours`, and (4) customer coordinates fall within the store's delivery radius.
3. **Single-Store Cart Invariant:** A shopping cart is strictly anchored to a single store (`Cart.storeId`). Adding items from a different store triggers an HTTP 409 conflict dialog with options to switch stores or keep the current cart.
4. **Race-Free Concurrency & Inventory Row-Locks:** Checkout utilizes `SELECT ... FOR UPDATE` row locks in ascending product ID order to guarantee zero stock overselling and prevent database deadlocks.
5. **Deterministic Order Finite State Machine (FSM):** Strict, unidirectional order state transitions (`PLACED` $\rightarrow$ `CONFIRMED` $\rightarrow$ `PREPARING` $\rightarrow$ `READY` $\rightarrow$ `OUT_FOR_DELIVERY` $\rightarrow$ `DELIVERED`), with inventory restoration on cancellation.
6. **Data Immutability via Snapshots:** Customer delivery addresses and product names/prices are deeply snapshot at order placement time, preserving historical fidelity regardless of subsequent merchant edits.
7. **Verified-Purchase Reviews:** 1–5 star reviews can only be submitted for completed (`DELIVERED`) orders, protected by a unique database constraint (`UNIQUE(order_id)`).
