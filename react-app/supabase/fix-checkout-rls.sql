-- Checkout + admin staff policies — run in Supabase → SQL Editor (safe to re-run)

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

grant usage on schema public to anon, authenticated;
grant select on public.products to anon, authenticated;
grant insert on public.orders to anon, authenticated;
grant insert on public.order_items to anon, authenticated;
grant select, update, delete on public.orders to authenticated;
grant select, delete on public.order_items to authenticated;
grant all on public.products to authenticated;
