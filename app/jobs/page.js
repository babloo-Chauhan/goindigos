import JobsBrowser from "../components/JobsBrowser";
import JsonLd from "../components/JsonLd";
import { breadcrumbSchema } from "../lib/structuredData";
import { pageMetadata } from "../lib/site";

export const metadata = pageMetadata({
  title: "Find aviation jobs",
  description: "Search sample aviation job listings by role, department or city, with the qualification and eligibility for each cabin crew, pilot and airport role.",
  path: "/jobs",
});

export default function JobsPage() {
  return (
    <>
      <JsonLd data={breadcrumbSchema("Find aviation jobs", "/jobs")} />
      <JobsBrowser />
    </>
  );
}
