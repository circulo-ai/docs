import "server-only";

import { Feed } from "feed";

import { resolveSiteUrl } from "@/lib/site-url";
import { getSource } from "@/lib/source";

const FEED_TITLE = "Documentation";
const FEED_DESCRIPTION = "Latest published documentation pages.";
const FEED_COPYRIGHT = `All rights reserved ${new Date().getFullYear()}`;

const resolveLastModified = (value: unknown) => {
  if (!value || typeof value !== "object") return undefined;
  const lastModified = (value as { lastModified?: unknown }).lastModified;
  return typeof lastModified === "string" ? lastModified : undefined;
};

const toValidDate = (value: string | undefined) => {
  const parsed = value ? new Date(value) : new Date();
  return Number.isNaN(parsed.getTime()) ? new Date() : parsed;
};

type GetRSSOptions = {
  siteUrl?: string;
};

export const getRSS = async (options: GetRSSOptions = {}) => {
  const siteUrl = resolveSiteUrl(options.siteUrl);
  const source = await getSource();

  const feed = new Feed({
    title: FEED_TITLE,
    description: FEED_DESCRIPTION,
    id: siteUrl,
    link: siteUrl,
    language: "en",
    copyright: FEED_COPYRIGHT,
  });

  for (const page of source.getPages()) {
    const link = new URL(page.url, siteUrl).toString();
    feed.addItem({
      id: link,
      title: page.data.title ?? "Untitled",
      description: page.data.description ?? "",
      link,
      date: toValidDate(resolveLastModified(page.data)),
    });
  }

  return feed.rss2();
};
