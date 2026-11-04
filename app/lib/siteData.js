"use client";

import { createContext, useContext, useMemo } from "react";

const SiteDataContext = createContext(null);

export function SiteDataProvider({ children, jobs, settings }) {
  const value = useMemo(() => ({ jobs, settings }), [jobs, settings]);
  return <SiteDataContext.Provider value={value}>{children}</SiteDataContext.Provider>;
}

export function useJobs() {
  return useContext(SiteDataContext).jobs;
}

export function useSiteSettings() {
  return useContext(SiteDataContext).settings;
}
