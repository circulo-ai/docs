import { Feedback } from "@/components/feedback-page/client";
import { DocsPage } from "fumadocs-ui/layouts/docs/page";
import { ComponentProps } from "react";

export function DocsPageWithFeedback({
  children,
  ...props
}: ComponentProps<typeof DocsPage>) {
  return (
    <DocsPage {...props}>
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
