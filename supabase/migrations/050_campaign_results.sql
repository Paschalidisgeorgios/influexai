create table if not exists public.campaign_results (
  id               uuid primary key default gen_random_uuid(),
  created_at       timestamptz not null default now(),
  user_id          uuid references auth.users(id) on delete cascade,
  mode             text not null,
  prompt           text not null default '',
  platforms        text[],
  goal             text,
  tone             text,
  brand_dna        jsonb,
  assumptions      text[],
  items            jsonb not null default '[]'::jsonb,
  overall_scores   jsonb,
  estimated_credits int default 0,
  used_credits     int default 0,
  title            text,
  summary          text
);
create index if not exists campaign_results_user_id_idx
  on public.campaign_results (user_id);
alter table public.campaign_results enable row level security;
create policy "campaign_results_owner"
  on public.campaign_results for all to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());
