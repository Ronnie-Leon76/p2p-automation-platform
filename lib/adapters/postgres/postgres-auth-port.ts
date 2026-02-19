import type { AuthPort, AuthPortUser } from "@/lib/ports/auth-port";

function mapSessionUser(payload: any): AuthPortUser | null {
  const user = payload?.user;
  if (!user?.id) {
    return null;
  }

  return {
    id: user.id,
    email: user.email,
    user_metadata: {
      name: user.name,
      image: user.image,
    },
  };
}

export class PostgresAuthPort implements AuthPort {
  async getCurrentUser(): Promise<AuthPortUser | null> {
    const response = await fetch("/api/auth/session", {
      method: "GET",
      credentials: "include",
      cache: "no-store",
    });

    if (!response.ok) {
      return null;
    }

    const payload = await response.json();
    if (!payload?.authenticated) {
      return null;
    }

    return mapSessionUser(payload);
  }

  onAuthStateChange(callback: (user: AuthPortUser | null) => void): () => void {
    let disposed = false;

    const syncUser = async () => {
      if (disposed) {
        return;
      }
      callback(await this.getCurrentUser());
    };

    void syncUser();

    const onVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        void syncUser();
      }
    };

    const onFocus = () => {
      void syncUser();
    };

    window.addEventListener("visibilitychange", onVisibilityChange);
    window.addEventListener("focus", onFocus);

    return () => {
      disposed = true;
      window.removeEventListener("visibilitychange", onVisibilityChange);
      window.removeEventListener("focus", onFocus);
    };
  }

  async signOut(): Promise<void> {
    await fetch("/api/auth/sign-out", {
      method: "POST",
      credentials: "include",
    });
  }
}
