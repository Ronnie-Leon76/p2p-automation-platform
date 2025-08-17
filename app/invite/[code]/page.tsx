"use client";

import dynamic from "next/dynamic";

const InviteAcceptancePage = dynamic(
  () => import("@/components/invite-acceptance-page").then((mod) => ({ default: mod.InviteAcceptancePage })),
  { 
    ssr: false,
    loading: () => <div className="flex items-center justify-center p-8">Loading...</div>
  }
);

interface InvitePageProps {
  params: {
    code: string;
  };
}

export default function InvitePage({ params }: InvitePageProps) {
  return <InviteAcceptancePage inviteCode={params.code} />;
}
