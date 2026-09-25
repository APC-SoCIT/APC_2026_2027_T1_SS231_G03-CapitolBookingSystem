create table public.catering_packages (
  id text primary key,
  name text not null,
  price_per_pax integer not null check (price_per_pax > 0),
  min_pax integer not null check (min_pax > 0),
  max_pax integer not null check (max_pax >= min_pax),
  description text not null,
  inclusions text[] not null default '{}',
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.packed_menu_items (
  id text primary key,
  name text not null,
  description text not null,
  price integer not null check (price > 0),
  category text not null,
  is_available boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.function_rooms (
  id text primary key,
  name text not null,
  capacity integer not null check (capacity > 0),
  amenities text[] not null default '{}',
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.settings (
  key text primary key,
  value integer not null,
  description text,
  updated_at timestamptz not null default now()
);

create table public.reserved_dates (
  date date primary key,
  reason text,
  created_at timestamptz not null default now()
);

create table public.delivery_orders (
  reference text primary key,
  user_id uuid references public.profiles(id) on delete set null,
  customer text not null,
  phone text,
  address text not null,
  status text not null check (status in ('Preparing', 'Ready for pickup', 'Out for delivery', 'Delivered')),
  eta text not null,
  placed_at timestamptz not null default now(),
  payment_method text,
  notes text,
  items_list jsonb not null default '[]',
  items_display text not null default '',
  subtotal integer not null default 0 check (subtotal >= 0),
  delivery_fee integer not null default 60 check (delivery_fee >= 0),
  total integer not null default 0 check (total >= 0),
  timeline jsonb not null default '[]',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.catering_bookings (
  id text primary key,
  user_id uuid references public.profiles(id) on delete set null,
  kind text not null check (kind in ('catering_buffet', 'catering_packed')),
  customer text not null,
  phone text not null,
  email text not null,
  date date not null,
  time text not null,
  status text not null check (status in ('Pending', 'Confirmed', 'Completed', 'Cancelled')),
  placed_at timestamptz not null default now(),
  timeline jsonb not null default '[]',
  notes text,
  package_id text references public.catering_packages(id) on delete set null,
  package_name text,
  pax integer check (pax > 0),
  price_per_pax integer check (price_per_pax >= 0),
  items_list jsonb not null default '[]',
  guest_count integer check (guest_count >= 0),
  subtotal integer not null default 0 check (subtotal >= 0),
  total integer not null default 0 check (total >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.function_bookings (
  id text primary key,
  user_id uuid references public.profiles(id) on delete set null,
  room_id text not null references public.function_rooms(id) on delete restrict,
  customer text not null,
  phone text not null,
  email text not null,
  guests integer not null check (guests > 0),
  event_type text not null,
  date date not null,
  time text not null,
  status text not null check (status in ('Pending', 'Confirmed', 'Completed', 'Cancelled')),
  special_requests text,
  placed_at timestamptz not null default now(),
  timeline jsonb not null default '[]',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.inquiries (
  id text primary key default gen_random_uuid()::text,
  user_id uuid references public.profiles(id) on delete set null,
  name text not null,
  email text,
  type text not null,
  message text not null,
  status text not null check (status in ('New', 'In progress', 'Resolved')),
  submitted_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

insert into public.catering_packages (id, name, price_per_pax, min_pax, max_pax, description, inclusions)
values
  ('pkg-1', 'Package 1', 350, 50, 100, 'Our starter package for intimate gatherings and small celebrations.', array['Steamed Rice', 'Soup of the Day', '2 Main Dish Selections', '1 Vegetable Dish', 'Dessert of the Day', 'Round-trip Delivery within Pasay']),
  ('pkg-2', 'Package 2', 500, 50, 200, 'A wider selection ideal for corporate events and family gatherings.', array['Steamed Rice', 'Soup of the Day', '3 Main Dish Selections', '1 Vegetable Dish', 'Pancit (choice of 1)', 'Dessert of the Day', 'Fresh Fruit Platter', 'Round-trip Delivery within Metro Manila']),
  ('pkg-3', 'Package 3', 750, 50, 500, 'Full-service catering for grand celebrations and special occasions.', array['Steamed Rice', 'Soup of the Day', '4 Main Dish Selections', '2 Vegetable Dishes', 'Pancit (choice of 2)', 'Lechon (per head allocation)', 'Dessert Spread (3 selections)', 'Fresh Fruit Platter', 'Waitstaff Service (up to 4 hours)', 'Round-trip Delivery (Anywhere in Metro Manila)'])
on conflict (id) do nothing;

insert into public.packed_menu_items (id, name, description, price, category)
values
  ('pm-01', 'Adobong Manok', 'Classic Filipino chicken adobo in garlic, soy, and vinegar.', 120, 'Chicken'),
  ('pm-02', 'Lechon Kawali', 'Crispy deep-fried pork belly served with liver sauce.', 145, 'Pork'),
  ('pm-03', 'Pork Sinigang', 'Tamarind-based pork soup with fresh vegetables.', 135, 'Pork'),
  ('pm-04', 'Beef Kaldereta', 'Braised beef in tomato and liver sauce with bell peppers.', 165, 'Beef'),
  ('pm-05', 'Chicken Tinola', 'Ginger-based chicken soup with green papaya and chili leaves.', 115, 'Chicken'),
  ('pm-06', 'Pinakbet', 'Mixed vegetables sautéed with shrimp paste and pork.', 100, 'Vegetables'),
  ('pm-07', 'Laing', 'Taro leaves simmered in coconut milk with chili.', 95, 'Vegetables'),
  ('pm-08', 'Pancit Bihon', 'Stir-fried rice noodles with pork, vegetables, and soy sauce.', 110, 'Noodles'),
  ('pm-09', 'Steamed Rice', 'Freshly cooked premium white rice per serving.', 35, 'Sides'),
  ('pm-10', 'Leche Flan', 'Classic Filipino caramel custard dessert.', 75, 'Desserts')
on conflict (id) do nothing;

insert into public.function_rooms (id, name, capacity, amenities)
values ('private_dining', 'Private Dining Room', 30, array['Tables & Chairs', 'Air Conditioning', 'Sound System', 'Projector & Screen', 'Event Coordination', 'Parking Space'])
on conflict (id) do nothing;

insert into public.settings (key, value, description)
values ('delivery_fee', 60, 'Default delivery fee in PHP, used when subtotal > 0')
on conflict (key) do nothing;

insert into public.reserved_dates (date, reason)
values
  ('2026-08-19', 'Blocked'),
  ('2026-08-22', 'Blocked'),
  ('2026-08-28', 'Blocked'),
  ('2026-09-03', 'Blocked'),
  ('2026-09-10', 'Blocked'),
  ('2026-09-15', 'Blocked'),
  ('2026-09-20', 'Blocked'),
  ('2026-09-25', 'Blocked'),
  ('2026-10-04', 'Blocked'),
  ('2026-10-11', 'Blocked')
on conflict (date) do nothing;

do $$
declare
  table_name text;
  command_name text;
  policy_name text;
  predicate text;
  admin_predicate constant text := $expr$exists (select 1 from public.profiles where id = (select auth.uid()) and role = 'admin')$expr$;
begin
  foreach table_name in array array['delivery_orders', 'catering_bookings', 'function_bookings', 'inquiries'] loop
    execute format('alter table public.%I enable row level security', table_name);
    execute format('grant all on public.%I to authenticated', table_name);
    execute format('grant truncate, references, trigger on public.%I to anon', table_name);
    foreach command_name in array array['select', 'insert', 'update', 'delete'] loop
      predicate := '((select auth.uid()) = user_id) or (' || admin_predicate || ')';
      if table_name = 'inquiries' and command_name = 'insert' then
        predicate := '((select auth.uid()) = user_id) or user_id is null';
      end if;
      execute format('create policy %I on public.%I for %s to authenticated %s %s',
        table_name || '_' || command_name || '_own', table_name, command_name,
        case when command_name <> 'insert' then format('using (%s)', predicate) else '' end,
        case when command_name in ('insert', 'update') then format('with check (%s)', predicate) else '' end);
    end loop;
  end loop;

  foreach table_name in array array['catering_packages', 'packed_menu_items', 'function_rooms', 'settings', 'reserved_dates'] loop
    execute format('alter table public.%I enable row level security', table_name);
    execute format('grant select, truncate, references, trigger on public.%I to anon, authenticated', table_name);
    policy_name := case table_name
      when 'catering_packages' then 'catalog_catering_packages_select'
      when 'packed_menu_items' then 'catalog_packed_items_select'
      when 'function_rooms' then 'catalog_function_rooms_select'
      else table_name || '_select' end;
    execute format('create policy %I on public.%I for select to anon, authenticated using (true)', policy_name, table_name);
    policy_name := case table_name
      when 'packed_menu_items' then 'packed_items_admin_all'
      when 'settings' then 'settings_admin_update'
      else table_name || '_admin_all' end;
    execute format('create policy %I on public.%I for %s to authenticated using (%s) with check (%s)',
      policy_name, table_name, case when table_name = 'settings' then 'update' else 'all' end,
      admin_predicate, admin_predicate);
  end loop;

  grant update on public.settings to authenticated;
end
$$;
