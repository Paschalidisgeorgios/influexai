-- Public creator profile fields

alter table public.profiles
  add column if not exists username text unique,
  add column if not exists bio text,
  add column if not exists is_public boolean not null default false,
  add column if not exists youtube_url text,
  add column if not exists tiktok_url text,
  add column if not exists instagram_url text;

create unique index if not exists profiles_username_lower_idx
  on public.profiles (lower(username))
  where username is not null;

alter table public.generations
  add column if not exists is_pinned boolean not null default false;

-- Public read: profiles that opted in
create policy "profiles_select_public"
  on public.profiles for select
  using (is_public = true and username is not null);

-- Public read: pinned showcase items for public profiles
create policy "generations_select_public_pinned"
  on public.generations for select
  using (
    is_pinned = true
    and exists (
      select 1
      from public.profiles p
      where p.id = generations.user_id
        and p.is_public = true
        and p.username is not null
    )
  );

create policy "generations_update_own"
  on public.generations for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
