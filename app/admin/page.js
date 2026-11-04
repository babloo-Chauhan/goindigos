import { Suspense } from "react";
import Link from "next/link";
import { getOpenJobs } from "../data/jobs";
import { requireAdmin } from "../lib/adminSession";
import { readJobs, readLeads, readSettings } from "../lib/contentStore";
import AdminFrame from "./components/AdminFrame";
import { istToday } from "./components/istToday";

export const metadata = { title: "Overview" };

async function OverviewContent() {
  await requireAdmin();
  const [jobs, settings, { newCount }] = await Promise.all([readJobs(), readSettings(), readLeads(1)]);
  const open = getOpenJobs(istToday(), jobs).length;

  return (
    <>
      <dl className="admin-stats">
        <div><dt>New contact leads</dt><dd>{newCount}</dd></div>
        <div><dt>Open listings</dt><dd>{open}</dd></div>
        <div><dt>Closed listings</dt><dd>{jobs.length - open}</dd></div>
        <div><dt>Public email</dt><dd className="admin-stat-text">{settings.email || "Not set"}</dd></div>
        <div><dt>Public phone</dt><dd className="admin-stat-text">{settings.phone || "Not set"}</dd></div>
      </dl>
      <div className="admin-actions">
        <Link className="admin-button" href="/admin/leads">View contact leads</Link>
        <Link className="admin-button admin-button-quiet" href="/admin/jobs/new">Add a job</Link>
        <Link className="admin-button admin-button-quiet" href="/admin/settings">Edit website settings</Link>
      </div>
    </>
  );
}

export default function AdminOverviewPage() {
  return (
    <AdminFrame title="Overview">
      <Suspense fallback={<p>Loading...</p>}>
        <OverviewContent />
      </Suspense>
    </AdminFrame>
  );
}
