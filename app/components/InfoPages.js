"use client";

import Image from "next/image";
import Link from "next/link";
import { useLanguage } from "../lib/language";
import ContactSection from "./ContactSection";
import EligibilityChecker from "./EligibilityChecker";
import FaqSection from "./FaqSection";
import PageHeader from "./PageHeader";
import RevealScope from "./RevealScope";
import { CareerPaths, JobSearchCta, ProcessRoute, RoleExplorer, WhyChoose } from "./sections";
import TeamFeature from "./TeamFeature";

export function CareersContent() {
  const { t } = useLanguage();
  return (
    <>
      <PageHeader photo="/images/career-cockpit.jpg" text={t.careersPageText} title={t.careersPageTitle} />
      <RevealScope>
        <CareerPaths />
        <EligibilityChecker />
        <RoleExplorer />
        <ProcessRoute />
        <FaqSection />
        <JobSearchCta />
      </RevealScope>
    </>
  );
}

export function NotFoundContent() {
  const { t } = useLanguage();
  return (
    <>
      <PageHeader text={t.notFoundText} title={t.notFoundTitle} />
      <section className="section">
        <div className="section-inner">
          <Link className="button button-signal" href="/jobs">{t.viewAllJobs}</Link>
        </div>
      </section>
    </>
  );
}

export function AboutContent() {
  const { t } = useLanguage();
  return (
    <>
      <PageHeader photo="/images/hero-runway.jpg" text={t.aboutIndependent} title={t.aboutPageTitle} />
      <RevealScope>
        <section className="section">
          <div className="section-inner about-split">
            <div>
              <h2 data-reveal>{t.aboutTitle}</h2>
              <p className="section-text" data-reveal>{t.aboutText}</p>
            </div>
            <div className="about-photo" data-reveal>
              <Image alt="" fill sizes="(max-width: 960px) 100vw, 50vw" src="/images/career-terminal.jpg" />
            </div>
          </div>
        </section>
        <TeamFeature />
        <WhyChoose />
        <JobSearchCta />
      </RevealScope>
    </>
  );
}

export function ContactContent() {
  const { t } = useLanguage();
  return (
    <>
      <PageHeader photo="/images/career-wing.jpg" text={t.disclaimer} title={t.contactTitle} />
      <ContactSection />
      <RevealScope>
        <FaqSection />
      </RevealScope>
    </>
  );
}
