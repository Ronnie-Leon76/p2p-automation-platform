import { getAuthenticatedUser } from "@/lib/auth/server-user";
import { isPostgresAdapter } from "@/lib/composition/backend-adapter";
import { prisma } from "@/lib/db/prisma";
import { createServerClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export async function GET() {
  try {
    const user = await getAuthenticatedUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (isPostgresAdapter()) {
      const preference = await prisma.userPreference.findUnique({
        where: { userId: user.id },
      });
      return NextResponse.json({ preferences: preference?.data ?? null }, { status: 200 });
    }

    const supabase = await createServerClient();
    const { data, error } = await supabase.from("user_preferences").select("*").eq("user_id", user.id).single();

    if (error) {
      return NextResponse.json({ preferences: null }, { status: 200 });
    }

    return NextResponse.json({ preferences: data }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ error: "Failed to load preferences" }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const user = await getAuthenticatedUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (isPostgresAdapter()) {
      await prisma.appUser.upsert({
        where: { id: user.id },
        create: {
          id: user.id,
          email: user.email,
          fullName: (body?.full_name as string | undefined) ?? user.user_metadata?.full_name ?? null,
          userType: (body?.user_type as string | undefined) ?? user.user_metadata?.user_type ?? "merchant",
          profileComplete: true,
          exchangeProvider: (body?.exchange_provider as string | undefined) ?? null,
        },
        update: {
          email: user.email,
          fullName: (body?.full_name as string | undefined) ?? undefined,
          userType: (body?.user_type as string | undefined) ?? undefined,
          profileComplete: true,
          exchangeProvider: (body?.exchange_provider as string | undefined) ?? undefined,
        },
      });

      await prisma.userPreference.upsert({
        where: { userId: user.id },
        create: {
          userId: user.id,
          data: body,
        },
        update: {
          data: body,
        },
      });

      return NextResponse.json({ success: true }, { status: 200 });
    }

    const supabase = await createServerClient();
    const { error } = await supabase.from("user_preferences").upsert({
      user_id: user.id,
      ...body,
      updated_at: new Date().toISOString(),
    });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    await supabase.from("users").update({ profile_complete: true }).eq("id", user.id);

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ error: "Failed to save preferences" }, { status: 500 });
  }
}
