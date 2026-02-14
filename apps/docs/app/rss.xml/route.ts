import { getRSS } from "@/lib/rss";

export const revalidate = false;

export async function GET(request: Request) {
  const siteUrl = new URL(request.url).origin;
  const rss = await getRSS({ siteUrl });

  return new Response(rss, {
    headers: {
      "Content-Type": "application/rss+xml; charset=utf-8",
    },
  });
}

