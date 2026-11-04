"use client";

import { toggleId } from "./idLists";
import { createStoredIdList } from "./storedIds";

export const MAX_COMPARED_JOBS = 3;

const compareList = createStoredIdList("aerocareer-compare-jobs");

/** Returns false when the list is already full, so the caller can explain why nothing changed. */
function toggleCompare(id) {
  const current = compareList.getIds();
  const next = toggleId(current, id, MAX_COMPARED_JOBS);
  compareList.update(() => next);
  return next !== current;
}

function clearCompare() {
  compareList.update(() => []);
}

export function useCompareJobs() {
  return { compareIds: compareList.useIds(), toggleCompare, clearCompare };
}
