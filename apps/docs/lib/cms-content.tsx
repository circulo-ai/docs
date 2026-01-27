type CmsContentProps = {
  content: unknown;
};

export function CmsContent({ content }: CmsContentProps) {
  return (
    <pre className="my-6 overflow-auto rounded-lg border border-fd-border bg-fd-secondary p-4 text-xs text-fd-foreground">
      {JSON.stringify(content, null, 2)}
    </pre>
  );
}
