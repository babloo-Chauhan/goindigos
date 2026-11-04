import { Suspense } from "react";
import { requireAdmin } from "../../lib/adminSession";
import { readSettings } from "../../lib/contentStore";
import AdminFrame from "../components/AdminFrame";
import SettingsForm from "../components/SettingsForm";

export const metadata = { title: "Website settings" };

async function SettingsContent() {
  await requireAdmin();
  return <SettingsForm settings={await readSettings()} />;
}

export default function AdminSettingsPage() {
  return (
    <AdminFrame title="Website settings">
      <Suspense fallback={<p>Loading...</p>}>
        <SettingsContent />
      </Suspense>
    </AdminFrame>
  );
}
