import { SupabaseAuthPort } from "@/lib/adapters/supabase/supabase-auth-port";
import { SupabaseServerAuthPort } from "@/lib/adapters/supabase/supabase-server-auth-port";
import type { AuthPort, ServerAuthPort } from "@/lib/ports/auth-port";

type SupportedAdapter = "mock" | "supabase" | "postgres";

function getAdapter(): SupportedAdapter {
  const configured = process.env.NEXT_PUBLIC_BACKEND_ADAPTER?.toLowerCase();
  if (configured === "mock" || configured === "supabase" || configured === "postgres") {
    return configured;
  }
  return "supabase";
}

export function getAuthPort(): AuthPort {
  const adapter = getAdapter();
  if (adapter !== "supabase") {
    throw new Error(`Auth adapter '${adapter}' is not implemented yet.`);
  }
  return new SupabaseAuthPort();
}

export function getServerAuthPort(): ServerAuthPort {
  const adapter = getAdapter();
  if (adapter !== "supabase") {
    throw new Error(`Server auth adapter '${adapter}' is not implemented yet.`);
  }
  return new SupabaseServerAuthPort();
}
