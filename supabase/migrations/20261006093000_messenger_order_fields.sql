-- Adds the minimum schema needed for the Messenger AI agent to accept delivery
-- orders directly (status: 'Pending Confirmation'/'Cancelled', a 'source'/'messenger_psid'
-- tag so staff can tell Messenger orders apart from website orders), a durable
-- per-customer conversation draft store (Railway can cold-restart webhook.js between
-- messages, so this can't be in-memory), and a collision-safe reference generator.
--
-- public.delivery_orders is a live table that was never captured in a prior migration
-- file, so this defensively asserts the status check constraint it expects to find
-- before altering it, and aborts loudly instead of guessing if the live schema differs.
do $$
declare
  status_conname text;
  status_condef text;
begin
  select c.conname, pg_get_constraintdef(c.oid) into status_conname, status_condef
  from pg_constraint c
  where c.conrelid = 'public.delivery_orders'::regclass
    and c.contype = 'c'
    and pg_get_constraintdef(c.oid) ilike '%status%';

  if status_conname is null then
    raise exception 'Could not find an existing status check constraint on public.delivery_orders; inspect the live schema before migrating';
  end if;

  if status_condef ilike '%Pending Confirmation%' then
    raise notice 'public.delivery_orders status constraint already includes Pending Confirmation; skipping constraint change';
  else
    if not (
      status_condef ilike '%Preparing%'
      and status_condef ilike '%Ready for pickup%'
      and status_condef ilike '%Out for delivery%'
      and status_condef ilike '%Delivered%'
    ) then
      raise exception 'Unexpected status check constraint on public.delivery_orders (found: %); inspect the live schema before migrating', status_condef;
    end if;

    raise notice 'Replacing public.delivery_orders status constraint % (was: %)', status_conname, status_condef;
    execute format('alter table public.delivery_orders drop constraint %I', status_conname);
    alter table public.delivery_orders
      add constraint delivery_orders_status_check
      check (status in (
        'Pending Confirmation', 'Preparing', 'Ready for pickup', 'Out for delivery', 'Delivered', 'Cancelled'
      ));
  end if;
end
$$;

alter table public.delivery_orders
  add column if not exists source text not null default 'web' check (source in ('web', 'messenger')),
  add column if not exists messenger_psid text;

create index if not exists delivery_orders_messenger_psid_idx
  on public.delivery_orders (messenger_psid)
  where messenger_psid is not null;

-- Collision-safe reference generator, replacing the client-side
-- CAP-${1050 + existingOrders.length} / random-digit schemes.
create sequence if not exists public.delivery_order_reference_seq start 1050;

create or replace function public.next_delivery_reference()
returns text
language sql
as $$
  select 'CAP-' || nextval('public.delivery_order_reference_seq')::text;
$$;

-- Per-Messenger-sender conversation draft. Service-role only: webhook.js is the
-- only writer/reader, so no anon/authenticated policies are granted at all.
create table if not exists public.messenger_sessions (
  psid text primary key,
  state text not null default 'idle',
  draft jsonb not null default '{}'::jsonb,
  last_message_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.messenger_sessions enable row level security;
revoke all on public.messenger_sessions from public, anon, authenticated;
