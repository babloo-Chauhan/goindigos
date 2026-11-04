import { Suspense } from "react";
import { requireAdmin } from "../../../lib/adminSession";
import { createJobAction } from "../../actions";
import AdminFrame from "../../components/AdminFrame";
import JobForm from "../../components/JobForm";

export const metadata = { title: "Add a job" };

async function NewJobContent() {
  await requireAdmin();
  return <JobForm action={createJobAction} submitLabel="Add job" />;
}

export default function NewJobPage() {
  return (
    <AdminFrame title="Add a job">
      <Suspense fallback={<p>Loading...</p>}>
        <NewJobContent />
      </Suspense>
    </AdminFrame>
  );
}
