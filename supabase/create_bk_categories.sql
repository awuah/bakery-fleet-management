create table if not exists public.bk_categories (
    id uuid default gen_random_uuid() primary key,
    name text not null unique,
    description text default '',
    created_at timestamptz default now()
);

alter table public.bk_categories enable row level security;

drop policy if exists "Allow anon read bk_categories" on public.bk_categories;
drop policy if exists "Allow anon insert bk_categories" on public.bk_categories;
drop policy if exists "Allow anon update bk_categories" on public.bk_categories;
drop policy if exists "Allow anon delete bk_categories" on public.bk_categories;

create policy "Allow anon read bk_categories" on public.bk_categories for select using (true);
create policy "Allow anon insert bk_categories" on public.bk_categories for insert with check (true);
create policy "Allow anon update bk_categories" on public.bk_categories for update using (true);
create policy "Allow anon delete bk_categories" on public.bk_categories for delete using (true);

insert into public.bk_categories (name, description)
values 
    ('Bread', 'Standard and specialty loaves, sandwich bread'),
    ('Pastry', 'Meat pies, croissants, danishes, sausage rolls'),
    ('Rolls', 'Dinner rolls, butter rolls, whole wheat rolls'),
    ('Buns', 'Burger buns, sweet buns, hot dog buns'),
    ('Cakes', 'Celebration cakes, cupcakes, sponge slices'),
    ('Specialty', 'Gluten-free, sourdough, seasonal specials')
on conflict (name) do nothing;
