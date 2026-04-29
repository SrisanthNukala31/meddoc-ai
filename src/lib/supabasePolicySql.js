// Supabase setup SQL snippets for meddoc-ai
// Copy these commands into Supabase SQL editor for schema + policy enforcement.

export const userMedicinesSetupSql = `
create table if not exists public.user_medicines (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) not null,
  name text not null,
  dosage text,
  frequency text default 'morning',
  times jsonb not null default '[]'::jsonb,
  start_date date,
  duration_days int,
  notes text,
  is_active boolean not null default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index if not exists idx_user_medicines_user_id_active on public.user_medicines(user_id, is_active);
create index if not exists idx_user_medicines_user_id_created_at on public.user_medicines(user_id, created_at desc);

alter table public.user_medicines enable row level security;

create policy "select_user_medicines" on public.user_medicines
  for select using (user_id = auth.uid());

create policy "insert_user_medicines" on public.user_medicines
  for insert with check (user_id = auth.uid());

create policy "update_user_medicines" on public.user_medicines
  for update using (user_id = auth.uid()) with check (user_id = auth.uid());

create policy "delete_user_medicines" on public.user_medicines
  for delete using (user_id = auth.uid());

create function if not exists public.user_medicines_set_user_id() returns trigger as $$
begin
  new.user_id := auth.uid();
  new.updated_at := now();
  return new;
end;
$$ language plpgsql security definer;

create trigger if not exists set_user_id_before_insert
before insert on public.user_medicines
for each row execute function public.user_medicines_set_user_id();

create trigger if not exists set_updated_at_before_update
before update on public.user_medicines
for each row execute function public.user_medicines_set_user_id();
`;
