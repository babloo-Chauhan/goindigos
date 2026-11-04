"use client";

import { useEffect } from "react";
import Link from "next/link";
import { Link2 } from "lucide-react";
import { categories, formatClosingDate, getOpenJobs, getRelatedJobs } from "../data/jobs";
import { useLanguage } from "../lib/language";
import { recordRecentJob } from "../lib/recentJobs";
import { SITE_NAME } from "../lib/site";
import { useJobs } from "../lib/siteData";
import { showToast } from "../lib/toast";
import { useIstToday } from "../lib/useIstToday";
import ApplyButton from "./ApplyButton";
import { CompareButton } from "./CompareControls";
import JobEligibilityCheck from "./JobEligibilityCheck";
import PageHeader from "./PageHeader";
import SaveButton from "./SaveButton";

export default function JobDetail({ job }) {
  const { language, t } = useLanguage();
  const today = useIstToday();
  const jobs = useJobs();
  const guide = t.guides.find((item) => item.category === job.category);
  const categoryName = categories.find((item) => item.id === job.category)?.[language];
  const isClosed = Boolean(today) && job.expiresAt < today;
  const title = job.title[language];
  const relatedJobs = getRelatedJobs(job, getOpenJobs(today, jobs));

  useEffect(() => {
    document.title = `${title} | ${SITE_NAME}`;
  }, [title]);

  useEffect(() => {
    recordRecentJob(job.id);
  }, [job.id]);

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(window.location.href);
      showToast(t.linkCopied);
    } catch {
      showToast(t.linkCopyFailed);
    }
  }

  const details = [
    [t.company, job.company[language]],
    [t.location, job.location[language]],
    [t.qualification, job.qualification[language]],
    [t.eligibility, job.eligibility[language]],
    [t.employmentType, t.employment[job.employment]],
    [t.closes, formatClosingDate(job.expiresAt, language)],
  ];

  return (
    <>
      <PageHeader
        eyebrow={<>{categoryName} <span className="sample-tag">{t.sampleTag}</span></>}
        photo="/images/hero-runway.jpg"
        text={job.company[language]}
        title={title}
      />
      <section className="section">
        <div className="section-inner detail-layout">
          <div>
            <h2>{t.aboutRole}</h2>
            <p className="section-text">{job.summary[language]}</p>
            <h3 className="detail-subheading">{t.typicalNeeds}</h3>
            <p className="section-text">{guide.needs}</p>
            <p className="field-note">{t.guideNote}</p>
            <JobEligibilityCheck job={job} />
            <Link className="text-link" href="/jobs">{t.backToJobs}</Link>
          </div>
          <aside className="detail-card">
            <dl>
              {details.map(([label, value]) => (
                <div key={label}>
                  <dt>{label}</dt>
                  <dd>{value}</dd>
                </div>
              ))}
            </dl>
            {isClosed ? <p role="status">{t.jobClosed}</p> : <ApplyButton job={job} />}
            <div className="detail-actions">
              <SaveButton job={job} />
              <CompareButton job={job} />
              <button className="copy-link" onClick={copyLink} type="button">
                <Link2 aria-hidden="true" size={18} /> {t.copyLink}
              </button>
            </div>
            <p className="field-note">{t.jobsNote}</p>
          </aside>
        </div>
      </section>
      {relatedJobs.length > 0 && (
        <section className="section related-section">
          <div className="section-inner">
            <h2>{t.relatedJobs}</h2>
            <ul className="related-grid">
              {relatedJobs.map((item) => (
                <li key={item.id}>
                  <Link href={`/jobs/${item.id}`}>
                    <strong>{item.title[language]}</strong>
                    <span>{item.company[language]}</span>
                    <span>{item.location[language]}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </section>
      )}
    </>
  );
}
