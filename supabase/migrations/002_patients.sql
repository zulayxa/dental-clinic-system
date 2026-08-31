-- Clinic patient register + waiting-room queue.
-- Run in the Supabase SQL editor if this table is not already present.
-- Enable Realtime for public.patients in Database > Replication if the
-- publication statement below is skipped.

create table if not exists public.patients (
  id uuid primary key default gen_random_uuid(),
  created_at timestamp with time zone not null default now(),
  full_name text not null,
  phone_number text,
  age integer,
  gender text,
  medical_history text,
  treatment_type text,
  tooth_number text,
  room_number text,
  queue_number integer,
  status text not null default 'waiting'
);

alter table public.patients enable row level security;

drop policy if exists "patients_authenticated_all" on public.patients;

create policy "patients_authenticated_all"
on public.patients
for all
to authenticated
using (true)
with check (true);

alter table public.patients replica identity full;

do $$
begin
  alter publication supabase_realtime add table public.patients;
exception
  when duplicate_object then null;
  when undefined_object then null;
end $$;
