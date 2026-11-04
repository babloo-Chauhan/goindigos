"use client";

import { useState } from "react";
import { AnimatePresence } from "framer-motion";
import { useLanguage } from "../lib/language";
import ApplicationDialog from "./ApplicationDialog";

export default function ApplyButton({ job }) {
  const { language, t } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <button
        aria-label={t.applyFor(job.title[language])}
        className="button button-signal"
        onClick={() => setIsOpen(true)}
        type="button"
      >
        {t.apply}
      </button>
      <AnimatePresence>
        {isOpen && <ApplicationDialog job={job} language={language} onClose={() => setIsOpen(false)} t={t} />}
      </AnimatePresence>
    </>
  );
}
