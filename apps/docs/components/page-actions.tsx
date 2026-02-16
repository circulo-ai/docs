"use client";

import { useCopyButton } from "fumadocs-ui/utils/use-copy-button";
import { Check, Copy, ExternalLinkIcon } from "lucide-react";
import { useMemo, useState, type ReactNode } from "react";

import { ChatGPT, Claude, Cursor, GitHub, Scira } from "@/components/icons";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  buildViewOptionLinks,
  type ViewOptionLinkId,
} from "@/lib/view-option-links";

const cache = new Map<string, string>();

const optionIcons: Record<ViewOptionLinkId, ReactNode> = {
  github: <GitHub />,
  scira: <Scira />,
  chatgpt: <ChatGPT />,
  claude: <Claude />,
  cursor: <Cursor />,
};

export function LLMCopyButton({
  /**
   * A URL to fetch the raw Markdown/MDX content of page
   */
  markdownUrl,
}: {
  markdownUrl: string;
}) {
  const [isLoading, setLoading] = useState(false);
  const [checked, onClick] = useCopyButton(async () => {
    const cached = cache.get(markdownUrl);
    if (cached) return navigator.clipboard.writeText(cached);

    setLoading(true);

    try {
      await navigator.clipboard.write([
        new ClipboardItem({
          "text/plain": fetch(markdownUrl).then(async (res) => {
            const content = await res.text();
            cache.set(markdownUrl, content);

            return content;
          }),
        }),
      ]);
    } finally {
      setLoading(false);
    }
  });

  return (
    <Button disabled={isLoading} variant="outline" size="sm" onClick={onClick}>
      {checked ? <Check /> : <Copy />}
      Copy Markdown
    </Button>
  );
}

export function ViewOptions({
  markdownUrl,
  githubUrl,
}: {
  /**
   * A URL to the raw Markdown/MDX content of page
   */
  markdownUrl: string;

  /**
   * Source file URL on GitHub
   */
  githubUrl?: string;
}) {
  const [selectedOption, setSelectedOption] = useState("");

  const items = useMemo(() => {
    const origin =
      typeof window === "undefined" ? undefined : window.location.origin;

    return buildViewOptionLinks({
      markdownUrl,
      githubUrl,
      origin,
    });
  }, [githubUrl, markdownUrl]);

  return (
    <Select
      value={selectedOption}
      onValueChange={(href) => {
        if (!href) return;
        window.open(href, "_blank", "noopener,noreferrer");
        setSelectedOption("");
      }}
    >
      <SelectTrigger
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        render={({ className, ...props }) => (
          <Button variant="outline" size="sm" {...props} />
        )}
      >
        <SelectValue>Open</SelectValue>
      </SelectTrigger>
      <SelectContent alignItemWithTrigger={false} className="min-w-52">
        <SelectGroup>
          {items.map((item) => (
            <SelectItem key={item.href} value={item.href}>
              {optionIcons[item.id]}
              {item.title}
              <ExternalLinkIcon className="ms-auto size-3.5 text-fd-muted-foreground" />
            </SelectItem>
          ))}
        </SelectGroup>
      </SelectContent>
    </Select>
  );
}
