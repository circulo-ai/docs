import { readEnv } from "@repo/env";
import { revalidateTag } from "next/cache";

import {
  LATEST_VERSION_CACHE_TAG,
  getLatestVersionServiceTag,
} from "@/lib/latest-version-cache";

const REVALIDATE_SECRET_HEADER = "x-revalidate-secret";

const normalizeServiceSlug = (value: unknown) => {
  if (typeof value !== "string") return undefined;
  const trimmed = value.trim().toLowerCase();
  return trimmed.length > 0 ? trimmed : undefined;
};

const isAuthorized = (request: Request) => {
  const secret = readEnv("DOCS_REVALIDATE_SECRET");
  if (!secret) return false;

  return request.headers.get(REVALIDATE_SECRET_HEADER) === secret;
};

export async function POST(request: Request) {
  if (!isAuthorized(request)) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  let service: string | undefined;
  try {
    const body = (await request.json()) as { service?: unknown };
    service = normalizeServiceSlug(body?.service);
  } catch {
    service = undefined;
  }

  if (service) {
    revalidateTag(getLatestVersionServiceTag(service), "max");
    return Response.json({ revalidated: true, scope: "service", service });
  }

  revalidateTag(LATEST_VERSION_CACHE_TAG, "max");
  return Response.json({ revalidated: true, scope: "all" });
}
