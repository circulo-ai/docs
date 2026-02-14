import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Spinner } from "@/components/ui/spinner";
import { DocsPage } from "fumadocs-ui/layouts/docs/page";

export default function Loading() {
  return (
    <DocsPage>
      <aside className="hidden w-72 shrink-0 space-y-3 lg:block">
        <Skeleton className="h-9 w-full rounded-lg" />
        <Skeleton className="h-5 w-4/5" />
        <Skeleton className="h-5 w-5/6" />
        <Skeleton className="h-5 w-3/4" />
        <Skeleton className="h-5 w-2/3" />
        <Skeleton className="h-5 w-4/5" />
      </aside>

      <main className="min-w-0 flex-1">
        <Card className="py-0">
          <div className="flex items-center gap-2 border-b px-4 py-3">
            <Spinner className="text-primary" />
            <p
              className="text-sm text-muted-foreground"
              role="status"
              aria-live="polite"
            >
              Loading documentation...
            </p>
          </div>
          <CardContent className="space-y-5 py-6">
            <Skeleton className="h-5 w-1/3" />
            <Skeleton className="h-10 w-3/4" />
            <Skeleton className="h-5 w-full" />
            <Skeleton className="h-5 w-full" />
            <Skeleton className="h-5 w-5/6" />
            <Skeleton className="h-36 w-full rounded-xl" />
            <Skeleton className="h-5 w-2/3" />
            <Skeleton className="h-5 w-full" />
            <Skeleton className="h-5 w-4/5" />
          </CardContent>
        </Card>
      </main>

      <aside className="hidden w-56 shrink-0 space-y-3 xl:block">
        <Skeleton className="h-5 w-1/2" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-5/6" />
        <Skeleton className="h-4 w-2/3" />
        <Skeleton className="h-4 w-3/4" />
      </aside>
    </DocsPage>
  );
}
