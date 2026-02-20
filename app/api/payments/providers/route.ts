import { NextRequest, NextResponse } from "next/server";

export async function GET(_request: NextRequest) {
  return NextResponse.json({ error: "Payment providers route is not migrated to Prisma yet." }, { status: 501 });
}
