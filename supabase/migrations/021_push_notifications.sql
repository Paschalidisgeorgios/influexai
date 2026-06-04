-- Push notifications: Expo push token + user preferences on profiles

alter table public.profiles
  add column if not exists push_token text,
  add column if not exists notification_preferences jsonb not null default '{
    "credits_warnings": true,
    "community_replies": true,
    "weekly_challenges": true,
    "reengagement": true,
    "new_features": false
  }'::jsonb;

create index if not exists idx_profiles_push_token
  on public.profiles (push_token)
  where push_token is not null;

-- Users can update their own push token and notification preferences
-- Allow authenticated users to update own profile (push token, prefs, etc.)
do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'profiles'
      and policyname = 'profiles_update_own'
  ) then
    create policy "profiles_update_own"
      on public.profiles for update
      using (auth.uid() = id)
      with check (auth.uid() = id);
  end if;
end $$;
