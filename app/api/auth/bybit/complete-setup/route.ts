import { type NextRequest, NextResponse } from "next/server";

export async function POST(_request: NextRequest) {
  return NextResponse.json(
    { error: "Legacy Bybit setup endpoint is retired. Use Better Auth + Prisma flows." },
    { status: 410 },
  );
}
