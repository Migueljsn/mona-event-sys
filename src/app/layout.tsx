import type { Metadata } from "next";
import Script from "next/script";

import { getSettings } from "@/lib/data/cards";
import { siteConfig } from "@/lib/site";

import "./globals.css";

export const metadata: Metadata = {
  title: siteConfig.name,
  description: siteConfig.description,
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const settings = await getSettings();
  const { gtm_id, meta_pixel_id, google_ads_id } = settings;

  return (
    <html lang="pt-BR" className="h-full antialiased">
      <head>
        {/* ── Google Tag Manager ─────────────────────────────────────── */}
        {gtm_id && (
          <Script id="gtm-head" strategy="afterInteractive">{`
            (function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
            new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
            j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
            'https://www.googletagmanager.com/gtm.js?id='+i+dl;
            f.parentNode.insertBefore(j,f);
            })(window,document,'script','dataLayer','${gtm_id}');
          `}</Script>
        )}

        {/* ── Meta Pixel ─────────────────────────────────────────────── */}
        {meta_pixel_id && (
          <Script id="meta-pixel" strategy="afterInteractive">{`
            !function(f,b,e,v,n,t,s)
            {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
            n.callMethod.apply(n,arguments):n.queue.push(arguments)};
            if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
            n.queue=[];t=b.createElement(e);t.async=!0;
            t.src=v;s=b.getElementsByTagName(e)[0];
            s.parentNode.insertBefore(t,s)}(window, document,'script',
            'https://connect.facebook.net/en_US/fbevents.js');
            fbq('init', '${meta_pixel_id}');
            fbq('track', 'PageView');
          `}</Script>
        )}

        {/* ── Google Ads (somente se sem GTM) ────────────────────────── */}
        {google_ads_id && !gtm_id && (
          <>
            <Script
              src={`https://www.googletagmanager.com/gtag/js?id=${google_ads_id}`}
              strategy="afterInteractive"
            />
            <Script id="google-ads" strategy="afterInteractive">{`
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              gtag('js', new Date());
              gtag('config', '${google_ads_id}');
            `}</Script>
          </>
        )}
      </head>

      <body className="min-h-full flex flex-col">
        {/* GTM noscript fallback */}
        {gtm_id && (
          <noscript>
            <iframe
              src={`https://www.googletagmanager.com/ns.html?id=${gtm_id}`}
              height="0"
              width="0"
              style={{ display: "none", visibility: "hidden" }}
            />
          </noscript>
        )}

        {children}
      </body>
    </html>
  );
}
