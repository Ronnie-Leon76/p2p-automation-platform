import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { prisma } from "@/lib/db/prisma";

const betterAuthUrl = process.env.BETTER_AUTH_URL ?? process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

if (!process.env.BETTER_AUTH_SECRET && process.env.NODE_ENV === "production") {
  throw new Error("BETTER_AUTH_SECRET must be set in production.");
}

export const betterAuthServer = betterAuth({
  database: prismaAdapter(prisma, {
    provider: "postgresql",
  }),
  secret: process.env.BETTER_AUTH_SECRET ?? "dev-only-unsafe-secret",
  baseURL: betterAuthUrl,
  emailAndPassword: {
    enabled: true,
  },
});
