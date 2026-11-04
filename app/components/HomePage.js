"use client";

import { useMemo, useRef, useState } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { EMPTY_FILTERS, getOpenJobs } from "../data/jobs";
import { useLanguage } from "../lib/language";
import { useHeroEntrance } from "../lib/pageMotion";
import { useJobs } from "../lib/siteData";
import { useIstToday } from "../lib/useIstToday";
import DepartureBoard from "./DepartureBoard";
import EligibilityChecker from "./EligibilityChecker";
import FaqSection from "./FaqSection";
import IndigoGallery from "./IndigoGallery";
import JobList from "./JobsSection";
import RevealScope from "./RevealScope";
import SearchPanel from "./SearchPanel";
import StatsBand from "./StatsBand";
import TeamFeature from "./TeamFeature";
import { CareerPaths, CategoryGrid, EligibilityGuide, FeaturedRoles, JobSearchCta, ProcessRoute, WhyChoose } from "./sections";

const AviationScene = dynamic(() => import("../AviationScene"), { ssr: false });

const LATEST_JOB_COUNT = 4;
const GUIDE_PREVIEW_COUNT = 4;

function HeroSection() {
  const { t } = useLanguage();
  const router = useRouter();
  const heroRef = useRef(null);
  const [filters, setFilters] = useState(EMPTY_FILTERS);
  useHeroEntrance(heroRef);

  function handleSearch() {
    const params = new URLSearchParams();
    if (filters.query.trim()) params.set("q", filters.query.trim());
    if (filters.category) params.set("category", filters.category);
    if (filters.location.trim()) params.set("location", filters.location.trim());
    const queryString = params.toString();
    router.push(queryString ? `/jobs?${queryString}` : "/jobs");
  }

  return (
    <section className="hero" ref={heroRef}>
      <div aria-hidden="true" className="hero-stars" />
      <AviationScene />
      <div className="hero-inner">
        <h1 data-hero-reveal>
          {t.heroBrand}
          <span>{t.heroTagline}</span>
        </h1>
        <p className="hero-text" data-hero-reveal>{t.heroText}</p>
        <div className="hero-actions" data-hero-reveal>
          <Link className="button button-signal" href="/jobs">{t.heroJobs}</Link>
          <Link className="button button-ghost" href="/careers">{t.heroCareers}</Link>
        </div>
        <SearchPanel
          data-hero-reveal
          filters={filters}
          onChange={(key, value) => setFilters((current) => ({ ...current, [key]: value }))}
          onSubmit={handleSearch}
        />
      </div>
    </section>
  );
}

export default function HomePage() {
  const { language, t } = useLanguage();
  const today = useIstToday();
  const jobs = useJobs();
  const openJobs = useMemo(() => getOpenJobs(today, jobs), [jobs, today]);
  const latestJobs = openJobs.slice(0, LATEST_JOB_COUNT);

  return (
    <>
      <HeroSection />
      <StatsBand jobs={openJobs} />
      <RevealScope>
        <TeamFeature />
        <IndigoGallery />
        <CareerPaths />
        <CategoryGrid jobs={openJobs} />
        <section className="latest-band">
          <div className="section-inner latest-layout">
            <div data-reveal>
              <h2>{t.jobsTitle}</h2>
              <p>{t.jobsNote}</p>
              <Link className="button button-signal" href="/jobs">{t.viewAllJobs}</Link>
            </div>
            <DepartureBoard jobs={openJobs} language={language} t={t} />
          </div>
        </section>
        <section className="section jobs-section latest-list">
          <div className="section-inner">
            <JobList jobs={latestJobs} />
          </div>
        </section>
        <FeaturedRoles jobs={openJobs} />
        <EligibilityChecker />
        <EligibilityGuide limit={GUIDE_PREVIEW_COUNT} />
        <WhyChoose />
        <ProcessRoute />
        <FaqSection />
        <JobSearchCta />
      </RevealScope>
    </>
  );
}
