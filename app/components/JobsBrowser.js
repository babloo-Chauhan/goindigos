"use client";

import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { Bookmark, LayoutGrid, List, X } from "lucide-react";
import {
  categories,
  DEFAULT_JOB_VIEW,
  EMPTY_FILTERS,
  getOpenJobs,
  jobViewToQuery,
  matchesFilters,
  queryToJobView,
  sortJobs,
} from "../data/jobs";
import { useJobs } from "../lib/siteData";
import { useLanguage } from "../lib/language";
import { smoothScrollBehavior } from "../lib/pageMotion";
import { useSavedJobs } from "../lib/savedJobs";
import { useIstToday } from "../lib/useIstToday";
import JobList from "./JobsSection";
import PageHeader from "./PageHeader";
import RecentJobs from "./RecentJobs";
import RevealScope from "./RevealScope";
import SearchPanel from "./SearchPanel";

const PAGE_COPY = {
  all: { title: "findJobsTitle", text: "findJobsText", photo: "/images/hero-runway.jpg" },
  airline: { title: "airlinesTitle", text: "airlinesText", photo: "/images/career-wing.jpg" },
  airport: { title: "airportTitle", text: "airportText", photo: "/images/career-terminal.jpg" },
};

/** Sits in its own Suspense boundary so reading the URL never replaces the job list and loses what the visitor is doing. */
function UrlViewSync({ lastQueryRef, onChange }) {
  const searchParams = useSearchParams();

  useEffect(() => {
    const query = searchParams.toString();
    // While typing fast this can hold an older address than the one just written, which must not undo the typing.
    const isStale = query !== new URLSearchParams(window.location.search).toString();
    if (isStale || query === lastQueryRef.current) return;
    lastQueryRef.current = query;
    onChange(queryToJobView(searchParams));
  }, [lastQueryRef, onChange, searchParams]);

  return null;
}

function JobsView({ audience }) {
  const { language, t } = useLanguage();
  const today = useIstToday();
  const pathname = usePathname();
  const { savedIds } = useSavedJobs();
  const [view, setView] = useState(DEFAULT_JOB_VIEW);
  const [layout, setLayout] = useState("list");
  const lastQueryRef = useRef("");
  const pageCopy = PAGE_COPY[audience];
  const jobs = useJobs();
  const { filters, sort, employment, savedOnly } = view;

  useEffect(() => {
    // The untouched default view says nothing about the address, and UrlViewSync has yet to apply a shared link.
    if (view === DEFAULT_JOB_VIEW) return;
    const query = jobViewToQuery(view);
    if (query === lastQueryRef.current) return;
    lastQueryRef.current = query;
    try {
      window.history.replaceState(null, "", query ? `${pathname}?${query}` : pathname);
    } catch {
      // Some browsers limit how often the address can change. The list still works, and the next change updates it.
    }
  }, [pathname, view]);

  const visibleJobs = useMemo(() => {
    const matching = getOpenJobs(today, jobs)
      .filter((job) => audience === "all" || job.audience === audience)
      .filter((job) => matchesFilters(job, filters))
      .filter((job) => !employment || job.employment === employment)
      .filter((job) => !savedOnly || savedIds.includes(job.id));
    return sortJobs(matching, sort, language);
  }, [audience, employment, filters, jobs, language, savedIds, savedOnly, sort, today]);

  function updateView(change) {
    setView((current) => ({ ...current, ...change }));
  }

  function updateFilter(key, value) {
    setView((current) => ({ ...current, filters: { ...current.filters, [key]: value } }));
  }

  function scrollToResults() {
    document.getElementById("job-results")?.scrollIntoView({ behavior: smoothScrollBehavior() });
  }

  function clearAll() {
    updateView({ filters: EMPTY_FILTERS, employment: "", savedOnly: false });
  }

  const activeCategory = categories.find((item) => item.id === filters.category);
  const employmentOptions = [
    { value: "", label: t.employmentAll },
    { value: "fullTime", label: t.employment.fullTime },
    { value: "contract", label: t.employment.contract },
  ];
  const layoutOptions = [
    { value: "list", label: t.layoutList, icon: List },
    { value: "grid", label: t.layoutGrid, icon: LayoutGrid },
  ];

  return (
    <>
      <Suspense fallback={null}>
        <UrlViewSync lastQueryRef={lastQueryRef} onChange={setView} />
      </Suspense>
      <PageHeader photo={pageCopy.photo} text={t[pageCopy.text]} title={t[pageCopy.title]} />
      <div className="search-section">
        <SearchPanel filters={filters} onChange={updateFilter} onSubmit={scrollToResults} />
      </div>
      <section className="section jobs-section" id="job-results">
        <div className="section-inner">
          <div className="jobs-heading">
            <h2>{t.jobsTitle}</h2>
            <p aria-live="polite" className="jobs-count">{t.roles(visibleJobs.length)}</p>
          </div>
          <p className="jobs-note">{t.jobsNote}</p>
          <div className="jobs-toolbar">
            <div aria-label={t.employmentType} className="segmented" role="group">
              {employmentOptions.map((option) => (
                <button
                  aria-pressed={employment === option.value}
                  key={option.value}
                  onClick={() => updateView({ employment: option.value })}
                  type="button"
                >
                  {option.label}
                </button>
              ))}
            </div>
            <button aria-pressed={savedOnly} className="saved-toggle" onClick={() => updateView({ savedOnly: !savedOnly })} type="button">
              <Bookmark aria-hidden="true" fill={savedOnly ? "currentColor" : "none"} size={16} />
              {t.savedOnly} ({savedIds.length})
            </button>
            <div aria-label={t.layoutLabel} className="segmented layout-toggle" role="group">
              {layoutOptions.map(({ value, label, icon: Icon }) => (
                <button aria-label={label} aria-pressed={layout === value} key={value} onClick={() => setLayout(value)} type="button">
                  <Icon aria-hidden="true" size={16} />
                </button>
              ))}
            </div>
            <label className="sort-field">
              {t.sortLabel}
              <select onChange={(event) => updateView({ sort: event.target.value })} value={sort}>
                <option value="closing">{t.sortClosing}</option>
                <option value="title">{t.sortTitle}</option>
              </select>
            </label>
          </div>
          {activeCategory && (
            <div className="active-filters">
              <button
                aria-label={`${t.clearFilter}: ${activeCategory[language]}`}
                onClick={() => updateFilter("category", "")}
                type="button"
              >
                {activeCategory[language]} <X aria-hidden="true" size={14} />
              </button>
            </div>
          )}
          <RevealScope>
            <JobList
              emptyHelp={savedOnly ? t.noSavedJobsHelp : t.noJobsHelp}
              emptyTitle={savedOnly ? t.noSavedJobs : t.noJobs}
              jobs={visibleJobs}
              layout={layout}
              onClearSearch={clearAll}
              clearLabel={savedOnly ? t.showAllJobs : t.clearSearch}
            />
          </RevealScope>
          <RecentJobs />
        </div>
      </section>
    </>
  );
}

export default function JobsBrowser({ audience = "all" }) {
  return <JobsView audience={audience} />;
}
