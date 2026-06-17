/** Live vs preview link targets for Landing V2 surfaces */

export type LandingV2Mode = "preview" | "live";

export type LandingV2Links = {
  mode: LandingV2Mode;
  home: string;
  pricing: string;
  signup: string;
  checkoutRedirect: string;
  showPreviewBanner: boolean;
  landingPreviewBanner: string | null;
  landingFooterTagline: string | null;
  landingFooterExtraLinks: ReadonlyArray<{ label: string; href: string }>;
  pricingPreviewBanner: string | null;
  pricingFooterTagline: string | null;
  pricingNavBack: { label: string; href: string } | null;
  pricingFinalCtaSecondary: { label: string; href: string };
  pricingFooterLinks: ReadonlyArray<{ label: string; href: string }>;
};

const PREVIEW_LANDING = "/design/landing-preview";
const PREVIEW_PRICING = "/design/pricing-preview";

export function getLandingV2Links(mode: LandingV2Mode): LandingV2Links {
  if (mode === "live") {
    return {
      mode,
      home: "/",
      pricing: "/pricing",
      signup: "/auth/sign-up",
      checkoutRedirect: "/pricing",
      showPreviewBanner: false,
      landingPreviewBanner: null,
      landingFooterTagline: null,
      landingFooterExtraLinks: [],
      pricingPreviewBanner: null,
      pricingFooterTagline: null,
      pricingNavBack: null,
      pricingFinalCtaSecondary: { label: "Zur Startseite", href: "/" },
      pricingFooterLinks: [
        { label: "Startseite", href: "/" },
        { label: "Impressum", href: "/impressum" },
        { label: "Datenschutz", href: "/datenschutz" },
      ],
    };
  }

  return {
    mode,
    home: PREVIEW_LANDING,
    pricing: PREVIEW_PRICING,
    signup: "/auth/sign-up",
    checkoutRedirect: PREVIEW_PRICING,
    showPreviewBanner: true,
    landingPreviewBanner: "Interne Vorschau — nicht die Live-Landingpage unter /",
    landingFooterTagline: "Landing Preview",
    landingFooterExtraLinks: [
      { label: "Live-Landing", href: "/" },
    ],
    pricingPreviewBanner: "Interne Pricing-Vorschau — Live-Preise unter /pricing",
    pricingFooterTagline: "Pricing Preview",
    pricingNavBack: { label: "Landing Preview", href: PREVIEW_LANDING },
    pricingFinalCtaSecondary: { label: "Zur Landing Preview", href: PREVIEW_LANDING },
    pricingFooterLinks: [
      { label: "Landing Preview", href: PREVIEW_LANDING },
      { label: "Live-Preise", href: "/pricing" },
    ],
  };
}
