export type ViewOptionLinkId =
  | "github"
  | "scira"
  | "chatgpt"
  | "claude"
  | "cursor";

export type ViewOptionLink = {
  id: ViewOptionLinkId;
  title: string;
  href: string;
};

type BuildViewOptionLinksInput = {
  markdownUrl: string;
  githubUrl?: string;
  origin?: string;
};

const buildPrompt = (markdownUrl: string, origin?: string) => {
  const absoluteMarkdownUrl = origin
    ? new URL(markdownUrl, origin).toString()
    : markdownUrl;

  return `Read ${absoluteMarkdownUrl}, I want to ask questions about it.`;
};

export const buildViewOptionLinks = ({
  markdownUrl,
  githubUrl,
  origin,
}: BuildViewOptionLinksInput): ViewOptionLink[] => {
  const q = buildPrompt(markdownUrl, origin);
  const links: ViewOptionLink[] = [];

  if (githubUrl) {
    links.push({
      id: "github",
      title: "Open in GitHub",
      href: githubUrl,
    });
  }

  links.push(
    {
      id: "scira",
      title: "Open in Scira",
      href: `https://scira.ai/?${new URLSearchParams({ q })}`,
    },
    {
      id: "chatgpt",
      title: "Open in ChatGPT",
      href: `https://chatgpt.com/?${new URLSearchParams({
        hints: "search",
        q,
      })}`,
    },
    {
      id: "claude",
      title: "Open in Claude",
      href: `https://claude.ai/new?${new URLSearchParams({ q })}`,
    },
    {
      id: "cursor",
      title: "Open in Cursor",
      href: `https://cursor.com/link/prompt?${new URLSearchParams({ text: q })}`,
    },
  );

  return links;
};
