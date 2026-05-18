-- Order workflow: pending → approved, fix delete (run in Supabase SQL Editor)

alter table public.orders alter column status set default 'pending';

update public.orders set status = 'pending' where status = 'new';

drop policy if exists "orders_delete_staff" on public.orders;
create policy "orders_delete_staff"
  on public.orders for delete
  to authenticated
  using (true);

drop policy if exists "order_items_delete_staff" on public.order_items;
create policy "order_items_delete_staff"
  on public.order_items for delete
  to authenticated
  using (true);

grant delete on public.orders to authenticated;
grant delete on public.order_items to authenticated;
