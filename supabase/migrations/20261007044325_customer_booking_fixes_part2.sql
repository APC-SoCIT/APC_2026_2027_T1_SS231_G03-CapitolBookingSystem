-- Customer booking fixes part 2: date-level availability guards.
-- (Applied remotely as version 20261007044325.)
--
-- Whole-date rule: one active booking per date per inventory pool. Catering
-- served in a function room writes the same ('function_room', room, date)
-- availability row as a function booking, so the two block each other.

drop trigger if exists sync_function_booking_availability on public.function_bookings;
drop trigger if exists sync_catering_booking_availability on public.catering_bookings;

drop index if exists public.function_bookings_active_slot_unique;
drop index if exists public.catering_bookings_active_slot_unique;

-- Collapse any same-date time duplicates (keep earliest physical row).
delete from public.booking_availability a
using public.booking_availability b
where a.kind = b.kind
  and a.resource_id = b.resource_id
  and a.date = b.date
  and a.time > b.time;

delete from public.booking_availability a
using public.booking_availability b
where a.kind = b.kind
  and a.resource_id = b.resource_id
  and a.date = b.date
  and a.ctid > b.ctid;

alter table public.booking_availability
  drop constraint if exists booking_availability_pkey;

alter table public.booking_availability
  drop column if exists time;

alter table public.booking_availability
  add primary key (kind, resource_id, date);

-- One active booking per date per pool.
create unique index if not exists function_bookings_active_date_unique
  on public.function_bookings (room_id, date)
  where status in ('Pending', 'Confirmed');

create unique index if not exists catering_bookings_active_delivery_date_unique
  on public.catering_bookings (kind, date)
  where venue_type = 'delivery'
    and status in ('Pending', 'Confirmed');

create unique index if not exists catering_bookings_active_room_date_unique
  on public.catering_bookings (function_room_id, date)
  where venue_type = 'function_room'
    and status in ('Pending', 'Confirmed');
