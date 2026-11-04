"use client";

import Link from "next/link";
import { X } from "lucide-react";
import { categories, formatClosingDate, getJob } from "../data/jobs";
import { useCompareJobs } from "../lib/compareJobs";
import { useLanguage } from "../lib/language";
import { useJobs } from "../lib/siteData";
import PageHeader from "./PageHeader";

export default function CompareJobs() {
  const { language, t } = useLanguage();
  const { compareIds, toggleCompare } = useCompareJobs();
  const jobs = useJobs();
  const compared = compareIds.map((id) => getJob(id, jobs)).filter(Boolean);

  const rows = [
    [t.company, (job) => job.company[language]],
    [t.fieldCategory, (job) => categories.find((item) => item.id === job.category)?.[language]],
    [t.location, (job) => job.location[language]],
    [t.qualification, (job) => job.qualification[language]],
    [t.eligibility, (job) => job.eligibility[language]],
    [t.employmentType, (job) => t.employment[job.employment]],
    [t.closes, (job) => formatClosingDate(job.expiresAt, language)],
  ];

  return (
    <>
      <PageHeader photo="/images/hero-runway.jpg" text={t.compareText} title={t.compareTitle} />
      <section className="section">
        <div className="section-inner">
          {compared.length === 0 ? (
            <div className="empty-state compare-empty">
              <h2>{t.compareEmpty}</h2>
              <p>{t.compareEmptyHelp}</p>
              <Link className="button button-navy" href="/jobs">{t.compareBrowse}</Link>
            </div>
          ) : (
            <div className="compare-scroll" role="region" aria-label={t.compareTitle} tabIndex={0}>
              <table className="compare-table">
                <thead>
                  <tr>
                    <td />
                    {compared.map((job) => (
                      <th key={job.id} scope="col">
                        <Link href={`/jobs/${job.id}`}>{job.title[language]}</Link>
                        <span className="sample-tag">{t.sampleTag}</span>
                        <button
                          aria-label={t.compareRemove(job.title[language])}
                          className="compare-clear"
                          onClick={() => toggleCompare(job.id)}
                          type="button"
                        >
                          <X aria-hidden="true" size={16} />
                        </button>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {rows.map(([label, getValue]) => (
                    <tr key={label}>
                      <th scope="row">{label}</th>
                      {compared.map((job) => <td key={job.id}>{getValue(job)}</td>)}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </section>
    </>
  );
}
