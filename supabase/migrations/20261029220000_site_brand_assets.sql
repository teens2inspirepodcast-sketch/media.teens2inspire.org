-- Uploads for the website CMS: public artwork, write access restricted to the existing admin role.
-- Does not modify payment, membership, login or private R2 storage.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'site-brand-assets', 'site-brand-assets', true, 10485760,
  array['image/jpeg','image/png','image/webp','image/gif','image/avif']
)
on conflict (id) do nothing;

drop policy if exists "site brand admin uploads" on storage.objects;
create policy "site brand admin uploads" on storage.objects for insert to authenticated
  with check (bucket_id = 'site-brand-assets' and name like 'branding/%' and public.is_admin());
drop policy if exists "site brand admin updates" on storage.objects;
create policy "site brand admin updates" on storage.objects for update to authenticated
  using (bucket_id = 'site-brand-assets' and public.is_admin())
  with check (bucket_id = 'site-brand-assets' and public.is_admin());
drop policy if exists "site brand admin deletes" on storage.objects;
create policy "site brand admin deletes" on storage.objects for delete to authenticated
  using (bucket_id = 'site-brand-assets' and public.is_admin());
