"use client";

import { toggleId } from "./idLists";
import { createStoredIdList } from "./storedIds";

const savedList = createStoredIdList("aerocareer-saved-jobs");

function toggleSaved(id) {
  savedList.update((ids) => toggleId(ids, id));
}

export function useSavedJobs() {
  return { savedIds: savedList.useIds(), toggleSaved };
}
