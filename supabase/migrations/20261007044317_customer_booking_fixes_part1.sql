-- Customer booking fixes part 1: profile contact sync, Room A/B, catering venue.
-- (Applied remotely as version 20261007044317.)

-- 1. Profile contact details (cross-device). Local-only storage moves here.
alter table public.profiles
  add column if not exists phone text,
  add column if not exists addresses jsonb not null default '[]'::jsonb;

grant update on public.profiles to authenticated;

drop policy if exists profiles_update_own on public.profiles;
create policy profiles_update_own
  on public.profiles
  for update
  to authenticated
  using ((select auth.uid()) = id)
  with check ((select auth.uid()) = id);

-- 2. Function Room A / B (cap 50 each). Existing bookings move to Room A.
insert into public.function_rooms (id, name, capacity, amenities)
values
  ('room_a', 'Function Room A', 50, array['Tables & Chairs', 'Air Conditioning', 'Sound System', 'Projector & Screen', 'Event Coordination', 'Parking Space']),
  ('room_b', 'Function Room B', 50, array['Tables & Chairs', 'Air Conditioning', 'Sound System', 'Projector & Screen', 'Event Coordination', 'Parking Space'])
on conflict (id) do nothing;

update public.function_bookings
  set room_id = 'room_a'
  where room_id = 'private_dining';

update public.function_rooms
  set is_active = false
  where id = 'private_dining';

-- 3. Catering venue: served in a function room or delivered.
alter table public.catering_bookings
  add column if not exists venue_type text not null default 'delivery'
    check (venue_type in ('function_room', 'delivery')),
  add column if not exists function_room_id text references public.function_rooms(id) on delete restrict,
  add column if not exists delivery_address text;

create index if not exists idx_catering_bookings_function_room
  on public.catering_bookings (function_room_id)
  where function_room_id is not null;
