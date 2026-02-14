"use client";

import {
  CheckCircle2Icon,
  ExternalLinkIcon,
  MessageCircleIcon,
  SendHorizontalIcon,
  ThumbsDownIcon,
  ThumbsUpIcon,
} from "lucide-react";
import type { ReactNode } from "react";
import { useId, useMemo, useState, useTransition } from "react";

import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverDescription,
  PopoverHeader,
  PopoverTitle,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

import type {
  ActionResponse,
  BlockFeedback,
  FeedbackAction,
  PageFeedback,
} from "./schema";

type SubmitState = {
  error?: string;
  response?: ActionResponse;
};

type FeedbackProps = {
  onSendAction: FeedbackAction<PageFeedback>;
};

type FeedbackBlockProps = {
  id: string;
  body: string;
  children?: ReactNode;
  onSendAction: FeedbackAction<BlockFeedback>;
};

const resolveFeedbackUrl = () => {
  if (typeof window === "undefined") return "/";
  const { pathname, search, hash } = window.location;
  return `${pathname}${search}${hash}`;
};

const toErrorMessage = (error: unknown) =>
  error instanceof Error ? error.message : "Unable to send feedback.";

const SuccessHint = ({ response }: { response?: ActionResponse }) => {
  if (!response) return null;

  return (
    <p className="mt-2 flex items-center gap-1.5 text-xs text-muted-foreground">
      <CheckCircle2Icon className="size-3.5" />
      Sent
      {response.githubUrl ? (
        <a
          href={response.githubUrl}
          target="_blank"
          rel="noreferrer noopener"
          className="ml-1 inline-flex items-center gap-1 underline underline-offset-4"
        >
          View thread
          <ExternalLinkIcon className="size-3" />
        </a>
      ) : null}
    </p>
  );
};

export function Feedback({ onSendAction }: FeedbackProps) {
  const [opinion, setOpinion] = useState<PageFeedback["opinion"] | null>(null);
  const [message, setMessage] = useState("");
  const [state, setState] = useState<SubmitState>({});
  const [isPending, startTransition] = useTransition();

  const canSubmit = opinion !== null && !isPending;

  const submit = () => {
    if (!opinion || isPending) return;
    setState({});

    startTransition(async () => {
      try {
        const response = await onSendAction({
          opinion,
          message,
          url: resolveFeedbackUrl(),
        });
        setState({ response });
        setMessage("");
      } catch (error) {
        setState({ error: toErrorMessage(error) });
      }
    });
  };

  return (
    <section className="mt-10 rounded-xl border border-border bg-card p-4">
      <p className="text-sm font-medium">Was this page helpful?</p>
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <Button
          type="button"
          size="sm"
          variant={opinion === "helpful" ? "default" : "outline"}
          onClick={() => setOpinion("helpful")}
          disabled={isPending}
        >
          <ThumbsUpIcon />
          Yes
        </Button>
        <Button
          type="button"
          size="sm"
          variant={opinion === "not_helpful" ? "default" : "outline"}
          onClick={() => setOpinion("not_helpful")}
          disabled={isPending}
        >
          <ThumbsDownIcon />
          No
        </Button>
      </div>

      <Textarea
        className="mt-3"
        placeholder="Optional details"
        value={message}
        onChange={(event) => setMessage(event.target.value)}
        maxLength={4000}
      />

      <div className="mt-3 flex items-center gap-2">
        <Button type="button" size="sm" onClick={submit} disabled={!canSubmit}>
          <SendHorizontalIcon />
          {isPending ? "Sending..." : "Send feedback"}
        </Button>
        {state.error ? (
          <p className="text-xs text-destructive">{state.error}</p>
        ) : null}
      </div>
      <SuccessHint response={state.response} />
    </section>
  );
}

export function FeedbackBlock({
  id,
  body,
  children,
  onSendAction,
}: FeedbackBlockProps) {
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [state, setState] = useState<SubmitState>({});
  const [isPending, startTransition] = useTransition();
  const textAreaId = useId();
  const trimmedMessage = useMemo(() => message.trim(), [message]);
  const canSubmit = trimmedMessage.length > 0 && !isPending;

  const submit = () => {
    if (!canSubmit) return;
    setState({});

    startTransition(async () => {
      try {
        const response = await onSendAction({
          blockBody: body,
          blockId: id,
          message: trimmedMessage,
          url: resolveFeedbackUrl(),
        });
        setState({ response });
        setMessage("");
      } catch (error) {
        setState({ error: toErrorMessage(error) });
      }
    });
  };

  return (
    <div className="group/feedback relative">
      {children}
      <div className="pointer-events-none absolute top-0 right-0 z-10 translate-x-full -translate-y-1/2">
        <div className="pointer-events-auto opacity-0 transition-opacity group-focus-within/feedback:opacity-100 group-hover/feedback:opacity-100">
          <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger render={<Button variant="ghost" size="icon-xs" />}>
              <span className="sr-only">Give block feedback</span>
              <MessageCircleIcon />
            </PopoverTrigger>
            <PopoverContent align="end" className="w-80">
              <PopoverHeader>
                <PopoverTitle>Feedback on this block</PopoverTitle>
                <PopoverDescription>
                  Tell us what should be improved.
                </PopoverDescription>
              </PopoverHeader>
              <label htmlFor={textAreaId} className="sr-only">
                Feedback message
              </label>
              <Textarea
                id={textAreaId}
                value={message}
                onChange={(event) => setMessage(event.target.value)}
                placeholder="What can be clearer?"
                maxLength={4000}
              />
              <div className="flex items-center justify-between gap-2">
                <span
                  className={cn(
                    "text-xs",
                    state.error ? "text-destructive" : "text-muted-foreground",
                  )}
                >
                  {state.error ?? " "}
                </span>
                <Button
                  type="button"
                  size="sm"
                  onClick={submit}
                  disabled={!canSubmit}
                >
                  <SendHorizontalIcon />
                  {isPending ? "Sending..." : "Send"}
                </Button>
              </div>
              <SuccessHint response={state.response} />
            </PopoverContent>
          </Popover>
        </div>
      </div>
    </div>
  );
}
