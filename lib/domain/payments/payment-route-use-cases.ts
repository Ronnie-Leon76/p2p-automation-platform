import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db/prisma";

type GenericRow = Record<string, unknown>;

function toNumber(value: unknown): number | null {
  if (value == null) return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

export async function listPaymentProviders(teamId?: string | null) {
  try {
    const rows = await prisma.$queryRaw<GenericRow[]>(
      Prisma.sql`
        SELECT id, name, type, currency, is_active
        FROM payment_providers
        WHERE is_active = true
        AND (${teamId ?? null}::text IS NULL OR team_id = ${teamId ?? null})
        ORDER BY name ASC
      `
    );
    return rows;
  } catch {
    return [
      { id: "mpesa", name: "M-Pesa", type: "mobile_money", currency: "KES", is_active: true },
      { id: "bank_transfer", name: "Bank Transfer", type: "bank", currency: "KES", is_active: true },
    ];
  }
}

export async function createPaymentTransaction(input: {
  teamId?: string | null;
  providerId: string;
  orderId?: string | null;
  amount: number;
  currency?: string;
  payerPhone?: string | null;
  payerName?: string | null;
  description?: string | null;
}) {
  const now = new Date();
  const expiresAt = new Date(now.getTime() + 15 * 60 * 1000);
  const txRef = `TX-${Date.now()}`;

  const rows = await prisma.$queryRaw<GenericRow[]>(
    Prisma.sql`
      INSERT INTO payment_transactions (
        team_id,
        provider_id,
        order_id,
        amount,
        currency,
        status,
        payer_phone,
        payer_name,
        description,
        reference_number,
        initiated_at,
        expires_at,
        created_at,
        updated_at
      ) VALUES (
        ${input.teamId ?? null},
        ${input.providerId},
        ${input.orderId ?? null},
        ${input.amount},
        ${input.currency ?? "KES"},
        'pending',
        ${input.payerPhone ?? null},
        ${input.payerName ?? null},
        ${input.description ?? null},
        ${txRef},
        ${now},
        ${expiresAt},
        ${now},
        ${now}
      )
      RETURNING *
    `
  );

  return rows[0] ?? null;
}

export async function listPaymentTransactions(filters: {
  orderId?: string | null;
  providerId?: string | null;
  teamId?: string | null;
  status?: string | null;
  limit?: number;
}) {
  const rows = await prisma.$queryRaw<GenericRow[]>(
    Prisma.sql`
      SELECT
        id,
        external_transaction_id,
        order_id,
        team_id,
        provider_id,
        amount,
        currency,
        status,
        payer_phone,
        payer_name,
        reference_number,
        metadata,
        initiated_at,
        expires_at,
        completed_at,
        created_at
      FROM payment_transactions
      WHERE (${filters.orderId ?? null}::text IS NULL OR order_id = ${filters.orderId ?? null})
        AND (${filters.providerId ?? null}::text IS NULL OR provider_id = ${filters.providerId ?? null})
        AND (${filters.teamId ?? null}::text IS NULL OR team_id = ${filters.teamId ?? null})
        AND (${filters.status ?? null}::text IS NULL OR status = ${filters.status ?? null})
      ORDER BY created_at DESC
      LIMIT ${Math.min(Math.max(filters.limit ?? 50, 1), 200)}
    `
  );

  return rows.map((row) => ({
    ...row,
    amount: toNumber(row.amount) ?? 0,
  }));
}

export async function listPaymentProofs(orderId?: string | null, transactionId?: string | null) {
  const rows = await prisma.$queryRaw<GenericRow[]>(
    Prisma.sql`
      SELECT
        id,
        transaction_id,
        order_id,
        file_url,
        file_type,
        verification_status,
        created_at
      FROM payment_proofs
      WHERE (${orderId ?? null}::text IS NULL OR order_id = ${orderId ?? null})
        AND (${transactionId ?? null}::text IS NULL OR transaction_id = ${transactionId ?? null})
      ORDER BY created_at DESC
      LIMIT 100
    `
  );
  return rows;
}

export async function createPaymentProof(input: {
  orderId?: string | null;
  transactionId: string;
  fileUrl: string;
  fileType?: string | null;
}) {
  const rows = await prisma.$queryRaw<GenericRow[]>(
    Prisma.sql`
      INSERT INTO payment_proofs (
        order_id,
        transaction_id,
        file_url,
        file_type,
        verification_status,
        created_at
      ) VALUES (
        ${input.orderId ?? null},
        ${input.transactionId},
        ${input.fileUrl},
        ${input.fileType ?? "application/octet-stream"},
        'pending',
        NOW()
      )
      RETURNING *
    `
  );
  return rows[0] ?? null;
}

export async function markTransactionCompleted(transactionId: string, orderId?: string | null) {
  await prisma.$executeRaw(
    Prisma.sql`
      UPDATE payment_transactions
      SET status = 'completed', completed_at = NOW(), updated_at = NOW()
      WHERE id = ${transactionId}
    `
  );

  if (orderId) {
    try {
      await prisma.$executeRaw(
        Prisma.sql`
          UPDATE orders
          SET payment_status = 'confirmed', status = 'completed', updated_at = NOW()
          WHERE id = ${orderId}
        `
      );
    } catch {
      // Orders table may not exist in partially migrated environments.
    }
  }
}
