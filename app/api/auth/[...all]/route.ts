import { betterAuthServer } from "@/lib/auth/better-auth/server";

export async function GET(request: Request) {
  return betterAuthServer.handler(request);
}

export async function POST(request: Request) {
  return betterAuthServer.handler(request);
}
