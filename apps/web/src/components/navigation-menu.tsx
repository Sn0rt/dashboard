"use client";

import { Icons } from "@/components/icons";
import { cn } from "@/lib/utils";
import { NavItem } from "../../constants";
import Link from "next/link";
import { usePathname } from "next/navigation";

export const DashboardNav = ({
  navItems,
  className,
}: {
  navItems: NavItem[];
  className?: string;
}) => {
  const pathName = usePathname();

  return (
    <div className={cn(className)}>
      <div className="left-0 top-0 flex w-full flex-col gap-1">
        {navItems.map(({ title, icon, href, disable }) => {
          const Icon = Icons[icon!] || Icons.notepad;
          const active = pathName === href || pathName.startsWith(`${href}/`);

          return (
            <Link
              key={title}
              href={disable ? "#" : href}
              className={cn(
                "group flex items-center gap-2 overflow-hidden rounded-md p-2 text-sm font-medium",
                "text-black hover:bg-gray-100",
                "outline-none focus-visible:ring-2 focus-visible:ring-black",
                active &&
                  "bg-primary/90 text-white hover:bg-primary/80 active:text-white",
                disable && "cursor-not-allowed opacity-70",
              )}
              aria-current={active ? "page" : undefined}
              aria-disabled={disable || undefined}
              onClick={(event) => {
                if (disable) event.preventDefault();
              }}
            >
              <Icon
                className={cn("size-4 text-black", active && "text-white")}
              />
              {title}
            </Link>
          );
        })}
      </div>
    </div>
  );
};
