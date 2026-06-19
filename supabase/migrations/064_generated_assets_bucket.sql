-- Private bucket for paid/preview generated assets (served only via API routes)

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'generated-assets',
  'generated-assets',
  false,
  52428800,
  array['image/jpeg', 'image/png', 'image/webp', 'video/mp4', 'video/webm']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;
