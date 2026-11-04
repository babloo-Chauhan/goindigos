import { Suspense } from "react";
import Link from "next/link";
import { categories, formatClosingDate, sortJobs } from "../../data/jobs";
import { requireAdmin } from "../../lib/adminSession";
import { readJobs } from "../../lib/contentStore";
import { deleteJobAction } from "../actions";
import AdminFrame from "../components/AdminFrame";
import DeleteButton from "../components/DeleteButton";
import { istToday } from "../components/istToday";

export const metadata = { title: "Job listings" };

const NOTICES = {
  created: "Job added.",
  updated: "Job saved.",
  deleted: "Job deleted.",
  "already-deleted": "That job was already deleted.",
  "delete-failed": "Could not delete the job. Try again.",
};

async function JobsContent({ searchParams }) {
  await requireAdmin();
  const { notice } = await searchParams;
  const jobs = sortJobs(await readJobs(), "closing");
  const today = istToday();

  return (
    <>
      {Object.hasOwn(NOTICES, notice ?? "") && <p className="admin-notice" role="status">{NOTICES[notice]}</p>}
      <div className="admin-actions">
        <Link className="admin-button" href="/admin/jobs/new">Add a job</Link>
      </div>
      {jobs.length === 0 ? (
        <p className="admin-card">No job listings yet.</p>
      ) : (
        <div className="admin-table-scroll" role="region" aria-label="Job listings" tabIndex={0}>
          <table className="admin-table">
            <thead>
              <tr>
                <th scope="col">Job</th>
                <th scope="col">Category</th>
                <th scope="col">Location</th>
                <th scope="col">Closes</th>
                <th scope="col">Status</th>
                <th scope="col"><span className="sr-only">Actions</span></th>
              </tr>
            </thead>
            <tbody>
              {jobs.map((job) => (
                <tr key={job.id}>
                  <th scope="row">
                    {job.title.en}
                    <span>{job.company.en}</span>
                  </th>
                  <td>{categories.find((item) => item.id === job.category)?.en}</td>
                  <td>{job.location.en}</td>
                  <td>{formatClosingDate(job.expiresAt, "en")}</td>
                  <td>
                    <span className="admin-pill" data-closed={job.expiresAt < today}>{job.expiresAt < today ? "Closed" : "Open"}</span>
                    {job.featured && <span className="admin-pill">Featured</span>}
                  </td>
                  <td className="admin-row-actions">
                    <Link aria-label={`Edit ${job.title.en}`} href={`/admin/jobs/${job.id}`}>Edit</Link>
                    <DeleteButton action={deleteJobAction.bind(null, job.id)} title={job.title.en} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}

export default function AdminJobsPage({ searchParams }) {
  return (
    <AdminFrame title="Job listings">
      <Suspense fallback={<p>Loading...</p>}>
        <JobsContent searchParams={searchParams} />
      </Suspense>
    </AdminFrame>
  );
}
