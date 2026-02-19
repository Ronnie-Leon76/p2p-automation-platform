import { betterAuthServer } from "@/lib/auth/better-auth/server";
import { getBackendAdapter } from "@/lib/composition/backend-adapter";
import { createServerClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  const adapter = getBackendAdapter();

  if (adapter === "postgres") {
    return (betterAuthServer as any).api.signOut({
      headers: request.headers,
      asResponse: true,
    });
  }

  const supabase = await createServerClient();
  const { error } = await supabase.auth.signOut();
  if (error) {
    return Response.json({ error: error.message }, { status: 400 });
  }

  return Response.json({ success: true }, { status: 200 });
}
