export type SupportedBackendAdapter = "mock" | "postgres";

export function getBackendAdapter(): SupportedBackendAdapter {
  const configured =
    process.env.BACKEND_ADAPTER?.toLowerCase() ?? process.env.NEXT_PUBLIC_BACKEND_ADAPTER?.toLowerCase();

  if (configured === "mock" || configured === "postgres") {
    return configured;
  }

  return "postgres";
}

export function isPostgresAdapter(): boolean {
  return getBackendAdapter() === "postgres";
}
