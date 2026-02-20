import { AppSidebar } from "@/components/app-sidebar";
import { PaymentIntegration } from "@/components/payment-integration";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { createServerClient } from "@/lib/database/server-client";
import { redirect } from "next/navigation";

export default async function OrderDetailsPage({
  params,
}: {
  params: Promise<{ orderId: string }>;
}) {
  const { orderId } = await params;
  const supabase = await createServerClient();

  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    redirect("/auth/login");
  }

  // Fetch order details
  const { data: order, error } = await supabase
    .from("orders")
    .select(
      `
      *,
      ads(*)
    `
    )
    .eq("id", orderId)
    .single();

  if (error || !order) {
    redirect("/dashboard/orders");
  }

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
          <SidebarTrigger className="-ml-1" />
          <div className="flex items-center gap-2">
            <h1 className="text-lg font-semibold">Order Details</h1>
          </div>
        </header>
        <div className="flex flex-1 flex-col gap-4 p-4">
          <Card>
            <CardHeader>
              <CardTitle>Order #{order.id.slice(-8)}</CardTitle>
              <CardDescription>
                {order.side.toUpperCase()} {order.crypto_amount}{" "}
                {order.crypto_currency} for {order.fiat_amount}{" "}
                {order.fiat_currency}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Status</p>
                  <p className="font-medium">{order.order_status}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">
                    Payment Status
                  </p>
                  <p className="font-medium">{order.payment_status}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Created</p>
                  <p className="font-medium">
                    {new Date(order.created_at).toLocaleString()}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Exchange</p>
                  <p className="font-medium">
                    {order.exchange_name.toUpperCase()}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Payment Management</CardTitle>
              <CardDescription>
                Manage payments and upload proof of payment for this order
              </CardDescription>
            </CardHeader>
            <CardContent>
              <PaymentIntegration orderId={orderId} />
            </CardContent>
          </Card>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
