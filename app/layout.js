import { Anek_Devanagari, Anek_Latin, Mukta } from "next/font/google";
import JsonLd from "./components/JsonLd";
import SiteShell from "./components/SiteShell";
import { SITE_DESCRIPTION, SITE_NAME, SITE_URL } from "./lib/site";
import { getSiteContent } from "./lib/siteContent";
import { SiteDataProvider } from "./lib/siteData";
import { organizationSchema, websiteSchema } from "./lib/structuredData";
import "./globals.css";

const displayLatin = Anek_Latin({
  axes: ["wdth"],
  display: "swap",
  subsets: ["latin"],
  variable: "--font-display-latin",
});

const displayHindi = Anek_Devanagari({
  axes: ["wdth"],
  display: "swap",
  subsets: ["devanagari"],
  variable: "--font-display-hindi",
});

const body = Mukta({
  display: "swap",
  subsets: ["latin", "devanagari"],
  variable: "--font-body",
  weight: ["400", "500", "600", "700"],
});

export const metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "AeroCareer Hub | Your Gateway to Aviation Careers",
    template: `%s | ${SITE_NAME}`,
  },
  description: SITE_DESCRIPTION,
  openGraph: {
    type: "website",
    siteName: SITE_NAME,
    locale: "en_IN",
    images: [{ url: "/images/hero-runway.jpg", alt: "An airport runway at sunset" }],
  },
  twitter: { card: "summary_large_image" },
};

export default async function RootLayout({ children }) {
  const { jobs, settings } = await getSiteContent();
  return (
    <html className={`${displayLatin.variable} ${displayHindi.variable} ${body.variable}`} data-scroll-behavior="smooth" lang="en">
      <head>
        <noscript>
          <style>{"[data-hero-reveal] { opacity: 1 !important; } .faq-answer { height: auto !important; opacity: 1 !important; }"}</style>
        </noscript>
      </head>
      <body>
        <JsonLd data={websiteSchema()} />
        <JsonLd data={organizationSchema()} />
        <SiteDataProvider jobs={jobs} settings={settings}>
          <SiteShell>{children}</SiteShell>
        </SiteDataProvider>
      </body>
    </html>
  );
}
