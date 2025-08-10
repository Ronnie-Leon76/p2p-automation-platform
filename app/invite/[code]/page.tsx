import { InviteAcceptancePage } from "@/components/invite-acceptance-page";

interface InvitePageProps {
  params: {
    code: string;
  };
}

export default function InvitePage({ params }: InvitePageProps) {
  return <InviteAcceptancePage inviteCode={params.code} />;
}

export async function generateMetadata({ params }: InvitePageProps) {
  return {
    title: `Team Invitation - ${params.code}`,
    description: "Join a P2P trading team",
  };
}
