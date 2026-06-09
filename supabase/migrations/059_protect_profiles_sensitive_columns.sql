-- Block client self-updates of billing, access, and agency membership fields.
-- Service role, webhooks, and security-definer RPCs (e.g. deduct_credits) keep working.

-- Platform plan exists in production but was never added in an earlier repo migration.
alter table public.profiles
  add column if not exists plan text;

create or replace function public.protect_profiles_sensitive_columns()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  jwt_role text;
begin
  jwt_role := coalesce(
    nullif(current_setting('request.jwt.claim.role', true), ''),
    nullif(current_setting('request.jwt.claims', true), '')::json->>'role',
    ''
  );

  if jwt_role in ('service_role', 'supabase_admin') then
    return new;
  end if;

  -- Block credit inflation for all non-privileged roles (including forged billing GUC).
  if new.credits is distinct from old.credits and new.credits > old.credits then
    raise exception 'profiles.credits cannot be increased by users'
      using errcode = '42501';
  end if;

  -- deduct_credits may lower credits only (never increase) via scoped billing GUC.
  if coalesce(current_setting('app.profile_billing_update', true), '') = '1'
     and new.credits is distinct from old.credits
     and new.credits <= old.credits then
    return new;
  end if;

  if new.tenant_id is distinct from old.tenant_id then
    raise exception 'profiles.tenant_id cannot be changed by users'
      using errcode = '42501';
  end if;

  if new.tenant_role is distinct from old.tenant_role then
    raise exception 'profiles.tenant_role cannot be changed by users'
      using errcode = '42501';
  end if;

  if new.credits is distinct from old.credits then
    raise exception 'profiles.credits cannot be changed directly'
      using errcode = '42501';
  end if;

  if new.plan is distinct from old.plan then
    raise exception 'profiles.plan cannot be changed by users'
      using errcode = '42501';
  end if;

  if new.stripe_customer_id is distinct from old.stripe_customer_id then
    raise exception 'profiles.stripe_customer_id cannot be changed by users'
      using errcode = '42501';
  end if;

  if new.stripe_subscription_id is distinct from old.stripe_subscription_id then
    raise exception 'profiles.stripe_subscription_id cannot be changed by users'
      using errcode = '42501';
  end if;

  if new.agency_plan is distinct from old.agency_plan then
    raise exception 'profiles.agency_plan cannot be changed by users'
      using errcode = '42501';
  end if;

  if new.agency_credits is distinct from old.agency_credits then
    raise exception 'profiles.agency_credits cannot be changed by users'
      using errcode = '42501';
  end if;

  if new.role is distinct from old.role then
    raise exception 'profiles.role cannot be changed by users'
      using errcode = '42501';
  end if;

  if new.is_admin is distinct from old.is_admin then
    raise exception 'profiles.is_admin cannot be changed by users'
      using errcode = '42501';
  end if;

  if new.referral_code is distinct from old.referral_code then
    raise exception 'profiles.referral_code cannot be changed by users'
      using errcode = '42501';
  end if;

  if new.referred_by is distinct from old.referred_by then
    raise exception 'profiles.referred_by cannot be changed by users'
      using errcode = '42501';
  end if;

  if new.is_beta is distinct from old.is_beta then
    raise exception 'profiles.is_beta cannot be changed by users'
      using errcode = '42501';
  end if;

  if new.beta_code is distinct from old.beta_code then
    raise exception 'profiles.beta_code cannot be changed by users'
      using errcode = '42501';
  end if;

  if new.email_sequence_day is distinct from old.email_sequence_day then
    raise exception 'profiles.email_sequence_day cannot be changed by users'
      using errcode = '42501';
  end if;

  if new.last_nurture_email_at is distinct from old.last_nurture_email_at then
    raise exception 'profiles.last_nurture_email_at cannot be changed by users'
      using errcode = '42501';
  end if;

  if new.is_churned is distinct from old.is_churned then
    raise exception 'profiles.is_churned cannot be changed by users'
      using errcode = '42501';
  end if;

  if new.nurture_unsubscribed is distinct from old.nurture_unsubscribed then
    raise exception 'profiles.nurture_unsubscribed cannot be changed by users'
      using errcode = '42501';
  end if;

  return new;
end;
$$;

drop trigger if exists protect_profiles_role on public.profiles;

drop trigger if exists protect_profiles_sensitive_columns on public.profiles;

create trigger protect_profiles_sensitive_columns
  before update on public.profiles
  for each row
  execute function public.protect_profiles_sensitive_columns();

do $$
declare
  col text;
  harmless_cols constant text[] := array[
    'full_name',
    'avatar_url',
    'username',
    'bio',
    'is_public',
    'youtube_url',
    'tiktok_url',
    'instagram_url',
    'onboarding_completed',
    'channel_name',
    'creator_niche',
    'niche',
    'subscriber_count',
    'creator_goal',
    'push_token',
    'notification_preferences',
    'daily_suggestions_email',
    'creator_dna',
    'last_active_at'
  ];
  grant_cols text;
begin
  -- Table-level revoke: column REVOKE alone is unreliable when UPDATE ON TABLE exists.
  revoke update on table public.profiles from anon, authenticated;

  select string_agg(format('%I', c.column_name), ', ' order by c.column_name)
  into grant_cols
  from unnest(harmless_cols) as hc(col_name)
  join information_schema.columns c
    on c.table_schema = 'public'
   and c.table_name = 'profiles'
   and c.column_name = hc.col_name;

  if grant_cols is not null and grant_cols <> '' then
    execute format(
      'grant update (%s) on table public.profiles to authenticated',
      grant_cols
    );
  end if;
end;
$$;

-- deduct_credits runs as authenticated; trigger bypass allows credit decrease only.
create or replace function public.deduct_credits(
  p_user_id uuid,
  p_amount int
)
returns int
language plpgsql
security definer
set search_path = public
as $$
declare
  new_balance int;
  jwt_role text;
begin
  if p_amount is null or p_amount <= 0 then
    return null;
  end if;

  jwt_role := coalesce(current_setting('request.jwt.claim.role', true), '');

  if auth.uid() is not null
     and auth.uid() is distinct from p_user_id
     and jwt_role is distinct from 'service_role' then
    return null;
  end if;

  perform set_config('app.profile_billing_update', '1', true);

  update public.profiles
    set credits = credits - p_amount
    where id = p_user_id
      and credits >= p_amount
    returning credits into new_balance;

  return new_balance;
end;
$$;

revoke all on function public.deduct_credits(uuid, int) from public;
grant execute on function public.deduct_credits(uuid, int) to authenticated, service_role;
