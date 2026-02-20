import type { AuthPort, AuthPortUser } from "@/lib/ports/auth-port";
import { getDashboardBootstrapCached } from "@/lib/client/dashboard-bootstrap-cache";

function mapSessionUser(payload: any): AuthPortUser | null {
  const user = payload?.user;
  if (!user?.id) {
    return null;
  }

  return {
    id: user.id,
    email: user.email,
    user_metadata: {
      name: user.name || user.full_name,
      image: user.image,
    },
  };
}

export class PostgresAuthPort implements AuthPort {
  private static sessionCache: { user: AuthPortUser | null; expiresAt: number } | null = null;
  private static inFlight: Promise<AuthPortUser | null> | null = null;
  private static subscribers = new Set<(user: AuthPortUser | null) => void>();
  private static listenersAttached = false;

  private static notifySubscribers(user: AuthPortUser | null) {
    PostgresAuthPort.subscribers.forEach((callback) => {
      callback(user);
    });
  }

  private static async fetchSession(forceRefresh: boolean): Promise<AuthPortUser | null> {
    const now = Date.now();
    if (!forceRefresh && PostgresAuthPort.sessionCache && PostgresAuthPort.sessionCache.expiresAt > now) {
      return PostgresAuthPort.sessionCache.user;
    }

    if (PostgresAuthPort.inFlight) {
      return PostgresAuthPort.inFlight;
    }

    PostgresAuthPort.inFlight = (async () => {
      try {
        const payload = await getDashboardBootstrapCached({
          exchange: "okx",
          minimal: true,
          types: ["profile"],
          ttlMs: 60_000,
        });
        const user = mapSessionUser(payload);
        PostgresAuthPort.sessionCache = { user, expiresAt: now + 60_000 };
        return user;
      } catch {
        PostgresAuthPort.sessionCache = { user: null, expiresAt: now + 10_000 };
        return null;
      } finally {
        PostgresAuthPort.inFlight = null;
      }
    })();

    return PostgresAuthPort.inFlight;
  }

  private static attachGlobalListeners() {
    if (PostgresAuthPort.listenersAttached) {
      return;
    }
    PostgresAuthPort.listenersAttached = true;

    const syncUser = async () => {
      const user = await PostgresAuthPort.fetchSession(true);
      PostgresAuthPort.notifySubscribers(user);
    };

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
  }

  async getCurrentUser(): Promise<AuthPortUser | null> {
    return PostgresAuthPort.fetchSession(false);
  }

  onAuthStateChange(callback: (user: AuthPortUser | null) => void): () => void {
    PostgresAuthPort.attachGlobalListeners();
    PostgresAuthPort.subscribers.add(callback);
    void this.getCurrentUser().then((user) => callback(user));

    return () => {
      PostgresAuthPort.subscribers.delete(callback);
    };
  }

  async signOut(): Promise<void> {
    await fetch("/api/auth/sign-out", {
      method: "POST",
      credentials: "include",
    });
  }
}
