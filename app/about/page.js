import { AboutContent } from "../components/InfoPages";
import JsonLd from "../components/JsonLd";
import { breadcrumbSchema } from "../lib/structuredData";
import { pageMetadata } from "../lib/site";

export const metadata = pageMetadata({
  title: "About us",
  description: "AeroCareer Hub is an independent aviation careers guide. It is not an airline or an official recruiter, and its job listings are samples for now.",
  path: "/about",
});

export default function AboutPage() {
  return (
    <>
      <JsonLd data={breadcrumbSchema("About us", "/about")} />
      <AboutContent />
    </>
  );
}
