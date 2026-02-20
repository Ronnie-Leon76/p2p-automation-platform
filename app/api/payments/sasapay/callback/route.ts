import { NextRequest, NextResponse } from "next/server";

export async function POST(_request: NextRequest) {
  return NextResponse.json({ error: "SasaPay callback route is not migrated to Prisma yet." }, { status: 501 });
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const challenge = searchParams.get("challenge");

  if (challenge) {
    return NextResponse.json({ challenge });
  }

  return NextResponse.json({ error: "SasaPay callback route is not migrated to Prisma yet." }, { status: 501 });
}
