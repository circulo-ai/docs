import { Link2, Unlink2 } from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Icon } from "@/types/icon";

type ExtraNavLink = {
  label: string;
  href: string;
  Icon: Icon;
};

const extraNavLinks: ExtraNavLink[] = [
  {
    label: "Link One",
    href: "#1",
    Icon: Link2,
  },
  {
    label: "Link Two",
    href: "#2",
    Icon: Unlink2,
  },
];

export function ExtraNavLinks() {
  return (
    <div className="mt-6 flex flex-col gap-3">
      {extraNavLinks.map(({ label, href, Icon }) => (
        <Button
          key={label}
          variant="outline"
          nativeButton={false}
          render={<Link href={href} />}
        >
          <Icon />
          {label}
        </Button>
      ))}
    </div>
  );
}
