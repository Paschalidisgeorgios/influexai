import type { Metadata } from "next";
import { getLocale } from "next-intl/server";
import { AgencyLandingPage } from "@/components/agency/AgencyLandingPage";

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: "White Label KI-Tools für Agenturen | InfluexAI",
    description:
      "Verkaufe KI-Content-Tools unter deiner eigenen Marke. Eigene Subdomain, eigenes Branding, bis zu 500 Clients verwalten.",
    openGraph: {
      title: "White Label KI-Tools für Agenturen | InfluexAI",
      description:
        "Verkaufe KI-Content-Tools unter deiner eigenen Marke. Eigene Subdomain, eigenes Branding, bis zu 500 Clients verwalten.",
    },
  };
}

export default async function AgencyPage() {
  await getLocale();
  return <AgencyLandingPage />;
}
