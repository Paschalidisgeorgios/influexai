import type { NextConfig } from "next";
import { withSentryConfig } from "@sentry/nextjs";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./i18n.ts");

const nextConfig: NextConfig = {
  typescript: {
    ignoreBuildErrors: false,
  },
  images: {
    formats: ["image/avif", "image/webp"],
    minimumCacheTTL: 86400,
    deviceSizes: [640, 750, 828, 1080, 1200],
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**.supabase.co",
      },
      {
        protocol: "https",
        hostname: "fal.media",
      },
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
    ],
  },
  experimental: {
    optimizePackageImports: [
      "lucide-react",
      "recharts",
      "@supabase/supabase-js",
    ],
  },
  compress: true,
  async redirects() {
    return [
      {
        source: "/dashboard/produkt-werbung",
        destination: "/dashboard/produkt",
        permanent: true,
      },
      {
        source: "/dashboard/mein-ki-ich",
        destination: "/dashboard/ki-influencer",
        permanent: true,
      },
      {
        source: "/dashboard/video-generator",
        destination: "/dashboard/seedance",
        permanent: true,
      },
      {
        source: "/dashboard/text-to-video",
        destination: "/dashboard/seedance",
        permanent: true,
      },
      {
        source: "/dashboard/story-creator",
        destination: "/dashboard/seedance",
        permanent: true,
      },
      {
        source: "/dashboard/voice-agent",
        destination: "/dashboard/melodia",
        permanent: true,
      },
      {
        source: "/dashboard/video-translation",
        destination: "/dashboard/video-uebersetzer",
        permanent: true,
      },
      {
        source: "/dashboard/lipsync",
        destination: "/dashboard/lipsync-studio",
        permanent: true,
      },
      {
        source: "/dashboard/voice-studio",
        destination: "/dashboard/melodia",
        permanent: true,
      },
      {
        source: "/dashboard/video-editor",
        destination: "/dashboard/video-transformer",
        permanent: true,
      },
      {
        source: "/dashboard/ecommerce-ads",
        destination: "/dashboard/ad-creator",
        permanent: true,
      },
      {
        source: "/dashboard/live-creator-new",
        destination: "/dashboard/face-studio",
        permanent: true,
      },
    ];
  },
};

const configWithIntl = withNextIntl(nextConfig);

export default withSentryConfig(configWithIntl, {
  org: "influexai",
  project: "javascript-nextjs",
  authToken: process.env.SENTRY_AUTH_TOKEN,
  silent: true,
  widenClientFileUpload: true,
  sourcemaps: {
    deleteSourcemapsAfterUpload: true,
  },
});
