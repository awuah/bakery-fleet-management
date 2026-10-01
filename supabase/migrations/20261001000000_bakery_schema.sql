-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- 1. PRODUCTS TABLE
create table if not exists public.products (
    id uuid primary key default uuid_generate_v4(),
    name text not null,
    sku text not null unique,
    category text not null default 'Bread',
    unit_price numeric(10,2) not null default 0.00,
    image_url text,
    created_at timestamptz not null default now()
);

-- 2. MASTER PRODUCTION CENTER STOCK
create table if not exists public.master_stock (
    id uuid primary key default uuid_generate_v4(),
    product_id uuid not null references public.products(id) on delete cascade unique,
    quantity integer not null default 0 check (quantity >= 0),
    low_stock_threshold integer not null default 20,
    updated_at timestamptz not null default now()
);

-- 3. FLEET VEHICLES
create table if not exists public.vehicles (
    id uuid primary key default uuid_generate_v4(),
    van_code text not null unique,
    driver_name text not null,
    driver_phone text not null,
    license_plate text not null,
    status text not null default 'idle' check (status in ('idle', 'loading', 'on_route', 'returned', 'maintenance')),
    current_lat double precision not null default 5.6037, -- Default Accra or European coordinates
    current_lng double precision not null default -0.1870,
    heading double precision not null default 0.0,
    speed_kmh double precision not null default 0.0,
    battery_level integer not null default 100,
    last_location_update timestamptz not null default now(),
    created_at timestamptz not null default now()
);

-- 4. VEHICLE STOCK (Stock on each van)
create table if not exists public.vehicle_stock (
    id uuid primary key default uuid_generate_v4(),
    vehicle_id uuid not null references public.vehicles(id) on delete cascade,
    product_id uuid not null references public.products(id) on delete cascade,
    loaded_quantity integer not null default 0 check (loaded_quantity >= 0),
    current_quantity integer not null default 0 check (current_quantity >= 0),
    delivered_quantity integer not null default 0 check (delivered_quantity >= 0),
    returned_quantity integer not null default 0 check (returned_quantity >= 0),
    updated_at timestamptz not null default now(),
    constraint uq_vehicle_product unique (vehicle_id, product_id)
);

-- 5. CUSTOMERS / SHOPS
create table if not exists public.customers (
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
create table if not exists public.deliveries (
    id uuid primary key default uuid_generate_v4(),
    delivery_number text not null unique,
    vehicle_id uuid not null references public.vehicles(id) on delete restrict,
    customer_id uuid not null references public.customers(id) on delete restrict,
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
create table if not exists public.delivery_items (
    id uuid primary key default uuid_generate_v4(),
    delivery_id uuid not null references public.deliveries(id) on delete cascade,
    product_id uuid not null references public.products(id) on delete restrict,
    quantity_delivered integer not null default 0,
    unit_price numeric(10,2) not null default 0.00,
    subtotal numeric(10,2) not null default 0.00,
    created_at timestamptz not null default now()
);

-- 8. STOCK MOVEMENTS (Audit Log / Activity Stream)
create table if not exists public.stock_movements (
    id uuid primary key default uuid_generate_v4(),
    movement_type text not null check (movement_type in ('PRODUCTION_ADD', 'VAN_LOAD', 'VAN_DELIVERY', 'VAN_RETURN', 'WASTAGE_ADJUSTMENT')),
    product_id uuid not null references public.products(id) on delete cascade,
    quantity integer not null,
    from_location text not null,
    to_location text not null,
    reference_id text,
    notes text,
    created_at timestamptz not null default now()
);

-- Enable RLS and setup open policies for app access
alter table public.products enable row level security;
alter table public.master_stock enable row level security;
alter table public.vehicles enable row level security;
alter table public.vehicle_stock enable row level security;
alter table public.customers enable row level security;
alter table public.deliveries enable row level security;
alter table public.delivery_items enable row level security;
alter table public.stock_movements enable row level security;

create policy "Allow all access to products" on public.products for all using (true) with check (true);
create policy "Allow all access to master_stock" on public.master_stock for all using (true) with check (true);
create policy "Allow all access to vehicles" on public.vehicles for all using (true) with check (true);
create policy "Allow all access to vehicle_stock" on public.vehicle_stock for all using (true) with check (true);
create policy "Allow all access to customers" on public.customers for all using (true) with check (true);
create policy "Allow all access to deliveries" on public.deliveries for all using (true) with check (true);
create policy "Allow all access to delivery_items" on public.delivery_items for all using (true) with check (true);
create policy "Allow all access to stock_movements" on public.stock_movements for all using (true) with check (true);

-- Enable Realtime publication
alter publication supabase_realtime add table public.vehicles;
alter publication supabase_realtime add table public.master_stock;
alter publication supabase_realtime add table public.vehicle_stock;
alter publication supabase_realtime add table public.deliveries;
alter publication supabase_realtime add table public.stock_movements;

-- RPC: Record Delivery from Driver App
create or replace function public.record_van_delivery(
    p_vehicle_id uuid,
    p_customer_id uuid,
    p_items jsonb, -- array of { product_id, quantity, unit_price }
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
    select van_code into v_van_code from public.vehicles where id = p_vehicle_id;
    select name into v_cust_name from public.customers where id = p_customer_id;
    
    v_del_num := 'DEL-' || to_char(now(), 'YYYYMMDD') || '-' || upper(substr(md5(random()::text), 1, 6));

    -- Create delivery master record
    insert into public.deliveries (
        delivery_number,
        vehicle_id,
        customer_id,
        status,
        delivered_at,
        driver_notes,
        recipient_name,
        total_items_delivered,
        total_value,
        delivery_lat,
        delivery_lng
    ) values (
        v_del_num,
        p_vehicle_id,
        p_customer_id,
        'completed',
        now(),
        p_notes,
        p_recipient_name,
        0,
        0,
        p_lat,
        p_lng
    ) returning id into v_delivery_id;

    -- Process each item
    for item in select * from jsonb_array_elements(p_items) loop
        v_prod_id := (item->>'product_id')::uuid;
        v_qty := (item->>'quantity')::integer;
        v_price := (item->>'unit_price')::numeric;
        v_subtotal := v_qty * v_price;

        if v_qty > 0 then
            v_total_items := v_total_items + v_qty;
            v_total_val := v_total_val + v_subtotal;

            -- Insert delivery item
            insert into public.delivery_items (
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

            -- Deduct from van stock
            update public.vehicle_stock
            set current_quantity = greatest(0, current_quantity - v_qty),
                delivered_quantity = delivered_quantity + v_qty,
                updated_at = now()
            where vehicle_id = p_vehicle_id and product_id = v_prod_id;

            -- Log stock movement
            insert into public.stock_movements (
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
                'Delivered to ' || coalesce(p_recipient_name, 'Store Manager')
            );
        end if;
    end loop;

    -- Update total on delivery record
    update public.deliveries
    set total_items_delivered = v_total_items,
        total_value = v_total_val
    where id = v_delivery_id;

    -- Update vehicle's last known location and timestamp
    if p_lat is not null and p_lng is not null then
        update public.vehicles
        set current_lat = p_lat,
            current_lng = p_lng,
            last_location_update = now(),
            status = 'on_route'
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

-- RPC: Transfer Stock from Master Production to Van
create or replace function public.transfer_to_van(
    p_vehicle_id uuid,
    p_items jsonb, -- array of { product_id, quantity }
    p_notes text default null
)
returns jsonb
language plpgsql
security definer
as $$
declare
    item jsonb;
    v_prod_id uuid;
    v_qty integer;
    v_van_code text;
    v_ref text;
begin
    select van_code into v_van_code from public.vehicles where id = p_vehicle_id;
    v_ref := 'LOAD-' || to_char(now(), 'YYYYMMDD') || '-' || upper(substr(md5(random()::text), 1, 4));

    for item in select * from jsonb_array_elements(p_items) loop
        v_prod_id := (item->>'product_id')::uuid;
        v_qty := (item->>'quantity')::integer;

        if v_qty > 0 then
            -- Deduct from master stock
            update public.master_stock
            set quantity = greatest(0, quantity - v_qty),
                updated_at = now()
            where product_id = v_prod_id;

            -- Add or update vehicle stock
            insert into public.vehicle_stock (
                vehicle_id,
                product_id,
                loaded_quantity,
                current_quantity,
                delivered_quantity,
                returned_quantity,
                updated_at
            ) values (
                p_vehicle_id,
                v_prod_id,
                v_qty,
                v_qty,
                0,
                0,
                now()
            )
            on conflict (vehicle_id, product_id) do update
            set loaded_quantity = public.vehicle_stock.loaded_quantity + v_qty,
                current_quantity = public.vehicle_stock.current_quantity + v_qty,
                updated_at = now();

            -- Log movement
            insert into public.stock_movements (
                movement_type,
                product_id,
                quantity,
                from_location,
                to_location,
                reference_id,
                notes
            ) values (
                'VAN_LOAD',
                v_prod_id,
                v_qty,
                'MASTER_PRODUCTION_CENTER',
                coalesce(v_van_code, 'VAN'),
                v_ref,
                coalesce(p_notes, 'Morning Stock Loading')
            );
        end if;
    end loop;

    -- Set vehicle status to loading or on_route
    update public.vehicles
    set status = 'loading'
    where id = p_vehicle_id;

    return jsonb_build_object(
        'success', true,
        'reference', v_ref
    );
end;
$$;

-- RPC: Record Bakery Production Run (adds to master stock)
create or replace function public.record_production_run(
    p_product_id uuid,
    p_quantity integer,
    p_batch_code text default null,
    p_notes text default null
)
returns jsonb
language plpgsql
security definer
as $$
begin
    update public.master_stock
    set quantity = quantity + p_quantity,
        updated_at = now()
    where product_id = p_product_id;

    insert into public.stock_movements (
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
        coalesce(p_batch_code, 'BATCH-' || to_char(now(), 'YYYYMMDD-HH24MI')),
        coalesce(p_notes, 'Fresh Baked Production Batch')
    );

    return jsonb_build_object('success', true);
end;
$$;
