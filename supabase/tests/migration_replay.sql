\set ON_ERROR_STOP on
begin;

\ir fixtures/business_rls_baseline.sql

create temporary table legacy_admin_test (id uuid primary key);
insert into legacy_admin_test values (gen_random_uuid());
insert into auth.users (id, email)
select id, id || '@role-test.invalid' from legacy_admin_test;
update public.profiles set role = 'admin' where id in (select id from legacy_admin_test);

create policy unexpected_policy on public.inquiries for select to authenticated using (true);
savepoint before_migration;
\set ON_ERROR_STOP off
\ir ../migrations/20260917082142_explicit_profile_roles.sql
\set migration_failed :ERROR
\set ON_ERROR_STOP on
rollback to savepoint before_migration;

\if :migration_failed
\else
  do $$ begin raise exception 'Migration accepted unexpected policies'; end $$;
\endif

do $$
begin
  assert (select role = 'admin' from public.profiles where id in (select id from legacy_admin_test)),
    'Failed migration must roll back admin conversion';
  assert exists (
    select 1 from pg_policies where schemaname = 'public' and tablename = 'catering_packages'
      and policyname = 'catering_packages_admin_all' and qual like '%''admin''%'
  ), 'Failed migration must roll back earlier policy changes';
end
$$;

drop policy unexpected_policy on public.inquiries;
\ir ../migrations/20260917082142_explicit_profile_roles.sql

do $$
begin
  assert (select role = 'system_admin' from public.profiles where id in (select id from legacy_admin_test)),
    'Legacy admin must become system_admin';
  assert not exists (
    select 1 from pg_policies where schemaname = 'public'
      and (qual like '%''admin''%' or with_check like '%''admin''%')
  ), 'Legacy admin predicates remain';
  raise notice 'PASS atomic conversion and rollback on unexpected policy drift';
end
$$;

rollback;
