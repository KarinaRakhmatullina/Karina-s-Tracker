-- Run this once in the Supabase SQL editor for your project.

create table if not exists app_data (
  key text primary key,
  value jsonb not null,
  updated_at timestamptz not null default now()
);

alter table app_data enable row level security;

create policy "Authenticated users can read app_data"
  on app_data for select
  using (auth.role() = 'authenticated');

create policy "Authenticated users can insert app_data"
  on app_data for insert
  with check (auth.role() = 'authenticated');

create policy "Authenticated users can update app_data"
  on app_data for update
  using (auth.role() = 'authenticated')
  with check (auth.role() = 'authenticated');
