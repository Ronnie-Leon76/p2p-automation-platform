export type SupportedBackendAdapter = "mock" | "supabase" | "postgres";

export function getBackendAdapter(): SupportedBackendAdapter {
  const configured =
    process.env.BACKEND_ADAPTER?.toLowerCase() ?? process.env.NEXT_PUBLIC_BACKEND_ADAPTER?.toLowerCase();

  if (configured === "mock" || configured === "supabase" || configured === "postgres") {
    return configured;
  }

  return "supabase";
}

export function isPostgresAdapter(): boolean {
  return getBackendAdapter() === "postgres";
}
