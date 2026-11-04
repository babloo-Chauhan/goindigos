"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion, useScroll, useTransform } from "framer-motion";
import { Check, Plane } from "lucide-react";
import { categories, formatClosingDate } from "../data/jobs";
import { useLanguage } from "../lib/language";
import { liftElement, trackPointer } from "../lib/pageMotion";

const LIFT_DISTANCE = -4;
const PATH_IMAGES = {
  pilots: "/images/career-cockpit.jpg",
  "cabin-crew": "/images/career-wing.jpg",
  "ground-staff": "/images/hero-runway.jpg",
};

export function CategoryGrid({ jobs }) {
  const { language, t } = useLanguage();

  return (
    <section className="section">
      <div className="section-inner">
        <h2 data-reveal>{t.categoriesTitle}</h2>
        <div className="category-grid">
          {categories.map(({ id, icon: Icon, ...names }) => (
            <Link
              className="category-sign"
              data-reveal
              href={`/jobs?category=${id}`}
              key={id}
              onPointerEnter={(event) => liftElement(event.currentTarget.querySelector(".sign-icon"), LIFT_DISTANCE)}
              onPointerLeave={(event) => liftElement(event.currentTarget.querySelector(".sign-icon"), 0)}
            >
              <span className="sign-icon"><Icon aria-hidden="true" size={24} /></span>
              <span className="sign-name">{names[language]}</span>
              <span className="sign-count">{t.roles(jobs.filter((job) => job.category === id).length)}</span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}

export function CareerPaths() {
  const { t } = useLanguage();

  return (
    <section className="section">
      <div className="section-inner">
        <h2 data-reveal>{t.pathsTitle}</h2>
        <p className="section-text" data-reveal>{t.pathsText}</p>
        <div className="paths-grid">
          {t.paths.map((path) => (
            <Link className="path-card" data-reveal href={`/jobs?category=${path.category}`} key={path.category}>
              <Image alt="" fill loading="eager" sizes="(max-width: 960px) 100vw, 33vw" src={PATH_IMAGES[path.category]} />
              <span className="path-copy">
                <strong>{path.title}</strong>
                <span>{path.text}</span>
              </span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}

export function FeaturedRoles({ jobs }) {
  const { language, t } = useLanguage();
  const featured = jobs.filter((job) => job.featured);
  if (featured.length === 0) return null;

  return (
    <section className="section">
      <div className="section-inner">
        <h2 data-reveal>{t.featuredTitle}</h2>
        <p className="section-text" data-reveal>{t.featuredText}</p>
        <div className="featured-grid">
          {featured.map((job) => (
            <article className="featured-card" data-reveal key={job.id} onPointerMove={trackPointer}>
              <p className="featured-city">{job.location[language]}</p>
              <h3>{job.title[language]}</h3>
              <p>{job.summary[language]}</p>
              <p className="featured-closes">{t.closes}: {formatClosingDate(job.expiresAt, language)}</p>
              <Link aria-label={t.detailsFor(job.title[language])} className="button button-light" href={`/jobs/${job.id}`}>
                {t.viewDetails}
              </Link>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

export function EligibilityGuide({ limit }) {
  const { t } = useLanguage();
  const guides = limit ? t.guides.slice(0, limit) : t.guides;

  return (
    <section className="section guide-section">
      <div className="section-inner">
        <h2 data-reveal>{t.guideTitle}</h2>
        <p className="section-text" data-reveal>{t.guideText}</p>
        <div className="guide-list">
          {guides.map((guide) => (
            <article className="guide-row" data-reveal key={guide.category}>
              <h3>{guide.title}</h3>
              <p><strong>{t.work}</strong>{guide.work}</p>
              <p><strong>{t.needs}</strong>{guide.needs}</p>
            </article>
          ))}
        </div>
        <p className="field-note">{t.guideNote}</p>
        {limit && <Link className="text-link" href="/careers">{t.guideMore}</Link>}
      </div>
    </section>
  );
}

export function RoleExplorer() {
  const { t } = useLanguage();
  const [activeCategory, setActiveCategory] = useState(t.guides[0].category);

  return (
    <section className="section guide-section">
      <div className="section-inner">
        <h2 data-reveal>{t.explorerTitle}</h2>
        <p className="section-text" data-reveal>{t.explorerText}</p>
        <div className="role-explorer" data-reveal>
          <div aria-label={t.explorerLabel} className="role-tabs" role="group">
            {t.guides.map((guide) => (
              <button
                aria-pressed={activeCategory === guide.category}
                key={guide.category}
                onClick={() => setActiveCategory(guide.category)}
                type="button"
              >
                {guide.title}
              </button>
            ))}
          </div>
          {/* Every role stays in the page so search engines and answer engines can read them all. */}
          {t.guides.map((guide) => (
            <article className="role-panel" hidden={activeCategory !== guide.category} key={guide.category}>
              <h3>{guide.title}</h3>
              <p><strong>{t.work}</strong>{guide.work}</p>
              <p><strong>{t.needs}</strong>{guide.needs}</p>
              <Link className="button button-navy" href={`/jobs?category=${guide.category}`}>{t.explorerJobs(guide.title)}</Link>
            </article>
          ))}
        </div>
        <p className="field-note">{t.guideNote}</p>
      </div>
    </section>
  );
}

export function WhyChoose() {
  const { t } = useLanguage();

  return (
    <section className="section">
      <div className="section-inner">
        <h2 data-reveal>{t.whyTitle}</h2>
        <ul className="why-grid">
          {t.whyItems.map((item) => (
            <li data-reveal key={item.title}>
              <Check aria-hidden="true" size={22} />
              <div>
                <h3>{item.title}</h3>
                <p>{item.text}</p>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

export function ProcessRoute() {
  const { t } = useLanguage();
  const routeRef = useRef(null);
  const { scrollYProgress } = useScroll({ target: routeRef, offset: ["start 90%", "start 35%"] });
  const planePosition = useTransform(scrollYProgress, [0, 1], ["0%", "100%"]);

  return (
    <section className="section process-section">
      <div className="section-inner">
        <h2 data-reveal>{t.careersTitle}</h2>
        <p className="section-text" data-reveal>{t.careersText}</p>
        <div className="route" ref={routeRef}>
          <span aria-hidden="true" className="route-track" />
          <motion.span aria-hidden="true" className="route-line" style={{ scaleX: scrollYProgress }} />
          <motion.span aria-hidden="true" className="route-plane" style={{ left: planePosition }}>
            <Plane size={22} />
          </motion.span>
          <ol className="route-steps">
            {t.careerSteps.map((step, index) => (
              <li data-reveal key={step.title}>
                <span aria-hidden="true" className="route-stop">{index + 1}</span>
                <h3>{step.title}</h3>
                <p>{step.text}</p>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </section>
  );
}

export function JobSearchCta() {
  const { t } = useLanguage();

  return (
    <section className="cta-band">
      <div className="cta-photo">
        <Image alt="" fill sizes="100vw" src="/images/career-wing.jpg" />
      </div>
      <div className="section-inner cta-inner" data-reveal>
        <div>
          <h2>{t.ctaTitle}</h2>
          <p>{t.ctaText}</p>
        </div>
        <Link className="button button-signal" href="/jobs">{t.searchButton}</Link>
      </div>
    </section>
  );
}
