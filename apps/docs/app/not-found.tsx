import Link from "next/link";

import { Button } from "@/components/ui/button";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { DocsPage } from "fumadocs-ui/layouts/docs/page";
import { ChevronLeftIcon, SearchIcon } from "lucide-react";

export default function NotFound() {
  return (
    <DocsPage>
      <Empty className="border bg-card/40 py-10">
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <SearchIcon />
          </EmptyMedia>
          <EmptyTitle className="text-base">Page not found</EmptyTitle>
          <EmptyDescription>
            We couldn&apos;t find the page you were looking for.
          </EmptyDescription>
        </EmptyHeader>
        <EmptyContent className="max-w-none sm:flex-row sm:justify-center">
          <Button size="lg" nativeButton={false} render={<Link href="d" />}>
            <ChevronLeftIcon data-icon="inline-start" />
            Return to docs home
          </Button>
        </EmptyContent>
      </Empty>
    </DocsPage>
  );
}
