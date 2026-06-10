-- KI-Influencer: distinguish generated vs uploaded photo paths

alter table characters
  add column if not exists source text not null default 'generated'
    check (source in ('generated', 'uploaded'));

alter table characters
  add column if not exists upload_session_id uuid;

alter table characters
  add column if not exists upload_zip_url text;

alter table characters
  add column if not exists upload_image_count int;

create index if not exists characters_upload_session_idx
  on characters(upload_session_id)
  where upload_session_id is not null;
