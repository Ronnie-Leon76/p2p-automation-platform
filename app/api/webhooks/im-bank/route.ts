import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  void request;
  return NextResponse.json({ error: "I&M webhook route is not migrated to Prisma yet." }, { status: 501 })
}

