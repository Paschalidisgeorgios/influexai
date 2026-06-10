-- Virtual KI-Influencer characters (casting → training set → LoRA → content)

create table if not exists characters (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  description text,
  casting_generation_id uuid,
  casting_image_url text,
  character_set_id uuid,
  lora_id uuid references lora_models(id) on delete set null,
  lora_ref text,
  trigger_word text,
  status text not null default 'draft',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index if not exists characters_user_idx
  on characters(user_id, created_at desc);

create index if not exists characters_lora_idx
  on characters(lora_id);

alter table characters enable row level security;

drop policy if exists "Users manage own characters" on characters;
create policy "Users manage own characters"
  on characters for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
