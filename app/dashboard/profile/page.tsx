"use client";

import { AppSidebar } from "@/components/app-sidebar";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { createClient } from "@/lib/supabase/client";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

const TraderProfile = dynamic(
  () =>
    import("@/components/trader-profile-enhanced").then((mod) => ({
      default: mod.TraderProfile,
    })),
  {
    ssr: false,
    loading: () => (
      <div className="flex items-center justify-center p-8">Loading...</div>
    ),
  }
);

export default function ProfilePage() {
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    // Client-side auth check for production
    const checkAuth = async () => {
      if (process.env.NODE_ENV !== "development") {
        const {
          data: { session },
        } = await supabase.auth.getSession();
        if (!session) {
          router.push("/auth");
          return;
        }
      }
      setIsLoading(false);
    };

    checkAuth();
  }, [router, supabase]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">Loading...</div>
      </div>
    );
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
