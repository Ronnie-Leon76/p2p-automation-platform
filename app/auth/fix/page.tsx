"use client";

import dynamic from "next/dynamic";

// Dynamically import the FixAuthContent to avoid SSR issues with mock auth
const FixAuthContent = dynamic(
  () => import("./FixAuthContent"),
  { 
    ssr: false,
    loading: () => (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center p-4">
        <div className="text-white">Loading...</div>
      </div>
    )
  }
);

export default function FixAuthPage() {
  return <FixAuthContent />;
}
