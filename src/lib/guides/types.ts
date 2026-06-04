export type GuideFaq = {
  question: string;
  answer: string;
};

export type Guide = {
  id: string;
  slug: string;
  title: string;
  meta_description: string;
  content: string;
  excerpt: string;
  category: string;
  tags: string[];
  target_keyword: string;
  secondary_keywords: string[];
  pillar_keywords: string[];
  cluster_articles: string[];
  reading_time_minutes: number;
  published: boolean;
  published_at: string | null;
  last_updated: string | null;
  updated_at: string;
  created_at: string;
  author: string;
  og_image_url: string | null;
  word_count: number;
  language: string;
  featured_snippet: string;
  faqs: GuideFaq[];
};
