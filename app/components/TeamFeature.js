"use client";

import Image from "next/image";
import { useLanguage } from "../lib/language";

export default function TeamFeature() {
  const { t } = useLanguage();

  return (
    <section className="section team-section">
      <div className="section-inner">
        <figure className="team-feature" data-reveal>
          <div className="team-photo">
            <Image alt={t.teamAlt} fill loading="eager" sizes="(max-width: 1280px) 100vw, 1200px" src="/images/indigo-team-photo.png" />
          </div>
          <figcaption className="team-copy">
            <h2>{t.teamTitle}</h2>
            <p>{t.teamText}</p>
          </figcaption>
        </figure>
      </div>
    </section>
  );
}
