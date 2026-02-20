/**
 * SASAPAY Payment Status Query API Route
 * GET /api/payments/sasapay/status/[transactionId]
 */

import { getAuthenticatedUser } from "@/lib/auth/server-user";
import { getSasaPayStatusUseCase } from "@/lib/domain/payments/payment-status-use-cases";
import { NextRequest, NextResponse } from 'next/server';

interface RouteParams {
  params: Promise<{
    transactionId: string;
  }>;
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const user = await getAuthenticatedUser();
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { transactionId } = await params;
    const payload = await getSasaPayStatusUseCase(transactionId);
    if (!payload) {
      return NextResponse.json(
        { error: 'Transaction not found' },
        { status: 404 }
      );
    }
    return NextResponse.json(payload);

  } catch (error) {
    console.error('Payment status query error:', error);
    return NextResponse.json(
      { error: 'Failed to query payment status' },
      { status: 500 }
    );
  }
}

// Allow POST for manual status refresh
export async function POST(request: NextRequest, { params }: RouteParams) {
  return GET(request, { params });
}
