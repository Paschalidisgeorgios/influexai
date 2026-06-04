import type { MetadataRoute } from "next";

const baseUrl =
  process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") ??
  "https://influexaicreator.com";

export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date();
  return [
    { url: baseUrl, lastModified, changeFrequency: "weekly", priority: 1 },
    { url: `${baseUrl}/auth`, lastModified, changeFrequency: "monthly", priority: 0.8 },
    { url: `${baseUrl}/login`, lastModified, changeFrequency: "monthly", priority: 0.5 },
    { url: `${baseUrl}/signup`, lastModified, changeFrequency: "monthly", priority: 0.5 },
  ];
}
