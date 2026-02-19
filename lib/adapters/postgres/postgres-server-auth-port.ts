import type { AuthPortUser, ServerAuthPort } from "@/lib/ports/auth-port";
import { headers } from "next/headers";
import { betterAuthServer } from "@/lib/auth/better-auth/server";

function mapSessionUser(session: any): AuthPortUser | null {
  const user = session?.user;
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

export class PostgresServerAuthPort implements ServerAuthPort {
  async getCurrentUser(): Promise<AuthPortUser | null> {
    const requestHeaders = await headers();
    const session = await (betterAuthServer as any).api.getSession({
      headers: requestHeaders,
    });

    return mapSessionUser(session);
  }
}
