"use client";

import { useSyncExternalStore } from "react";

const DAY_MS = 86_400_000;
const IST_OFFSET_MS = 19_800_000;

function subscribeToIstMidnight(onChange) {
  let timer;
  function schedule() {
    const msUntilMidnight = DAY_MS - ((Date.now() + IST_OFFSET_MS) % DAY_MS);
    timer = setTimeout(() => {
      onChange();
      schedule();
    }, msUntilMidnight);
  }
  schedule();
  return () => clearTimeout(timer);
}

function getIstDate() {
  return new Date(Date.now() + IST_OFFSET_MS).toISOString().slice(0, 10);
}

function getServerDate() {
  return "";
}

/** Today's date in India as YYYY-MM-DD, or "" during prerender. A job stays listed through its closing date. */
export function useIstToday() {
  return useSyncExternalStore(subscribeToIstMidnight, getIstDate, getServerDate);
}
