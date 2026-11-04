import { describe, expect, test } from "vitest";
import { jobViewToQuery, queryToJobView } from "../../app/data/jobs";
import { parseStoredIds, pushRecentId, toggleId } from "../../app/lib/idLists";

const DEFAULT_VIEW = {
  filters: { query: "", category: "", location: "" },
  sort: "closing",
  employment: "",
  savedOnly: false,
};

describe("toggleId", () => {
  test("adds a new id and removes an existing one without changing the input", () => {
    const ids = ["1"];
    expect(toggleId(ids, "2")).toEqual(["1", "2"]);
    expect(toggleId(ids, "1")).toEqual([]);
    expect(ids).toEqual(["1"]);
  });

  test("refuses a new id once full but still allows removal", () => {
    const full = ["1", "2", "3"];
    expect(toggleId(full, "4", 3)).toBe(full);
    expect(toggleId(full, "2", 3)).toEqual(["1", "3"]);
  });
});

describe("pushRecentId", () => {
  test("puts the id first, without duplicates, and honours the limit", () => {
    expect(pushRecentId(["1", "2", "3"], "2", 3)).toEqual(["2", "1", "3"]);
    expect(pushRecentId(["1", "2", "3"], "4", 3)).toEqual(["4", "1", "2"]);
  });
});

describe("parseStoredIds", () => {
  test("keeps only strings from stored data", () => {
    expect(parseStoredIds('["1", 2, null, "3"]')).toEqual(["1", "3"]);
  });

  test("treats damaged or missing data as an empty list", () => {
    expect(parseStoredIds("{not json")).toEqual([]);
    expect(parseStoredIds('{"a":1}')).toEqual([]);
    expect(parseStoredIds(null)).toEqual([]);
  });
});

describe("job view in the URL", () => {
  test("a default view has an empty query", () => {
    expect(jobViewToQuery(DEFAULT_VIEW)).toBe("");
  });

  test("survives a round trip, including Hindi and spaces", () => {
    const view = {
      filters: { query: "केबिन क्रू", category: "pilots", location: "New Delhi" },
      sort: "title",
      employment: "contract",
      savedOnly: true,
    };
    expect(queryToJobView(new URLSearchParams(jobViewToQuery(view)))).toEqual(view);
  });

  test("ignores values someone typed into the URL that the site does not know", () => {
    const view = queryToJobView(new URLSearchParams("category=nope&sort=nope&type=nope&saved=yes"));
    expect(view).toEqual(DEFAULT_VIEW);
  });
});
