do $$
declare
  table_name text;
  policy_names text[];
  policy_name text;
  command_name text;
  predicate text;
  customer_predicate text;
  operational_predicate constant text := $expr$(select role from public.profiles where id = (select auth.uid())) in ('front_of_house', 'restaurant_manager')$expr$;
  reader_predicate constant text := $expr$(select role from public.profiles where id = (select auth.uid())) in ('front_of_house', 'restaurant_manager', 'system_admin')$expr$;
  customer_role constant text := $expr$(select role from public.profiles where id = (select auth.uid())) = 'customer'$expr$;
begin
  lock table public.profiles in access exclusive mode;
  alter table public.profiles drop constraint profiles_role_check;
  update public.profiles set role = 'system_admin' where role = 'admin';
  alter table public.profiles add constraint profiles_role_check
    check (role in ('customer', 'front_of_house', 'restaurant_manager', 'system_admin', 'delivery_rider'));

  revoke all on public.profiles from public, anon, authenticated;
  revoke all (id, display_name, role, created_at) on public.profiles from public, anon, authenticated;
  grant select on public.profiles to authenticated;

  foreach table_name in array array[
    'catering_packages', 'packed_menu_items', 'function_rooms', 'settings', 'reserved_dates',
    'delivery_orders', 'catering_bookings', 'function_bookings', 'inquiries'
  ] loop
    if to_regclass(format('public.%I', table_name)) is null then
      continue;
    end if;

    execute format('lock table public.%I in access exclusive mode', table_name);
    if table_name in ('delivery_orders', 'catering_bookings', 'function_bookings', 'inquiries') then
      policy_names := array[
        table_name || '_select_own', table_name || '_insert_own',
        table_name || '_update_own', table_name || '_delete_own'
      ];
    else
      policy_names := case table_name
        when 'catering_packages' then array['catalog_catering_packages_select', 'catering_packages_admin_all']
        when 'packed_menu_items' then array['catalog_packed_items_select', 'packed_items_admin_all']
        when 'function_rooms' then array['catalog_function_rooms_select', 'function_rooms_admin_all']
        when 'settings' then array['settings_select', 'settings_admin_update']
        when 'reserved_dates' then array['reserved_dates_select', 'reserved_dates_admin_all']
      end;
    end if;

    if exists (
      select 1 from pg_policies p
      where p.schemaname = 'public' and p.tablename = table_name
        and (
          not (p.policyname = any(policy_names))
          or p.permissive <> 'PERMISSIVE'
          or p.cmd <> case
            when table_name in ('delivery_orders', 'catering_bookings', 'function_bookings', 'inquiries')
              then upper(split_part(p.policyname, '_', array_length(string_to_array(p.policyname, '_'), 1) - 1))
            when p.policyname = policy_names[1] then 'SELECT'
            when table_name = 'settings' then 'UPDATE'
            else 'ALL'
          end
          or (p.policyname = policy_names[1]
            and table_name not in ('delivery_orders', 'catering_bookings', 'function_bookings', 'inquiries')
            and (p.qual is distinct from 'true' or p.roles <> array['anon', 'authenticated']::name[]))
        )
    ) or (
      select count(*) from pg_policies p
      where p.schemaname = 'public' and p.tablename = table_name
    ) <> cardinality(policy_names) then
      raise exception 'Unexpected RLS baseline for public.%; inspect policies before migrating', table_name;
    end if;

    execute format('alter table public.%I enable row level security', table_name);
    execute format('revoke truncate, references, trigger on public.%I from public, anon, authenticated', table_name);

    if table_name in ('delivery_orders', 'catering_bookings', 'function_bookings', 'inquiries') then
      execute format('grant select, insert, update, delete on public.%I to authenticated', table_name);
      foreach command_name in array array['select', 'insert', 'update', 'delete'] loop
        policy_name := table_name || '_' || command_name || '_own';
        customer_predicate := '(select auth.uid()) = user_id';
        if table_name = 'inquiries' and command_name = 'insert' then
          customer_predicate := '(' || customer_predicate || ' or user_id is null)';
        end if;
        predicate := format('((%s) and (%s)) or (%s)', customer_role, customer_predicate,
          case when command_name = 'select' then reader_predicate else operational_predicate end);
        execute format('alter policy %I on public.%I to authenticated %s %s',
          policy_name, table_name,
          case when command_name <> 'insert' then format('using (%s)', predicate) else '' end,
          case when command_name in ('insert', 'update') then format('with check (%s)', predicate) else '' end);
      end loop;
    else
      policy_name := policy_names[2];
      execute format('alter policy %I on public.%I to authenticated using (%s) with check (%s)',
        policy_name, table_name, operational_predicate, operational_predicate);
      if table_name = 'settings' then
        execute format('grant select, update on public.%I to authenticated', table_name);
      else
        execute format('grant select, insert, update, delete on public.%I to authenticated', table_name);
      end if;
    end if;
  end loop;
end
$$;
