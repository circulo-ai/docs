import { describe, expect, it } from "vitest";

import {
  createFeedbackBlockBody,
  createFeedbackBlockId,
} from "@/lib/feedback-block";

describe("feedback block id generation", () => {
  it("normalizes body whitespace before hashing", () => {
    const compact = createFeedbackBlockBody("Alpha beta gamma");
    const noisy = createFeedbackBlockBody("  Alpha   beta \n\t gamma  ");

    expect(noisy).toBe(compact);
  });

  it("is stable for the same normalized body and order", () => {
    const idA = createFeedbackBlockId("Alpha beta gamma", 3);
    const idB = createFeedbackBlockId("  Alpha   beta \n\t gamma  ", 3);

    expect(idA).toBe(idB);
  });

  it("changes when order changes for the same body", () => {
    const idA = createFeedbackBlockId("Alpha beta gamma", 3);
    const idB = createFeedbackBlockId("Alpha beta gamma", 4);

    expect(idA).not.toBe(idB);
  });
});
