"use client";

import dynamic from "next/dynamic";

const AdManagement = dynamic(
  () =>
    import("@/components/ad-management-enhanced").then((mod) => ({
      default: mod.AdManagement,
    })),
  {
    ssr: false,
    loading: () => <div className="p-8">Loading ad management...</div>,
  },
);

export function AdManagementClient() {
  return <AdManagement />;
}
