import { AppSidebar } from "@/components/app-sidebar";
import { AdManagementClient } from "@/components/ad-management-client";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { getAuthenticatedUser } from "@/lib/auth/server-user";
import { redirect } from "next/navigation";

export default async function AdsPage() {
  // In development mode, bypass auth check
  if (process.env.NODE_ENV !== "development") {
    const user = await getAuthenticatedUser();
    if (!user) {
      redirect("/auth/login");
    }
  }

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
          <SidebarTrigger className="-ml-1" />
          <div className="flex items-center gap-2">
            <h1 className="text-lg font-semibold">Ad Management</h1>
          </div>
        </header>
        <div className="flex flex-1 flex-col gap-4 p-4">
          <AdManagementClient />
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}

