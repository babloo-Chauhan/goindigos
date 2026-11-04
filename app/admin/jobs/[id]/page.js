import { Suspense } from "react";
import { notFound } from "next/navigation";
import { getJob } from "../../../data/jobs";
import { requireAdmin } from "../../../lib/adminSession";
import { readJobs } from "../../../lib/contentStore";
import { updateJobAction } from "../../actions";
import AdminFrame from "../../components/AdminFrame";
import JobForm from "../../components/JobForm";

export const metadata = { title: "Edit job" };

/** A private page with no paths to build ahead of time, so it renders on each request. */
export const instant = false;

async function EditJobContent({ params }) {
  await requireAdmin();
  const { id } = await params;
  const job = getJob(id, await readJobs());
  if (!job) notFound();
  return <JobForm action={updateJobAction.bind(null, id)} job={job} submitLabel="Save job" />;
}

export default function EditJobPage({ params }) {
  return (
    <AdminFrame title="Edit job">
      <Suspense fallback={<p>Loading...</p>}>
        <EditJobContent params={params} />
      </Suspense>
    </AdminFrame>
  );
}
