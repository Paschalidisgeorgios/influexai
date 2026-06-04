import type { MetadataRoute } from "next";
import { listPublicProfileUsernames } from "@/app/actions/public-profile";
import {
  localizedUrl,
  SEO_BASE_URL,
  SEO_LOCALES,
  SEO_STATIC_PATHS,
} from "@/lib/seo";
import { defaultLocale } from "@/lib/locale";
import { createServiceSupabaseClient } from "@/lib/supabase/service";
import { getAllProgrammaticPaths } from "@/lib/programmatic-seo";
import { PILLAR_SLUGS } from "@/lib/guides/pillars";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const lastModified = new Date();
  const entries: MetadataRoute.Sitemap = [];

  for (const page of SEO_STATIC_PATHS) {
    for (const lang of SEO_LOCALES) {
      entries.push({
        url: localizedUrl(page, lang),
        lastModified,
        changeFrequency: page === "/" ? "weekly" : "monthly",
        priority: page === "/" ? 1.0 : 0.7,
      });
    }
  }

  try {
    const usernames = await listPublicProfileUsernames();
    for (const username of usernames) {
      entries.push({
        url: `${SEO_BASE_URL}/creator/${username}`,
        lastModified,
        changeFrequency: "weekly",
        priority: 0.6,
      });
    }
  } catch {
    /* public profiles optional */
  }

  entries.push({
    url: localizedUrl("/login", defaultLocale),
    lastModified,
    changeFrequency: "yearly",
    priority: 0.4,
  });
  entries.push({
    url: localizedUrl("/signup", defaultLocale),
    lastModified,
    changeFrequency: "yearly",
    priority: 0.5,
  });

  entries.push({
    url: `${SEO_BASE_URL}/blog`,
    lastModified,
    changeFrequency: "daily",
    priority: 0.8,
  });

  entries.push({
    url: `${SEO_BASE_URL}/guides`,
    lastModified,
    changeFrequency: "weekly",
    priority: 0.9,
  });

  for (const slug of PILLAR_SLUGS) {
    entries.push({
      url: `${SEO_BASE_URL}/guides/${slug}`,
      lastModified,
      changeFrequency: "monthly",
      priority: 0.85,
    });
  }

  entries.push({
    url: `${SEO_BASE_URL}/tools`,
    lastModified,
    changeFrequency: "weekly",
    priority: 0.85,
  });

  for (const { feature, niche } of getAllProgrammaticPaths()) {
    entries.push({
      url: `${SEO_BASE_URL}/tools/${feature}/${niche}`,
      lastModified,
      changeFrequency: "monthly",
      priority: 0.5,
    });
  }

  try {
    const supabase = createServiceSupabaseClient();
    const { data: posts } = await supabase
      .from("blog_posts")
      .select("slug, updated_at, published_at")
      .eq("published", true);

    for (const post of posts ?? []) {
      entries.push({
        url: `${SEO_BASE_URL}/blog/${post.slug}`,
        lastModified: new Date(
          post.updated_at ?? post.published_at ?? Date.now()
        ),
        changeFrequency: "weekly",
        priority: 0.75,
      });
    }
  } catch {
    /* blog table may not exist until migration */
  }

  return entries;
}
