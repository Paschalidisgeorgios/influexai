"use client";

import Script from "next/script";
import { useEffect, useState } from "react";

export function GoogleAnalytics() {
  const [consent, setConsent] = useState(false);
  const GA_ID = "G-TPNGDKC46Q";

  useEffect(() => {
    const check = () => {
      try {
        const val = localStorage.getItem("influexai_cookie_consent");
        setConsent(val === "accepted");
      } catch {}
    };
    check();
    window.addEventListener("storage", check);
    return () => window.removeEventListener("storage", check);
  }, []);

  if (!consent) return null;

  return (
    <>
      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`}
        strategy="afterInteractive"
      />
      <Script id="google-analytics" strategy="afterInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', 'G-TPNGDKC46Q', {
            page_path: window.location.pathname,
            anonymize_ip: true,
          });
        `}
      </Script>
    </>
  );
}
