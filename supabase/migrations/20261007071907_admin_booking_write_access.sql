-- Admin booking write access: the role migration granted system_admin read
-- access on booking tables but left insert/update/delete to front_of_house
-- and restaurant_manager only, so every admin status change was rejected by
-- RLS (and silently reverted on the delivery screen). Include system_admin
-- in the write predicate for the three booking tables.
-- (Applied remotely as version 20261007071907.)

do $$
declare
  table_name text;
  staff_predicate constant text :=
    '(select role from public.profiles where id = (select auth.uid()))'
    || ' in (''front_of_house'', ''restaurant_manager'', ''system_admin'')';
  customer_predicate constant text :=
    '((select role from public.profiles where id = (select auth.uid())) = ''customer'')'
    || ' and ((select auth.uid()) = user_id)';
  predicate text;
begin
  predicate := '(' || customer_predicate || ') or (' || staff_predicate || ')';
  foreach table_name in array array['delivery_orders', 'catering_bookings', 'function_bookings'] loop
    execute format(
      'drop policy if exists %I on public.%I',
      table_name || '_insert_own', table_name);
    execute format(
      'create policy %I on public.%I for insert to authenticated with check (%s)',
      table_name || '_insert_own', table_name, predicate);
    execute format(
      'drop policy if exists %I on public.%I',
      table_name || '_update_own', table_name);
    execute format(
      'create policy %I on public.%I for update to authenticated using (%s) with check (%s)',
      table_name || '_update_own', table_name, predicate, predicate);
    execute format(
      'drop policy if exists %I on public.%I',
      table_name || '_delete_own', table_name);
    execute format(
      'create policy %I on public.%I for delete to authenticated using (%s)',
      table_name || '_delete_own', table_name, predicate);
  end loop;
end
$$;
