import { beforeEach, describe, expect, it, vi } from "vitest";

const { getLatestVersionCachedMock, notFoundMock, redirectMock } = vi.hoisted(
  () => ({
    getLatestVersionCachedMock: vi.fn(),
    notFoundMock: vi.fn(),
    redirectMock: vi.fn(),
  }),
);

vi.mock("@/lib/latest-version-cache", () => ({
  getLatestVersionCached: getLatestVersionCachedMock,
}));

vi.mock("next/navigation", () => ({
  notFound: notFoundMock,
  redirect: redirectMock,
}));

import ServiceRoute from "./page";

describe("service route", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    redirectMock.mockImplementation((destination: string) => {
      throw new Error(`NEXT_REDIRECT:${destination}`);
    });
    notFoundMock.mockImplementation(() => {
      throw new Error("NEXT_NOT_FOUND");
    });
  });

  it("redirects directly to the latest version default slug", async () => {
    getLatestVersionCachedMock.mockResolvedValue({
      version: "1.2.3",
      defaultPageSlug: "start-here/intro",
    });

    await expect(
      ServiceRoute({
        params: { service: "ciruclo" },
      }),
    ).rejects.toThrow("NEXT_REDIRECT:/ciruclo/start-here/intro");

    expect(getLatestVersionCachedMock).toHaveBeenCalledWith("ciruclo");
    expect(redirectMock).toHaveBeenCalledWith("/ciruclo/start-here/intro");
    expect(redirectMock).not.toHaveBeenCalledWith("/ciruclo/v1.2.3");
  });

  it("returns not found when latest version does not exist", async () => {
    getLatestVersionCachedMock.mockResolvedValue(null);

    await expect(
      ServiceRoute({
        params: { service: "ciruclo" },
      }),
    ).rejects.toThrow("NEXT_NOT_FOUND");

    expect(notFoundMock).toHaveBeenCalledTimes(1);
    expect(redirectMock).not.toHaveBeenCalled();
  });

  it("returns not found when latest default page slug is missing", async () => {
    getLatestVersionCachedMock.mockResolvedValue({
      version: "1.2.3",
      defaultPageSlug: "   ",
    });

    await expect(
      ServiceRoute({
        params: { service: "ciruclo" },
      }),
    ).rejects.toThrow("NEXT_NOT_FOUND");

    expect(notFoundMock).toHaveBeenCalledTimes(1);
    expect(redirectMock).not.toHaveBeenCalled();
  });
});
