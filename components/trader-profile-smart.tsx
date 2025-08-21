// Smart wrapper for TraderProfile components
"use client";

import { isMockMode } from "@/lib/config/environment";
import dynamic from "next/dynamic";

// Dynamically import components
const TraderProfileRegular = dynamic(
  () =>
    import("./trader-profile").then((mod) => ({ default: mod.TraderProfile })),
  {
    ssr: false,
    loading: () => (
      <div className="flex items-center justify-center p-8">Loading...</div>
    ),
  }
);

const TraderProfileEnhanced = dynamic(
  () =>
    import("./trader-profile-enhanced").then((mod) => ({
      default: mod.TraderProfile,
    })),
  {
    ssr: false,
    loading: () => (
      <div className="flex items-center justify-center p-8">Loading...</div>
    ),
  }
);

interface TraderProfileProps {
  mode?: "regular" | "enhanced" | "auto";
}

export function TraderProfile({ mode = "auto" }: TraderProfileProps = {}) {
  // Auto-detect mode based on environment
  const shouldUseEnhanced =
    mode === "enhanced" || (mode === "auto" && !isMockMode());

  if (shouldUseEnhanced) {
    return <TraderProfileEnhanced />;
  }

  return <TraderProfileRegular />;
}

export default TraderProfile;
