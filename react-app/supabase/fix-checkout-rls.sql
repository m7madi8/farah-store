-- Run in Supabase SQL Editor if checkout fails with RLS on orders/order_items

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

grant usage on schema public to anon, authenticated;
grant select on public.products to anon, authenticated;
grant insert on public.orders to anon, authenticated;
grant insert on public.order_items to anon, authenticated;

drop policy if exists "orders_delete_staff" on public.orders;
create policy "orders_delete_staff"
  on public.orders for delete
  to authenticated
  using (true);

grant delete on public.orders to authenticated;

drop policy if exists "order_items_delete_staff" on public.order_items;
create policy "order_items_delete_staff"
  on public.order_items for delete
  to authenticated
  using (true);

grant delete on public.order_items to authenticated;
