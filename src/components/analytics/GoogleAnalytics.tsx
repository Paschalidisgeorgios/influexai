"use client";

import Script from "next/script";

export function GoogleAnalytics() {
  return (
    <>
      <Script
        src="https://www.googletagmanager.com/gtag/js?id=G-TPNGDKC46Q"
        strategy="afterInteractive"
      />
      <Script id="google-analytics" strategy="afterInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', 'G-TPNGDKC46Q', { anonymize_ip: true });
          gtag('config', 'G-F8ND36VLQV', { anonymize_ip: true });
        `}
      </Script>
    </>
  );
}
