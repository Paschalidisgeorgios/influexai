-- Pillar guides (content hub) + newsletter subscribers

create table if not exists public.guides (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title text not null,
  meta_description text not null default '',
  content text not null default '',
  excerpt text not null default '',
  category text not null default 'Guide',
  tags text[] not null default '{}',
  target_keyword text not null default '',
  secondary_keywords text[] not null default '{}',
  pillar_keywords text[] not null default '{}',
  cluster_articles text[] not null default '{}',
  reading_time_minutes integer not null default 1,
  published boolean not null default false,
  published_at timestamptz,
  last_updated date,
  updated_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  author text not null default 'InfluexAI Team',
  og_image_url text,
  word_count integer not null default 0,
  language text not null default 'de',
  featured_snippet text not null default '',
  faqs jsonb not null default '[]'::jsonb
);

create index if not exists idx_guides_slug on public.guides (slug);
create index if not exists idx_guides_published on public.guides (published_at desc nulls last)
  where published = true;

alter table public.guides enable row level security;

create policy "guides_public_select"
  on public.guides for select
  using (published = true);

create table if not exists public.newsletter_subscribers (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  source text not null default 'unknown',
  created_at timestamptz not null default now(),
  confirmed boolean not null default false,
  confirm_token text,
  confirmed_at timestamptz
);

create index if not exists idx_newsletter_email on public.newsletter_subscribers (email);

alter table public.newsletter_subscribers enable row level security;

-- Inserts via service role only (no public policies)

create or replace function public.guides_set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists guides_updated_at on public.guides;
create trigger guides_updated_at
  before update on public.guides
  for each row execute function public.guides_set_updated_at();
