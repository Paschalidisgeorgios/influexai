-- KI-Influencer: characters (consolidated — no FK to lora_models)
-- lora_id: text reference to lora_models.id (UUID string) when that table exists
-- lora_ref: fal.ai LoRA file URL after training completes

create table if not exists public.characters (
  id                    uuid primary key default gen_random_uuid(),
  user_id               uuid not null references auth.users(id) on delete cascade,
  name                  text not null,
  description           text,
  source                text not null default 'generated',
  casting_generation_id uuid,
  casting_image_url     text,
  character_set_id      uuid,
  upload_session_id     uuid,
  upload_zip_url        text,
  upload_image_count    int,
  lora_id               text,
  lora_ref              text,
  trigger_word          text,
  status                text not null default 'draft',
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now()
);

-- Repair: older attempts may have created lora_id as uuid FK to lora_models
alter table public.characters drop constraint if exists characters_lora_id_fkey;

do $$
begin
  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'characters'
      and column_name = 'lora_id'
      and udt_name = 'uuid'
  ) then
    alter table public.characters
      alter column lora_id type text using lora_id::text;
  end if;
exception
  when others then null;
end $$;

alter table public.characters add column if not exists description text;
alter table public.characters add column if not exists source text;
alter table public.characters add column if not exists casting_generation_id uuid;
alter table public.characters add column if not exists casting_image_url text;
alter table public.characters add column if not exists character_set_id uuid;
alter table public.characters add column if not exists upload_session_id uuid;
alter table public.characters add column if not exists upload_zip_url text;
alter table public.characters add column if not exists upload_image_count int;
alter table public.characters add column if not exists lora_id text;
alter table public.characters add column if not exists lora_ref text;
alter table public.characters add column if not exists trigger_word text;
alter table public.characters add column if not exists status text;
alter table public.characters add column if not exists created_at timestamptz;
alter table public.characters add column if not exists updated_at timestamptz;

update public.characters set source = 'generated' where source is null;
update public.characters set status = 'draft' where status is null;
update public.characters set created_at = now() where created_at is null;
update public.characters set updated_at = now() where updated_at is null;

alter table public.characters alter column source set default 'generated';
alter table public.characters alter column status set default 'draft';
alter table public.characters alter column created_at set default now();
alter table public.characters alter column updated_at set default now();

do $$
begin
  alter table public.characters alter column source set not null;
exception
  when others then null;
end $$;

do $$
begin
  alter table public.characters alter column status set not null;
exception
  when others then null;
end $$;

do $$
begin
  alter table public.characters
    add constraint characters_source_check
    check (source in ('generated', 'uploaded'));
exception
  when duplicate_object then null;
end $$;

create index if not exists characters_user_idx
  on public.characters (user_id, created_at desc);

create index if not exists characters_lora_idx
  on public.characters (lora_id)
  where lora_id is not null;

create index if not exists characters_upload_session_idx
  on public.characters (upload_session_id)
  where upload_session_id is not null;

alter table public.characters enable row level security;

do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'characters'
      and policyname = 'Users manage own characters'
  ) then
    create policy "Users manage own characters"
      on public.characters for all
      to authenticated
      using (auth.uid() = user_id)
      with check (auth.uid() = user_id);
  end if;
end $$;

comment on table public.characters is
  'KI-Influencer virtual characters. lora_id = lora_models row id (text); lora_ref = fal LoRA URL.';
comment on column public.characters.lora_id is
  'Optional reference to lora_models.id (UUID as text). No FK — lora_models may be created separately.';
comment on column public.characters.lora_ref is
  'fal.ai LoRA weights URL after training completes.';
