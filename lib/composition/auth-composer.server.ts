import { PostgresServerAuthPort } from "@/lib/adapters/postgres/postgres-server-auth-port";
import type { ServerAuthPort } from "@/lib/ports/auth-port";

type SupportedAdapter = "mock" | "postgres";

function getAdapter(): SupportedAdapter {
  const configured =
    process.env.BACKEND_ADAPTER?.toLowerCase() ??
    process.env.NEXT_PUBLIC_BACKEND_ADAPTER?.toLowerCase();

  if (configured === "mock" || configured === "postgres") {
    return configured;
  }
  return "postgres";
}

export function getServerAuthPort(): ServerAuthPort {
  const adapter = getAdapter();
  if (adapter === "postgres") {
    return new PostgresServerAuthPort();
  }
  throw new Error(`Server auth adapter '${adapter}' is not implemented yet.`);
}
