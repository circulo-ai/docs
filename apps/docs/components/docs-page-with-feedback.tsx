import { Feedback } from "@/components/feedback-page/client";
import { cn } from "@/lib/utils";
import { DocsPage } from "fumadocs-ui/layouts/docs/page";
import { ComponentProps } from "react";

export function DocsPageWithFeedback({
  children,
  className,
  ...props
}: ComponentProps<typeof DocsPage>) {
  return (
    <DocsPage
      className={cn("[&>:last-child:not(:has(*))]:hidden", className)}
      {...props}
    >
      {children}
      <Feedback
        onSendAction={async (feedback) => {
          "use server";
          console.log(feedback);
          return await { githubUrl: undefined };
        }}
      />
    </DocsPage>
  );
}
