/** Adds the id, or removes it if present. A full list stays unchanged, so the caller can tell the visitor why. */
export function toggleId(ids, id, limit = Infinity) {
  if (ids.includes(id)) return ids.filter((item) => item !== id);
  return ids.length >= limit ? ids : [...ids, id];
}

/** Moves the id to the front and drops the oldest once the list is over its limit. */
export function pushRecentId(ids, id, limit) {
  return [id, ...ids.filter((item) => item !== id)].slice(0, limit);
}

export function parseStoredIds(stored) {
  try {
    const parsed = JSON.parse(stored);
    return Array.isArray(parsed) ? parsed.filter((id) => typeof id === "string") : [];
  } catch {
    return [];
  }
}
