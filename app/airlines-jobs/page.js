import JobsBrowser from "../components/JobsBrowser";
import JsonLd from "../components/JsonLd";
import { breadcrumbSchema } from "../lib/structuredData";
import { pageMetadata } from "../lib/site";

export const metadata = pageMetadata({
  title: "Airline jobs: pilots, cabin crew and engineers",
  description: "Sample airline job listings for flight crew, engineering and head-office staff, each with the qualification and experience employers usually ask for.",
  path: "/airlines-jobs",
});

export default function AirlinesJobsPage() {
  return (
    <>
      <JsonLd data={breadcrumbSchema("Airline jobs", "/airlines-jobs")} />
      <JobsBrowser audience="airline" />
    </>
  );
}
