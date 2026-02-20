import { getAuthenticatedUser } from "@/lib/auth/server-user";
import { NextResponse } from "next/server";

export async function POST() {
  try {
    const user = await getAuthenticatedUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    return NextResponse.json({ success: true, message: "Email verification sent! Please check your inbox." }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ error: "Failed to send email verification" }, { status: 500 });
  }
}

