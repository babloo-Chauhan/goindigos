"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { MotionConfig } from "framer-motion";
import { useLanguage } from "../lib/language";
import { usePageTransition, useSmoothScroll } from "../lib/pageMotion";
import { useIstToday } from "../lib/useIstToday";
import { CompareTray } from "./CompareControls";
import BrandLogo from "./BrandLogo";
import ContactLinks from "./ContactLinks";
import SiteHeader from "./SiteHeader";
import TeamFeature from "./TeamFeature";
import { BackToTop, Toaster } from "./SiteOverlays";

/** These pages place the team section within their own content. Every other page gets it above the footer. */
const PAGES_PLACING_TEAM_SECTION = ["/", "/about"];

function SiteFooter() {
  const { t } = useLanguage();
  const today = useIstToday();
  const groups = [
    { label: t.footerExplore, links: [[t.navJobs, "/jobs"], [t.navAirlines, "/airlines-jobs"], [t.navAirport, "/airport-jobs"]] },
    { label: t.footerCompany, links: [[t.navCareers, "/careers"], [t.navAbout, "/about"], [t.navContact, "/contact"]] },
  ];

  return (
    <footer className="site-footer">
      <div className="section-inner footer-top">
        <div>
          <Link aria-label={t.homeLabel} className="brand" href="/">
            <BrandLogo />
          </Link>
          <p>{t.footerTagline}</p>
          <ContactLinks />
        </div>
        {groups.map((group) => (
          <nav aria-label={group.label} className="footer-links" key={group.label}>
            <strong>{group.label}</strong>
            {group.links.map(([label, href]) => <Link href={href} key={href}>{label}</Link>)}
          </nav>
        ))}
      </div>
      <div className="section-inner footer-bottom">
        <p>{t.disclaimer}</p>
        <p>© {today.slice(0, 4)} AeroCareer Hub</p>
        <p>{t.footerCredit} <a href="https://itellic.com" rel="noopener" target="_blank">itellic.com</a></p>
        <a href="#top">{t.backToTop}</a>
      </div>
    </footer>
  );
}

export default function SiteShell({ children }) {
  const { language, t } = useLanguage();
  const mainRef = useRef(null);
  const pathname = usePathname();
  useSmoothScroll();
  usePageTransition(mainRef, pathname);
  const isAdmin = pathname === "/admin" || pathname.startsWith("/admin/");

  useEffect(() => {
    document.documentElement.lang = language;
  }, [language]);

  return (
    <MotionConfig reducedMotion="user">
      <div id="top" />
      <a className="skip-link" href="#main">{t.skipLink}</a>
      {!isAdmin && <SiteHeader />}
      <main id="main" ref={mainRef} tabIndex={-1}>
        {children}
        {!isAdmin && !PAGES_PLACING_TEAM_SECTION.includes(pathname) && <TeamFeature />}
      </main>
      {!isAdmin && (
        <>
          <SiteFooter />
          <CompareTray />
          <BackToTop />
        </>
      )}
      <Toaster />
    </MotionConfig>
  );
}
