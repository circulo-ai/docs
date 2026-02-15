import { describe, expect, it } from "vitest";

import {
  buildServiceHref,
  buildServiceLatestHref,
  buildVersionHref,
  isKeyboardSelectionEvent,
  isSamePathname,
} from "@/lib/service-version-switcher-navigation";

describe("service version switcher navigation", () => {
  it("builds a service href without a default page slug", () => {
    expect(buildServiceHref("foo")).toBe("/foo");
  });

  it("builds a service href using the latest default page slug", () => {
    expect(buildServiceLatestHref("foo", "start-here/intro")).toBe(
      "/foo/start-here/intro",
    );
  });

  it("normalizes and encodes default page slug segments", () => {
    expect(
      buildServiceLatestHref("foo", "  start here / intro%20guide  "),
    ).toBe("/foo/start%20here/intro%2520guide");
  });

  it("builds a version href", () => {
    expect(buildVersionHref("foo", "1.2.3")).toBe("/foo/v1.2.3");
  });

  it("treats identical paths as the same pathname", () => {
    expect(isSamePathname("/foo/bar", "/foo/bar")).toBe(true);
  });

  it("treats trailing slashes as the same pathname", () => {
    expect(isSamePathname("/foo/bar/", "/foo/bar")).toBe(true);
  });

  it("treats root path variants as the same pathname", () => {
    expect(isSamePathname("/", "")).toBe(true);
  });

  it("detects different pathnames", () => {
    expect(isSamePathname("/foo/bar", "/foo/baz")).toBe(false);
  });

  it("identifies keyboard selection events", () => {
    expect(
      isKeyboardSelectionEvent({
        nativeEvent: { type: "keydown" },
      }),
    ).toBe(true);
  });

  it("ignores non-keyboard selection events", () => {
    expect(
      isKeyboardSelectionEvent({
        nativeEvent: { type: "click" },
      }),
    ).toBe(false);
  });

  it("identifies keyboard events from Base UI event details", () => {
    expect(
      isKeyboardSelectionEvent({
        event: { type: "keydown" },
      }),
    ).toBe(true);
  });

  it("handles missing event details", () => {
    expect(isKeyboardSelectionEvent(undefined)).toBe(false);
  });
});
