-- SEO blog posts for public /blog and admin content engine

create table if not exists public.blog_posts (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title text not null,
  meta_description text not null default '',
  content text not null default '',
  excerpt text not null default '',
  category text not null default 'KI Tools',
  tags text[] not null default '{}',
  target_keyword text not null default '',
  secondary_keywords text[] not null default '{}',
  reading_time_minutes integer not null default 1,
  published boolean not null default false,
  published_at timestamptz,
  scheduled_at timestamptz,
  updated_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  author text not null default 'InfluexAI Team',
  og_image_url text,
  word_count integer not null default 0,
  language text not null default 'de'
);

create index if not exists idx_blog_posts_published_at
  on public.blog_posts (published_at desc nulls last)
  where published = true;

create index if not exists idx_blog_posts_category
  on public.blog_posts (category);

create index if not exists idx_blog_posts_scheduled_at
  on public.blog_posts (scheduled_at);

create index if not exists idx_blog_posts_slug
  on public.blog_posts (slug);

alter table public.blog_posts enable row level security;

create policy "blog_posts_public_select"
  on public.blog_posts for select
  using (published = true);

-- Admin writes via service role in server actions

create or replace function public.blog_posts_set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists blog_posts_updated_at on public.blog_posts;
create trigger blog_posts_updated_at
  before update on public.blog_posts
  for each row execute function public.blog_posts_set_updated_at();
