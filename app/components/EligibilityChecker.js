"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { getOpenJobs, isEligible } from "../data/jobs";
import { useLanguage } from "../lib/language";
import { useJobs } from "../lib/siteData";
import { useIstToday } from "../lib/useIstToday";

export default function EligibilityChecker() {
  const { language, t } = useLanguage();
  const today = useIstToday();
  const jobs = useJobs();
  const [qualification, setQualification] = useState("");
  const [years, setYears] = useState("0");

  const matches = useMemo(() => {
    if (!qualification) return [];
    return getOpenJobs(today, jobs).filter((job) => isEligible(job, { qualification, years: Number(years) }));
  }, [jobs, qualification, today, years]);

  return (
    <section className="section checker-section">
      <div className="section-inner checker-layout">
        <div data-reveal>
          <h2>{t.checkerTitle}</h2>
          <p className="section-text">{t.checkerText}</p>
          <form className="checker-form" onSubmit={(event) => event.preventDefault()}>
            <label>
              {t.checkerQualification}
              <select onChange={(event) => setQualification(event.target.value)} value={qualification}>
                <option value="">{t.selectOption}</option>
                {t.qualificationOptions.map((option) => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </select>
            </label>
            <label>
              {t.checkerExperience}
              <select onChange={(event) => setYears(event.target.value)} value={years}>
                {t.yearsOptions.map((option) => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </select>
            </label>
          </form>
          <p className="field-note">{t.checkerNote}</p>
        </div>
        <div className="checker-results" data-reveal>
          <p aria-live="polite" className="checker-count">
            {!qualification ? t.checkerPrompt : matches.length > 0 ? t.checkerResult(matches.length) : t.checkerNone}
          </p>
          <ul>
            <AnimatePresence initial={false} mode="popLayout">
              {matches.map((job) => (
                <motion.li
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 12 }}
                  initial={{ opacity: 0, x: -12 }}
                  key={job.id}
                  layout
                  transition={{ duration: 0.2, ease: "easeOut" }}
                >
                  <Link href={`/jobs/${job.id}`}>
                    <strong>{job.title[language]}</strong>
                    <span>{job.location[language]}</span>
                  </Link>
                </motion.li>
              ))}
            </AnimatePresence>
          </ul>
        </div>
      </div>
    </section>
  );
}
