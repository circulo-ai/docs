"use client";

import { cva } from "class-variance-authority";
import type { FeedbackBlockProps } from "fumadocs-core/mdx-plugins/remark-feedback-block";
import {
  CornerDownRightIcon,
  MessageSquare,
  ThumbsDown,
  ThumbsUp,
} from "lucide-react";
import { usePathname } from "next/navigation";
import {
  ReactNode,
  useCallback,
  useRef,
  useState,
  useSyncExternalStore,
  useTransition,
  type SyntheticEvent,
} from "react";
import { z } from "zod/mini";

import { buttonVariants } from "@/components/ui/button";
import { Collapsible, CollapsibleContent } from "@/components/ui/collapsible";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import {
  actionResponse,
  blockFeedback,
  pageFeedback,
  type ActionResponse,
  type BlockFeedback,
  type PageFeedback,
} from "./schema";

const rateButtonVariants = cva(
  "inline-flex items-center gap-2 rounded-full border px-3 py-2 text-sm font-medium disabled:cursor-not-allowed [&_svg]:size-4",
  {
    variants: {
      active: {
        true: "bg-fd-accent text-fd-accent-foreground [&_svg]:fill-current",
        false: "text-fd-muted-foreground",
      },
    },
  },
);

const pageFeedbackResult = z.extend(pageFeedback, {
  response: actionResponse,
});

const blockFeedbackResult = z.extend(blockFeedback, {
  response: actionResponse,
});

const feedbackStorageEvent = "docs-feedback-storage-updated";

/**
 * A feedback component to be attached at the end of page
 */
export function Feedback({
  onSendAction,
}: {
  onSendAction: (feedback: PageFeedback) => Promise<ActionResponse>;
}) {
  const url = usePathname();
  const validatePageFeedback = useCallback((v: unknown) => {
    const result = pageFeedbackResult.safeParse(v);
    return result.success ? result.data : null;
  }, []);
  const { previous, setPrevious } = useSubmissionStorage(
    url,
    validatePageFeedback,
  );
  const [opinion, setOpinion] = useState<"good" | "bad" | null>(null);
  const [message, setMessage] = useState("");
  const [isPending, startTransition] = useTransition();

  function submit(e?: SyntheticEvent) {
    if (opinion == null) return;

    startTransition(async () => {
      const feedback: PageFeedback = {
        url,
        opinion,
        message,
      };

      const response = await onSendAction(feedback);
      setPrevious({
        response,
        ...feedback,
      });
      setMessage("");
      setOpinion(null);
    });

    e?.preventDefault();
  }

  const activeOpinion = previous?.opinion ?? opinion;

  return (
    <Collapsible
      open={opinion !== null || previous !== null}
      onOpenChange={(v) => {
        if (!v) setOpinion(null);
      }}
      className="border-y py-3"
    >
      <div className="flex flex-row items-center gap-2">
        <p className="pe-2 text-sm font-medium">How is this guide?</p>
        <button
          disabled={previous !== null}
          className={cn(
            rateButtonVariants({
              active: activeOpinion === "good",
            }),
          )}
          onClick={() => {
            setOpinion("good");
          }}
        >
          <ThumbsUp />
          Good
        </button>
        <button
          disabled={previous !== null}
          className={cn(
            rateButtonVariants({
              active: activeOpinion === "bad",
            }),
          )}
          onClick={() => {
            setOpinion("bad");
          }}
        >
          <ThumbsDown />
          Bad
        </button>
      </div>
      <CollapsibleContent className="mt-3">
        {previous ? (
          <div className="flex flex-col items-center gap-3 rounded-xl bg-fd-card px-3 py-6 text-center text-sm text-fd-muted-foreground">
            <p>Thank you for your feedback!</p>
            <div className="flex flex-row items-center gap-2">
              <a
                href={previous.response?.githubUrl}
                rel="noreferrer noopener"
                target="_blank"
                className={cn(buttonVariants(), "text-xs")}
              >
                View on GitHub
              </a>

              <button
                className={cn(
                  buttonVariants({ variant: "secondary" }),
                  "text-xs",
                )}
                onClick={() => {
                  setOpinion(previous.opinion);
                  setPrevious(null);
                }}
              >
                Submit Again
              </button>
            </div>
          </div>
        ) : (
          <form className="flex flex-col gap-3" onSubmit={submit}>
            <textarea
              autoFocus
              required
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="resize-none rounded-lg border bg-fd-secondary p-3 text-fd-secondary-foreground placeholder:text-fd-muted-foreground focus-visible:outline-none"
              placeholder="Leave your feedback..."
              onKeyDown={(e) => {
                if (!e.shiftKey && e.key === "Enter") {
                  submit(e);
                }
              }}
            />
            <button
              type="submit"
              className={cn(buttonVariants(), "w-fit px-3")}
              disabled={isPending}
            >
              Submit
            </button>
          </form>
        )}
      </CollapsibleContent>
    </Collapsible>
  );
}

/**
 * A feedback component for each content block in page, should be used with `remark-feedback-block`.
 *
 * See https://fumadocs.dev/docs/integrations/feedback.
 */
export function FeedbackBlock({
  id,
  body,
  onSendAction,
  children,
}: FeedbackBlockProps & {
  onSendAction: (feedback: BlockFeedback) => Promise<ActionResponse>;
  children: ReactNode;
}) {
  const url = usePathname();
  const blockId = `${url}-${id}`;
  const validateBlockFeedback = useCallback((v: unknown) => {
    const result = blockFeedbackResult.safeParse(v);
    if (result.success) return result.data;
    return null;
  }, []);
  const { previous, setPrevious } = useSubmissionStorage(
    blockId,
    validateBlockFeedback,
  );
  const [message, setMessage] = useState("");
  const [isPending, startTransition] = useTransition();
  const [open, setOpen] = useState(false);

  function submit(e?: SyntheticEvent) {
    startTransition(async () => {
      const feedback: BlockFeedback = {
        blockId,
        blockBody: body,
        url,
        message,
      };

      const response = await onSendAction(feedback);
      setPrevious({
        response,
        ...feedback,
      });
      setMessage("");
    });

    e?.preventDefault();
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <div className="group/feedback relative">
        <div
          className={cn(
            "pointer-events-none absolute -inset-1 z-[-1] rounded-sm transition-colors duration-100",
            open
              ? "bg-fd-accent"
              : "group-hover/feedback:bg-fd-accent group-hover/feedback:delay-100",
          )}
        />
        <PopoverTrigger
          className={cn(
            buttonVariants({ variant: "secondary", size: "sm" }),
            "absolute end-0 -top-7 gap-1.5 text-fd-muted-foreground backdrop-blur-sm transition-all duration-100 data-[state=open]:bg-fd-accent data-[state=open]:text-fd-accent-foreground",
            !open &&
              "pointer-events-none opacity-0 group-hover/feedback:pointer-events-auto group-hover/feedback:opacity-100 group-hover/feedback:delay-100 hover:pointer-events-auto hover:opacity-100 hover:delay-100",
          )}
          onClick={(e) => {
            setOpen((prev) => !prev);
            e.stopPropagation();
            e.preventDefault();
          }}
        >
          <MessageSquare className="size-3.5" />
          Feedback
        </PopoverTrigger>

        <div className="in-[.prose-no-margin]:prose-no-margin">{children}</div>
      </div>

      <PopoverContent className="min-w-75 bg-fd-card text-fd-card-foreground">
        {previous ? (
          <div className="flex flex-col items-center gap-2 rounded-xl py-2 text-center text-sm text-fd-muted-foreground">
            <p>Thank you for your feedback!</p>
            <div className="flex flex-row items-center gap-2">
              <a
                href={previous.response?.githubUrl}
                rel="noreferrer noopener"
                target="_blank"
                className={cn(buttonVariants(), "text-xs")}
              >
                View on GitHub
              </a>

              <button
                className={cn(
                  buttonVariants({ variant: "secondary" }),
                  "text-xs",
                )}
                onClick={() => {
                  setPrevious(null);
                }}
              >
                Submit Again
              </button>
            </div>
          </div>
        ) : (
          <form className="flex flex-col gap-2" onSubmit={submit}>
            <textarea
              autoFocus
              required
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="resize-none rounded-lg border bg-fd-secondary p-3 text-fd-secondary-foreground placeholder:text-fd-muted-foreground focus-visible:outline-none"
              placeholder="Leave your feedback..."
              onKeyDown={(e) => {
                if (!e.shiftKey && e.key === "Enter") {
                  submit(e);
                }
              }}
            />
            <button
              type="submit"
              className={cn(
                buttonVariants({ variant: "secondary", size: "sm" }),
                "gap-1.5",
              )}
              disabled={isPending}
            >
              <CornerDownRightIcon className="size-4 text-fd-muted-foreground" />
              Submit
            </button>
          </form>
        )}
      </PopoverContent>
    </Popover>
  );
}

function useSubmissionStorage<Result>(
  blockId: string,
  validate: (v: unknown) => Result | null,
) {
  const storageKey = `docs-feedback-${blockId}`;
  const snapshotCache = useRef<{
    storageKey: string;
    raw: string | null;
    value: Result | null;
  }>({
    storageKey,
    raw: null,
    value: null,
  });

  const subscribe = useCallback(
    (onStoreChange: () => void) => {
      if (typeof window === "undefined") return () => {};

      const onStorage = (event: StorageEvent) => {
        if (
          event.storageArea === window.localStorage &&
          event.key === storageKey
        ) {
          onStoreChange();
        }
      };
      const onFeedbackStorageUpdate = (event: Event) => {
        const customEvent = event as CustomEvent<{ storageKey: string }>;
        if (customEvent.detail?.storageKey === storageKey) onStoreChange();
      };

      window.addEventListener("storage", onStorage);
      window.addEventListener(feedbackStorageEvent, onFeedbackStorageUpdate);
      return () => {
        window.removeEventListener("storage", onStorage);
        window.removeEventListener(
          feedbackStorageEvent,
          onFeedbackStorageUpdate,
        );
      };
    },
    [storageKey],
  );

  const getSnapshot = useCallback(() => {
    if (typeof window === "undefined") return null;

    const raw = window.localStorage.getItem(storageKey);
    const cached = snapshotCache.current;
    if (cached.storageKey === storageKey && cached.raw === raw) {
      return cached.value;
    }

    let value: Result | null = null;
    if (raw !== null) {
      try {
        value = validate(JSON.parse(raw));
      } catch {
        value = null;
      }
    }

    snapshotCache.current = { storageKey, raw, value };
    return value;
  }, [storageKey, validate]);

  const value = useSyncExternalStore(subscribe, getSnapshot, () => null);

  return {
    previous: value,
    setPrevious(result: Result | null) {
      if (typeof window === "undefined") return;

      if (result) {
        const serialized = JSON.stringify(result);
        window.localStorage.setItem(storageKey, serialized);
        snapshotCache.current = {
          storageKey,
          raw: serialized,
          value: result,
        };
      } else {
        window.localStorage.removeItem(storageKey);
        snapshotCache.current = {
          storageKey,
          raw: null,
          value: null,
        };
      }

      window.dispatchEvent(
        new CustomEvent(feedbackStorageEvent, {
          detail: { storageKey },
        }),
      );
    },
  };
}
