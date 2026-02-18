import { createServerClient } from "@/lib/supabase/server";
import type { AuthPortUser, ServerAuthPort } from "@/lib/ports/auth-port";

export class SupabaseServerAuthPort implements ServerAuthPort {
  async getCurrentUser(): Promise<AuthPortUser | null> {
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
      user_metadata: user.user_metadata,
    };
  }
}
