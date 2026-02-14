"use client";

import { DocsPage } from "fumadocs-ui/layouts/docs/page";
import { RotateCcwIcon, TriangleAlertIcon } from "lucide-react";
import { useEffect } from "react";

import { Button } from "@/components/ui/button";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";

type DocsErrorProps = {
  error: Error & { digest?: string };
  reset: () => void;
};

export default function Error({ error, reset }: DocsErrorProps) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <DocsPage>
      <Empty className="border bg-card/40">
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <TriangleAlertIcon aria-hidden="true" className="size-4" />
          </EmptyMedia>
          <EmptyTitle>Something went wrong</EmptyTitle>
          <EmptyDescription>
            We could not load this page. Please try again.
            {error.digest ? (
              <span className="mt-1 block font-mono text-xs text-muted-foreground">
                Error ID: {error.digest}
              </span>
            ) : null}
          </EmptyDescription>
        </EmptyHeader>
        <EmptyContent className="sm:flex-row sm:justify-center">
          <Button onClick={reset}>
            <RotateCcwIcon />
            Try again
          </Button>
        </EmptyContent>
      </Empty>
    </DocsPage>
  );
}
