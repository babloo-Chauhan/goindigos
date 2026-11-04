"use client";

import PageHeader from "./components/PageHeader";
import { useLanguage } from "./lib/language";

export default function ErrorPage({ reset }) {
  const { t } = useLanguage();
  return (
    <>
      <PageHeader text={t.errorText} title={t.errorTitle} />
      <section className="section">
        <div className="section-inner">
          <button className="button button-signal" onClick={reset} type="button">{t.tryAgain}</button>
        </div>
      </section>
    </>
  );
}
