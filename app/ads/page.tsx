"use client";

import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/app-sidebar"
import dynamic from "next/dynamic"

// Dynamically import AdManagement to avoid SSR issues with browser APIs
const AdManagement = dynamic(
  () => import("@/components/ad-management-enhanced").then((mod) => ({ default: mod.AdManagement })),
  { 
    ssr: false,
    loading: () => <div className="flex items-center justify-center p-8">Loading...</div>
  }
)

export default function AdsPage() {
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
  )
}
