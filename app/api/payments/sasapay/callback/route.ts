/**
 * SASAPAY Payment Callback API Route
 * POST /api/payments/sasapay/callback
 */

import { sasapayService } from '@/lib/services/sasapay-service';
import { createServerClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerClient();
    const callbackData = await request.json();

    console.log('📥 SASAPAY callback received:', callbackData);

    // Process the callback
    const result = await sasapayService.processPaymentCallback(callbackData);

    if (result.success && result.transaction_id) {
      // Find the SASAPAY transaction record
      const { data: sasapayTransaction, error: sasapayError } = await supabase
        .from('sasapay_transactions')
        .select('*')
        .eq('sasapay_transaction_id', result.transaction_id)
        .single();

      if (sasapayError || !sasapayTransaction) {
        console.error('SASAPAY transaction not found:', sasapayError);
        return NextResponse.json(
          { error: 'Transaction not found' },
          { status: 404 }
        );
      }

      // Update the SASAPAY transaction with callback data
      const { error: updateSasapayError } = await supabase
        .from('sasapay_transactions')
        .update({
          callback_data: callbackData,
          callback_received_at: new Date().toISOString(),
          sasapay_status: result.success ? 'completed' : 'failed',
        })
        .eq('id', sasapayTransaction.id);

      if (updateSasapayError) {
        console.error('Failed to update SASAPAY transaction:', updateSasapayError);
      }

      // Update the main transaction status
      const { error: updateTransactionError } = await supabase
        .from('transactions')
        .update({
          status: result.success ? 'completed' : 'failed',
          completed_at: result.success ? new Date().toISOString() : null,
          external_ref: result.transaction_id,
        })
        .eq('id', sasapayTransaction.transaction_id);

      if (updateTransactionError) {
        console.error('Failed to update main transaction:', updateTransactionError);
      }

      // If payment was successful, trigger additional actions
      if (result.success) {
        console.log('✅ Payment confirmed, triggering post-payment actions...');
        
        // Here you could:
        // 1. Release crypto to buyer
        // 2. Update order status
        // 3. Send notifications
        // 4. Update user balances
        
        try {
          // Example: Update order status (you'd need to implement this based on your order system)
          if (sasapayTransaction.order_id) {
            // await updateOrderStatus(sasapayTransaction.order_id, 'payment_received');
          }
          
          // Example: Send notification to user
          // await sendPaymentConfirmationNotification(sasapayTransaction.user_id);
          
        } catch (actionError) {
          console.error('Error in post-payment actions:', actionError);
          // Don't fail the callback even if post-actions fail
        }
      }

      console.log(`${result.success ? '✅' : '❌'} SASAPAY payment processed:`, result.transaction_id);

      return NextResponse.json({
        success: true,
        message: 'Callback processed successfully',
      });

    } else {
      console.error('❌ SASAPAY callback processing failed:', result.error);
      
      return NextResponse.json({
        success: false,
        error: result.error || 'Callback processing failed',
      }, { status: 400 });
    }

  } catch (error) {
    console.error('❌ SASAPAY callback error:', error);
    
    return NextResponse.json({
      success: false,
      error: 'Internal server error',
    }, { status: 500 });
  }
}

// Handle GET requests (for webhook verification if needed)
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const challenge = searchParams.get('challenge');
  
  if (challenge) {
    // Return challenge for webhook verification
    return NextResponse.json({ challenge });
  }
  
  return NextResponse.json({ 
    message: 'SASAPAY callback endpoint is active',
    timestamp: new Date().toISOString(),
  });
}
