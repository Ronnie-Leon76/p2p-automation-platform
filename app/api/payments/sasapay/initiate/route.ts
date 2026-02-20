/**
 * SASAPAY Payment Initiation API Route
 * POST /api/payments/sasapay/initiate
 */

import { isPostgresAdapter } from '@/lib/composition/backend-adapter';
import { sasapayService } from '@/lib/services/sasapay-service';
import { createServerClient } from '@/lib/database/server-client';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  if (isPostgresAdapter()) {
    return NextResponse.json({ error: "SasaPay initiate route is not migrated to Postgres yet." }, { status: 501 });
  }

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

    const body = await request.json();
    const { amount, phone_number, order_id, description } = body;

    // Validate required fields
    if (!amount || !phone_number || !order_id) {
      return NextResponse.json(
        { error: 'Missing required fields: amount, phone_number, order_id' },
        { status: 400 }
      );
    }

    // Generate unique account reference for this transaction
    const accountReference = sasapayService.generateAccountReference(
      session.user.id,
      order_id
    );

    // Create transaction record in database
    const { data: transaction, error: dbError } = await supabase
      .from('transactions')
      .insert({
        user_id: session.user.id,
        transaction_ref: `SASAPAY_${Date.now()}`,
        transaction_type: 'payment_in',
        amount: parseFloat(amount),
        currency: 'KES',
        payment_provider: 'sasapay',
        order_id: order_id,
        status: 'pending',
      })
      .select()
      .single();

    if (dbError || !transaction) {
      console.error('Failed to create transaction record:', dbError);
      return NextResponse.json(
        { error: 'Failed to create transaction record' },
        { status: 500 }
      );
    }

    // Prepare SASAPAY payment request
    const paymentRequest = {
      amount: parseFloat(amount),
      currency: 'KES',
      phone_number: phone_number,
      account_reference: accountReference,
      description: description || `P2P Trade Payment - Order ${order_id}`,
      callback_url: `${process.env.NEXT_PUBLIC_APP_URL}/api/payments/sasapay/callback`,
      result_url: `${process.env.NEXT_PUBLIC_APP_URL}/api/payments/sasapay/result`,
    };

    // Initiate payment with SASAPAY
    const sasapayResponse = await sasapayService.initiatePayment(paymentRequest);

    // Store SASAPAY-specific transaction details
    const { error: sasapayDbError } = await supabase
      .from('sasapay_transactions')
      .insert({
        transaction_id: transaction.id,
        user_id: session.user.id,
        sasapay_transaction_id: sasapayResponse.checkout_request_id,
        paybill_number: process.env.SASAPAY_PAYBILL_NUMBER || '',
        account_number: accountReference,
        sender_phone: phone_number,
        sasapay_status: 'pending',
      });

    if (sasapayDbError) {
      console.error('Failed to store SASAPAY transaction details:', sasapayDbError);
    }

    return NextResponse.json({
      success: true,
      transaction_id: transaction.id,
      checkout_request_id: sasapayResponse.checkout_request_id,
      account_reference: accountReference,
      paybill_number: process.env.SASAPAY_PAYBILL_NUMBER,
      customer_message: sasapayResponse.customer_message,
      instructions: `Pay KES ${amount} to Paybill ${process.env.SASAPAY_PAYBILL_NUMBER} using Account Number ${accountReference}`,
    });

  } catch (error) {
    console.error('SASAPAY payment initiation error:', error);
    return NextResponse.json(
      { error: 'Failed to initiate payment' },
      { status: 500 }
    );
  }
}

