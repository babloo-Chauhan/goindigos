"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Bookmark, Menu, X } from "lucide-react";
import { useLanguage } from "../lib/language";
import { slideMenu } from "../lib/pageMotion";
import { useSavedJobs } from "../lib/savedJobs";
import BrandLogo from "./BrandLogo";
import { ScrollProgress } from "./SiteOverlays";

function LanguageSelector({ language, setLanguage, t }) {
  return (
    <div aria-label={t.languageLabel} className="language-selector" role="group">
      <button aria-pressed={language === "en"} lang="en" onClick={() => setLanguage("en")} type="button">English</button>
      <button aria-pressed={language === "hi"} lang="hi" onClick={() => setLanguage("hi")} type="button">हिंदी</button>
    </div>
  );
}

export default function SiteHeader() {
  const { language, setLanguage, t } = useLanguage();
  const { savedIds } = useSavedJobs();
  const pathname = usePathname();
  // Tracks the page the menu was opened on, so any navigation closes it.
  const [menuOpenedOn, setMenuOpenedOn] = useState(null);
  const menuOpen = menuOpenedOn === pathname;
  const mobileNavRef = useRef(null);
  const hasToggledMenu = useRef(false);

  useEffect(() => {
    if (!hasToggledMenu.current) return;
    slideMenu(mobileNavRef.current, menuOpen);
  }, [menuOpen]);

  function toggleMenu() {
    hasToggledMenu.current = true;
    setMenuOpenedOn(menuOpen ? null : pathname);
  }

  const links = [
    { label: t.navHome, href: "/" },
    { label: t.navJobs, href: "/jobs" },
    { label: t.navAirlines, href: "/airlines-jobs" },
    { label: t.navAirport, href: "/airport-jobs" },
    { label: t.navCareers, href: "/careers" },
    { label: t.navAbout, href: "/about" },
    { label: t.navContact, href: "/contact" },
  ];

  const renderLinks = () => links.map((link) => (
    <Link
      aria-current={pathname === link.href ? "page" : undefined}
      href={link.href}
      key={link.href}
      onClick={() => setMenuOpenedOn(null)}
    >
      {link.label}
    </Link>
  ));

  return (
    <header className="site-header">
      <div className="header-inner">
        <Link aria-label={t.homeLabel} className="brand" href="/">
          <BrandLogo />
        </Link>
        <nav aria-label={t.navLabel} className="desktop-nav">{renderLinks()}</nav>
        <Link aria-label={t.savedJobs(savedIds.length)} className="saved-link" href="/jobs?saved=1">
          <Bookmark aria-hidden="true" fill={savedIds.length > 0 ? "currentColor" : "none"} size={20} />
          {savedIds.length > 0 && <span aria-hidden="true" className="saved-count">{savedIds.length}</span>}
        </Link>
        <LanguageSelector language={language} setLanguage={setLanguage} t={t} />
        <button
          aria-controls="mobile-navigation"
          aria-expanded={menuOpen}
          aria-label={t.menu}
          className="menu-toggle"
          onClick={toggleMenu}
          type="button"
        >
          {menuOpen ? <X aria-hidden="true" size={22} /> : <Menu aria-hidden="true" size={22} />}
        </button>
      </div>
      <nav aria-label={t.navLabel} className="mobile-nav" hidden id="mobile-navigation" ref={mobileNavRef}>
        <div className="mobile-nav-links">{renderLinks()}</div>
      </nav>
      <ScrollProgress />
    </header>
  );
}
