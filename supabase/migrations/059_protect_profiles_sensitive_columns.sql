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

  -- Authorized billing RPC (deduct_credits) may adjust credits only.
  if coalesce(current_setting('app.profile_billing_update', true), '') = '1'
     and new.credits is distinct from old.credits then
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
  sensitive_cols constant text[] := array[
    'tenant_id',
    'tenant_role',
    'credits',
    'plan',
    'stripe_customer_id',
    'stripe_subscription_id',
    'agency_plan',
    'agency_credits',
    'role',
    'is_admin',
    'referral_code',
    'referred_by',
    'is_beta',
    'beta_code',
    'email_sequence_day',
    'last_nurture_email_at',
    'is_churned',
    'nurture_unsubscribed'
  ];
begin
  foreach col in array sensitive_cols
  loop
    if exists (
      select 1
      from information_schema.columns
      where table_schema = 'public'
        and table_name = 'profiles'
        and column_name = col
    ) then
      execute format(
        'revoke update (%I) on table public.profiles from anon, authenticated',
        col
      );
    end if;
  end loop;
end;
$$;

-- deduct_credits runs as authenticated; trigger bypass is scoped to credits only.
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
