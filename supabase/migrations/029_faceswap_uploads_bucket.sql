-- Public temp uploads for Akool face swap (HTTPS URLs)
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'faceswap-uploads',
  'faceswap-uploads',
  true,
  52428800,
  array['image/jpeg', 'image/png', 'image/webp', 'video/mp4', 'video/webm', 'video/quicktime']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

create policy "faceswap_uploads_public_read"
  on storage.objects for select
  using (bucket_id = 'faceswap-uploads');

create policy "faceswap_uploads_service_insert"
  on storage.objects for insert
  with check (bucket_id = 'faceswap-uploads');
