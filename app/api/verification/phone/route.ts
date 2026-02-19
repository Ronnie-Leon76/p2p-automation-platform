import { getAuthenticatedUser } from "@/lib/auth/server-user";
import { isPostgresAdapter } from "@/lib/composition/backend-adapter";
import { prisma } from "@/lib/db/prisma";
import { createServerClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const action = body?.action as "update" | "send" | "verify";
    const phoneNumber = body?.phoneNumber as string | undefined;
    const code = body?.code as string | undefined;

    const user = await getAuthenticatedUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (isPostgresAdapter()) {
      if (action === "update") {
        if (!phoneNumber) {
          return NextResponse.json({ error: "Phone number is required" }, { status: 400 });
        }
        await prisma.appUser.upsert({
          where: { id: user.id },
          create: {
            id: user.id,
            email: user.email,
            phone: phoneNumber,
          },
          update: {
            phone: phoneNumber,
          },
        });
        return NextResponse.json({ success: true, message: "Phone number updated successfully" }, { status: 200 });
      }

      if (action === "send") {
        if (!phoneNumber) {
          return NextResponse.json({ error: "Phone number is required" }, { status: 400 });
        }
        return NextResponse.json(
          {
            success: true,
            message: `Verification code would be sent to ${phoneNumber} (Feature coming soon)`,
          },
          { status: 200 }
        );
      }

      if (action === "verify") {
        if (!phoneNumber || !code) {
          return NextResponse.json({ error: "Phone number and code are required" }, { status: 400 });
        }
        return NextResponse.json({ success: true, message: "Phone verification successful! (Mock implementation)" }, { status: 200 });
      }

      return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    }

    const supabase = await createServerClient();
    const {
      data: { user: supabaseUser },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !supabaseUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (action === "update") {
      if (!phoneNumber) {
        return NextResponse.json({ error: "Phone number is required" }, { status: 400 });
      }
      const { error } = await supabase.auth.updateUser({ phone: phoneNumber });
      if (error) {
        return NextResponse.json({ error: error.message }, { status: 400 });
      }
      return NextResponse.json({ success: true, message: "Phone number updated successfully" }, { status: 200 });
    }

    if (action === "send") {
      if (!phoneNumber) {
        return NextResponse.json({ error: "Phone number is required" }, { status: 400 });
      }
      return NextResponse.json(
        {
          success: true,
          message: `Verification code would be sent to ${phoneNumber} (Feature coming soon)`,
        },
        { status: 200 }
      );
    }

    if (action === "verify") {
      if (!phoneNumber || !code) {
        return NextResponse.json({ error: "Phone number and code are required" }, { status: 400 });
      }
      return NextResponse.json({ success: true, message: "Phone verification successful! (Mock implementation)" }, { status: 200 });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error) {
    return NextResponse.json({ error: "Failed to process phone verification" }, { status: 500 });
  }
}
