import { NextRequest, NextResponse } from "next/server";

export async function POST(_request: NextRequest) {
  return NextResponse.json({ error: "SasaPay initiate route is not migrated to Prisma yet." }, { status: 501 });
}
