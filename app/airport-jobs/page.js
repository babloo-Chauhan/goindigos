import JobsBrowser from "../components/JobsBrowser";
import JsonLd from "../components/JsonLd";
import { breadcrumbSchema } from "../lib/structuredData";
import { pageMetadata } from "../lib/site";

export const metadata = pageMetadata({
  title: "Airport jobs: ground staff, security and cargo",
  description: "Sample airport job listings for terminal, security, cargo and systems staff, each with the qualification and experience employers usually ask for.",
  path: "/airport-jobs",
});

export default function AirportJobsPage() {
  return (
    <>
      <JsonLd data={breadcrumbSchema("Airport jobs", "/airport-jobs")} />
      <JobsBrowser audience="airport" />
    </>
  );
}
