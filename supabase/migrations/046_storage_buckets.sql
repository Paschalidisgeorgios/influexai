-- All InfluexAI storage buckets + public read / auth upload / auth delete-own policies
-- Idempotent: buckets ON CONFLICT DO NOTHING; policies DROP IF EXISTS + CREATE.

insert into storage.buckets (id, name, public)
values
  ('generated-assets', 'generated-assets', true),
  ('video-assets', 'video-assets', true),
  ('avatar-assets', 'avatar-assets', true),
  ('ugc-assets', 'ugc-assets', true),
  ('product-assets', 'product-assets', true),
  ('audio-assets', 'audio-assets', true),
  ('lora-assets', 'lora-assets', true),
  ('remix-assets', 'remix-assets', true),
  ('thumbnail-assets', 'thumbnail-assets', true)
on conflict (id) do nothing;

-- generated-assets (Flux, Upscaler, Thumbnail previews)
drop policy if exists "Public read generated-assets" on storage.objects;
create policy "Public read generated-assets"
  on storage.objects for select
  using (bucket_id = 'generated-assets');

drop policy if exists "Auth upload generated-assets" on storage.objects;
create policy "Auth upload generated-assets"
  on storage.objects for insert
  with check (
    bucket_id = 'generated-assets'
    and auth.role() = 'authenticated'
  );

drop policy if exists "Auth delete own generated-assets" on storage.objects;
create policy "Auth delete own generated-assets"
  on storage.objects for delete
  using (
    bucket_id = 'generated-assets'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

-- video-assets (Kling, Seedance, Video Remix)
drop policy if exists "Public read video-assets" on storage.objects;
create policy "Public read video-assets"
  on storage.objects for select
  using (bucket_id = 'video-assets');

drop policy if exists "Auth upload video-assets" on storage.objects;
create policy "Auth upload video-assets"
  on storage.objects for insert
  with check (
    bucket_id = 'video-assets'
    and auth.role() = 'authenticated'
  );

drop policy if exists "Auth delete own video-assets" on storage.objects;
create policy "Auth delete own video-assets"
  on storage.objects for delete
  using (
    bucket_id = 'video-assets'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

-- avatar-assets (KI-Ich, Face Swap, Live Creator)
drop policy if exists "Public read avatar-assets" on storage.objects;
create policy "Public read avatar-assets"
  on storage.objects for select
  using (bucket_id = 'avatar-assets');

drop policy if exists "Auth upload avatar-assets" on storage.objects;
create policy "Auth upload avatar-assets"
  on storage.objects for insert
  with check (
    bucket_id = 'avatar-assets'
    and auth.role() = 'authenticated'
  );

drop policy if exists "Auth delete own avatar-assets" on storage.objects;
create policy "Auth delete own avatar-assets"
  on storage.objects for delete
  using (
    bucket_id = 'avatar-assets'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

-- ugc-assets (UGC Video)
drop policy if exists "Public read ugc-assets" on storage.objects;
create policy "Public read ugc-assets"
  on storage.objects for select
  using (bucket_id = 'ugc-assets');

drop policy if exists "Auth upload ugc-assets" on storage.objects;
create policy "Auth upload ugc-assets"
  on storage.objects for insert
  with check (
    bucket_id = 'ugc-assets'
    and auth.role() = 'authenticated'
  );

drop policy if exists "Auth delete own ugc-assets" on storage.objects;
create policy "Auth delete own ugc-assets"
  on storage.objects for delete
  using (
    bucket_id = 'ugc-assets'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

-- product-assets (Produkt-Werbung)
drop policy if exists "Public read product-assets" on storage.objects;
create policy "Public read product-assets"
  on storage.objects for select
  using (bucket_id = 'product-assets');

drop policy if exists "Auth upload product-assets" on storage.objects;
create policy "Auth upload product-assets"
  on storage.objects for insert
  with check (
    bucket_id = 'product-assets'
    and auth.role() = 'authenticated'
  );

drop policy if exists "Auth delete own product-assets" on storage.objects;
create policy "Auth delete own product-assets"
  on storage.objects for delete
  using (
    bucket_id = 'product-assets'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

-- audio-assets (Stimme & Musik, ElevenLabs)
drop policy if exists "Public read audio-assets" on storage.objects;
create policy "Public read audio-assets"
  on storage.objects for select
  using (bucket_id = 'audio-assets');

drop policy if exists "Auth upload audio-assets" on storage.objects;
create policy "Auth upload audio-assets"
  on storage.objects for insert
  with check (
    bucket_id = 'audio-assets'
    and auth.role() = 'authenticated'
  );

drop policy if exists "Auth delete own audio-assets" on storage.objects;
create policy "Auth delete own audio-assets"
  on storage.objects for delete
  using (
    bucket_id = 'audio-assets'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

-- lora-assets (LoRA Training Modelle)
drop policy if exists "Public read lora-assets" on storage.objects;
create policy "Public read lora-assets"
  on storage.objects for select
  using (bucket_id = 'lora-assets');

drop policy if exists "Auth upload lora-assets" on storage.objects;
create policy "Auth upload lora-assets"
  on storage.objects for insert
  with check (
    bucket_id = 'lora-assets'
    and auth.role() = 'authenticated'
  );

drop policy if exists "Auth delete own lora-assets" on storage.objects;
create policy "Auth delete own lora-assets"
  on storage.objects for delete
  using (
    bucket_id = 'lora-assets'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

-- remix-assets (Video Remix Outputs)
drop policy if exists "Public read remix-assets" on storage.objects;
create policy "Public read remix-assets"
  on storage.objects for select
  using (bucket_id = 'remix-assets');

drop policy if exists "Auth upload remix-assets" on storage.objects;
create policy "Auth upload remix-assets"
  on storage.objects for insert
  with check (
    bucket_id = 'remix-assets'
    and auth.role() = 'authenticated'
  );

drop policy if exists "Auth delete own remix-assets" on storage.objects;
create policy "Auth delete own remix-assets"
  on storage.objects for delete
  using (
    bucket_id = 'remix-assets'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

-- thumbnail-assets (Thumbnail Konzept)
drop policy if exists "Public read thumbnail-assets" on storage.objects;
create policy "Public read thumbnail-assets"
  on storage.objects for select
  using (bucket_id = 'thumbnail-assets');

drop policy if exists "Auth upload thumbnail-assets" on storage.objects;
create policy "Auth upload thumbnail-assets"
  on storage.objects for insert
  with check (
    bucket_id = 'thumbnail-assets'
    and auth.role() = 'authenticated'
  );

drop policy if exists "Auth delete own thumbnail-assets" on storage.objects;
create policy "Auth delete own thumbnail-assets"
  on storage.objects for delete
  using (
    bucket_id = 'thumbnail-assets'
    and auth.uid()::text = (storage.foldername(name))[1]
  );
