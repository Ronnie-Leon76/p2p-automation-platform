"use client";

import dynamic from "next/dynamic";

const EnhancedTeamManagement = dynamic(
  () => import("@/components/team-management").then((mod) => ({ default: mod.EnhancedTeamManagement })),
  { 
    ssr: false,
    loading: () => <div className="flex items-center justify-center p-8">Loading...</div>
  }
);

export default function TeamPage() {
  return <EnhancedTeamManagement />;
}
