import assert from "node:assert/strict";
import test from "node:test";
import {
  addHistorySelection,
  isSearchHistoryEntry,
} from "../lib/search/searchHistoryEntries.ts";

test("search history stores the selected profile, not the query", () => {
  const profile = {
    type: "fursona",
    username: "test_user",
    displayName: "Test User",
  };
  const history = addHistorySelection([], profile);
  assert.deepEqual(history, [profile]);
  assert.equal(history[0].username, "test_user");
  assert.equal(isSearchHistoryEntry("test"), false);
});

test("reselecting a result moves its latest details to the top", () => {
  const profile = {
    type: "fursona",
    username: "test_user",
    displayName: "Test User",
  };
  const page = { type: "nav", path: "/settings", label: "Settings" };
  const updated = { ...profile, displayName: "New Name" };
  assert.deepEqual(addHistorySelection([page, profile], updated), [
    updated,
    page,
  ]);
});
