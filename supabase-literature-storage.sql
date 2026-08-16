-- Run this once in the Supabase SQL editor for your project, in addition
-- to supabase.sql. Creates a private bucket for literature source files
-- (PDF/TXT/DOCX) and restricts access to authenticated users, same as the
-- app_data table.

insert into storage.buckets (id, name, public)
values ('literature-files', 'literature-files', false)
on conflict (id) do nothing;

create policy "Authenticated users can read literature files"
  on storage.objects for select
  using (bucket_id = 'literature-files' and auth.role() = 'authenticated');

create policy "Authenticated users can upload literature files"
  on storage.objects for insert
  with check (bucket_id = 'literature-files' and auth.role() = 'authenticated');

create policy "Authenticated users can update literature files"
  on storage.objects for update
  using (bucket_id = 'literature-files' and auth.role() = 'authenticated')
  with check (bucket_id = 'literature-files' and auth.role() = 'authenticated');

create policy "Authenticated users can delete literature files"
  on storage.objects for delete
  using (bucket_id = 'literature-files' and auth.role() = 'authenticated');
