"use client";

import dynamic from "next/dynamic";
import Image from "next/image";

const AviationScene = dynamic(() => import("../AviationScene"), { ssr: false });

export default function PageHeader({ eyebrow, photo, text, title }) {
  return (
    <section className="page-header">
      {photo && (
        <div className="page-header-photo">
          <Image alt="" fill priority sizes="100vw" src={photo} />
        </div>
      )}
      <AviationScene mode="header" />
      <div className="section-inner">
        {eyebrow && <p className="page-header-tags">{eyebrow}</p>}
        <h1>{title}</h1>
        <p>{text}</p>
      </div>
    </section>
  );
}
