-- Web Push subscriptions (endpoint + keys per browser/device)

create table if not exists public.push_notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  endpoint text not null,
  p256dh text not null,
  auth text not null,
  user_agent text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (endpoint)
);

create index if not exists push_notifications_user_id_idx
  on public.push_notifications (user_id);

alter table public.push_notifications enable row level security;

drop policy if exists "push_notifications_select_own" on public.push_notifications;
create policy "push_notifications_select_own"
  on public.push_notifications for select
  using (auth.uid() = user_id);

drop policy if exists "push_notifications_insert_own" on public.push_notifications;
create policy "push_notifications_insert_own"
  on public.push_notifications for insert
  with check (auth.uid() = user_id);

drop policy if exists "push_notifications_update_own" on public.push_notifications;
create policy "push_notifications_update_own"
  on public.push_notifications for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "push_notifications_delete_own" on public.push_notifications;
create policy "push_notifications_delete_own"
  on public.push_notifications for delete
  using (auth.uid() = user_id);
