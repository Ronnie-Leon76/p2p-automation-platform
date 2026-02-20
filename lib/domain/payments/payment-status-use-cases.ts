import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db/prisma";
import { sasapayService } from "@/lib/services/sasapay-service";

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

type SasaPayTransaction = {
  id: string;
  transaction_id: string;
  sasapay_transaction_id: string | null;
  paybill_number: string | null;
  account_number: string | null;
  sasapay_status: string | null;
  callback_received_at: Date | string | null;
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

async function getSasaPayTransaction(
  transactionId: string
): Promise<SasaPayTransaction | null> {
  try {
    const rows = await prisma.$queryRaw<SasaPayTransaction[]>(
      Prisma.sql`
        SELECT
          id,
          transaction_id,
          sasapay_transaction_id,
          paybill_number,
          account_number,
          sasapay_status,
          callback_received_at
        FROM sasapay_transactions
        WHERE transaction_id = ${transactionId}
        LIMIT 1
      `
    );
    return rows[0] ?? null;
  } catch {
    return null;
  }
}

async function markSasaPayTransactionCompleted(
  transactionId: string,
  sasapayId: string
): Promise<void> {
  const now = new Date();

  try {
    await prisma.$executeRaw(
      Prisma.sql`
        UPDATE payment_transactions
        SET status = 'completed', completed_at = ${now}
        WHERE id = ${transactionId}
      `
    );
  } catch {
    // Ignore if table is missing.
  }

  try {
    await prisma.$executeRaw(
      Prisma.sql`
        UPDATE transactions
        SET status = 'completed', completed_at = ${now}
        WHERE id = ${transactionId}
      `
    );
  } catch {
    // Ignore if legacy table is missing.
  }

  await prisma.$executeRaw(
    Prisma.sql`
      UPDATE sasapay_transactions
      SET sasapay_status = 'completed'
      WHERE id = ${sasapayId}
    `
  );
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

export async function getSasaPayStatusUseCase(transactionId: string) {
  const transaction = await getPaymentTransactionById(transactionId);
  if (!transaction) {
    return null;
  }

  const sasapayTransaction = await getSasaPayTransaction(transactionId);
  let liveStatus: unknown = null;

  if (sasapayTransaction?.sasapay_transaction_id) {
    try {
      liveStatus = await sasapayService.queryPaymentStatus(
        sasapayTransaction.sasapay_transaction_id
      );

      const liveStatusRecord = liveStatus as Record<string, unknown>;
      const resultCode = liveStatusRecord?.result_code;

      if (
        resultCode === "0" &&
        transaction.status === "pending" &&
        sasapayTransaction.id
      ) {
        await markSasaPayTransactionCompleted(
          transactionId,
          sasapayTransaction.id
        );
      }
    } catch (error) {
      console.error("Error querying SASAPAY status:", error);
    }
  }

  return {
    success: true,
    transaction: {
      id: transaction.id,
      status: transaction.status,
      amount: transaction.amount,
      currency: transaction.currency,
      created_at: transaction.createdAt,
      completed_at: transaction.completedAt,
      order_id: transaction.orderId,
      payment_provider: transaction.paymentProvider,
    },
    sasapay_details: sasapayTransaction
      ? {
          checkout_request_id: sasapayTransaction.sasapay_transaction_id,
          paybill_number: sasapayTransaction.paybill_number,
          account_number: sasapayTransaction.account_number,
          status: sasapayTransaction.sasapay_status,
          callback_received: Boolean(sasapayTransaction.callback_received_at),
        }
      : null,
    live_status: liveStatus,
  };
}
