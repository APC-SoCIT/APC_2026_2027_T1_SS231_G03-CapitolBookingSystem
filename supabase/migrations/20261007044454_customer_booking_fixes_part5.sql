-- Customer booking fixes part 5: delivery realtime publication.
-- (Applied remotely as version 202610070444xx.)

do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'delivery_orders'
  ) then
    alter publication supabase_realtime add table public.delivery_orders;
  end if;
end
$$;
