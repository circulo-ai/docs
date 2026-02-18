import { describe, expect, it } from "vitest";

import {
  resolveCmsLinkRel,
  resolveCmsLinkTarget,
  resolveCmsLinkTargetWithFallback,
} from "@/lib/cms-link-target";

describe("cms link target helpers", () => {
  it("accepts supported target values only", () => {
    expect(resolveCmsLinkTarget("_self")).toBe("_self");
    expect(resolveCmsLinkTarget("_blank")).toBe("_blank");
    expect(resolveCmsLinkTarget("_parent")).toBe("_parent");
    expect(resolveCmsLinkTarget("_top")).toBe("_top");
    expect(resolveCmsLinkTarget("_new")).toBeUndefined();
    expect(resolveCmsLinkTarget("")).toBeUndefined();
    expect(resolveCmsLinkTarget(undefined)).toBeUndefined();
  });

  it("maps _blank target to safe rel attributes", () => {
    expect(resolveCmsLinkRel("_blank")).toBe("noopener noreferrer");
    expect(resolveCmsLinkRel("_self")).toBeUndefined();
  });

  it("falls back to _blank when legacy newTab is true", () => {
    expect(resolveCmsLinkTargetWithFallback("_parent", true)).toBe("_parent");
    expect(resolveCmsLinkTargetWithFallback(undefined, true)).toBe("_blank");
    expect(resolveCmsLinkTargetWithFallback(undefined, false)).toBeUndefined();
  });
});
