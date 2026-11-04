"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Plus } from "lucide-react";
import { useLanguage } from "../lib/language";

export default function FaqSection() {
  const { t } = useLanguage();
  const [openIndex, setOpenIndex] = useState(null);

  return (
    <section className="section faq-section">
      <div className="section-inner faq-layout">
        <h2 data-reveal>{t.faqTitle}</h2>
        <div className="faq-list">
          {t.faqs.map((faq, index) => {
            const isOpen = openIndex === index;
            return (
              <div className="faq-item" data-reveal key={faq.question}>
                <h3>
                  <button
                    aria-controls={`faq-answer-${index}`}
                    aria-expanded={isOpen}
                    onClick={() => setOpenIndex(isOpen ? null : index)}
                    type="button"
                  >
                    <span>{faq.question}</span>
                    <motion.span animate={{ rotate: isOpen ? 45 : 0 }} className="faq-icon">
                      <Plus aria-hidden="true" size={20} />
                    </motion.span>
                  </button>
                </h3>
                {/* Stays in the page while closed so search engines and answer engines can read it. */}
                <motion.div
                  animate={{ height: isOpen ? "auto" : 0, opacity: isOpen ? 1 : 0 }}
                  className="faq-answer"
                  id={`faq-answer-${index}`}
                  inert={!isOpen}
                  initial={false}
                  transition={{ duration: 0.22, ease: "easeOut" }}
                >
                  <p>{faq.answer}</p>
                </motion.div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
