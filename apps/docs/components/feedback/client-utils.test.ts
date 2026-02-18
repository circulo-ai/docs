import { describe, expect, it } from "vitest";

import { toErrorMessage } from "@/components/feedback/client-utils";

describe("feedback client utils", () => {
  it("uses error.message for Error instances", () => {
    expect(toErrorMessage(new Error("boom"))).toBe("boom");
  });

  it("uses fallback message for unknown values", () => {
    expect(toErrorMessage("boom")).toBe("Unable to send feedback.");
    expect(toErrorMessage(null)).toBe("Unable to send feedback.");
  });
});
