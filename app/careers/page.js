import { CareersContent } from "../components/InfoPages";
import JsonLd from "../components/JsonLd";
import { copy } from "../data/copy";
import { breadcrumbSchema, faqSchema } from "../lib/structuredData";
import { pageMetadata } from "../lib/site";

export const metadata = pageMetadata({
  title: "Aviation careers: roles, eligibility and hiring",
  description: "What each aviation role involves, which qualifications employers usually ask for, how hiring works, and how to spot a fake aviation job offer.",
  path: "/careers",
});

export default function CareersPage() {
  return (
    <>
      <JsonLd data={breadcrumbSchema("Aviation careers", "/careers")} />
      <JsonLd data={faqSchema(copy.en.faqs)} />
      <CareersContent />
    </>
  );
}
