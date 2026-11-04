"use client";

import { startTransition, useActionState } from "react";
import Link from "next/link";
import { copy } from "../../data/copy";
import { categories, getJobRequirements } from "../../data/jobs";

function FieldError({ message, id }) {
  return message ? <span className="admin-error" id={id}>{message}</span> : null;
}

function TextPair({ errors, job, label, maxLength, multiline, name }) {
  const Control = multiline ? "textarea" : "input";
  return (
    <div className="admin-pair">
      <label>
        {label} (English)
        <Control
          aria-describedby={errors[`${name}_en`] ? `${name}_en-error` : undefined}
          aria-invalid={Boolean(errors[`${name}_en`])}
          defaultValue={job?.[name].en}
          maxLength={maxLength}
          name={`${name}_en`}
          required
          rows={multiline ? 4 : undefined}
        />
        <FieldError id={`${name}_en-error`} message={errors[`${name}_en`]} />
      </label>
      <label lang="hi">
        {label} (Hindi, optional)
        <Control
          aria-describedby={errors[`${name}_hi`] ? `${name}_hi-error` : undefined}
          aria-invalid={Boolean(errors[`${name}_hi`])}
          defaultValue={job && job[name].hi !== job[name].en ? job[name].hi : ""}
          maxLength={maxLength}
          name={`${name}_hi`}
          rows={multiline ? 4 : undefined}
        />
        <FieldError id={`${name}_hi-error`} message={errors[`${name}_hi`]} />
      </label>
    </div>
  );
}

function Select({ defaultValue, error, label, name, options }) {
  return (
    <label>
      {label}
      <select defaultValue={defaultValue} name={name} required>
        {options.map(([value, text]) => <option key={value} value={value}>{text}</option>)}
      </select>
      <FieldError id={`${name}-error`} message={error} />
    </label>
  );
}

export default function JobForm({ action, job, submitLabel }) {
  const [state, formAction, isPending] = useActionState(action, {});
  const errors = state.errors ?? {};
  const requirements = job ? getJobRequirements(job) : { accepts: [], minYears: 0 };

  // Calling the action directly keeps what was typed when the server rejects a field. A form action would clear it.
  function handleSubmit(event) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    startTransition(() => formAction(formData));
  }

  return (
    <form className="admin-form admin-form-wide" onSubmit={handleSubmit}>
      <p className="admin-hint">Every listing appears on the public site with a &ldquo;Sample&rdquo; tag and stays out of search results.</p>

      <fieldset>
        <legend>Role</legend>
        <TextPair errors={errors} job={job} label="Job title" maxLength={120} name="title" />
        <TextPair errors={errors} job={job} label="Company" maxLength={120} name="company" />
        <TextPair errors={errors} job={job} label="Location" maxLength={120} name="location" />
        <TextPair errors={errors} job={job} label="Summary" maxLength={1000} multiline name="summary" />
      </fieldset>

      <fieldset>
        <legend>Listing</legend>
        <div className="admin-grid">
          <Select
            defaultValue={job?.audience ?? "airline"}
            error={errors.audience}
            label="Shown under"
            name="audience"
            options={[["airline", "Airline jobs"], ["airport", "Airport jobs"]]}
          />
          <Select
            defaultValue={job?.category ?? categories[0].id}
            error={errors.category}
            label="Category"
            name="category"
            options={categories.map((item) => [item.id, item.en])}
          />
          <Select
            defaultValue={job?.employment ?? "fullTime"}
            error={errors.employment}
            label="Employment type"
            name="employment"
            options={[["fullTime", "Full time"], ["contract", "Contract"]]}
          />
          <label>
            Closing date
            <input defaultValue={job?.expiresAt} name="expiresAt" required type="date" />
            <FieldError id="expiresAt-error" message={errors.expiresAt} />
          </label>
        </div>
        <label className="admin-check">
          <input defaultChecked={Boolean(job?.featured)} name="featured" type="checkbox" />
          Feature on the home page
        </label>
      </fieldset>

      <fieldset>
        <legend>Eligibility</legend>
        <TextPair errors={errors} job={job} label="Qualification" maxLength={160} name="qualification" />
        <TextPair errors={errors} job={job} label="Eligibility" maxLength={160} name="eligibility" />
        <div role="group" aria-labelledby="accepts-label">
          <p className="admin-group-label" id="accepts-label">Qualifications accepted by the eligibility checker</p>
          <div className="admin-checks">
            {copy.en.qualificationOptions.map((option) => (
              <label className="admin-check" key={option.value}>
                <input defaultChecked={requirements.accepts.includes(option.value)} name="accepts" type="checkbox" value={option.value} />
                {option.label}
              </label>
            ))}
          </div>
          <FieldError id="accepts-error" message={errors.accepts} />
        </div>
        <label className="admin-narrow">
          Minimum years of experience
          <input defaultValue={requirements.minYears} max={40} min={0} name="minYears" required type="number" />
          <FieldError id="minYears-error" message={errors.minYears} />
        </label>
      </fieldset>

      {state.error && <p className="admin-error" role="alert">{state.error}</p>}
      {state.errors && <p className="admin-error" role="alert">Fix the marked fields, then save again.</p>}
      <div className="admin-actions">
        <button className="admin-button" disabled={isPending} type="submit">{isPending ? "Saving..." : submitLabel}</button>
        <Link className="admin-button admin-button-quiet" href="/admin/jobs">Cancel</Link>
      </div>
    </form>
  );
}
