\set ON_ERROR_STOP on
begin;

do $$
declare
  test_date date := current_date + 100000;
  test_room text;
  function_id text := gen_random_uuid()::text;
  replacement_id text := gen_random_uuid()::text;
  buffet_id text := gen_random_uuid()::text;
  packed_id text := gen_random_uuid()::text;
  original_updated_at timestamptz;
  changed_rows integer;
begin
  select id into test_room from public.function_rooms order by id limit 1;
  assert test_room is not null, 'No function room available for inventory test';

  insert into public.function_bookings
    (id, room_id, customer, phone, email, guests, event_type, date, time, status)
  values
    (function_id, test_room, 'Inventory Test', '09170000000', 'inventory@test.invalid', 1, 'Test', test_date, '12:00', 'Pending');
  assert exists (
    select 1 from public.booking_availability
    where kind = 'function_room' and resource_id = test_room and date = test_date and time = '12:00'
  ), 'Pending function booking must publish occupied slot';

  begin
    insert into public.function_bookings
      (id, room_id, customer, phone, email, guests, event_type, date, time, status)
    values
      (gen_random_uuid()::text, test_room, 'Inventory Test', '09170000000', 'inventory@test.invalid', 1, 'Test', test_date, '12:00', 'Confirmed');
    raise exception 'Active duplicate function slot accepted';
  exception when unique_violation then
    null;
  end;

  update public.function_bookings set status = 'Confirmed' where id = function_id;
  assert exists (
    select 1 from public.booking_availability
    where kind = 'function_room' and resource_id = test_room and date = test_date and time = '12:00'
  ), 'Pending-to-confirmed transition must keep slot occupied';

  update public.function_bookings set status = 'Cancelled' where id = function_id;
  assert not exists (
    select 1 from public.booking_availability
    where kind = 'function_room' and resource_id = test_room and date = test_date and time = '12:00'
  ), 'Cancelled function booking must release slot';

  insert into public.function_bookings
    (id, room_id, customer, phone, email, guests, event_type, date, time, status)
  values
    (replacement_id, test_room, 'Inventory Test', '09170000000', 'inventory@test.invalid', 1, 'Test', test_date, '12:00', 'Pending');
  select updated_at into original_updated_at from public.function_bookings where id = replacement_id;
  update public.function_bookings
  set status = 'Confirmed', updated_at = clock_timestamp() + interval '1 second'
  where id = replacement_id and updated_at = original_updated_at;
  get diagnostics changed_rows = row_count;
  assert changed_rows = 1, 'Current booking version must update';
  update public.function_bookings
  set status = 'Cancelled'
  where id = replacement_id and updated_at = original_updated_at;
  get diagnostics changed_rows = row_count;
  assert changed_rows = 0, 'Stale booking version must not overwrite newer edits';
  update public.function_bookings set time = '12:30' where id = replacement_id;
  assert not exists (
    select 1 from public.booking_availability
    where kind = 'function_room' and resource_id = test_room and date = test_date and time = '12:00'
  ) and exists (
    select 1 from public.booking_availability
    where kind = 'function_room' and resource_id = test_room and date = test_date and time = '12:30'
  ), 'Moving active booking must move availability slot';

  insert into public.catering_bookings
    (id, kind, customer, phone, email, date, time, status)
  values
    (buffet_id, 'catering_buffet', 'Inventory Test', '09170000000', 'inventory@test.invalid', test_date, '13:00', 'Pending'),
    (packed_id, 'catering_packed', 'Inventory Test', '09170000000', 'inventory@test.invalid', test_date, '13:00', 'Pending');
  assert exists (
    select 1 from public.booking_availability
    where kind = 'catering_buffet' and resource_id = 'catering_buffet' and date = test_date and time = '13:00'
  ) and exists (
    select 1 from public.booking_availability
    where kind = 'catering_packed' and resource_id = 'catering_packed' and date = test_date and time = '13:00'
  ), 'Catering kinds must own separate slot inventory';

  begin
    insert into public.catering_bookings
      (id, kind, customer, phone, email, date, time, status)
    values
      (gen_random_uuid()::text, 'catering_buffet', 'Inventory Test', '09170000000', 'inventory@test.invalid', test_date, '13:00', 'Confirmed');
    raise exception 'Active duplicate catering slot accepted';
  exception when unique_violation then
    null;
  end;

  assert has_table_privilege('anon', 'public.booking_availability', 'SELECT'), 'anon must read public availability';
  assert not has_table_privilege('anon', 'public.booking_availability', 'INSERT'), 'anon must not write availability';
  assert not has_table_privilege('authenticated', 'public.booking_availability', 'UPDATE'), 'authenticated must not edit availability';
  assert exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'booking_availability'
  ), 'Availability must be in Realtime publication';
  assert exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'reserved_dates'
  ), 'Blackout dates must be in Realtime publication';
end
$$;

set local role anon;
do $$
begin
  assert exists (
    select 1 from public.booking_availability
    where kind = 'function_room'
      and date = current_date + 100000
      and time = '12:30'
  ), 'anon must see occupied slots';

  begin
    perform 1 from public.function_bookings;
    raise exception 'anon can read private booking details';
  exception when insufficient_privilege then
    null;
  end;
end
$$;
reset role;

rollback;
