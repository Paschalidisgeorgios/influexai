-- Creator Community Hub

create table if not exists public.community_challenges (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text not null default '',
  start_date timestamptz not null,
  end_date timestamptz not null,
  created_at timestamptz not null default now()
);

create index if not exists community_challenges_active_idx
  on public.community_challenges (start_date, end_date);

create table if not exists public.community_posts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  type text not null check (type in ('win', 'idea', 'question')),
  content text not null check (char_length(content) <= 280),
  metric text,
  niche text not null default '',
  challenge_id uuid references public.community_challenges (id) on delete set null,
  created_at timestamptz not null default now(),
  is_deleted boolean not null default false,
  reactions_fire integer not null default 0,
  reactions_applause integer not null default 0,
  reactions_insight integer not null default 0
);

create index if not exists community_posts_created_idx
  on public.community_posts (created_at desc)
  where is_deleted = false;

create index if not exists community_posts_type_idx
  on public.community_posts (type, created_at desc)
  where is_deleted = false;

create table if not exists public.community_reactions (
  post_id uuid not null references public.community_posts (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  reaction_type text not null check (reaction_type in ('fire', 'applause', 'insight')),
  created_at timestamptz not null default now(),
  primary key (post_id, user_id)
);

create table if not exists public.community_replies (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.community_posts (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  content text not null check (char_length(content) <= 140),
  created_at timestamptz not null default now()
);

create index if not exists community_replies_post_idx
  on public.community_replies (post_id, created_at asc);

create table if not exists public.community_reports (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.community_posts (id) on delete cascade,
  reporter_id uuid not null references auth.users (id) on delete cascade,
  reason text not null default '',
  created_at timestamptz not null default now()
);

create index if not exists community_reports_created_idx
  on public.community_reports (created_at desc);

create table if not exists public.challenge_participants (
  challenge_id uuid not null references public.community_challenges (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  joined_at timestamptz not null default now(),
  primary key (challenge_id, user_id)
);

alter table public.community_challenges enable row level security;
alter table public.community_posts enable row level security;
alter table public.community_reactions enable row level security;
alter table public.community_replies enable row level security;
alter table public.community_reports enable row level security;
alter table public.challenge_participants enable row level security;

-- Public read
create policy "challenges_select_public"
  on public.community_challenges for select using (true);

create policy "posts_select_public"
  on public.community_posts for select using (is_deleted = false);

create policy "reactions_select_public"
  on public.community_reactions for select using (true);

create policy "replies_select_public"
  on public.community_replies for select using (true);

create policy "participants_select_public"
  on public.challenge_participants for select using (true);

-- Authenticated writes
create policy "posts_insert_own"
  on public.community_posts for insert
  with check (auth.uid() = user_id);

create policy "reactions_insert_own"
  on public.community_reactions for insert
  with check (auth.uid() = user_id);

create policy "reactions_update_own"
  on public.community_reactions for update
  using (auth.uid() = user_id);

create policy "reactions_delete_own"
  on public.community_reactions for delete
  using (auth.uid() = user_id);

create policy "replies_insert_own"
  on public.community_replies for insert
  with check (auth.uid() = user_id);

create policy "reports_insert_own"
  on public.community_reports for insert
  with check (auth.uid() = reporter_id);

create policy "participants_insert_own"
  on public.challenge_participants for insert
  with check (auth.uid() = user_id);
