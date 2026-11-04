"use client";

import { pushRecentId } from "./idLists";
import { createStoredIdList } from "./storedIds";

const MAX_RECENT_JOBS = 4;

const recentList = createStoredIdList("aerocareer-recent-jobs");

export function recordRecentJob(id) {
  recentList.update((ids) => (ids[0] === id ? ids : pushRecentId(ids, id, MAX_RECENT_JOBS)));
}

export function useRecentJobs() {
  return recentList.useIds();
}
