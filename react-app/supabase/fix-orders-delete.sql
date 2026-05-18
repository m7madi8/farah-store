-- =============================================================================
-- FIX: Admin cannot delete orders — paste ALL of this in Supabase SQL Editor → Run
-- Safe to re-run. Then: /admin/login → sign out → sign in → try delete again.
-- =============================================================================

-- 1) Staff policies
drop policy if exists "orders_select_staff" on public.orders;
create policy "orders_select_staff"
  on public.orders for select to authenticated using (true);

drop policy if exists "orders_update_staff" on public.orders;
create policy "orders_update_staff"
  on public.orders for update to authenticated using (true) with check (true);

drop policy if exists "orders_delete_staff" on public.orders;
create policy "orders_delete_staff"
  on public.orders for delete to authenticated using (true);

drop policy if exists "order_items_select_staff" on public.order_items;
create policy "order_items_select_staff"
  on public.order_items for select to authenticated using (true);

drop policy if exists "order_items_delete_staff" on public.order_items;
create policy "order_items_delete_staff"
  on public.order_items for delete to authenticated using (true);

-- 2) Table privileges (RLS alone is not enough)
grant usage on schema public to anon, authenticated;
grant select on public.products to anon, authenticated;
grant insert on public.orders to anon, authenticated;
grant insert on public.order_items to anon, authenticated;
grant select, update, delete on table public.orders to authenticated;
grant select, delete on table public.order_items to authenticated;

-- 3) RPC: delete as postgres (bypasses RLS). Only role "authenticated" may call it.
drop function if exists public.staff_delete_order(uuid);

create function public.staff_delete_order(p_order_id uuid)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  n int;
begin
  delete from public.order_items where order_id = p_order_id;
  delete from public.orders where id = p_order_id;
  get diagnostics n = row_count;
  return coalesce(n, 0) > 0;
end;
$$;

revoke all on function public.staff_delete_order(uuid) from public;
grant execute on function public.staff_delete_order(uuid) to authenticated;

-- 4) Refresh PostgREST schema cache (so the app sees staff_delete_order)
notify pgrst, 'reload schema';
