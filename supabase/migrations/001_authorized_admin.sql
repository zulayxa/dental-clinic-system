-- Exact-email allowlist for clinic login.
-- Run in the Supabase SQL editor if this table is not already present.

create table if not exists public.authorized_admin (
  email text primary key
);

alter table public.authorized_admin enable row level security;

drop policy if exists "authorized_admin_select_own" on public.authorized_admin;

create policy "authorized_admin_select_own"
on public.authorized_admin
for select
to authenticated
using (lower(email) = lower(auth.jwt() ->> 'email'));

insert into public.authorized_admin (email)
values ('maya.chen@luminadental.com')
on conflict (email) do nothing;
