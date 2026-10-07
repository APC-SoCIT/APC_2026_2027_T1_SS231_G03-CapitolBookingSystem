-- Customer booking fixes part 4: delivery Supabase flow.
-- (Applied remotely as version 20261007044349.)

alter table public.delivery_orders
  add column if not exists rider_id text;

grant execute on function public.next_delivery_reference() to authenticated;

-- Riders read and progress their deliveries.
drop policy if exists delivery_orders_rider_select on public.delivery_orders;
create policy delivery_orders_rider_select
  on public.delivery_orders
  for select
  to authenticated
  using (
    (select role from public.profiles where id = (select auth.uid())) = 'delivery_rider'
  );

drop policy if exists delivery_orders_rider_update on public.delivery_orders;
create policy delivery_orders_rider_update
  on public.delivery_orders
  for update
  to authenticated
  using (
    (select role from public.profiles where id = (select auth.uid())) = 'delivery_rider'
  )
  with check (
    (select role from public.profiles where id = (select auth.uid())) = 'delivery_rider'
  );
