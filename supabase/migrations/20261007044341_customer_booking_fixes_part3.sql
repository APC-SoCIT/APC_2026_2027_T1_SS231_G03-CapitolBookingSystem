-- Customer booking fixes part 3: date-level sync triggers + backfill.
-- (Applied remotely as version 20261007044341.)

create or replace function private.sync_function_booking_availability()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  old_active boolean := false;
  new_active boolean := false;
begin
  if tg_op <> 'INSERT' then
    old_active := old.status in ('Pending', 'Confirmed');
  end if;
  if tg_op <> 'DELETE' then
    new_active := new.status in ('Pending', 'Confirmed');
  end if;

  if old_active then
    if tg_op = 'DELETE' then
      delete from public.booking_availability
      where kind = 'function_room'
        and resource_id = old.room_id
        and date = old.date;
    elsif not new_active
      or old.room_id is distinct from new.room_id
      or old.date is distinct from new.date then
      delete from public.booking_availability
      where kind = 'function_room'
        and resource_id = old.room_id
        and date = old.date;
    end if;
  end if;

  if new_active then
    if tg_op = 'INSERT' then
      insert into public.booking_availability (kind, resource_id, date)
      values ('function_room', new.room_id, new.date);
    elsif not old_active
      or old.room_id is distinct from new.room_id
      or old.date is distinct from new.date then
      insert into public.booking_availability (kind, resource_id, date)
      values ('function_room', new.room_id, new.date);
    end if;
  end if;

  if tg_op = 'DELETE' then
    return old;
  end if;
  return new;
end;
$$;

create or replace function private.sync_catering_booking_availability()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  old_active boolean := false;
  new_active boolean := false;
  old_kind text;
  old_resource text;
  new_kind text;
  new_resource text;
begin
  if tg_op <> 'INSERT' then
    old_active := old.status in ('Pending', 'Confirmed');
  end if;
  if tg_op <> 'DELETE' then
    new_active := new.status in ('Pending', 'Confirmed');
  end if;

  if tg_op <> 'INSERT' and old.venue_type = 'function_room' and old.function_room_id is not null then
    old_kind := 'function_room';
    old_resource := old.function_room_id;
  elsif tg_op <> 'INSERT' then
    old_kind := old.kind;
    old_resource := old.kind;
  end if;

  if tg_op <> 'DELETE' and new.venue_type = 'function_room' and new.function_room_id is not null then
    new_kind := 'function_room';
    new_resource := new.function_room_id;
  elsif tg_op <> 'DELETE' then
    new_kind := new.kind;
    new_resource := new.kind;
  end if;

  if old_active then
    if tg_op = 'DELETE' then
      delete from public.booking_availability
      where kind = old_kind
        and resource_id = old_resource
        and date = old.date;
    elsif not new_active
      or old_kind is distinct from new_kind
      or old_resource is distinct from new_resource
      or old.date is distinct from new.date then
      delete from public.booking_availability
      where kind = old_kind
        and resource_id = old_resource
        and date = old.date;
    end if;
  end if;

  if new_active then
    if tg_op = 'INSERT' then
      insert into public.booking_availability (kind, resource_id, date)
      values (new_kind, new_resource, new.date);
    elsif not old_active
      or old_kind is distinct from new_kind
      or old_resource is distinct from new_resource
      or old.date is distinct from new.date then
      insert into public.booking_availability (kind, resource_id, date)
      values (new_kind, new_resource, new.date);
    end if;
  end if;

  if tg_op = 'DELETE' then
    return old;
  end if;
  return new;
end;
$$;

create trigger sync_function_booking_availability
  after insert or update or delete on public.function_bookings
  for each row execute function private.sync_function_booking_availability();

create trigger sync_catering_booking_availability
  after insert or update or delete on public.catering_bookings
  for each row execute function private.sync_catering_booking_availability();

revoke all on function private.sync_function_booking_availability() from public, anon, authenticated;
revoke all on function private.sync_catering_booking_availability() from public, anon, authenticated;

-- Rebuild availability from current active bookings (date level).
delete from public.booking_availability;

insert into public.booking_availability (kind, resource_id, date)
select distinct 'function_room', room_id, date
from public.function_bookings
where status in ('Pending', 'Confirmed');

insert into public.booking_availability (kind, resource_id, date)
select distinct
  case when venue_type = 'function_room' then 'function_room' else kind end,
  case when venue_type = 'function_room' then function_room_id else kind end,
  date
from public.catering_bookings
where status in ('Pending', 'Confirmed')
  and (venue_type <> 'function_room' or function_room_id is not null)
on conflict do nothing;
