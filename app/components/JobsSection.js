"use client";

import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { MapPin } from "lucide-react";
import { categories, formatClosingDate } from "../data/jobs";
import { useLanguage } from "../lib/language";
import ApplyButton from "./ApplyButton";
import { CompareButton } from "./CompareControls";
import SaveButton from "./SaveButton";

function JobPass({ job, ref }) {
  const { language, t } = useLanguage();
  const categoryName = categories.find((item) => item.id === job.category)?.[language];
  const title = job.title[language];

  return (
    <motion.li
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.98 }}
      initial={{ opacity: 0, scale: 0.98 }}
      layout
      ref={ref}
      transition={{ duration: 0.2, ease: "easeOut" }}
    >
      <article className="job-pass" data-reveal>
        <div className="pass-main">
          <p className="pass-tags">
            <span>{categoryName}</span>
            <span className="sample-tag">{t.sampleTag}</span>
          </p>
          <h3><Link aria-label={t.detailsFor(title)} href={`/jobs/${job.id}`}>{title}</Link></h3>
          <p className="pass-company">
            <span className="visually-hidden">{t.company}: </span>{job.company[language]}
          </p>
          <dl className="pass-details">
            <div>
              <dt>{t.location}</dt>
              <dd><MapPin aria-hidden="true" size={15} /> {job.location[language]}</dd>
            </div>
            <div>
              <dt>{t.qualification}</dt>
              <dd>{job.qualification[language]}</dd>
            </div>
            <div>
              <dt>{t.eligibility}</dt>
              <dd>{job.eligibility[language]}</dd>
            </div>
            <div>
              <dt>{t.employmentType}</dt>
              <dd>{t.employment[job.employment]}</dd>
            </div>
          </dl>
        </div>
        <div className="pass-stub">
          <div className="stub-top">
            <p>
              <span>{t.closes}</span>
              <strong>{formatClosingDate(job.expiresAt, language)}</strong>
            </p>
            <div className="stub-icons">
              <CompareButton job={job} />
              <SaveButton job={job} />
            </div>
          </div>
          <ApplyButton job={job} />
        </div>
      </article>
    </motion.li>
  );
}

export default function JobList({ clearLabel, emptyHelp, emptyTitle, jobs, layout = "list", onClearSearch }) {
  const { t } = useLanguage();

  return (
    <>
      <ul className="job-list" data-layout={layout}>
        <AnimatePresence initial={false} mode="popLayout">
          {jobs.map((job) => <JobPass job={job} key={job.id} />)}
        </AnimatePresence>
      </ul>
      {jobs.length === 0 && (
        <div className="empty-state">
          <h3>{emptyTitle ?? t.noJobs}</h3>
          <p>{emptyHelp ?? t.noJobsHelp}</p>
          {onClearSearch && (
            <button className="button button-navy" onClick={onClearSearch} type="button">{clearLabel ?? t.clearSearch}</button>
          )}
        </div>
      )}
    </>
  );
}
