create extension if not exists pgcrypto;

create or replace function public.current_app_role()
returns text
language sql
stable
as $$
  select coalesce(auth.jwt() -> 'user_metadata' ->> 'role', '')
$$;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  role text not null check (role in ('patient', 'asha', 'admin')),
  full_name text,
  phone text,
  village text,
  block text,
  district text,
  households_covered integer check (households_covered is null or households_covered >= 0),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.case_reports (
  id uuid primary key default gen_random_uuid(),
  asha_user_id uuid not null references auth.users(id) on delete cascade,
  patient_name text not null,
  age integer check (age is null or (age >= 0 and age <= 120)),
  gender text,
  village text not null,
  block text,
  district text,
  symptoms text not null,
  days_sick integer check (days_sick is null or days_sick >= 0),
  danger_signs text,
  triage text not null check (triage in ('self-care', 'clinic', 'emergency')),
  referral_status text not null check (referral_status in ('pending', 'referred', 'completed')),
  created_at timestamptz not null default timezone('utc', now())
);

create index if not exists profiles_role_idx on public.profiles(role);
create index if not exists profiles_district_idx on public.profiles(district);
create index if not exists case_reports_asha_user_id_idx on public.case_reports(asha_user_id);
create index if not exists case_reports_created_at_idx on public.case_reports(created_at desc);
create index if not exists case_reports_district_idx on public.case_reports(district);

drop trigger if exists profiles_set_updated_at on public.profiles;
create trigger profiles_set_updated_at
before update on public.profiles
for each row
execute function public.set_updated_at();

alter table public.profiles enable row level security;
alter table public.case_reports enable row level security;

drop policy if exists "profiles_select_own_or_admin" on public.profiles;
create policy "profiles_select_own_or_admin"
on public.profiles
for select
to authenticated
using (
  auth.uid() = id
  or public.current_app_role() = 'admin'
);

drop policy if exists "profiles_insert_own" on public.profiles;
create policy "profiles_insert_own"
on public.profiles
for insert
to authenticated
with check (
  auth.uid() = id
  and role = public.current_app_role()
);

drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own"
on public.profiles
for update
to authenticated
using (
  auth.uid() = id
)
with check (
  auth.uid() = id
  and role = public.current_app_role()
);

drop policy if exists "case_reports_select_own_or_admin" on public.case_reports;
create policy "case_reports_select_own_or_admin"
on public.case_reports
for select
to authenticated
using (
  auth.uid() = asha_user_id
  or public.current_app_role() = 'admin'
);

drop policy if exists "case_reports_insert_asha_own" on public.case_reports;
create policy "case_reports_insert_asha_own"
on public.case_reports
for insert
to authenticated
with check (
  auth.uid() = asha_user_id
  and public.current_app_role() = 'asha'
);
