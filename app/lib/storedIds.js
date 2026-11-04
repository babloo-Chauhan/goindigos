"use client";

import { useSyncExternalStore } from "react";
import { parseStoredIds } from "./idLists";

const NO_IDS = [];

function getServerIds() {
  return NO_IDS;
}

/** A list of job ids kept in localStorage and shared across components and open tabs. */
export function createStoredIdList(storageKey) {
  const listeners = new Set();
  let ids = null;

  function notify() {
    listeners.forEach((listener) => listener());
  }

  // Another tab changed the list, so drop the cached copy before this tab overwrites that change.
  function handleStorageChange(event) {
    if (event.key !== null && event.key !== storageKey) return;
    ids = null;
    notify();
  }

  function subscribe(listener) {
    if (listeners.size === 0) window.addEventListener("storage", handleStorageChange);
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
      if (listeners.size === 0) window.removeEventListener("storage", handleStorageChange);
    };
  }

  function getIds() {
    if (ids) return ids;
    try {
      ids = parseStoredIds(window.localStorage.getItem(storageKey));
    } catch {
      ids = NO_IDS;
    }
    return ids;
  }

  function update(change) {
    // With nothing subscribed, changes from other tabs went unheard, so the cached copy cannot be trusted.
    if (listeners.size === 0) ids = null;
    const current = getIds();
    const next = change(current);
    if (next === current) return;
    ids = next;
    try {
      window.localStorage.setItem(storageKey, JSON.stringify(next));
    } catch {
      // Without storage the list still works until the page is reloaded.
    }
    notify();
  }

  return {
    getIds,
    update,
    useIds: () => useSyncExternalStore(subscribe, getIds, getServerIds),
  };
}
