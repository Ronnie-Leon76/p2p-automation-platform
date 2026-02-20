import { NextResponse, type NextRequest } from "next/server";

export async function POST(_request: NextRequest) {
  return NextResponse.json({ error: "P2P order routes are not migrated to Prisma yet." }, { status: 501 });
}

export async function GET(_request: NextRequest) {
  return NextResponse.json({ error: "P2P order routes are not migrated to Prisma yet." }, { status: 501 });
}
