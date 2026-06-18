-- AI Creator workflow — extend characters for persona profile + reference sets

alter table public.characters add column if not exists character_type text;
alter table public.characters add column if not exists niche text;
alter table public.characters add column if not exists style text;
alter table public.characters add column if not exists tone text;
alter table public.characters add column if not exists platforms text[];
alter table public.characters add column if not exists target_audience text;
alter table public.characters add column if not exists consent_confirmed boolean not null default false;
alter table public.characters add column if not exists reference_image_urls text[];
alter table public.characters add column if not exists training_provider text;
alter table public.characters add column if not exists training_model text;
alter table public.characters add column if not exists training_job_id text;
alter table public.characters add column if not exists preview_image_url text;

do $$
begin
  alter table public.characters
    add constraint characters_character_type_check
    check (character_type is null or character_type in ('self', 'fictional'));
exception
  when duplicate_object then null;
end $$;

comment on column public.characters.character_type is
  'AI Creator path: self (digital twin) or fictional persona.';
comment on column public.characters.reference_image_urls is
  'Public or signed URLs for reference image set (not user demo assets).';
comment on column public.characters.consent_confirmed is
  'User confirmed rights/consent for uploaded reference images.';
