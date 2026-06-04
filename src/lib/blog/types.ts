export type BlogPost = {
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
  reading_time_minutes: number;
  published: boolean;
  published_at: string | null;
  scheduled_at: string | null;
  updated_at: string;
  created_at: string;
  author: string;
  og_image_url: string | null;
  word_count: number;
  language: string;
};

export type BlogOutlineItem = {
  heading: string;
  type: "h2" | "h3";
  keyPoints: string[];
};

export type BlogOutlineResult = {
  title: string;
  metaDescription: string;
  excerpt: string;
  outline: BlogOutlineItem[];
  featuredSnippetType: "definition" | "list" | "table" | "steps";
};

export type KeywordIdea = {
  keyword: string;
  searchIntent: string;
  difficulty: "low" | "medium" | "high";
  suggestedTitle: string;
  estimatedWordCount: number;
};

export type SeoCheckItem = {
  id: string;
  label: string;
  status: "pass" | "warn" | "fail";
};
