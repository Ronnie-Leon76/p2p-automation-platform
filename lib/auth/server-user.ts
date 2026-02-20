import { getBackendAdapter } from "@/lib/composition/backend-adapter";
import { getServerAuthPort } from "@/lib/composition/auth-composer.server";
import { createServerClient } from "@/lib/supabase/server";

export type AuthenticatedUser = {
  id: string;
  email?: string;
  user_metadata?: Record<string, any>;
};

export async function getAuthenticatedUser(): Promise<AuthenticatedUser | null> {
  const adapter = getBackendAdapter();

  if (adapter === "postgres") {
    const authPort = getServerAuthPort();
    const user = await authPort.getCurrentUser();
    if (!user) {
      return null;
    }
    return {
      id: user.id,
      email: user.email,
      user_metadata: user.user_metadata,
    };
  }

  const supabase = await createServerClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    return null;
  }

  return {
    id: user.id,
    email: user.email,
    user_metadata: user.user_metadata ?? {},
  };
}
