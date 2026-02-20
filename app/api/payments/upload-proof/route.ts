import { getAuthenticatedUser } from "@/lib/auth/server-user";
import { createPaymentProof } from "@/lib/domain/payments/payment-route-use-cases";
import { type NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get("file");
    const transactionId = String(formData.get("transaction_id") ?? "").trim();
    const orderId = String(formData.get("order_id") ?? "").trim();

    if (!(file instanceof File) || !transactionId) {
      return NextResponse.json({ error: "file and transaction_id are required" }, { status: 400 });
    }

    const proof = await createPaymentProof({
      orderId: orderId || null,
      transactionId,
      fileUrl: `local-proof://${Date.now()}-${file.name}`,
      fileType: file.type || "application/octet-stream",
    });

    return NextResponse.json({ success: true, proof }, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to upload payment proof" },
      { status: 500 },
    );
  }
}
