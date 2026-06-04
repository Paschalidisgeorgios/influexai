"use client";

import dynamic from "next/dynamic";

const AdSpot = dynamic(
  () => import("./AdSpot").then((mod) => mod.AdSpot),
  {
    ssr: false,
    loading: () => (
      <section
        className="min-h-screen w-full bg-[#060608]"
        aria-label="InfluexAI Ad Spot loading"
      />
    ),
  }
);

export function AdSpotLazy() {
  return <AdSpot />;
}
