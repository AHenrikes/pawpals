import assert from "node:assert/strict";
import test from "node:test";
import {
  changesPrivateLayout,
  layoutForPath,
  shouldTransition,
} from "../components/transitions/layoutForPath.ts";
import { distanceToPreviousPath } from "../components/transitions/privateHistory.ts";

test("private routes follow the app and return layout groups", () => {
  assert.equal(layoutForPath("/"), "app");
  assert.equal(layoutForPath("/messages"), "app");
  assert.equal(layoutForPath("/messages/123"), "return");
  assert.equal(layoutForPath("/@someone"), "return");
  assert.equal(layoutForPath("/profile/someone/connections"), "return");
  assert.equal(layoutForPath("/settings"), "return");
  assert.equal(layoutForPath("/sign-in"), null);
});

test("page cover runs only when private layout changes", () => {
  assert.equal(changesPrivateLayout("/messages", "/"), false);
  assert.equal(changesPrivateLayout("/", "/messages"), false);
  assert.equal(changesPrivateLayout("/", "/@someone"), true);
  assert.equal(changesPrivateLayout("/settings", "/@someone"), false);
  assert.equal(changesPrivateLayout("/@someone", "/messages"), true);
  assert.equal(changesPrivateLayout("/", "/sign-in"), false);
});

test("profile navigation always uses the page cover", () => {
  assert.equal(shouldTransition("/messages", "/"), false);
  assert.equal(shouldTransition("/settings", "/messages/123"), false);
  assert.equal(shouldTransition("/", "/@someone"), true);
  assert.equal(shouldTransition("/@someone", "/settings"), true);
  assert.equal(shouldTransition("/settings", "/@someone"), true);
  assert.equal(shouldTransition("/@someone", "/@other"), true);
  assert.equal(
    shouldTransition("/profile/someone/connections", "/settings"),
    true,
  );
  assert.equal(shouldTransition("/@someone", "/@someone"), false);
});

test("revisiting a route returns to its existing history entry", () => {
  const previousPaths = ["/", "/settings", "/@someone"];
  assert.equal(distanceToPreviousPath(previousPaths, "/settings"), 2);
  assert.equal(distanceToPreviousPath(previousPaths, "/"), 3);
  assert.equal(distanceToPreviousPath(previousPaths, "/@other"), 0);
  assert.equal(distanceToPreviousPath([], "/settings"), 0);
});
