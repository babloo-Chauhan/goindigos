"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { Scale, X } from "lucide-react";
import { useCompareJobs } from "../lib/compareJobs";
import { useLanguage } from "../lib/language";
import { showToast } from "../lib/toast";

export function CompareButton({ job }) {
  const { language, t } = useLanguage();
  const { compareIds, toggleCompare } = useCompareJobs();
  const isCompared = compareIds.includes(job.id);
  const title = job.title[language];

  function handleClick() {
    if (!toggleCompare(job.id)) showToast(t.compareFull);
  }

  return (
    <motion.button
      aria-label={isCompared ? t.compareRemove(title) : t.compareAdd(title)}
      aria-pressed={isCompared}
      className="save-button"
      onClick={handleClick}
      type="button"
      whileTap={{ scale: 0.86 }}
    >
      <Scale aria-hidden="true" size={20} strokeWidth={isCompared ? 3 : 2} />
    </motion.button>
  );
}

export function CompareTray() {
  const { t } = useLanguage();
  const { compareIds, clearCompare } = useCompareJobs();
  const pathname = usePathname();
  const isVisible = compareIds.length > 0 && pathname !== "/compare";

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.aside
          animate={{ opacity: 1, y: 0 }}
          aria-label={t.compareTitle}
          className="compare-tray"
          exit={{ opacity: 0, y: 16 }}
          initial={{ opacity: 0, y: 16 }}
          transition={{ duration: 0.2, ease: "easeOut" }}
        >
          <span>{t.compareTray(compareIds.length)}</span>
          <Link className="button button-signal" href="/compare">{t.compareOpen}</Link>
          <button aria-label={t.compareClear} className="compare-clear" onClick={clearCompare} type="button">
            <X aria-hidden="true" size={18} />
          </button>
        </motion.aside>
      )}
    </AnimatePresence>
  );
}
