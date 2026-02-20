import { betterAuthServer } from "@/lib/auth/better-auth/server";
import { getBackendAdapter } from "@/lib/composition/backend-adapter";

export async function POST(request: Request) {
  const adapter = getBackendAdapter();

  if (adapter === "postgres") {
    return (betterAuthServer as any).api.signOut({
      headers: request.headers,
      asResponse: true,
    });
  }
  return Response.json({ error: `Backend adapter '${adapter}' is not supported.` }, { status: 400 });
}

