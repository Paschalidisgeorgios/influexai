-- Creator DNA for KI Agent (profiles.creator_dna jsonb)
alter table public.profiles
  add column if not exists creator_dna jsonb;

comment on column public.profiles.creator_dna is
  'CreatorDNA: niche, targetAudience, platforms, tone, language, goals, forbiddenTopics, preferredFormats, visualStyle, ctaStyle';
