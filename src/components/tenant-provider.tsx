"use client";

import { createContext, useContext, useMemo, type ReactNode } from "react";
import Image from "next/image";
import type { TenantBranding } from "@/lib/tenant";

type TenantContextValue = {
  tenant: TenantBranding | null;
  isTenantRoute: boolean;
  branding: TenantBranding;
};

const defaultBranding: TenantBranding = {
  appName: "InfluexAI",
  logoUrl: null,
  primaryColor: "#B4FF00",
  secondaryColor: "#060608",
  plan: "starter",
  showPoweredBy: false,
  slug: "",
};

const TenantContext = createContext<TenantContextValue>({
  tenant: null,
  isTenantRoute: false,
  branding: defaultBranding,
});

export function TenantProvider({
  children,
  branding,
  isTenantRoute = false,
}: {
  children: ReactNode;
  branding: TenantBranding;
  isTenantRoute?: boolean;
}) {
  const value = useMemo(
    () => ({
      tenant: isTenantRoute ? branding : null,
      isTenantRoute,
      branding,
    }),
    [branding, isTenantRoute]
  );

  return (
    <TenantContext.Provider value={value}>{children}</TenantContext.Provider>
  );
}

export function useTenant() {
  return useContext(TenantContext);
}

export function AppBrand({
  className = "",
  size = "md",
}: {
  className?: string;
  size?: "sm" | "md" | "lg";
}) {
  const { branding } = useTenant();
  const box =
    size === "sm"
      ? "w-6 h-6 text-xs"
      : size === "lg"
        ? "w-9 h-9 text-base"
        : "w-7 h-7 text-sm";

  if (branding.logoUrl) {
    return (
      <Image
        src={branding.logoUrl}
        alt={branding.appName}
        width={36}
        height={36}
        unoptimized
        className={`${box} rounded-md object-contain ${className}`}
      />
    );
  }

  const initial = branding.appName.charAt(0).toUpperCase();
  return (
    <div
      className={`${box} rounded-[7px] flex items-center justify-center font-[family-name:var(--font-bebas)] leading-none`}
      style={{
        background: "var(--accent)",
        color: "var(--background)",
      }}
    >
      {initial}
    </div>
  );
}

export function AppName({ className = "" }: { className?: string }) {
  const { branding } = useTenant();
  const parts = branding.appName.split(" ");
  const last = parts.pop() ?? branding.appName;
  const first = parts.join(" ") || "";

  return (
    <span
      className={className}
      style={{
        fontFamily: "var(--font-bebas), 'Bebas Neue', sans-serif",
        letterSpacing: "0.04em",
      }}
    >
      {first ? (
        <>
          {first} <span style={{ color: "var(--accent)" }}>{last}</span>
        </>
      ) : (
        <span style={{ color: "var(--accent)" }}>{last}</span>
      )}
    </span>
  );
}

export function PoweredByFooter() {
  const { branding, isTenantRoute } = useTenant();
  if (!isTenantRoute || !branding.showPoweredBy) return null;

  return (
    <p className="text-white/20 text-xs text-center py-3">
      Powered by{" "}
      <a
        href="https://influexaicreator.com"
        className="underline hover:text-[var(--accent)]"
        target="_blank"
        rel="noopener noreferrer"
      >
        InfluexAI
      </a>
    </p>
  );
}
