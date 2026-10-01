create or replace function public.bk_transfer_to_van(
    p_vehicle_id uuid,
    p_items jsonb,
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
    v_total integer := 0;
begin
    select van_code into v_van_code from public.bk_vehicles where id = p_vehicle_id;
    v_ref := 'LOAD-' || to_char(now(), 'YYYYMMDD') || '-' || upper(substr(md5(random()::text), 1, 4));

    for item in select * from jsonb_array_elements(p_items) loop
        v_prod_id := (item->>'product_id')::uuid;
        v_qty := (item->>'quantity')::integer;

        if v_qty > 0 then
            update public.bk_master_stock
            set quantity = greatest(0, quantity - v_qty),
                updated_at = now()
            where product_id = v_prod_id;

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
                v_prod_id,
                v_qty,
                v_qty,
                0,
                0,
                now()
            )
            on conflict (vehicle_id, product_id) do update set
                loaded_quantity = bk_vehicle_stock.loaded_quantity + v_qty,
                current_quantity = bk_vehicle_stock.current_quantity + v_qty,
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
                v_prod_id,
                v_qty,
                'MASTER_PRODUCTION_CENTER',
                coalesce(v_van_code, 'VAN'),
                v_ref,
                coalesce(p_notes, 'Loaded onto ' || coalesce(v_van_code, 'van'))
            );

            v_total := v_total + v_qty;
        end if;
    end loop;

    return jsonb_build_object(
        'success', true,
        'reference', v_ref,
        'van_code', v_van_code,
        'items_loaded', v_total
    );
end;
$$;
