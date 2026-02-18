/**
 * SASAPAY Payment Status Query API Route
 * GET /api/payments/sasapay/status/[transactionId]
 */

import { sasapayService } from '@/lib/services/sasapay-service';
import { createServerClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

interface RouteParams {
  params: {
    transactionId: string;
  };
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const supabase = await createServerClient();
    
    // Get the authenticated user
    const { data: { session }, error: authError } = await supabase.auth.getSession();
    
    if (authError || !session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { transactionId } = params;

    // Get transaction details from database
    const { data: transaction, error: transactionError } = await supabase
      .from('transactions')
      .select(`
        *,
        sasapay_transactions (*)
      `)
      .eq('id', transactionId)
      .eq('user_id', session.user.id)
      .single();

    if (transactionError || !transaction) {
      return NextResponse.json(
        { error: 'Transaction not found' },
        { status: 404 }
      );
    }

    // If we have SASAPAY details, query the current status
    let sasapayStatus = null;
    if (transaction.sasapay_transactions?.length > 0) {
      const sasapayTx = transaction.sasapay_transactions[0];
      
      try {
        sasapayStatus = await sasapayService.queryPaymentStatus(
          sasapayTx.sasapay_transaction_id
        );

        // Update our database with the latest status if it changed
        if (sasapayStatus.result_code === '0' && transaction.status === 'pending') {
          await supabase
            .from('transactions')
            .update({
              status: 'completed',
              completed_at: new Date().toISOString(),
            })
            .eq('id', transactionId);

          await supabase
            .from('sasapay_transactions')
            .update({
              sasapay_status: 'completed',
            })
            .eq('id', sasapayTx.id);
        }
      } catch (statusError) {
        console.error('Error querying SASAPAY status:', statusError);
      }
    }

    return NextResponse.json({
      success: true,
      transaction: {
        id: transaction.id,
        status: transaction.status,
        amount: transaction.amount,
        currency: transaction.currency,
        created_at: transaction.initiated_at,
        completed_at: transaction.completed_at,
        order_id: transaction.order_id,
        payment_provider: transaction.payment_provider,
      },
      sasapay_details: transaction.sasapay_transactions?.[0] ? {
        checkout_request_id: transaction.sasapay_transactions[0].sasapay_transaction_id,
        paybill_number: transaction.sasapay_transactions[0].paybill_number,
        account_number: transaction.sasapay_transactions[0].account_number,
        status: transaction.sasapay_transactions[0].sasapay_status,
        callback_received: !!transaction.sasapay_transactions[0].callback_received_at,
      } : null,
      live_status: sasapayStatus,
    });

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
