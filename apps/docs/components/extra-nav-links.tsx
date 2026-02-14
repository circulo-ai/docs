import type { ExtraNavLink } from "@repo/docs-source";
import { Link2, icons, type LucideIcon } from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";

const resolveIcon = (iconName?: string): LucideIcon => {
  if (!iconName) return Link2;
  return (
    (icons[iconName as keyof typeof icons] as LucideIcon | undefined) ?? Link2
  );
};

type ExtraNavLinksProps = {
  links?: ExtraNavLink[] | null;
};

export function ExtraNavLinks({ links }: ExtraNavLinksProps) {
  const extraNavLinks = (links ?? []).filter(
    (link): link is ExtraNavLink =>
      typeof link?.label === "string" &&
      link.label.length > 0 &&
      typeof link.href === "string" &&
      link.href.length > 0,
  );

  if (extraNavLinks.length === 0) return null;
  return (
    <div className="mt-6 flex flex-col gap-3">
      {extraNavLinks.map(({ label, href, icon, variant, target }) => {
        const Icon = resolveIcon(icon);
        const rel = target === "_blank" ? "noopener noreferrer" : undefined;
        return (
          <Button
            key={`${label}:${href}`}
            variant={variant ?? "outline"}
            nativeButton={false}
            render={<Link href={href} target={target} rel={rel} />}
          >
            <Icon />
            {label}
          </Button>
        );
      })}
    </div>
  );
}
