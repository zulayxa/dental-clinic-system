-- Short clinic patient codes (P-1001, P-1002, …).
-- Run in the Supabase SQL editor. Adds patient_code only; existing columns stay as they are.

create sequence if not exists public.patient_code_seq start with 1001;

alter table public.patients
  add column if not exists patient_code text;

select setval(
  'public.patient_code_seq',
  greatest(
    coalesce(
      (
        select max(substring(patient_code from 3)::bigint)
        from public.patients
        where patient_code ~ '^P-[0-9]+$'
      ),
      1000
    ),
    1000
  ),
  true
);

update public.patients
set patient_code = 'P-' || nextval('public.patient_code_seq')::text
where patient_code is null or btrim(patient_code) = '';

alter table public.patients
  alter column patient_code set default ('P-' || nextval('public.patient_code_seq')::text);

create unique index if not exists patients_patient_code_uidx
  on public.patients (patient_code);
