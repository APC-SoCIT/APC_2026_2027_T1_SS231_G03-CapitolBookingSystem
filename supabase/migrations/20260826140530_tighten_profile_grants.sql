revoke all on table public.profiles from anon, authenticated, public;

grant select on table public.profiles to authenticated;
grant all on table public.profiles to service_role;
