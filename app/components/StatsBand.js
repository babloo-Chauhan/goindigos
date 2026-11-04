"use client";

import { useRef } from "react";
import { Briefcase, LayoutGrid, MapPin } from "lucide-react";
import { getJobStats } from "../data/jobs";
import { useLanguage } from "../lib/language";
import { useCountUp } from "../lib/pageMotion";

function Stat({ icon: Icon, label, value }) {
  const valueRef = useRef(null);
  useCountUp(valueRef, value);

  return (
    <div>
      <dt>{label}</dt>
      <dd>
        <span className="stat-icon"><Icon aria-hidden="true" size={22} /></span>
        <span key={value} ref={valueRef}>{value}</span>
      </dd>
    </div>
  );
}

export default function StatsBand({ jobs }) {
  const { t } = useLanguage();
  const stats = getJobStats(jobs);

  return (
    <section aria-label={t.statsLabel} className="stats-band">
      <dl className="section-inner stats-grid">
        <Stat icon={Briefcase} label={t.statRoles} value={stats.roles} />
        <Stat icon={LayoutGrid} label={t.statDepartments} value={stats.departments} />
        <Stat icon={MapPin} label={t.statCities} value={stats.cities} />
      </dl>
    </section>
  );
}
