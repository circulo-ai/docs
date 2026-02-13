import Link from "next/link";

import { buttonVariants } from "@/components/ui/button";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { ChevronLeftIcon, SearchIcon } from "lucide-react";

export default function NotFound() {
  return (
    <div className="mx-auto flex w-full max-w-3xl flex-1 items-center px-4 py-12 md:px-6">
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
          <Link href="/" className={buttonVariants({ size: "lg" })}>
            <ChevronLeftIcon data-icon="inline-start" />
            Return to docs home
          </Link>
        </EmptyContent>
      </Empty>
    </div>
  );
}
