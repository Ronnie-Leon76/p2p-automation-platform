import { OrderDetailsLive } from "@/components/order-details-live";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { getAuthenticatedUser } from "@/lib/auth/server-user";
import { redirect } from "next/navigation";

export default async function OrderDetailsPage({
  params,
}: {
  params: Promise<{ orderId: string }>;
}) {
  const { orderId } = await params;
  const user = await getAuthenticatedUser();
  if (!user) {
    redirect("/auth/login");
  }

  return (
    <main className="min-h-screen bg-background p-4 md:p-6">
      <div className="mx-auto w-full max-w-7xl space-y-4">
        <header className="border-b pb-3">
          <h1 className="text-lg font-semibold">Order Details</h1>
        </header>
        <Card>
          <CardHeader>
            <CardTitle>Order #{orderId.slice(-8)}</CardTitle>
          </CardHeader>
          <CardContent>
            <OrderDetailsLive orderId={orderId} />
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
