# Supabase Backend Checklist (meddoc-ai)

## 1. Table schema for user_medicines
Run this SQL in Supabase SQL editor:

```sql
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
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

create index if not exists idx_user_medicines_user_id_active on public.user_medicines(user_id, is_active);
create index if not exists idx_user_medicines_user_id_created_at on public.user_medicines(user_id, created_at desc);
```

## 2. RLS policies (required)
Enable Row Level Security:

```sql
alter table public.user_medicines enable row level security;

-- Users can read their own medicines
create policy "select_user_medicines" on public.user_medicines
  for select using (user_id = auth.uid());

-- Users can insert rows for themselves (or rely on trigger to set user_id)
create policy "insert_user_medicines" on public.user_medicines
  for insert with check (user_id = auth.uid());

-- Users can update their own rows
create policy "update_user_medicines" on public.user_medicines
  for update using (user_id = auth.uid()) with check (user_id = auth.uid());

-- Users can delete their own rows (soft delete via is_active false)
create policy "delete_user_medicines" on public.user_medicines
  for delete using (user_id = auth.uid());
```

## 3. (Optional but recommended) Force user_id in DB
Use trigger to ignore any client-supplied value and assign auth.uid():

```sql
create function public.user_medicines_set_user_id() returns trigger as $$
begin
  new.user_id := auth.uid();
  new.updated_at := now();
  return new;
end;
$$ language plpgsql security definer;

create trigger set_user_id_before_insert
before insert on public.user_medicines
for each row execute function public.user_medicines_set_user_id();

create trigger set_updated_at_before_update
before update on public.user_medicines
for each row execute function public.user_medicines_set_user_id();
```

## 4. Confirm in Supabase Auth > Settings > Policies
- Anonymous role should have zero direct table access.
- Row-level policies should enforce `auth.uid()` checks.

## 5. Environment variables (local/dev/prod)
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`


## 6. Client wiring check
In `src/pages/MedicineReminder.jsx`, ensure user ID is always from authenticated session, not free-form input:
- `user.id` from `useAuth()` should be used.
- Keep `user_id` in insert/update only for the client side, and rely on Supabase RLS + trigger for safety.


## 7. Manual test procedure
1. Create user A and user B.
2. Add medicine for A.
3. While authenticated as B, query `user_medicines` (should return 0 rows).
4. Attempt role switching via direct REST or client to change `user_id`; should fail with RLS.
