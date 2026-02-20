"use client";

import dynamic from "next/dynamic";
import { useParams } from "next/navigation";

const InviteAcceptancePage = dynamic(
  () => import("@/components/invite-acceptance-page").then((mod) => ({ default: mod.InviteAcceptancePage })),
  { 
    ssr: false,
    loading: () => <div className="flex items-center justify-center p-8">Loading...</div>
  }
);

export default function InvitePage() {
  const params = useParams<{ code: string }>();
  return <InviteAcceptancePage inviteCode={params.code} />;
}
