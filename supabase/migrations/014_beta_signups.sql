-- Beta waitlist (first 100 creators)

create table if not exists public.beta_signups (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  name text,
  niche text,
  code text not null unique,
  status text not null default 'active' check (status in ('active', 'waitlisted')),
  converted_to_user boolean not null default false,
  user_id uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now()
);

create unique index if not exists beta_signups_email_idx on public.beta_signups (lower(email));
create index if not exists beta_signups_status_created_idx
  on public.beta_signups (status, created_at desc);

alter table public.profiles
  add column if not exists is_beta boolean not null default false,
  add column if not exists beta_code text;

alter table public.beta_signups enable row level security;

-- No public policies: server actions use service role
