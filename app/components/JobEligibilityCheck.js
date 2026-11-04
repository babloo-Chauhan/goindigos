"use client";

import { useState } from "react";
import { isEligible } from "../data/jobs";
import { useLanguage } from "../lib/language";

export default function JobEligibilityCheck({ job }) {
  const { t } = useLanguage();
  const [qualification, setQualification] = useState("");
  const [years, setYears] = useState("0");
  const meetsRequirements = isEligible(job, { qualification, years: Number(years) });

  return (
    <section className="role-check">
      <h3>{t.roleCheckTitle}</h3>
      <div className="role-check-fields">
        <label>
          {t.checkerQualification}
          <select onChange={(event) => setQualification(event.target.value)} value={qualification}>
            <option value="">{t.selectOption}</option>
            {t.qualificationOptions.map((option) => (
              <option key={option.value} value={option.value}>{option.label}</option>
            ))}
          </select>
        </label>
        <label>
          {t.checkerExperience}
          <select onChange={(event) => setYears(event.target.value)} value={years}>
            {t.yearsOptions.map((option) => (
              <option key={option.value} value={option.value}>{option.label}</option>
            ))}
          </select>
        </label>
      </div>
      <p aria-live="polite" className="role-check-result" data-result={qualification ? String(meetsRequirements) : undefined}>
        {!qualification ? t.checkerPrompt : meetsRequirements ? t.roleCheckYes : t.roleCheckNo}
      </p>
    </section>
  );
}
