-- Community creations: public gallery, likes, comments, follows, reports

alter table public.generations
  add column if not exists is_public boolean not null default false;

create index if not exists idx_generations_public_created
  on public.generations (created_at desc)
  where is_public = true;

create table if not exists public.community_likes (
  generation_id uuid not null references public.generations (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (generation_id, user_id)
);

create index if not exists idx_community_likes_generation
  on public.community_likes (generation_id);

create table if not exists public.community_comments (
  id uuid primary key default gen_random_uuid(),
  generation_id uuid not null references public.generations (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  content text not null check (char_length(content) >= 1 and char_length(content) <= 500),
  created_at timestamptz not null default now(),
  is_deleted boolean not null default false
);

create index if not exists idx_community_comments_generation
  on public.community_comments (generation_id, created_at asc)
  where is_deleted = false;

create table if not exists public.community_follows (
  follower_id uuid not null references auth.users (id) on delete cascade,
  following_id uuid not null references auth.users (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (follower_id, following_id),
  check (follower_id <> following_id)
);

create index if not exists idx_community_follows_following
  on public.community_follows (following_id);

create table if not exists public.community_creation_reports (
  id uuid primary key default gen_random_uuid(),
  generation_id uuid not null references public.generations (id) on delete cascade,
  reporter_id uuid not null references auth.users (id) on delete cascade,
  reason text not null default '',
  created_at timestamptz not null default now()
);

create index if not exists idx_community_creation_reports_created
  on public.community_creation_reports (created_at desc);

alter table public.community_likes enable row level security;
alter table public.community_comments enable row level security;
alter table public.community_follows enable row level security;
alter table public.community_creation_reports enable row level security;

-- Public generations for community (owner has public profile)
create policy "generations_select_public_community"
  on public.generations for select
  using (
    is_public = true
    and exists (
      select 1
      from public.profiles p
      where p.id = generations.user_id
        and p.is_public = true
        and p.username is not null
    )
  );

create policy "community_likes_select_public"
  on public.community_likes for select using (true);

create policy "community_likes_insert_own"
  on public.community_likes for insert
  with check (auth.uid() = user_id);

create policy "community_likes_delete_own"
  on public.community_likes for delete
  using (auth.uid() = user_id);

create policy "community_comments_select_public"
  on public.community_comments for select using (is_deleted = false);

create policy "community_comments_insert_own"
  on public.community_comments for insert
  with check (auth.uid() = user_id);

create policy "community_follows_select_public"
  on public.community_follows for select using (true);

create policy "community_follows_insert_own"
  on public.community_follows for insert
  with check (auth.uid() = follower_id);

create policy "community_follows_delete_own"
  on public.community_follows for delete
  using (auth.uid() = follower_id);

create policy "community_creation_reports_insert_own"
  on public.community_creation_reports for insert
  with check (auth.uid() = reporter_id);
