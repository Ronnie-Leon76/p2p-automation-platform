// Smart wrapper that chooses the right component based on environment
"use client";

import { isMockMode } from "@/lib/config/environment";
import dynamic from "next/dynamic";

// Dynamically import components to avoid bundle bloat
const AdManagementRegular = dynamic(
  () => import("./ad-management").then((mod) => ({ default: mod.AdManagement })),
  { 
    ssr: false,
    loading: () => <div className="flex items-center justify-center p-8">Loading...</div>
  }
);

const AdManagementEnhanced = dynamic(
  () => import("./ad-management-enhanced").then((mod) => ({ default: mod.AdManagement })),
  { 
    ssr: false,
    loading: () => <div className="flex items-center justify-center p-8">Loading...</div>
  }
);

interface AdManagementProps {
  // Common props that both components accept
  mode?: "regular" | "enhanced" | "auto";
}

export function AdManagement({ mode = "auto" }: AdManagementProps = {}) {
  // Auto-detect mode based on environment
  const shouldUseEnhanced = mode === "enhanced" || 
    (mode === "auto" && !isMockMode());

  if (shouldUseEnhanced) {
    return <AdManagementEnhanced />;
  }

  return <AdManagementRegular />;
}

export default AdManagement;
