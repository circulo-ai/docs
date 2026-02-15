import { beforeEach, describe, expect, it, vi } from "vitest";

const { revalidateTagMock } = vi.hoisted(() => ({
  revalidateTagMock: vi.fn(),
}));

vi.mock("next/cache", () => ({
  revalidateTag: revalidateTagMock,
}));

import {
  LATEST_VERSION_CACHE_TAG,
  getLatestVersionServiceTag,
} from "@/lib/latest-version-cache";
import { POST } from "./route";

describe("latest-version revalidation route", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.DOCS_REVALIDATE_SECRET = "docs-revalidate-secret";
  });

  it("rejects unauthorized requests", async () => {
    const request = new Request(
      "http://docs.local/api/revalidate/latest-version",
      {
        method: "POST",
      },
    );

    const response = await POST(request);

    expect(response.status).toBe(401);
    expect(revalidateTagMock).not.toHaveBeenCalled();
  });

  it("revalidates a specific service tag", async () => {
    const request = new Request(
      "http://docs.local/api/revalidate/latest-version",
      {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "x-revalidate-secret": "docs-revalidate-secret",
        },
        body: JSON.stringify({ service: "ciruclo" }),
      },
    );

    const response = await POST(request);

    expect(response.status).toBe(200);
    expect(revalidateTagMock).toHaveBeenCalledWith(
      getLatestVersionServiceTag("ciruclo"),
      "max",
    );
    expect(revalidateTagMock).not.toHaveBeenCalledWith(
      LATEST_VERSION_CACHE_TAG,
    );
  });

  it("revalidates all latest-version cache entries when service is missing", async () => {
    const request = new Request(
      "http://docs.local/api/revalidate/latest-version",
      {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "x-revalidate-secret": "docs-revalidate-secret",
        },
        body: JSON.stringify({}),
      },
    );

    const response = await POST(request);

    expect(response.status).toBe(200);
    expect(revalidateTagMock).toHaveBeenCalledWith(
      LATEST_VERSION_CACHE_TAG,
      "max",
    );
  });
});
