import { isMarkdownPreferred } from "fumadocs-core/negotiation";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

const RESERVED_FIRST_SEGMENTS = new Set([
  "api",
  "_next",
  "favicon.ico",
  "llms-full.txt",
  "llms.mdx",
  "rss.xml",
]);

const VERSION_SEGMENT_REGEX =
  /^v\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?(?:\+[0-9A-Za-z.-]+)?$/;

const hasFileExtension = (pathname: string) => {
  const segments = pathname.split("/").filter(Boolean);
  const lastSegment = segments[segments.length - 1];
  if (!lastSegment) return false;
  if (VERSION_SEGMENT_REGEX.test(lastSegment)) return false;

  return /^[^/]+\.[^/]+$/.test(lastSegment);
};

const shouldSkipLlmRewrite = (pathname: string) =>
  pathname.startsWith("/api/") ||
  pathname === "/api" ||
  pathname.startsWith("/_next/") ||
  pathname === "/favicon.ico" ||
  pathname === "/llms-full.txt" ||
  pathname.startsWith("/llms.mdx") ||
  pathname === "/rss.xml";

const toLlmPath = (pathname: string): string | null => {
  if (shouldSkipLlmRewrite(pathname)) return null;
  if (pathname === "/") return "/llms.mdx";
  if (hasFileExtension(pathname)) return null;
  return `/llms.mdx${pathname}`;
};

const rewriteExplicitMdxPath = (pathname: string): string | null => {
  if (!pathname.endsWith(".mdx")) return null;

  const withoutExtension = pathname.slice(0, -".mdx".length);
  if (!withoutExtension.startsWith("/")) return null;
  if (withoutExtension === "/llms") return null;

  const target = withoutExtension.length > 0 ? withoutExtension : "/";
  return toLlmPath(target);
};

const resolveServiceSlug = (pathname: string): string | undefined => {
  const [firstSegment] = pathname.split("/").filter(Boolean);
  if (!firstSegment) return undefined;
  if (RESERVED_FIRST_SEGMENTS.has(firstSegment)) return undefined;
  if (firstSegment.includes(".")) return undefined;

  try {
    return decodeURIComponent(firstSegment);
  } catch {
    return firstSegment;
  }
};

export function proxy(request: NextRequest) {
  const requestHeaders = new Headers(request.headers);
  const pathname = request.nextUrl.pathname;
  const pathForService =
    pathname.endsWith(".mdx") && pathname !== "/llms.mdx"
      ? pathname.slice(0, -".mdx".length)
      : pathname;
  const serviceSlug = resolveServiceSlug(pathForService);

  if (serviceSlug) {
    requestHeaders.set("x-service-slug", serviceSlug);
  } else {
    requestHeaders.delete("x-service-slug");
  }

  const explicitMdxRewrite = rewriteExplicitMdxPath(pathname);
  if (explicitMdxRewrite) {
    const url = new URL(explicitMdxRewrite, request.nextUrl);
    url.search = request.nextUrl.search;

    return NextResponse.rewrite(url, {
      request: {
        headers: requestHeaders,
      },
    });
  }

  if (isMarkdownPreferred(request)) {
    const target = toLlmPath(pathname);
    if (target) {
      const url = new URL(target, request.nextUrl);
      url.search = request.nextUrl.search;

      return NextResponse.rewrite(url, {
        request: {
          headers: requestHeaders,
        },
      });
    }
  }

  return NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
