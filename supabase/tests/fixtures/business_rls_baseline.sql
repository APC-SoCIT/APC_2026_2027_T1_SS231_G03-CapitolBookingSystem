create table public.catering_packages (
  id text primary key, name text not null,
  price_per_pax integer not null check (price_per_pax > 0),
  min_pax integer not null check (min_pax > 0),
  max_pax integer not null check (max_pax >= min_pax),
  description text not null, inclusions text[] not null default '{}',
  is_active boolean not null default true,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table public.packed_menu_items (
  id text primary key, name text not null, description text not null,
  price integer not null check (price > 0), category text not null,
  is_available boolean not null default true,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table public.function_rooms (
  id text primary key, name text not null, capacity integer not null check (capacity > 0),
  amenities text[] not null default '{}', is_active boolean not null default true,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table public.settings (
  key text primary key, value integer not null, description text,
  updated_at timestamptz not null default now()
);
create table public.reserved_dates (
  date date primary key, reason text, created_at timestamptz not null default now()
);
create table public.delivery_orders (
  reference text primary key, user_id uuid references public.profiles(id) on delete set null,
  customer text not null, phone text, address text not null,
  status text not null check (status in ('Preparing','Ready for pickup','Out for delivery','Delivered')),
  eta text not null, placed_at timestamptz not null default now(), payment_method text, notes text,
  items_list jsonb not null default '[]', items_display text not null default '',
  subtotal integer not null default 0 check (subtotal >= 0),
  delivery_fee integer not null default 60 check (delivery_fee >= 0),
  total integer not null default 0 check (total >= 0), timeline jsonb not null default '[]',
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table public.catering_bookings (
  id text primary key, user_id uuid references public.profiles(id) on delete set null,
  kind text not null check (kind in ('catering_buffet','catering_packed')),
  customer text not null, phone text not null, email text not null, date date not null, time text not null,
  status text not null check (status in ('Pending','Confirmed','Completed','Cancelled')),
  placed_at timestamptz not null default now(), timeline jsonb not null default '[]', notes text,
  package_id text references public.catering_packages(id) on delete set null, package_name text,
  pax integer check (pax > 0), price_per_pax integer check (price_per_pax >= 0),
  items_list jsonb not null default '[]', guest_count integer check (guest_count >= 0),
  subtotal integer not null default 0 check (subtotal >= 0), total integer not null default 0 check (total >= 0),
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table public.function_bookings (
  id text primary key, user_id uuid references public.profiles(id) on delete set null,
  room_id text not null references public.function_rooms(id) on delete restrict,
  customer text not null, phone text not null, email text not null,
  guests integer not null check (guests > 0), event_type text not null, date date not null, time text not null,
  status text not null check (status in ('Pending','Confirmed','Completed','Cancelled')),
  special_requests text, placed_at timestamptz not null default now(), timeline jsonb not null default '[]',
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table public.inquiries (
  id text primary key, user_id uuid references public.profiles(id) on delete set null,
  name text not null, email text not null, type text not null, message text not null,
  status text not null check (status in ('New','In progress','Resolved')),
  submitted_at timestamptz not null default now(),
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);

do $$
declare
  t text;
  command_name text;
  policy_name text;
  predicate text;
  admin_predicate constant text := $expr$exists (select 1 from public.profiles where id = (select auth.uid()) and role = 'admin')$expr$;
begin
  foreach t in array array['delivery_orders', 'catering_bookings', 'function_bookings', 'inquiries'] loop
    execute format('alter table public.%I enable row level security', t);
    execute format('grant all on public.%I to authenticated', t);
    execute format('grant truncate, references, trigger on public.%I to anon', t);
    foreach command_name in array array['select', 'insert', 'update', 'delete'] loop
      predicate := '((select auth.uid()) = user_id) or (' || admin_predicate || ')';
      if t = 'inquiries' and command_name = 'insert' then
        predicate := '((select auth.uid()) = user_id) or user_id is null';
      end if;
      execute format('create policy %I on public.%I for %s to authenticated %s %s',
        t || '_' || command_name || '_own', t, command_name,
        case when command_name <> 'insert' then format('using (%s)', predicate) else '' end,
        case when command_name in ('insert', 'update') then format('with check (%s)', predicate) else '' end);
    end loop;
  end loop;
  foreach t in array array['catering_packages', 'packed_menu_items', 'function_rooms', 'settings', 'reserved_dates'] loop
    execute format('alter table public.%I enable row level security', t);
    execute format('grant select, truncate, references, trigger on public.%I to anon, authenticated', t);
    policy_name := case t
      when 'catering_packages' then 'catalog_catering_packages_select'
      when 'packed_menu_items' then 'catalog_packed_items_select'
      when 'function_rooms' then 'catalog_function_rooms_select'
      else t || '_select' end;
    execute format('create policy %I on public.%I for select to anon, authenticated using (true)', policy_name, t);
    policy_name := case t when 'packed_menu_items' then 'packed_items_admin_all'
      when 'settings' then 'settings_admin_update' else t || '_admin_all' end;
    execute format('create policy %I on public.%I for %s to authenticated using (%s) with check (%s)',
      policy_name, t, case when t = 'settings' then 'update' else 'all' end, admin_predicate, admin_predicate);
  end loop;
  grant update on public.settings to authenticated;
end
$$;
