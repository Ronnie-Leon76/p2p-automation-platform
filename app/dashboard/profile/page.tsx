import { AppSidebar } from "@/components/app-sidebar";
import { TraderProfile } from "@/components/trader-profile";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { createServerClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export default async function ProfilePage() {
  // In development mode, bypass Supabase auth check
  if (process.env.NODE_ENV !== "development") {
    const supabase = createServerClient();

    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session) {
      redirect("/auth");
    }
  }

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
          <SidebarTrigger className="-ml-1" />
          <div className="flex items-center gap-2">
            <h1 className="text-lg font-semibold">Trader Profile</h1>
          </div>
        </header>
        <div className="flex flex-1 flex-col gap-4 p-4">
          <TraderProfile />
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
