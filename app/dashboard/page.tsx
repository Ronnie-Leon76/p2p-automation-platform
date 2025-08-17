"use client";

import { AppSidebar } from "@/components/app-sidebar";
import { DashboardOverview } from "@/components/dashboard-overview";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";

export default function DashboardPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      <SidebarProvider>
        <AppSidebar />
        <SidebarInset>
          <header className="flex h-16 shrink-0 items-center gap-2 border-b border-white/10 bg-black/20 backdrop-blur-lg px-4">
            <SidebarTrigger className="-ml-1 text-white" />
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-semibold text-white">
                P2P Automation Dashboard
              </h1>
            </div>
          </header>
          <div className="flex flex-1 flex-col gap-4 p-4">
            <DashboardOverview />
          </div>
        </SidebarInset>
      </SidebarProvider>
    </div>
  );
}
