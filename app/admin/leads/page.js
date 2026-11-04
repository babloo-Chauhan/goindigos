import { Suspense } from "react";
import { requireAdmin } from "../../lib/adminSession";
import { MAX_LEADS_SHOWN, readLeads } from "../../lib/contentStore";
import { deleteLeadAction, setLeadHandledAction } from "../actions";
import AdminFrame from "../components/AdminFrame";
import DeleteButton from "../components/DeleteButton";

export const metadata = { title: "Contact leads" };

const NOTICES = {
  updated: "Lead updated.",
  deleted: "Lead deleted.",
  failed: "Could not update the lead. Try again.",
};

const dateFormat = new Intl.DateTimeFormat("en-IN", { dateStyle: "medium", timeStyle: "short", timeZone: "Asia/Kolkata" });

/** The address comes from a public form, so it is encoded to stop it adding its own mail fields such as bcc. */
function mailtoLink(email) {
  return `mailto:${encodeURIComponent(email).replace("%40", "@")}`;
}

function LeadCard({ lead }) {
  return (
    <li className="admin-lead" data-handled={lead.handled}>
      <div className="admin-lead-head">
        <div>
          <h2>{lead.name}</h2>
          <a href={mailtoLink(lead.email)}>{lead.email}</a>
        </div>
        <div className="admin-lead-meta">
          <span className="admin-pill" data-new={!lead.handled}>{lead.handled ? "Handled" : "New"}</span>
          <time dateTime={lead.createdAt}>{dateFormat.format(new Date(lead.createdAt))}</time>
        </div>
      </div>
      <p className="admin-lead-message">{lead.message}</p>
      <div className="admin-row-actions">
        <form action={setLeadHandledAction.bind(null, lead.id, !lead.handled)}>
          <button type="submit">{lead.handled ? "Mark as new" : "Mark as handled"}</button>
        </form>
        <DeleteButton action={deleteLeadAction.bind(null, lead.id)} title={`the message from ${lead.name}`} />
      </div>
    </li>
  );
}

async function LeadsContent({ searchParams }) {
  await requireAdmin();
  const { notice } = await searchParams;
  const { leads, total } = await readLeads();

  return (
    <>
      {Object.hasOwn(NOTICES, notice ?? "") && <p className="admin-notice" role="status">{NOTICES[notice]}</p>}
      {total > MAX_LEADS_SHOWN && <p className="admin-hint">Showing the newest {MAX_LEADS_SHOWN} of {total} leads.</p>}
      {leads.length === 0 ? (
        <p className="admin-card">No contact leads yet. Messages sent through the contact form will appear here.</p>
      ) : (
        <ul className="admin-leads">
          {leads.map((lead) => <LeadCard key={lead.id} lead={lead} />)}
        </ul>
      )}
    </>
  );
}

export default function AdminLeadsPage({ searchParams }) {
  return (
    <AdminFrame title="Contact leads">
      <Suspense fallback={<p>Loading...</p>}>
        <LeadsContent searchParams={searchParams} />
      </Suspense>
    </AdminFrame>
  );
}
