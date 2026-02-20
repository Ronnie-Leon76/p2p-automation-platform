import { type NextRequest, NextResponse } from "next/server";

export async function POST(_request: NextRequest) {
  return NextResponse.json({ error: "Payment initiation route is not migrated to Prisma yet." }, { status: 501 });
}
