import assert from "node:assert/strict";
import { test } from "node:test";
import { normalizeSocialLinks, safeSocialLinks } from "../lib/validation/socialLinks.js";

test("rejects malformed social link payloads without throwing", () => {
  for (const payload of [
    null,
    {},
    [null],
    [{}],
    [{ platform: "website", url: null }],
    [{ platform: "website", url: "javascript:alert(1)" }],
  ]) {
    assert.equal(normalizeSocialLinks(payload), null);
  }
});

test("normalizes valid HTTPS links", () => {
  assert.deepEqual(
    normalizeSocialLinks([
      { platform: "website", url: " https://example.com/me " },
    ]),
    [{ platform: "website", url: "https://example.com/me" }],
  );
});

test("hides malformed stored social links", () => {
  assert.deepEqual(safeSocialLinks([{ platform: "website", url: "javascript:alert(1)" }]), []);
});
