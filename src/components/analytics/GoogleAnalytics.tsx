"use client";

import Script from "next/script";
import { useEffect, useState } from "react";

const GA_ID_1 = "G-TPNGDKC46Q";
const GA_ID_2 = "G-F8ND36VLQV";
const CONSENT_KEY = "influexai_cookie_consent";

export function GoogleAnalytics() {
  const [consent, setConsent] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem(CONSENT_KEY);
    if (stored === "accepted") setConsent(true);

    function onStorage(e: StorageEvent) {
      if (e.key === CONSENT_KEY && e.newValue === "accepted") {
        setConsent(true);
      }
    }
    window.addEventListener("storage", onStorage);

    function onConsent() {
      setConsent(true);
    }
    window.addEventListener("influexai_consent_accepted", onConsent);

    return () => {
      window.removeEventListener("storage", onStorage);
      window.removeEventListener("influexai_consent_accepted", onConsent);
    };
  }, []);

  if (!consent) return null;

  return (
    <>
      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID_1}`}
        strategy="afterInteractive"
      />
      <Script id="google-analytics" strategy="afterInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', '${GA_ID_1}', {
            anonymize_ip: true,
          });
          gtag('config', '${GA_ID_2}', {
            anonymize_ip: true,
          });
        `}
      </Script>
    </>
  );
}
