import { PostgresAuthPort } from "@/lib/adapters/postgres/postgres-auth-port";
import type { AuthPort } from "@/lib/ports/auth-port";

type SupportedAdapter = "mock" | "postgres";

function getAdapter(): SupportedAdapter {
  const configured =
    process.env.NEXT_PUBLIC_BACKEND_ADAPTER?.toLowerCase() ?? process.env.BACKEND_ADAPTER?.toLowerCase();
  if (configured === "mock" || configured === "postgres") {
    return configured;
  }
  return "postgres";
}

export function getAuthPort(): AuthPort {
  const adapter = getAdapter();
  if (adapter === "postgres") {
    return new PostgresAuthPort();
  }
  throw new Error(`Auth adapter '${adapter}' is not implemented yet.`);
}
