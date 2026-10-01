-- SEED DATA FOR BAKERY MANAGEMENT SYSTEM

-- 1. Insert Bakery Products
insert into public.products (id, name, sku, category, unit_price, image_url) values
    ('a0000000-0000-0000-0000-000000000001', 'Artisan Country Sourdough', 'BRD-SOUR-01', 'Breads', 4.50, 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=400'),
    ('a0000000-0000-0000-0000-000000000002', 'Golden Butter Croissant', 'PAS-CROI-01', 'Pastries', 2.80, 'https://images.unsplash.com/photo-1555507036-ab1f4038808a?w=400'),
    ('a0000000-0000-0000-0000-000000000003', 'Brioche Burger Buns (6-Pack)', 'BUN-BRIO-06', 'Buns & Rolls', 5.20, 'https://images.unsplash.com/photo-1589367920969-ab8e050bbb04?w=400'),
    ('a0000000-0000-0000-0000-000000000004', 'Cinnamon Swirl Rolls', 'PAS-CINN-01', 'Pastries', 3.20, 'https://images.unsplash.com/photo-1509365465985-25d11c17e812?w=400'),
    ('a0000000-0000-0000-0000-000000000005', 'Rustic Whole Wheat Baguette', 'BRD-BAGU-01', 'Breads', 3.00, 'https://images.unsplash.com/photo-1549931319-a545dcf3bc73?w=400'),
    ('a0000000-0000-0000-0000-000000000006', 'Pain au Chocolat', 'PAS-CHOC-01', 'Pastries', 3.50, 'https://images.unsplash.com/photo-1623334044303-241021148842?w=400')
on conflict (id) do nothing;

-- 2. Master Production Stock
insert into public.master_stock (id, product_id, quantity, low_stock_threshold) values
    ('b0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001', 350, 40),
    ('b0000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000002', 500, 50),
    ('b0000000-0000-0000-0000-000000000003', 'a0000000-0000-0000-0000-000000000003', 240, 30),
    ('b0000000-0000-0000-0000-000000000004', 'a0000000-0000-0000-0000-000000000004', 180, 25),
    ('b0000000-0000-0000-0000-000000000005', 'a0000000-0000-0000-0000-000000000005', 420, 40),
    ('b0000000-0000-0000-0000-000000000006', 'a0000000-0000-0000-0000-000000000006', 300, 35)
on conflict (id) do nothing;

-- 3. Fleet Vehicles (Vans with initial GPS coordinates)
-- Coordinates near Greater London / Accra (we can use London or vibrant metro coordinates)
-- Let's use central area coordinates: 51.5074, -0.1278 (London) or Accra (5.6037, -0.1870)
insert into public.vehicles (id, van_code, driver_name, driver_phone, license_plate, status, current_lat, current_lng, heading, speed_kmh, battery_level, last_location_update) values
    ('c0000000-0000-0000-0000-000000000001', 'VAN-01', 'Kwame Mensah', '+44 7700 900123', 'BK24-RUN', 'on_route', 51.5134, -0.1180, 45.0, 32.5, 92, now()),
    ('c0000000-0000-0000-0000-000000000002', 'VAN-02', 'Sarah Jenkins', '+44 7700 900456', 'BK24-DEL', 'on_route', 51.5205, -0.1360, 180.0, 24.0, 88, now()),
    ('c0000000-0000-0000-0000-000000000003', 'VAN-03', 'David Osei', '+44 7700 900789', 'BK24-EXP', 'loading', 51.5050, -0.0900, 0.0, 0.0, 100, now())
on conflict (id) do nothing;

-- 4. Vehicle Stock Allocation
-- VAN-01 Stock
insert into public.vehicle_stock (id, vehicle_id, product_id, loaded_quantity, current_quantity, delivered_quantity, returned_quantity) values
    ('d0000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001', 50, 35, 15, 0),
    ('d0000000-0000-0000-0000-000000000002', 'c0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000002', 80, 50, 30, 0),
    ('d0000000-0000-0000-0000-000000000003', 'c0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000003', 40, 25, 15, 0),
    ('d0000000-0000-0000-0000-000000000004', 'c0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000004', 30, 20, 10, 0)
on conflict (id) do nothing;

-- VAN-02 Stock
insert into public.vehicle_stock (id, vehicle_id, product_id, loaded_quantity, current_quantity, delivered_quantity, returned_quantity) values
    ('d0000000-0000-0000-0000-000000000005', 'c0000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000001', 60, 45, 15, 0),
    ('d0000000-0000-0000-0000-000000000006', 'c0000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000005', 70, 50, 20, 0),
    ('d0000000-0000-0000-0000-000000000007', 'c0000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000006', 45, 30, 15, 0)
on conflict (id) do nothing;

-- 5. Customers / Shops
insert into public.customers (id, name, contact_person, phone, address, lat, lng) values
    ('e0000000-0000-0000-0000-000000000001', 'Sunrise Artisan Cafe & Deli', 'Elena Rostova', '+44 20 7946 0911', '14 Covent Garden Mews', 51.5120, -0.1230),
    ('e0000000-0000-0000-0000-000000000002', 'FreshMart Central Supermarket', 'Marcus Kane', '+44 20 7946 0922', '88 Tottenham Court Rd', 51.5218, -0.1342),
    ('e0000000-0000-0000-0000-000000000003', 'GreenGrocer Organic Market', 'Priya Sharma', '+44 20 7946 0933', '22 Soho Square', 51.5152, -0.1320),
    ('e0000000-0000-0000-0000-000000000004', 'Harbor View Coffee & Eatery', 'Liam Davies', '+44 20 7946 0944', '5 Southwark Bridge Rd', 51.5060, -0.0950),
    ('e0000000-0000-0000-0000-000000000005', 'The Corner Baker House', 'Amara Diallo', '+44 20 7946 0955', '41 Kingsway, Holborn', 51.5165, -0.1195)
on conflict (id) do nothing;

-- 6. Initial Stock Movements
insert into public.stock_movements (movement_type, product_id, quantity, from_location, to_location, reference_id, notes, created_at) values
    ('PRODUCTION_ADD', 'a0000000-0000-0000-0000-000000000001', 400, 'OVENS_AND_BAKEHOUSE', 'MASTER_PRODUCTION_CENTER', 'BATCH-20261001-0500', 'Morning fresh sourdough bake', now() - interval '4 hours'),
    ('PRODUCTION_ADD', 'a0000000-0000-0000-0000-000000000002', 600, 'OVENS_AND_BAKEHOUSE', 'MASTER_PRODUCTION_CENTER', 'BATCH-20261001-0530', 'Morning croissant production', now() - interval '3 hours 30 minutes'),
    ('VAN_LOAD', 'a0000000-0000-0000-0000-000000000001', 50, 'MASTER_PRODUCTION_CENTER', 'VAN-01', 'LOAD-20261001-V1', 'Loaded for central route', now() - interval '2 hours'),
    ('VAN_LOAD', 'a0000000-0000-0000-0000-000000000002', 80, 'MASTER_PRODUCTION_CENTER', 'VAN-01', 'LOAD-20261001-V1', 'Loaded for central route', now() - interval '2 hours'),
    ('VAN_DELIVERY', 'a0000000-0000-0000-0000-000000000001', 15, 'VAN-01', 'CUSTOMER: Sunrise Artisan Cafe & Deli', 'DEL-20261001-A1', 'Morning shop delivery completed', now() - interval '45 minutes'),
    ('VAN_DELIVERY', 'a0000000-0000-0000-0000-000000000002', 30, 'VAN-01', 'CUSTOMER: Sunrise Artisan Cafe & Deli', 'DEL-20261001-A1', 'Morning shop delivery completed', now() - interval '45 minutes');
