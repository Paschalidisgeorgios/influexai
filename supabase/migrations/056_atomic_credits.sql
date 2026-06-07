-- Atomic credit balance updates (avoids read-modify-write races).

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

  -- User sessions may only deduct their own balance; service_role (webhooks/cron) may deduct any.
  if auth.uid() is not null
     and auth.uid() is distinct from p_user_id
     and jwt_role is distinct from 'service_role' then
    return null;
  end if;

  update public.profiles
    set credits = credits - p_amount
    where id = p_user_id
      and credits >= p_amount
    returning credits into new_balance;

  return new_balance;
end;
$$;

create or replace function public.add_credits(
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

  update public.profiles
    set credits = credits + p_amount
    where id = p_user_id
    returning credits into new_balance;

  return new_balance;
end;
$$;

revoke all on function public.deduct_credits(uuid, int) from public;
revoke all on function public.add_credits(uuid, int) from public;

grant execute on function public.deduct_credits(uuid, int) to authenticated, service_role;
grant execute on function public.add_credits(uuid, int) to service_role;
