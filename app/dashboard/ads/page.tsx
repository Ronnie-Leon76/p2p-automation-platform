import { AppSidebar } from "@/components/app-sidebar";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { createServerClient } from "@/lib/database/server-client";
import dynamic from "next/dynamic";
import { redirect } from "next/navigation";

const AdManagement = dynamic(
  () => import("@/components/ad-management-enhanced").then((mod) => ({ default: mod.AdManagement })),
  {
    ssr: false,
    loading: () => <div className="p-8">Loading ad management...</div>,
  },
);

export default async function AdsPage() {
  // In development mode, bypass Supabase auth check
  if (process.env.NODE_ENV !== "development") {
    const supabase = await createServerClient();

    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session) {
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
          <AdManagement />
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}

