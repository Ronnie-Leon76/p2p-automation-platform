import { type NextRequest, NextResponse } from "next/server";

export async function POST(_request: NextRequest) {
  return NextResponse.json({ error: "Transaction matching routes are not migrated to Prisma yet." }, { status: 501 });
}

export async function GET(_request: NextRequest) {
  return NextResponse.json({ error: "Transaction matching routes are not migrated to Prisma yet." }, { status: 501 });
}
