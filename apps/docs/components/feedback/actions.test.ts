import { beforeEach, describe, expect, it, vi } from "vitest";

const createDiscussionThread = vi.fn<
  (pageId: string, body: string) => Promise<{ githubUrl: string }>
>(async () => ({
  githubUrl: "https://github.com/acme/docs/discussions/1",
}));

vi.mock("@/lib/github", () => ({
  createDiscussionThread,
}));

describe("feedback actions", () => {
  beforeEach(() => {
    createDiscussionThread.mockClear();
  });

  it("maps page feedback opinions and uses fallback summary with forwarded suffix", async () => {
    const { onPageFeedbackAction } =
      await import("@/components/feedback/actions");

    await expect(
      onPageFeedbackAction({
        url: "/docs/getting-started",
        opinion: "helpful",
        message: "",
      }),
    ).resolves.toEqual({
      githubUrl: "https://github.com/acme/docs/discussions/1",
    });

    expect(createDiscussionThread).toHaveBeenCalledWith(
      "/docs/getting-started",
      "[Helpful] No additional message.\n\n> Forwarded from docs feedback.",
    );
  });

  it("maps not_helpful page feedback and appends forwarded suffix exactly once", async () => {
    const { onPageFeedbackAction } =
      await import("@/components/feedback/actions");

    await onPageFeedbackAction({
      url: "/docs/getting-started",
      opinion: "not_helpful",
      message: "Need an example.",
    });

    expect(createDiscussionThread).toHaveBeenCalledTimes(1);
    const call = createDiscussionThread.mock.calls[0];
    expect(call).toBeDefined();
    if (!call) return;

    const body = call[1];
    expect(body).toContain("[Not Helpful] Need an example.");
    expect(body.match(/> Forwarded from docs feedback\./g)?.length ?? 0).toBe(
      1,
    );
  });

  it("uses truncated blockBody summary when blockBody is provided", async () => {
    const { onBlockFeedbackAction } =
      await import("@/components/feedback/actions");
    const longBody = "x".repeat(241);

    await onBlockFeedbackAction({
      url: "/docs/getting-started",
      blockId: "fb-123",
      blockBody: longBody,
      message: "Clarify this paragraph.",
    });

    expect(createDiscussionThread).toHaveBeenCalledWith(
      "/docs/getting-started",
      `> ${"x".repeat(240)}...\n\nClarify this paragraph.\n\n> Forwarded from docs feedback.`,
    );
  });

  it("falls back to blockId when blockBody is missing", async () => {
    const { onBlockFeedbackAction } =
      await import("@/components/feedback/actions");

    await onBlockFeedbackAction({
      url: "/docs/getting-started",
      blockId: "fb-123",
      message: "Clarify this paragraph.",
    });

    expect(createDiscussionThread).toHaveBeenCalledWith(
      "/docs/getting-started",
      "> fb-123\n\nClarify this paragraph.\n\n> Forwarded from docs feedback.",
    );
  });
});
