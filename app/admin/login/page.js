import { Suspense } from "react";
import { redirect } from "next/navigation";
import { isAdminConfigured } from "../../lib/adminAuth";
import { isAdminSignedIn } from "../../lib/adminSession";
import LoginForm from "../components/LoginForm";

export const metadata = { title: "Sign in" };

async function LoginContent() {
  if (await isAdminSignedIn()) redirect("/admin");
  if (!isAdminConfigured()) {
    return (
      <p className="admin-error" role="alert">
        Admin sign-in is not set up on this server yet. The README explains how.
      </p>
    );
  }
  return <LoginForm />;
}

export default function LoginPage() {
  return (
    <div className="admin-login">
      <div className="admin-card">
        <h1>AeroCareer Hub admin</h1>
        <Suspense fallback={<p>Loading...</p>}>
          <LoginContent />
        </Suspense>
      </div>
    </div>
  );
}
