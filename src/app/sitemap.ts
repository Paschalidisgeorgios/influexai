import type { MetadataRoute } from "next";
import { listPublicProfileUsernames } from "@/app/actions/public-profile";
import {
  localizedUrl,
  SEO_BASE_URL,
  SEO_LOCALES,
  SEO_STATIC_PATHS,
} from "@/lib/seo";
import { defaultLocale } from "@/lib/locale";

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

  return entries;
}
