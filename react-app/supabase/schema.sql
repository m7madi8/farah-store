-- Chef Farah Ammar — Supabase schema (SQL Editor in dashboard)
-- Enable Email auth: Authentication > Providers > Email

create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  name_ar text,
  description text,
  description_ar text,
  price numeric(10, 2) not null default 0,
  category text not null default 'boxes',
  image_url text,
  hero_image text,
  sort_order int not null default 100,
  badge text,
  details jsonb default '[]'::jsonb,
  variants jsonb,
  images jsonb default '[]'::jsonb,
  created_at timestamptz default now()
);

create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  customer_name text not null,
  customer_phone text not null,
  shipping_address text not null,
  notes text default '',
  payment_method text default 'cod',
  total numeric(12, 2) not null default 0,
  status text not null default 'pending',
  created_at timestamptz default now()
);

create table if not exists public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders (id) on delete cascade,
  product_id uuid references public.products (id) on delete set null,
  quantity int not null default 1,
  unit_price numeric(10, 2) not null default 0,
  product_name text default '',
  product_slug text,
  created_at timestamptz default now()
);

create index if not exists idx_orders_created_at on public.orders (created_at desc);
create index if not exists idx_order_items_order_id on public.order_items (order_id);

alter table public.products enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;

drop policy if exists "products_select_public" on public.products;
create policy "products_select_public"
  on public.products for select
  to anon, authenticated
  using (true);

drop policy if exists "orders_insert_public" on public.orders;
create policy "orders_insert_public"
  on public.orders for insert
  to anon, authenticated
  with check (true);

drop policy if exists "order_items_insert_public" on public.order_items;
create policy "order_items_insert_public"
  on public.order_items for insert
  to anon, authenticated
  with check (true);

drop policy if exists "orders_select_staff" on public.orders;
create policy "orders_select_staff"
  on public.orders for select
  to authenticated
  using (true);

drop policy if exists "orders_update_staff" on public.orders;
create policy "orders_update_staff"
  on public.orders for update
  to authenticated
  using (true)
  with check (true);

drop policy if exists "orders_delete_staff" on public.orders;
create policy "orders_delete_staff"
  on public.orders for delete
  to authenticated
  using (true);

drop policy if exists "order_items_select_staff" on public.order_items;
create policy "order_items_select_staff"
  on public.order_items for select
  to authenticated
  using (true);

drop policy if exists "order_items_delete_staff" on public.order_items;
create policy "order_items_delete_staff"
  on public.order_items for delete
  to authenticated
  using (true);

drop policy if exists "products_staff_write" on public.products;
create policy "products_staff_write"
  on public.products for all
  to authenticated
  using (true)
  with check (true);
