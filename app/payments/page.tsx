import { AppSidebar } from "@/components/app-sidebar";
import { PaymentsOverview } from "@/components/payments-overview";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";

export default function PaymentsPage() {
  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
          <SidebarTrigger className="-ml-1" />
          <div className="flex items-center gap-2">
            <h1 className="text-lg font-semibold">Payments</h1>
          </div>
        </header>
        <div className="flex flex-1 flex-col gap-4 p-4">
          <PaymentsOverview />
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
