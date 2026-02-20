import { getServerAuthPort } from "@/lib/composition/auth-composer.server";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const serverAuthPort = getServerAuthPort();
    const user = await serverAuthPort.getCurrentUser();
    if (!user) {
      return NextResponse.json({ authenticated: false, user: null }, { status: 200 });
    }

    return NextResponse.json(
      {
        authenticated: true,
        user: {
          id: user.id,
          email: user.email,
          user_metadata: user.user_metadata ?? {},
        },
      },
      { status: 200 }
    );
  } catch (error) {
    return NextResponse.json({ authenticated: false, user: null }, { status: 200 });
  }
}
