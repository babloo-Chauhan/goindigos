"use client";

import Link from "next/link";
import { getOpenJobs } from "../data/jobs";
import { useLanguage } from "../lib/language";
import { useRecentJobs } from "../lib/recentJobs";
import { useJobs } from "../lib/siteData";
import { useIstToday } from "../lib/useIstToday";

export default function RecentJobs() {
  const { language, t } = useLanguage();
  const recentIds = useRecentJobs();
  const today = useIstToday();
  const jobs = useJobs();
  const openJobs = getOpenJobs(today, jobs);
  const recentJobs = recentIds.map((id) => openJobs.find((job) => job.id === id)).filter(Boolean);
  if (recentJobs.length === 0) return null;

  return (
    <section aria-labelledby="recent-jobs-title" className="recent-jobs">
      <h2 id="recent-jobs-title">{t.recentTitle}</h2>
      <ul className="related-grid">
        {recentJobs.map((job) => (
          <li key={job.id}>
            <Link href={`/jobs/${job.id}`}>
              <strong>{job.title[language]}</strong>
              <span>{job.location[language]}</span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
