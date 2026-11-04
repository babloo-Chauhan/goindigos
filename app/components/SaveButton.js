"use client";

import { motion } from "framer-motion";
import { Bookmark } from "lucide-react";
import { useLanguage } from "../lib/language";
import { useSavedJobs } from "../lib/savedJobs";
import { showToast } from "../lib/toast";

export default function SaveButton({ job }) {
  const { language, t } = useLanguage();
  const { savedIds, toggleSaved } = useSavedJobs();
  const isSaved = savedIds.includes(job.id);
  const title = job.title[language];

  function handleClick() {
    toggleSaved(job.id);
    showToast(isSaved ? t.unsavedToast : t.savedToast);
  }

  return (
    <motion.button
      aria-label={isSaved ? t.unsaveJob(title) : t.saveJob(title)}
      aria-pressed={isSaved}
      className="save-button"
      onClick={handleClick}
      type="button"
      whileTap={{ scale: 0.86 }}
    >
      <Bookmark aria-hidden="true" fill={isSaved ? "currentColor" : "none"} size={20} />
    </motion.button>
  );
}
