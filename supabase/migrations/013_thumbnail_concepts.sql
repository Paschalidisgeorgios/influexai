-- Thumbnail Concept Generator: gespeicherte Konzepte pro Nutzer

create table if not exists public.thumbnail_concepts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  topic text not null,
  concepts jsonb not null,
  created_at timestamptz not null default now()
);

create index if not exists thumbnail_concepts_user_created_idx
  on public.thumbnail_concepts (user_id, created_at desc);

alter table public.thumbnail_concepts enable row level security;

create policy "thumbnail_concepts_select_own"
  on public.thumbnail_concepts for select using (auth.uid() = user_id);

create policy "thumbnail_concepts_insert_own"
  on public.thumbnail_concepts for insert with check (auth.uid() = user_id);

create policy "thumbnail_concepts_delete_own"
  on public.thumbnail_concepts for delete using (auth.uid() = user_id);
