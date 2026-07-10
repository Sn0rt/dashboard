import { DashboardUtils } from "@/components/(dashboard)/dashboard-utils";
import { ScrollArea } from "@/components/ui/scroll-area";

export default function DashboardPage() {
  return (
    <ScrollArea className="h-[calc(100dvh)]">
      <section className="container grid items-center gap-6 pb-6 pt-12">
        <div className="mx-auto flex max-w-[980px] flex-col items-start gap-2">
          <h1 className="text-center text-xl font-semibold text-purple">
            Dashboard
          </h1>
        </div>
      </section>
      <hr className="max-w-x" />
      <DashboardUtils />
    </ScrollArea>
  );
}
