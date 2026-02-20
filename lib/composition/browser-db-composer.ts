let cachedClient: any | null = null;

export function getBrowserDbClient() {
  if (!cachedClient) {
    cachedClient = new Proxy(
      {},
      {
        get() {
          throw new Error("Browser DB client is not migrated to Prisma yet.");
        },
      }
    );
  }
  return cachedClient;
}

