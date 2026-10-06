alter table public.function_bookings
  alter column time type time using time::time;

alter table public.catering_bookings
  alter column time type time using time::time;

alter table public.function_bookings
  add constraint function_bookings_time_grid_check check (
    time >= time '09:00'
    and time <= time '19:30'
    and extract(minute from time)::integer in (0, 30)
    and extract(second from time) = 0
  );

alter table public.catering_bookings
  add constraint catering_bookings_time_grid_check check (
    time >= time '09:00'
    and time <= time '19:30'
    and extract(minute from time)::integer in (0, 30)
    and extract(second from time) = 0
  );

create unique index function_bookings_active_slot_unique
  on public.function_bookings (room_id, date, time)
  where status in ('Pending', 'Confirmed');

create unique index catering_bookings_active_slot_unique
  on public.catering_bookings (kind, date, time)
  where status in ('Pending', 'Confirmed');

create table public.booking_availability (
  kind text not null check (kind in ('function_room', 'catering_buffet', 'catering_packed')),
  resource_id text not null,
  date date not null,
  time time not null,
  primary key (kind, resource_id, date, time)
);

alter table public.booking_availability enable row level security;
revoke all on table public.booking_availability from public, anon, authenticated;
grant select on table public.booking_availability to anon, authenticated;

create policy booking_availability_select
  on public.booking_availability
  for select
  to anon, authenticated
  using (true);

create function private.sync_function_booking_availability()
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
        and date = old.date
        and time = old.time;
    elsif not new_active
      or old.room_id is distinct from new.room_id
      or old.date is distinct from new.date
      or old.time is distinct from new.time then
      delete from public.booking_availability
      where kind = 'function_room'
        and resource_id = old.room_id
        and date = old.date
        and time = old.time;
    end if;
  end if;

  if new_active then
    if tg_op = 'INSERT' then
      insert into public.booking_availability (kind, resource_id, date, time)
      values ('function_room', new.room_id, new.date, new.time);
    elsif not old_active
      or old.room_id is distinct from new.room_id
      or old.date is distinct from new.date
      or old.time is distinct from new.time then
      insert into public.booking_availability (kind, resource_id, date, time)
      values ('function_room', new.room_id, new.date, new.time);
    end if;
  end if;

  if tg_op = 'DELETE' then
    return old;
  end if;
  return new;
end;
$$;

create function private.sync_catering_booking_availability()
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
      where kind = old.kind
        and resource_id = old.kind
        and date = old.date
        and time = old.time;
    elsif not new_active
      or old.kind is distinct from new.kind
      or old.date is distinct from new.date
      or old.time is distinct from new.time then
      delete from public.booking_availability
      where kind = old.kind
        and resource_id = old.kind
        and date = old.date
        and time = old.time;
    end if;
  end if;

  if new_active then
    if tg_op = 'INSERT' then
      insert into public.booking_availability (kind, resource_id, date, time)
      values (new.kind, new.kind, new.date, new.time);
    elsif not old_active
      or old.kind is distinct from new.kind
      or old.date is distinct from new.date
      or old.time is distinct from new.time then
      insert into public.booking_availability (kind, resource_id, date, time)
      values (new.kind, new.kind, new.date, new.time);
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

insert into public.booking_availability (kind, resource_id, date, time)
select 'function_room', room_id, date, time
from public.function_bookings
where status in ('Pending', 'Confirmed');

insert into public.booking_availability (kind, resource_id, date, time)
select kind, kind, date, time
from public.catering_bookings
where status in ('Pending', 'Confirmed');

alter publication supabase_realtime
  add table public.booking_availability,
             public.reserved_dates,
             public.function_bookings,
             public.catering_bookings;
