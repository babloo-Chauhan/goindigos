import { Suspense } from "react";
import { notFound } from "next/navigation";
import JobDetail from "../../components/JobDetail";
import { getJob, jobs as sampleJobs } from "../../data/jobs";
import { getSiteContent } from "../../lib/siteContent";

/** Pages for jobs added later render on the server. The background upgrade would fail on the URL read in the root layout. */
export const instant = false;

/** Uses the samples, which never run out, because an empty list fails the build. Saved jobs render on first visit. */
export function generateStaticParams() {
  return sampleJobs.map((job) => ({ id: job.id }));
}

export async function generateMetadata({ params }) {
  const { id } = await params;
  const { jobs } = await getSiteContent();
  const job = getJob(id, jobs);
  // Listings are samples, so they stay out of search results rather than appear as real vacancies.
  return job ? { title: job.title.en, description: job.summary.en, robots: { index: false, follow: true } } : {};
}

async function JobContent({ params }) {
  const { id } = await params;
  const { jobs } = await getSiteContent();
  const job = getJob(id, jobs);
  if (!job) notFound();
  return <JobDetail job={job} />;
}

export default function JobPage({ params }) {
  return (
    <Suspense fallback={null}>
      <JobContent params={params} />
    </Suspense>
  );
}
