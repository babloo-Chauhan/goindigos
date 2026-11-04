"use client";

import { useState } from "react";
import { AnimatePresence, motion, useMotionValueEvent, useScroll } from "framer-motion";
import { ArrowUp } from "lucide-react";
import { useLanguage } from "../lib/language";
import { smoothScrollBehavior } from "../lib/pageMotion";
import { useToast } from "../lib/toast";

const BACK_TO_TOP_OFFSET = 700;

export function ScrollProgress() {
  const { scrollYProgress } = useScroll();
  return <motion.span aria-hidden="true" className="scroll-progress" style={{ scaleX: scrollYProgress }} />;
}

export function BackToTop() {
  const { t } = useLanguage();
  const { scrollY } = useScroll();
  const [isVisible, setIsVisible] = useState(false);

  useMotionValueEvent(scrollY, "change", (position) => setIsVisible(position > BACK_TO_TOP_OFFSET));

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.button
          animate={{ opacity: 1, y: 0 }}
          aria-label={t.scrollToTop}
          className="back-to-top"
          exit={{ opacity: 0, y: 12 }}
          initial={{ opacity: 0, y: 12 }}
          onClick={() => {
            document.getElementById("main")?.focus({ preventScroll: true });
            window.scrollTo({ top: 0, behavior: smoothScrollBehavior() });
          }}
          type="button"
        >
          <ArrowUp aria-hidden="true" size={20} />
        </motion.button>
      )}
    </AnimatePresence>
  );
}

export function Toaster() {
  const toast = useToast();

  return (
    <div aria-live="polite" className="toast-region" role="status">
      <AnimatePresence>
        {toast && (
          <motion.p
            animate={{ opacity: 1, y: 0 }}
            className="toast"
            exit={{ opacity: 0, y: 8 }}
            initial={{ opacity: 0, y: 12 }}
            key={toast.id}
            transition={{ duration: 0.18 }}
          >
            {toast.message}
          </motion.p>
        )}
      </AnimatePresence>
    </div>
  );
}
