"use client";

import { startTransition, useActionState } from "react";
import Image from "next/image";
import { saveSettingsAction } from "../actions";

export default function SettingsForm({ settings }) {
  const [state, formAction, isPending] = useActionState(saveSettingsAction, {});
  const errors = state.errors ?? {};
  const current = state.settings ?? settings;

  // Calling the action directly keeps what was typed when the server rejects a field. A form action would clear it.
  function handleSubmit(event) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    startTransition(() => formAction(formData));
  }

  return (
    <form className="admin-form" key={state.savedAt ?? "initial"} onSubmit={handleSubmit}>
      <fieldset>
        <legend>Logo</legend>
        <div className="admin-logo-preview">
          {current.logo ? (
            <Image alt="Current logo" height={58} src={current.logo} unoptimized width={112} />
          ) : (
            <p>No logo. The site shows its name instead.</p>
          )}
        </div>
        <label>
          Upload a new logo
          <input accept="image/png,image/jpeg,image/webp" name="logo" type="file" />
          <span className="admin-hint">PNG, JPG or WebP, up to 2 MB.</span>
          {errors.logo && <span className="admin-error">{errors.logo}</span>}
        </label>
        <p className="admin-hint">
          Use a logo you own or have written permission to use. Do not use an airline&rsquo;s logo or one that looks like it, because job seekers could mistake this site for that airline.
        </p>
        {current.logo && (
          <label className="admin-check">
            <input name="removeLogo" type="checkbox" />
            Remove the logo and show the site name
          </label>
        )}
      </fieldset>

      <fieldset>
        <legend>Contact details</legend>
        <p className="admin-hint">Shown in the footer and on the contact page. Leave a field empty to hide it.</p>
        <label>
          Public email
          <input defaultValue={current.email} name="email" type="email" />
          {errors.email && <span className="admin-error">{errors.email}</span>}
        </label>
        <label>
          Public phone
          <input defaultValue={current.phone} name="phone" type="tel" />
          {errors.phone && <span className="admin-error">{errors.phone}</span>}
        </label>
        <label>
          Contact form link
          <input defaultValue={current.contactFormUrl} name="contactFormUrl" placeholder="https://" type="url" />
          <span className="admin-hint">Optional link to an outside form, such as a Google Form. The site&rsquo;s own form at /contact stays available.</span>
          {errors.contactFormUrl && <span className="admin-error">{errors.contactFormUrl}</span>}
        </label>
      </fieldset>

      {state.error && <p className="admin-error" role="alert">{state.error}</p>}
      {state.savedAt && <p className="admin-notice" role="status">Settings saved.</p>}
      <div className="admin-actions">
        <button className="admin-button" disabled={isPending} type="submit">{isPending ? "Saving..." : "Save settings"}</button>
      </div>
    </form>
  );
}
