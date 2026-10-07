-- First-time profile setup + lock profile UPDATE to editable columns.
-- New signups get onboarding_completed = false (column default) and must
-- complete the setup modal once. Existing profiles are marked complete so
-- current customers are never prompted.
--
-- Security: revoke the table-wide UPDATE granted for contact sync and
-- re-grant only the customer-editable columns. The own-row RLS policy
-- (profiles_update_own) is unchanged, but without a column privilege a
-- client can no longer escalate its own role to system_admin.

alter table public.profiles
  add column if not exists onboarding_completed boolean not null default false;

update public.profiles
  set onboarding_completed = true
  where onboarding_completed = false;

revoke update on table public.profiles from authenticated;

grant update (display_name, phone, addresses, onboarding_completed)
  on public.profiles to authenticated;
