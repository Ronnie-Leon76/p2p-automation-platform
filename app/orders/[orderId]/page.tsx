import { redirect } from "next/navigation";

export default async function LegacyOrdersDetailsPage({
  params,
}: {
  params: Promise<{ orderId: string }>;
}) {
  const { orderId } = await params;
  redirect(`/dashboard/orders/${encodeURIComponent(orderId)}`);
}

