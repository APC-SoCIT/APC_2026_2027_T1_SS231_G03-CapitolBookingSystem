\set ON_ERROR_STOP on
begin;

create temporary table role_test_users (id uuid primary key, role text not null);
insert into role_test_users
select gen_random_uuid(), role from unnest(array[
  'customer', 'customer', 'front_of_house', 'restaurant_manager', 'system_admin', 'delivery_rider'
]) as role;
grant select on role_test_users to authenticated, anon;

insert into auth.users (id, email, raw_user_meta_data)
select id, id || '@role-test.invalid', '{"role":"system_admin","full_name":"Role verification"}'::jsonb
from role_test_users;

do $$
begin
  assert not exists (
    select 1 from public.profiles p join role_test_users u using (id) where p.role <> 'customer'
  ), 'Signup metadata must not grant employee roles';
end
$$;

update public.profiles p set role = u.role from role_test_users u where p.id = u.id;

create temporary table role_test_rows (table_name text, row_key text, owner_id uuid, payload jsonb);
grant select on role_test_rows to authenticated, anon;

create function pg_temp.check_query(statement text, expected bigint)
returns void language plpgsql as $$
declare
  actual bigint;
begin
  begin
    execute statement into actual;
    if expected < 0 or actual is distinct from expected then
      raise exception 'Expected %, got %: %', expected, actual, statement;
    end if;
    raise sqlstate 'ZX001';
  exception
    when sqlstate 'ZX001' then null;
    when insufficient_privilege then
      if expected <> -1 then raise; end if;
  end;
end
$$;

do $$
declare
  u record;
  t text;
  payload jsonb;
  room_key text := gen_random_uuid()::text;
  row_key text;
  columns_sql text;
begin
  if to_regclass('public.function_rooms') is not null then
    insert into public.function_rooms (id, name, capacity) values (room_key, 'Role verification', 10);
  end if;
  foreach t in array array['delivery_orders', 'catering_bookings', 'function_bookings', 'inquiries'] loop
    if to_regclass(format('public.%I', t)) is null then
      raise notice 'SKIP business permissions: public.% absent', t;
      continue;
    end if;
    for u in select * from role_test_users loop
      row_key := gen_random_uuid()::text;
      payload := jsonb_build_object('user_id', u.id) || case t
        when 'delivery_orders' then jsonb_build_object('reference', row_key, 'customer', 'Test', 'address', 'Test', 'status', 'Preparing', 'eta', 'Test')
        when 'catering_bookings' then jsonb_build_object('id', row_key, 'kind', 'catering_buffet', 'customer', 'Test', 'phone', 'Test', 'email', 'test@role-test.invalid', 'date', '2099-01-01', 'time', '12:00', 'status', 'Pending')
        when 'function_bookings' then jsonb_build_object('id', row_key, 'room_id', room_key, 'customer', 'Test', 'phone', 'Test', 'email', 'test@role-test.invalid', 'guests', 1, 'event_type', 'Test', 'date', '2099-01-01', 'time', '12:00', 'status', 'Pending')
        when 'inquiries' then jsonb_build_object('id', row_key, 'name', 'Test', 'email', 'test@role-test.invalid', 'type', 'Test', 'message', 'Test', 'status', 'New') end;
      select string_agg(format('%I', key), ', ' order by key) into columns_sql from jsonb_object_keys(payload) as key;
      execute format('insert into public.%I (%s) select %s from jsonb_populate_record(null::public.%I, %L)', t, columns_sql, columns_sql, t, payload);
      insert into role_test_rows values (t, row_key, u.id, payload);
    end loop;
  end loop;
end
$$;

do $$
declare
  actor record;
  target record;
  t text;
  client_role text;
  primary_key text;
  columns_sql text;
  payload jsonb;
  can_read boolean;
  can_write boolean;
  visible_count bigint;
  query text;
begin
  for actor in select * from role_test_users loop
    perform set_config('request.jwt.claim.sub', actor.id::text, true);
    perform set_config('request.jwt.claims', jsonb_build_object('sub', actor.id, 'role', 'authenticated', 'user_metadata', jsonb_build_object('role', 'system_admin'))::text, true);
    set local role authenticated;
    perform pg_temp.check_query('select count(*) from public.profiles', 1);
    perform pg_temp.check_query(format('with changed as (update public.profiles set role = %L where id = %L returning 1) select count(*) from changed', 'system_admin', actor.id), -1);
    reset role;

    for target in select * from role_test_rows loop
      primary_key := case when target.table_name = 'delivery_orders' then 'reference' else 'id' end;
      can_write := actor.role in ('front_of_house', 'restaurant_manager') or (actor.role = 'customer' and actor.id = target.owner_id);
      can_read := actor.role = 'system_admin' or can_write;
      set local role authenticated;
      perform pg_temp.check_query(format('select count(*) from public.%I where %I = %L', target.table_name, primary_key, target.row_key), can_read::integer);
      perform pg_temp.check_query(format('with changed as (update public.%I set user_id = user_id where %I = %L returning 1) select count(*) from changed', target.table_name, primary_key, target.row_key), can_write::integer);
      perform pg_temp.check_query(format('with changed as (delete from public.%I where %I = %L returning 1) select count(*) from changed', target.table_name, primary_key, target.row_key), can_write::integer);
      payload := target.payload || jsonb_build_object(primary_key, gen_random_uuid()::text);
      select string_agg(format('%I', key), ', ' order by key) into columns_sql from jsonb_object_keys(payload) as key;
      query := format('with changed as (insert into public.%I (%s) select %s from jsonb_populate_record(null::public.%I, %L) returning 1) select count(*) from changed', target.table_name, columns_sql, columns_sql, target.table_name, payload);
      perform pg_temp.check_query(query, case when can_write then 1 else -1 end);
      if actor.role = 'customer' and actor.id = target.owner_id then
        perform pg_temp.check_query(format('with changed as (update public.%I set user_id = %L where %I = %L returning 1) select count(*) from changed', target.table_name, (select id from role_test_users where id <> actor.id limit 1), primary_key, target.row_key), -1);
      end if;
      reset role;
    end loop;

    if to_regclass('public.inquiries') is not null then
      set local role authenticated;
      perform pg_temp.check_query(format('with changed as (insert into public.inquiries (id, user_id, name, email, type, message, status) values (%L, null, %L, %L, %L, %L, %L) returning 1) select count(*) from changed', gen_random_uuid(), 'Test', 'test@role-test.invalid', 'Test', 'Test', 'New'),
        case when actor.role in ('customer', 'front_of_house', 'restaurant_manager') then 1 else -1 end);
      if actor.role = 'customer' then
        perform pg_temp.check_query(format('with changed as (insert into public.inquiries (id, user_id, name, email, type, message, status) values (%L, null, %L, %L, %L, %L, %L)) select 1', gen_random_uuid(), 'Test', 'test@role-test.invalid', 'Test', 'Test', 'New'), 1);
      end if;
      reset role;
    end if;

    foreach t in array array['catering_packages', 'packed_menu_items', 'function_rooms', 'settings', 'reserved_dates'] loop
      if to_regclass(format('public.%I', t)) is null then continue; end if;
      primary_key := case t when 'settings' then 'key' when 'reserved_dates' then 'date' else 'id' end;
      payload := case t
        when 'catering_packages' then jsonb_build_object('id', gen_random_uuid(), 'name', 'Test', 'price_per_pax', 1, 'min_pax', 1, 'max_pax', 2, 'description', 'Test')
        when 'packed_menu_items' then jsonb_build_object('id', gen_random_uuid(), 'name', 'Test', 'description', 'Test', 'price', 1, 'category', 'Test')
        when 'function_rooms' then jsonb_build_object('id', gen_random_uuid(), 'name', 'Test', 'capacity', 1)
        when 'settings' then jsonb_build_object('key', gen_random_uuid(), 'value', 1)
        when 'reserved_dates' then jsonb_build_object('date', (select coalesce(max(date), current_date) + 1 from public.reserved_dates), 'reason', 'Test') end;
      select string_agg(format('%I', key), ', ' order by key) into columns_sql from jsonb_object_keys(payload) as key;
      query := format('insert into public.%I (%s) select %s from jsonb_populate_record(null::public.%I, %L)', t, columns_sql, columns_sql, t, payload);
      execute query;
      can_write := actor.role in ('front_of_house', 'restaurant_manager');
      set local role authenticated;
      perform pg_temp.check_query(format('select count(*) from public.%I where %I::text = %L', t, primary_key, payload ->> primary_key), 1);
      perform pg_temp.check_query(format('with changed as (update public.%I set %I = %I where %I::text = %L returning 1) select count(*) from changed', t, primary_key, primary_key, primary_key, payload ->> primary_key), can_write::integer);
      perform pg_temp.check_query(format('with changed as (delete from public.%I where %I::text = %L returning 1) select count(*) from changed', t, primary_key, payload ->> primary_key), case when t = 'settings' then -1 else can_write::integer end);
      reset role;
      execute format('delete from public.%I where %I::text = %L', t, primary_key, payload ->> primary_key);
      set local role authenticated;
      perform pg_temp.check_query('with changed as (' || query || ' returning 1) select count(*) from changed', case when can_write and t <> 'settings' then 1 else -1 end);
      reset role;
    end loop;
  end loop;

  foreach client_role in array array['anon', 'authenticated'] loop
    foreach t in array array['profiles', 'delivery_orders', 'catering_bookings', 'function_bookings', 'inquiries', 'catering_packages', 'packed_menu_items', 'function_rooms', 'settings', 'reserved_dates'] loop
      if to_regclass(format('public.%I', t)) is null then continue; end if;
      assert not has_table_privilege(client_role, format('public.%I', t), 'TRUNCATE'), 'Client TRUNCATE bypasses RLS';
      if t = 'profiles' then
        assert not has_any_column_privilege(client_role, 'public.profiles', 'INSERT'), 'Client profile inserts';
        assert not has_any_column_privilege(client_role, 'public.profiles', 'UPDATE'), 'Client role updates';
        assert not has_table_privilege(client_role, 'public.profiles', 'DELETE'), 'Client profile deletes';
      end if;
    end loop;
  end loop;

  perform set_config('request.jwt.claim.sub', '', true);
  perform set_config('request.jwt.claims', '{}', true);
  foreach t in array array['catering_packages', 'packed_menu_items', 'function_rooms', 'settings', 'reserved_dates'] loop
    if to_regclass(format('public.%I', t)) is null then continue; end if;
    execute format('select count(*) from public.%I', t) into visible_count;
    set local role anon;
    perform pg_temp.check_query(format('select count(*) from public.%I', t), visible_count);
    reset role;
  end loop;

  for actor in select * from role_test_users limit 1 loop
    begin
      update public.profiles set role = 'admin' where id = actor.id;
      raise exception 'Legacy admin role accepted';
    exception when check_violation then null;
    end;
    begin
      update public.profiles set role = 'unknown' where id = actor.id;
      raise exception 'Unknown role accepted';
    exception when check_violation then null;
    end;
  end loop;
  raise notice 'PASS role constraints, profile immutability, signup metadata, and available business policies';
end
$$;

rollback;
