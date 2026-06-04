-- Performance indexes for high-frequency queries (see lib/db.ts for EXPLAIN notes)

-- Generations: user timeline + type breakdown
create index if not exists idx_generations_user_created
  on public.generations (user_id, created_at desc);

create index if not exists idx_generations_user_type
  on public.generations (user_id, type);

-- Community feed (partial indexes skip deleted rows)
create index if not exists idx_community_posts_created
  on public.community_posts (created_at desc)
  where is_deleted = false;

create index if not exists idx_community_posts_type
  on public.community_posts (type, created_at desc)
  where is_deleted = false;

-- Credit history (table: credit_transactions)
create index if not exists idx_credit_transactions_user_created
  on public.credit_transactions (user_id, created_at desc);

-- Referrals by referrer + status
create index if not exists idx_referrals_referrer_status
  on public.referrals (referrer_id, status);
