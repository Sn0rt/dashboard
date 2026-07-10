"use client";

import volcanoLogo from "@/assets/volcano-icon-color.svg";
import { DashboardNav } from "@/components/navigation-menu";
import { cn } from "@/lib/utils";
import { navSections } from "../../../../constants";
import Image from "next/image";

export default function Sidebar({ className }: { className?: string }) {
  return (
    <aside
      className={cn(
        "relative h-screen w-[240px] max-w-full flex-none border-r bg-card bg-neutral-100",
        className,
      )}
    >
      <div className="flex items-center p-5 pt-10">
        <Image
          src={volcanoLogo || "/placeholder.svg"}
          alt="Volcano Logo"
          width={32}
          height={32}
        />
        <span className="ml-2 text-xl font-semibold text-primary">Volcano</span>
      </div>
      <nav aria-label="Dashboard navigation" className="space-y-5 px-3 py-4">
        {navSections.map((section) => (
          <section key={section.title}>
            <h2 className="px-2 pb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              {section.title}
            </h2>
            <DashboardNav
              navItems={section.items}
              className="hidden md:flex md:col-span-3"
            />
          </section>
        ))}
      </nav>
    </aside>
  );
}
