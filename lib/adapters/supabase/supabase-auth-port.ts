import { createClient } from "@/lib/supabase/client";
import type { AuthPort, AuthPortUser } from "@/lib/ports/auth-port";

export class SupabaseAuthPort implements AuthPort {
  private supabase = createClient();

  async getCurrentUser(): Promise<AuthPortUser | null> {
    const {
      data: { user },
      error,
    } = await this.supabase.auth.getUser();

    if (error || !user) {
      return null;
    }

    return {
      id: user.id,
      email: user.email,
      user_metadata: user.user_metadata,
    };
  }

  onAuthStateChange(callback: (user: AuthPortUser | null) => void): () => void {
    const { data } = this.supabase.auth.onAuthStateChange((_event, session) => {
      const user = session?.user
        ? {
            id: session.user.id,
            email: session.user.email,
            user_metadata: session.user.user_metadata,
          }
        : null;
      callback(user);
    });

    return () => data.subscription.unsubscribe();
  }

  async signOut(): Promise<void> {
    await this.supabase.auth.signOut();
  }
}
