import assert from "node:assert/strict";
import { test } from "node:test";
import { searchSettings } from "../components/pages/settings/settingsSearch.ts";

test("search finds a setting inside its section", () => {
  assert.deepEqual(
    searchSettings("post visibility").map(({ section, anchor }) => ({
      section,
      anchor,
    })),
    [{ section: "privacy", anchor: "post-visibility" }],
  );
});

test("search includes settings topics and platform keywords", () => {
  assert.equal(searchSettings("discord")[0]?.anchor, "profile-socials");
  assert.equal(searchSettings("text size")[0]?.anchor, "text-size");
  assert.deepEqual(searchSettings("not a setting"), []);
});
