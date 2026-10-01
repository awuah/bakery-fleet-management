# Crust & Fleet — Bakery Production & Fleet Logistics System 🥐🚚

A real-time bakery management and fleet delivery logistics system featuring a **central Supabase backend**, an **HQ Web Management Dashboard (React + Leaflet + Realtime)**, and a **Driver Companion Mobile App (Flutter for Android)**.

## Live Deployment & Repository

- **Live Web Management Dashboard**: [https://web-roan-eight-83.vercel.app](https://web-roan-eight-83.vercel.app)
- **GitHub Repository**: [https://github.com/awuah/bakery-fleet-management](https://github.com/awuah/bakery-fleet-management)
- **Supabase Project**: `ttczgbfxntvgqdbclruh` (Region: `eu-west-1`)

---

## Architecture Overview

```
                                  ┌──────────────────────────────────────────────┐
                                  │          Central Supabase Backend            │
                                  │  (Postgres, Auth, Realtime GPS & Inventory)  │
                                  └──────────────▲────────────────▲──────────────┘
                                                 │                │
                                    Realtime Sync│                │Live GPS & Deliveries
                                                 │                │
                            ┌────────────────────▼─────┐    ┌─────▼──────────────────────┐
                            │   HQ Web Management App  │    │  Driver Mobile/Tablet App  │
                            │     (Bakery Manager)     │    │      (Flutter Android)     │
                            │                          │    │                            │
                            │ • Master Bakery Stock    │    │ • Van Loaded Inventory     │
                            │ • Fleet Stock per Van    │    │ • Delivery Check-in/Drop   │
                            │ • Live Fleet GPS Map     │    │ • Background/Live GPS Ping │
                            │ • Stock Activity Logs    │    │ • Real-time Sync to Web    │
                            └──────────────────────────┘    └────────────────────────────┘
```

---

## 1. Central Backend (Supabase PostgreSQL + Realtime)

- **Products Table (`products`)**: Master catalogue of artisan breads, croissants, buns, and pastries with SKU, categories, and unit prices.
- **Master Production Stock (`master_stock`)**: Central inventory at the bakehouse facility, with low-stock alerts.
- **Fleet Vehicles (`vehicles`)**: Fleet vans with driver names, phones, license plates, battery level, speed, status, and live GPS coordinates (`current_lat`, `current_lng`).
- **Vehicle Stock (`vehicle_stock`)**: Real-time stock allocated to each van (loaded, delivered, remaining).
- **Customers & Shops (`customers`)**: Destination cafes, supermarkets, and delis with coordinates and contact details.
- **Deliveries (`deliveries` & `delivery_items`)**: Detailed delivery receipts, customer drop records, timestamps, item breakdowns, and driver notes.
- **Stock Movement Ledger (`stock_movements`)**: Comprehensive audit trail capturing:
  - `PRODUCTION_ADD` (Oven output added to master stock)
  - `VAN_LOAD` (Transferred from master bakery to van)
  - `VAN_DELIVERY` (Deducted from van stock upon customer drop)
  - `VAN_RETURN` / `WASTAGE`
- **Stored Procedures / RPCs**:
  - `record_van_delivery(...)`: Atomically records delivery, decrements van inventory, logs movement, and updates vehicle GPS position.
  - `transfer_to_van(...)`: Deducts master stock, loads van inventory, and writes transfer ledger.
  - `record_production_run(...)`: Adds fresh oven bake batches to master stock.

---

## 2. HQ Web Dashboard (`web/`)

Built with **React, Vite, TypeScript, Tailwind CSS, Leaflet, and Supabase Realtime**:
- **Interactive Live Fleet Radar**: Leaflet map displaying real-time van pins, speed, battery, driver details, and customer shops.
- **Master Bakery Stock Hub**: Live stock on hand, threshold indicators, "Log Bake Run" modal, and "Load Van" dispatch modal.
- **Fleet On-Road Stock Panel**: View live stock inside every vehicle on the road with loaded vs delivered vs remaining breakdown and fulfillment progress.
- **Live Stock Movement Ledger**: Real-time audit ticker streaming all bake runs, van loads, and customer deliveries.
- **Delivery Receipts**: Full log of completed drops with driver notes and store recipient names.

---

## 3. Companion Driver App (`mobile/`)

Built with **Flutter for Android (Phone & Tablet)**:
- **Vehicle Selector**: Pick assigned van (`VAN-01`, `VAN-02`, `VAN-03`).
- **Driver Dashboard**:
  - Live GPS radar broadcast toggle with automatic location updates to Supabase.
  - On-Board Inventory summary cards (units remaining vs delivered).
  - Delivery Stops list for assigned customer shops.
- **Shop Delivery Drop Workflow**:
  - Select destination shop.
  - Counter steppers to set delivered quantities with stock validation.
  - Recipient name and delivery notes.
  - Instant submission calling `record_van_delivery` RPC.
  - Deductions and location updates instantly reflect on the web dashboard map with zero refresh lag.
- **Van Manifest Screen**: Real-time view of loaded vs delivered vs remaining items.

---

## Getting Started

### Web Dashboard
```bash
cd web
npm install
npm run dev
```

### Mobile Companion App (Android)
```bash
cd mobile
flutter pub get
flutter run
```
