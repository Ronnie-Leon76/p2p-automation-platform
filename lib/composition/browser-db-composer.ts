import { createClient } from "@/lib/supabase/client";

let cachedClient: ReturnType<typeof createClient> | null = null;

export function getBrowserDbClient() {
  if (!cachedClient) {
    cachedClient = createClient();
  }
  return cachedClient;
}
