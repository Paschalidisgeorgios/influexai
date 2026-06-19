create table if not exists public.avatar_render_jobs (
  id                  uuid primary key default gen_random_uuid(),
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now(),
  user_id             uuid references auth.users(id) on delete cascade,
  source_image_key    text not null,
  source_image_url    text,
  driving_video_key   text not null,
  driving_video_url   text,
  options             jsonb not null default '{}'::jsonb,
  estimated_credits   int not null default 0,
  used_credits        int not null default 0,
  status              text not null default 'draft',
  runpod_job_id       text,
  raw_output_key      text,
  raw_output_url      text,
  final_output_key    text,
  final_output_url    text,
  quality_report      jsonb,
  error               text,
  consent_given       boolean not null default false
);

create index if not exists avatar_jobs_user_id_idx
  on public.avatar_render_jobs (user_id);
create index if not exists avatar_jobs_status_idx
  on public.avatar_render_jobs (status);

alter table public.avatar_render_jobs
  enable row level security;

do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'avatar_render_jobs'
      and policyname = 'avatar_jobs_owner'
  ) then
    create policy "avatar_jobs_owner"
      on public.avatar_render_jobs
      for all to authenticated
      using (user_id = auth.uid())
      with check (user_id = auth.uid());
  end if;
end $$;
