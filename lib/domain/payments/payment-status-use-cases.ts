import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db/prisma";

type GenericRecord = Record<string, unknown>;

type UnifiedPaymentTransaction = {
  id: string;
  status: string | null;
  amount: number | string | null;
  currency: string | null;
  createdAt: Date | string | null;
  completedAt: Date | string | null;
  orderId: string | null;
  paymentProvider: string | null;
};


function normalizeTransaction(row: GenericRecord): UnifiedPaymentTransaction {
  return {
    id: String(row.id),
    status: (row.status as string | null) ?? null,
    amount: (row.amount as number | string | null) ?? null,
    currency: (row.currency as string | null) ?? null,
    createdAt:
      (row.initiated_at as Date | string | null) ??
      (row.created_at as Date | string | null) ??
      null,
    completedAt:
      (row.completed_at as Date | string | null) ??
      (row.updated_at as Date | string | null) ??
      null,
    orderId: (row.order_id as string | null) ?? null,
    paymentProvider: (row.payment_provider as string | null) ?? null,
  };
}

async function getPaymentTransactionById(
  transactionId: string
): Promise<UnifiedPaymentTransaction | null> {
  try {
    const paymentRows = await prisma.$queryRaw<GenericRecord[]>(
      Prisma.sql`
        SELECT
          id,
          status,
          amount,
          currency,
          initiated_at,
          completed_at,
          order_id,
          payment_provider,
          created_at,
          updated_at
        FROM payment_transactions
        WHERE id = ${transactionId}
        LIMIT 1
      `
    );

    if (paymentRows.length > 0) {
      return normalizeTransaction(paymentRows[0]);
    }
  } catch {
    // Table may not exist in partially migrated environments.
  }

  try {
    const legacyRows = await prisma.$queryRaw<GenericRecord[]>(
      Prisma.sql`
        SELECT
          id,
          status,
          amount,
          currency,
          created_at,
          completed_at,
          order_id,
          payment_provider
        FROM transactions
        WHERE id = ${transactionId}
        LIMIT 1
      `
    );

    if (legacyRows.length > 0) {
      return normalizeTransaction(legacyRows[0]);
    }
  } catch {
    // Legacy table may not exist either.
  }

  return null;
}

export async function getPaymentStatusUseCase(transactionId: string) {
  const transaction = await getPaymentTransactionById(transactionId);
  if (!transaction) {
    return null;
  }

  return {
    id: transaction.id,
    status: transaction.status,
    amount: transaction.amount,
    currency: transaction.currency,
    created_at: transaction.createdAt,
    completed_at: transaction.completedAt,
    order_id: transaction.orderId,
    payment_provider: transaction.paymentProvider,
  };
}
