-- BAKERY FLEET & INVENTORY SCHEMA (PREFIXED WITH bk_)
-- For Shared Supabase Project: bsztwifzletpauxuuirg

create extension if not exists "uuid-ossp";

-- 1. PRODUCTS TABLE
create table if not exists public.bk_products (
    id uuid primary key default uuid_generate_v4(),
    name text not null,
    sku text not null unique,
    category text not null default 'Bread',
    unit_price numeric(10,2) not null default 0.00,
    image_url text,
    created_at timestamptz not null default now()
);

-- 2. MASTER PRODUCTION CENTER STOCK
create table if not exists public.bk_master_stock (
    id uuid primary key default uuid_generate_v4(),
    product_id uuid not null references public.bk_products(id) on delete cascade unique,
    quantity integer not null default 0 check (quantity >= 0),
    low_stock_threshold integer not null default 20,
    updated_at timestamptz not null default now()
);

-- 3. FLEET VEHICLES
create table if not exists public.bk_vehicles (
    id uuid primary key default uuid_generate_v4(),
    van_code text not null unique,
    driver_name text not null,
    driver_phone text not null,
    license_plate text not null,
    status text not null default 'idle' check (status in ('idle', 'loading', 'on_route', 'returned', 'maintenance')),
    current_lat double precision not null default 5.6037, -- Accra HQ coordinates
    current_lng double precision not null default -0.1870,
    heading double precision not null default 0.0,
    speed_kmh double precision not null default 0.0,
    battery_level integer not null default 100,
    last_location_update timestamptz not null default now(),
    created_at timestamptz not null default now()
);

-- 4. VEHICLE STOCK
create table if not exists public.bk_vehicle_stock (
    id uuid primary key default uuid_generate_v4(),
    vehicle_id uuid not null references public.bk_vehicles(id) on delete cascade,
    product_id uuid not null references public.bk_products(id) on delete cascade,
    loaded_quantity integer not null default 0 check (loaded_quantity >= 0),
    current_quantity integer not null default 0 check (current_quantity >= 0),
    delivered_quantity integer not null default 0 check (delivered_quantity >= 0),
    returned_quantity integer not null default 0 check (returned_quantity >= 0),
    updated_at timestamptz not null default now(),
    constraint uq_bk_vehicle_product unique (vehicle_id, product_id)
);

-- 5. CUSTOMERS / SHOPS
create table if not exists public.bk_customers (
    id uuid primary key default uuid_generate_v4(),
    name text not null,
    contact_person text,
    phone text,
    address text not null,
    lat double precision not null,
    lng double precision not null,
    created_at timestamptz not null default now()
);

-- 6. DELIVERIES
create table if not exists public.bk_deliveries (
    id uuid primary key default uuid_generate_v4(),
    delivery_number text not null unique,
    vehicle_id uuid not null references public.bk_vehicles(id) on delete restrict,
    customer_id uuid not null references public.bk_customers(id) on delete restrict,
    status text not null default 'completed' check (status in ('completed', 'partial', 'cancelled')),
    delivered_at timestamptz not null default now(),
    driver_notes text,
    recipient_name text,
    total_items_delivered integer not null default 0,
    total_value numeric(10,2) not null default 0.00,
    delivery_lat double precision,
    delivery_lng double precision,
    created_at timestamptz not null default now()
);

-- 7. DELIVERY ITEMS
create table if not exists public.bk_delivery_items (
    id uuid primary key default uuid_generate_v4(),
    delivery_id uuid not null references public.bk_deliveries(id) on delete cascade,
    product_id uuid not null references public.bk_products(id) on delete restrict,
    quantity_delivered integer not null default 0,
    unit_price numeric(10,2) not null default 0.00,
    subtotal numeric(10,2) not null default 0.00,
    created_at timestamptz not null default now()
);

-- 8. STOCK MOVEMENTS (Audit Trail)
create table if not exists public.bk_stock_movements (
    id uuid primary key default uuid_generate_v4(),
    movement_type text not null check (movement_type in ('PRODUCTION_ADD', 'VAN_LOAD', 'VAN_DELIVERY', 'VAN_RETURN', 'WASTAGE_ADJUSTMENT')),
    product_id uuid not null references public.bk_products(id) on delete cascade,
    quantity integer not null,
    from_location text not null,
    to_location text not null,
    reference_id text,
    notes text,
    created_at timestamptz not null default now()
);

-- Enable RLS and Open Policies
alter table public.bk_products enable row level security;
alter table public.bk_master_stock enable row level security;
alter table public.bk_vehicles enable row level security;
alter table public.bk_vehicle_stock enable row level security;
alter table public.bk_customers enable row level security;
alter table public.bk_deliveries enable row level security;
alter table public.bk_delivery_items enable row level security;
alter table public.bk_stock_movements enable row level security;

do $$
begin
    if not exists (select 1 from pg_policies where tablename = 'bk_products' and policyname = 'Allow all access to bk_products') then
        create policy "Allow all access to bk_products" on public.bk_products for all using (true) with check (true);
    end if;
    if not exists (select 1 from pg_policies where tablename = 'bk_master_stock' and policyname = 'Allow all access to bk_master_stock') then
        create policy "Allow all access to bk_master_stock" on public.bk_master_stock for all using (true) with check (true);
    end if;
    if not exists (select 1 from pg_policies where tablename = 'bk_vehicles' and policyname = 'Allow all access to bk_vehicles') then
        create policy "Allow all access to bk_vehicles" on public.bk_vehicles for all using (true) with check (true);
    end if;
    if not exists (select 1 from pg_policies where tablename = 'bk_vehicle_stock' and policyname = 'Allow all access to bk_vehicle_stock') then
        create policy "Allow all access to bk_vehicle_stock" on public.bk_vehicle_stock for all using (true) with check (true);
    end if;
    if not exists (select 1 from pg_policies where tablename = 'bk_customers' and policyname = 'Allow all access to bk_customers') then
        create policy "Allow all access to bk_customers" on public.bk_customers for all using (true) with check (true);
    end if;
    if not exists (select 1 from pg_policies where tablename = 'bk_deliveries' and policyname = 'Allow all access to bk_deliveries') then
        create policy "Allow all access to bk_deliveries" on public.bk_deliveries for all using (true) with check (true);
    end if;
    if not exists (select 1 from pg_policies where tablename = 'bk_delivery_items' and policyname = 'Allow all access to bk_delivery_items') then
        create policy "Allow all access to bk_delivery_items" on public.bk_delivery_items for all using (true) with check (true);
    end if;
    if not exists (select 1 from pg_policies where tablename = 'bk_stock_movements' and policyname = 'Allow all access to bk_stock_movements') then
        create policy "Allow all access to bk_stock_movements" on public.bk_stock_movements for all using (true) with check (true);
    end if;
end $$;

-- Enable Realtime publication for bk_* tables
alter publication supabase_realtime add table public.bk_vehicles;
alter publication supabase_realtime add table public.bk_master_stock;
alter publication supabase_realtime add table public.bk_vehicle_stock;
alter publication supabase_realtime add table public.bk_deliveries;
alter publication supabase_realtime add table public.bk_stock_movements;
alter publication supabase_realtime add table public.bk_products;
alter publication supabase_realtime add table public.bk_customers;

-- Stored Procedure: bk_record_van_delivery
create or replace function public.bk_record_van_delivery(
    p_vehicle_id uuid,
    p_customer_id uuid,
    p_items jsonb,
    p_recipient_name text default null,
    p_notes text default null,
    p_lat double precision default null,
    p_lng double precision default null
)
returns jsonb
language plpgsql
security definer
as $$
declare
    v_delivery_id uuid;
    v_del_num text;
    v_total_items integer := 0;
    v_total_val numeric(10,2) := 0;
    v_van_code text;
    v_cust_name text;
    item jsonb;
    v_prod_id uuid;
    v_qty integer;
    v_price numeric(10,2);
    v_subtotal numeric(10,2);
begin
    select van_code into v_van_code from public.bk_vehicles where id = p_vehicle_id;
    select name into v_cust_name from public.bk_customers where id = p_customer_id;

    v_del_num := 'DEL-' || to_char(now(), 'YYYYMMDD-HH24MISS') || '-' || substring(md5(random()::text) from 1 for 4);

    insert into public.bk_deliveries (
        delivery_number,
        vehicle_id,
        customer_id,
        status,
        delivered_at,
        driver_notes,
        recipient_name,
        delivery_lat,
        delivery_lng,
        total_items_delivered,
        total_value
    ) values (
        v_del_num,
        p_vehicle_id,
        p_customer_id,
        'completed',
        now(),
        p_notes,
        p_recipient_name,
        p_lat,
        p_lng,
        0,
        0.00
    ) returning id into v_delivery_id;

    for item in select * from jsonb_array_elements(p_items)
    loop
        v_prod_id := (item->>'product_id')::uuid;
        v_qty := (item->>'quantity')::integer;
        v_price := coalesce((item->>'unit_price')::numeric, 0.00);

        if v_qty > 0 then
            v_subtotal := v_qty * v_price;
            v_total_items := v_total_items + v_qty;
            v_total_val := v_total_val + v_subtotal;

            insert into public.bk_delivery_items (
                delivery_id,
                product_id,
                quantity_delivered,
                unit_price,
                subtotal
            ) values (
                v_delivery_id,
                v_prod_id,
                v_qty,
                v_price,
                v_subtotal
            );

            update public.bk_vehicle_stock
            set current_quantity = greatest(0, current_quantity - v_qty),
                delivered_quantity = delivered_quantity + v_qty,
                updated_at = now()
            where vehicle_id = p_vehicle_id and product_id = v_prod_id;

            insert into public.bk_stock_movements (
                movement_type,
                product_id,
                quantity,
                from_location,
                to_location,
                reference_id,
                notes
            ) values (
                'VAN_DELIVERY',
                v_prod_id,
                v_qty,
                coalesce(v_van_code, 'VAN'),
                'CUSTOMER: ' || coalesce(v_cust_name, 'Shop'),
                v_del_num,
                'Delivery Drop #' || v_del_num || ' (' || coalesce(p_notes, 'None') || ')'
            );
        end if;
    end loop;

    update public.bk_deliveries
    set total_items_delivered = v_total_items,
        total_value = v_total_val
    where id = v_delivery_id;

    if p_lat is not null and p_lng is not null then
        update public.bk_vehicles
        set current_lat = p_lat,
            current_lng = p_lng,
            last_location_update = now()
        where id = p_vehicle_id;
    end if;

    return jsonb_build_object(
        'success', true,
        'delivery_id', v_delivery_id,
        'delivery_number', v_del_num,
        'total_items', v_total_items,
        'total_value', v_total_val
    );
end;
$$;

-- Stored Procedure: bk_transfer_to_van
create or replace function public.bk_transfer_to_van(
    p_vehicle_id uuid,
    p_product_id uuid,
    p_quantity integer,
    p_reference_notes text default null
)
returns jsonb
language plpgsql
security definer
as $$
declare
    v_avail integer;
    v_van_code text;
    v_prod_name text;
begin
    if p_quantity <= 0 then
        return jsonb_build_object('success', false, 'error', 'Quantity must be greater than zero');
    end if;

    select quantity into v_avail from public.bk_master_stock where product_id = p_product_id;
    if coalesce(v_avail, 0) < p_quantity then
        return jsonb_build_object('success', false, 'error', 'Insufficient master stock. Available: ' || coalesce(v_avail, 0));
    end if;

    select van_code into v_van_code from public.bk_vehicles where id = p_vehicle_id;
    select name into v_prod_name from public.bk_products where id = p_product_id;

    update public.bk_master_stock
    set quantity = quantity - p_quantity,
        updated_at = now()
    where product_id = p_product_id;

    insert into public.bk_vehicle_stock (
        vehicle_id,
        product_id,
        loaded_quantity,
        current_quantity,
        delivered_quantity,
        returned_quantity,
        updated_at
    ) values (
        p_vehicle_id,
        p_product_id,
        p_quantity,
        p_quantity,
        0,
        0,
        now()
    )
    on conflict (vehicle_id, product_id) do update set
        loaded_quantity = bk_vehicle_stock.loaded_quantity + p_quantity,
        current_quantity = bk_vehicle_stock.current_quantity + p_quantity,
        updated_at = now();

    insert into public.bk_stock_movements (
        movement_type,
        product_id,
        quantity,
        from_location,
        to_location,
        reference_id,
        notes
    ) values (
        'VAN_LOAD',
        p_product_id,
        p_quantity,
        'MASTER_PRODUCTION_CENTER',
        coalesce(v_van_code, 'VAN'),
        'LOAD-' || to_char(now(), 'YYYYMMDD-HH24MISS'),
        coalesce(p_reference_notes, 'Stock dispatched from Bakery HQ to Van')
    );

    return jsonb_build_object(
        'success', true,
        'transferred_quantity', p_quantity,
        'van_code', v_van_code,
        'product_name', v_prod_name
    );
end;
$$;

-- Stored Procedure: bk_record_production_run
create or replace function public.bk_record_production_run(
    p_product_id uuid,
    p_quantity integer,
    p_notes text default null
)
returns jsonb
language plpgsql
security definer
as $$
declare
    v_prod_name text;
    v_new_qty integer;
begin
    if p_quantity <= 0 then
        return jsonb_build_object('success', false, 'error', 'Quantity must be greater than zero');
    end if;

    select name into v_prod_name from public.bk_products where id = p_product_id;

    insert into public.bk_master_stock (product_id, quantity, low_stock_threshold, updated_at)
    values (p_product_id, p_quantity, 20, now())
    on conflict (product_id) do update set
        quantity = bk_master_stock.quantity + p_quantity,
        updated_at = now()
    returning quantity into v_new_qty;

    insert into public.bk_stock_movements (
        movement_type,
        product_id,
        quantity,
        from_location,
        to_location,
        reference_id,
        notes
    ) values (
        'PRODUCTION_ADD',
        p_product_id,
        p_quantity,
        'OVENS_AND_BAKEHOUSE',
        'MASTER_PRODUCTION_CENTER',
        'BATCH-' || to_char(now(), 'YYYYMMDD-HH24MISS'),
        coalesce(p_notes, 'Fresh bake batch completed')
    );

    return jsonb_build_object(
        'success', true,
        'product_name', v_prod_name,
        'added_quantity', p_quantity,
        'total_master_stock', v_new_qty
    );
end;
$$;

-- SEED DATA FOR BK_ TABLES
insert into public.bk_products (id, name, sku, category, unit_price, image_url) values
    ('a0000000-0000-0000-0000-000000000001', 'Artisan Country Sourdough', 'BRD-SOUR-01', 'Breads', 35.00, 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=400'),
    ('a0000000-0000-0000-0000-000000000002', 'Golden Butter Croissant', 'PAS-CROI-01', 'Pastries', 22.00, 'https://images.unsplash.com/photo-1555507036-ab1f4038808a?w=400'),
    ('a0000000-0000-0000-0000-000000000003', 'Brioche Burger Buns (6-Pack)', 'BUN-BRIO-06', 'Buns & Rolls', 40.00, 'https://images.unsplash.com/photo-1589367920969-ab8e050bbb04?w=400'),
    ('a0000000-0000-0000-0000-000000000004', 'Cinnamon Swirl Rolls', 'PAS-CINN-01', 'Pastries', 25.00, 'https://images.unsplash.com/photo-1509365465985-25d11c17e812?w=400'),
    ('a0000000-0000-0000-0000-000000000005', 'Rustic Whole Wheat Baguette', 'BRD-BAGU-01', 'Breads', 24.00, 'https://images.unsplash.com/photo-1549931319-a545dcf3bc73?w=400'),
    ('a0000000-0000-0000-0000-000000000006', 'Pain au Chocolat', 'PAS-CHOC-01', 'Pastries', 28.00, 'https://images.unsplash.com/photo-1623334044303-241021148842?w=400')
on conflict (id) do nothing;

insert into public.bk_master_stock (id, product_id, quantity, low_stock_threshold) values
    ('b0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001', 350, 40),
    ('b0000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000002', 500, 50),
    ('b0000000-0000-0000-0000-000000000003', 'a0000000-0000-0000-0000-000000000003', 240, 30),
    ('b0000000-0000-0000-0000-000000000004', 'a0000000-0000-0000-0000-000000000004', 180, 25),
    ('b0000000-0000-0000-0000-000000000005', 'a0000000-0000-0000-0000-000000000005', 420, 40),
    ('b0000000-0000-0000-0000-000000000006', 'a0000000-0000-0000-0000-000000000006', 300, 35)
on conflict (id) do nothing;

insert into public.bk_vehicles (id, van_code, driver_name, driver_phone, license_plate, status, current_lat, current_lng, heading, speed_kmh, battery_level, last_location_update) values
    ('c0000000-0000-0000-0000-000000000001', 'VAN-01', 'Kwame Mensah', '+233 24 555 0101', 'GW-4521-24', 'on_route', 5.6134, -0.1780, 45.0, 32.5, 92, now()),
    ('c0000000-0000-0000-0000-000000000002', 'VAN-02', 'Kofi Boateng', '+233 20 555 0102', 'GN-8832-23', 'on_route', 5.5905, -0.1960, 180.0, 24.0, 88, now()),
    ('c0000000-0000-0000-0000-000000000003', 'VAN-03', 'David Osei', '+233 55 555 0103', 'GT-1194-24', 'loading', 5.6037, -0.1870, 0.0, 0.0, 100, now())
on conflict (id) do nothing;

insert into public.bk_vehicle_stock (id, vehicle_id, product_id, loaded_quantity, current_quantity, delivered_quantity, returned_quantity) values
    ('d0000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001', 50, 35, 15, 0),
    ('d0000000-0000-0000-0000-000000000002', 'c0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000002', 80, 50, 30, 0),
    ('d0000000-0000-0000-0000-000000000003', 'c0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000003', 40, 25, 15, 0),
    ('d0000000-0000-0000-0000-000000000004', 'c0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000004', 30, 20, 10, 0),
    ('d0000000-0000-0000-0000-000000000005', 'c0000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000001', 60, 45, 15, 0),
    ('d0000000-0000-0000-0000-000000000006', 'c0000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000005', 70, 50, 20, 0),
    ('d0000000-0000-0000-0000-000000000007', 'c0000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000006', 45, 30, 15, 0)
on conflict (id) do nothing;

insert into public.bk_customers (id, name, contact_person, phone, address, lat, lng) values
    ('e0000000-0000-0000-0000-000000000001', 'Sunrise Artisan Cafe & Deli', 'Ama Serwaa', '+233 20 123 4567', 'Plot 14, Airport Residential Area, Accra', 5.6020, -0.1730),
    ('e0000000-0000-0000-0000-000000000002', 'FreshMart Central Supermarket', 'Marcus Kane', '+233 24 987 6543', 'Oxford Street, Osu, Accra', 5.5568, -0.1832),
    ('e0000000-0000-0000-0000-000000000003', 'GreenGrocer Organic Market', 'Priya Sharma', '+233 50 444 3322', 'Cantonments Post Office Road, Accra', 5.5782, -0.1680),
    ('e0000000-0000-0000-0000-000000000004', 'Harbor View Coffee & Eatery', 'Liam Davies', '+233 27 888 9900', 'Labone Junction, Accra', 5.5680, -0.1610),
    ('e0000000-0000-0000-0000-000000000005', 'The Corner Baker House', 'Abena Pokua', '+233 24 111 2233', 'East Legon Boundary Road, Accra', 5.6365, -0.1595)
on conflict (id) do nothing;

insert into public.bk_stock_movements (movement_type, product_id, quantity, from_location, to_location, reference_id, notes, created_at) values
    ('PRODUCTION_ADD', 'a0000000-0000-0000-0000-000000000001', 400, 'OVENS_AND_BAKEHOUSE', 'MASTER_PRODUCTION_CENTER', 'BATCH-20261001-0500', 'Morning fresh sourdough bake', now() - interval '4 hours'),
    ('PRODUCTION_ADD', 'a0000000-0000-0000-0000-000000000002', 600, 'OVENS_AND_BAKEHOUSE', 'MASTER_PRODUCTION_CENTER', 'BATCH-20261001-0530', 'Morning croissant production', now() - interval '3 hours 30 minutes'),
    ('VAN_LOAD', 'a0000000-0000-0000-0000-000000000001', 50, 'MASTER_PRODUCTION_CENTER', 'VAN-01', 'LOAD-20261001-V1', 'Loaded for Airport route', now() - interval '2 hours'),
    ('VAN_LOAD', 'a0000000-0000-0000-0000-000000000002', 80, 'MASTER_PRODUCTION_CENTER', 'VAN-01', 'LOAD-20261001-V1', 'Loaded for Airport route', now() - interval '2 hours'),
    ('VAN_DELIVERY', 'a0000000-0000-0000-0000-000000000001', 15, 'VAN-01', 'CUSTOMER: Sunrise Artisan Cafe & Deli', 'DEL-20261001-A1', 'Morning shop delivery completed', now() - interval '45 minutes'),
    ('VAN_DELIVERY', 'a0000000-0000-0000-0000-000000000002', 30, 'VAN-01', 'CUSTOMER: Sunrise Artisan Cafe & Deli', 'DEL-20261001-A1', 'Morning shop delivery completed', now() - interval '45 minutes');
