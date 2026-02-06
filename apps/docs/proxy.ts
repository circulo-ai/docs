import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

const resolveServiceSlug = (pathname: string): string | undefined => {
  const [firstSegment] = pathname.split("/").filter(Boolean);
  if (!firstSegment) return undefined;

  try {
    return decodeURIComponent(firstSegment);
  } catch {
    return firstSegment;
  }
};

export function proxy(request: NextRequest) {
  const requestHeaders = new Headers(request.headers);
  const serviceSlug = resolveServiceSlug(request.nextUrl.pathname);

  if (serviceSlug) {
    requestHeaders.set("x-service-slug", serviceSlug);
  } else {
    requestHeaders.delete("x-service-slug");
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
