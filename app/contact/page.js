import { ContactContent } from "../components/InfoPages";
import JsonLd from "../components/JsonLd";
import { breadcrumbSchema } from "../lib/structuredData";
import { pageMetadata } from "../lib/site";

export const metadata = pageMetadata({
  title: "Contact us",
  description: "Questions about an aviation role or the AeroCareer Hub website, plus common answers.",
  path: "/contact",
});

export default function ContactPage() {
  return (
    <>
      <JsonLd data={breadcrumbSchema("Contact us", "/contact")} />
      <ContactContent />
    </>
  );
}
