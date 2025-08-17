/**
 * P2P Order Management Service for SasaPay Integration
 * Handles the complete sell order flow with payment requests and confirmations
 */

import { createServerClient } from "@/lib/supabase/server"
import { sasaPayService } from "./sasapay-service"

interface P2PSellOrder {
  id: string
  seller_id: string
  buyer_id?: string
  crypto_currency: string
  fiat_currency: string
  amount_crypto: number
  amount_fiat: number
  rate: number
  payment_method: string
  status: 'active' | 'matched' | 'payment_pending' | 'payment_confirmed' | 'completed' | 'cancelled' | 'disputed'
  buyer_phone?: string
  payment_window_minutes: number
  created_at: string
  matched_at?: string
  payment_deadline?: string
}

interface PaymentRequestResult {
  success: boolean
  transaction_id?: string
  checkout_request_id?: string
  merchant_request_id?: string
  customer_message?: string
  error?: string
}

export class P2POrderManager {
  private supabase: any

  constructor(supabaseClient?: any) {
    this.supabase = supabaseClient || createServerClient()
  }

  /**
   * Handle a matched buy order - send payment to seller
   * This is triggered when buyer matches a sell order and confirms purchase
   */
  async handleMatchedBuyOrder(orderId: string, buyerId: string, sellerPhone: string): Promise<PaymentRequestResult> {
    try {
      // Get order details
      const { data: order, error: orderError } = await this.supabase
        .from("orders")
        .select("*")
        .eq("id", orderId)
        .single()

      if (orderError || !order) {
        throw new Error(`Order not found: ${orderId}`)
      }

      // Validate this is a buy order scenario (buyer is purchasing from seller)
      if (order.buyer_id !== buyerId) {
        throw new Error(`Unauthorized: Order ${orderId} does not belong to buyer ${buyerId}`)
      }

      // Validate order can accept payment
      if (order.status !== 'matched') {
        throw new Error(`Order ${orderId} is not in matched status. Current status: ${order.status}`)
      }

      // Generate unique merchant reference
      const merchantReference = `P2P_BUY_${orderId}_${Date.now()}`

      // Create payment transaction record
      const { data: transaction, error: transactionError } = await this.supabase
        .from("payment_transactions")
        .insert({
          order_id: orderId,
          user_id: order.seller_id, // Seller receives the payment
          transaction_type: "sasapay_b2c",
          amount: Number(order.amount_fiat),
          currency: order.fiat_currency || "KES",
          status: "pending",
          payment_method: "sasapay",
          recipient_phone: sellerPhone,
          reference_number: merchantReference,
          description: `P2P Buy Order Payment - ${order.crypto_currency} Purchase`,
          metadata: {
            provider: "sasapay",
            merchant_reference: merchantReference,
            crypto_currency: order.crypto_currency,
            crypto_amount: order.amount_crypto,
            rate: order.rate,
            payment_type: "b2c_send",
          },
          initiated_at: new Date().toISOString(),
          created_at: new Date().toISOString(),
        })
        .select()
        .single()

      if (transactionError) {
        console.error("Failed to create transaction record:", transactionError)
        throw new Error("Failed to create transaction record")
      }

      // Get daily usage for transaction limit validation
      const { data: dailyUsage } = await this.supabase
        .from("payment_transactions")
        .select("amount")
        .eq("payment_method", "sasapay")
        .eq("transaction_type", "sasapay_b2c")
        .gte("created_at", new Date().toISOString().split("T")[0] + "T00:00:00.000Z")
        .eq("status", "completed")

      const dailyUsed = dailyUsage?.reduce((total: number, tx: any) => total + Number(tx.amount), 0) || 0

      // Send payment to seller via SasaPay B2C
      const paymentResponse = await sasaPayService.sendMoney({
        amount: Number(order.amount_fiat),
        currency: order.fiat_currency || "KES",
        receiver_phone: sellerPhone,
        merchant_reference: merchantReference,
        reason: `Payment for ${order.amount_crypto} ${order.crypto_currency} at rate ${order.rate}`,
        daily_used: dailyUsed, // Include daily usage for validation
      })

      // Update transaction with SasaPay response
      await this.supabase
        .from("payment_transactions")
        .update({
          external_transaction_id: paymentResponse.B2CRequestID,
          metadata: {
            ...transaction.metadata,
            sasapay_response: paymentResponse,
            b2c_request_id: paymentResponse.B2CRequestID,
            conversation_id: paymentResponse.ConversationID,
            originator_conversation_id: paymentResponse.OriginatorConversationID,
          },
          updated_at: new Date().toISOString(),
        })
        .eq("id", transaction.id)

      // Update order status to payment_sent
      await this.supabase
        .from("orders")
        .update({
          status: "payment_sent",
          seller_phone: sellerPhone,
          updated_at: new Date().toISOString(),
        })
        .eq("id", orderId)

      // Log the payment
      await this.supabase
        .from("order_logs")
        .insert({
          order_id: orderId,
          action: "payment_sent",
          details: {
            transaction_id: transaction.id,
            b2c_request_id: paymentResponse.B2CRequestID,
            amount: order.amount_fiat,
            currency: order.fiat_currency,
            seller_phone: sellerPhone,
            merchant_reference: merchantReference,
          },
          created_at: new Date().toISOString(),
        })

      console.log(`Payment sent for P2P buy order ${orderId}:`, {
        transaction_id: transaction.id,
        b2c_request_id: paymentResponse.B2CRequestID,
        amount: order.amount_fiat,
        seller_phone: sellerPhone,
      })

      return {
        success: true,
        transaction_id: transaction.id,
        checkout_request_id: paymentResponse.B2CRequestID,
        merchant_request_id: paymentResponse.ConversationID,
        customer_message: paymentResponse.detail,
      }

    } catch (error) {
      console.error(`Failed to send payment for buy order ${orderId}:`, error)
      
      // Update order status to error
      await this.supabase
        .from("orders")
        .update({
          status: "active", // Return to active so it can be matched again
          error_message: error instanceof Error ? error.message : "Payment sending failed",
          updated_at: new Date().toISOString(),
        })
        .eq("id", orderId)

      return {
        success: false,
        error: error instanceof Error ? error.message : "Payment sending failed",
      }
    }
  }

  /**
   * Process B2C payment confirmation callback
   */
  async processB2CPaymentConfirmation(callbackData: any): Promise<boolean> {
    try {
      const {
        B2CRequestID,
        ConversationID,
        ResultCode,
        ResultDesc,
        TransactionAmount,
        RecipientAccountNumber,
        RecipientName,
        TransactionDate,
        SasaPayTransactionCode,
        CheckoutRequestID,
        MerchantTransactionReference,
        MerchantAccountBalance,
      } = callbackData

      console.log("Processing SasaPay B2C payment confirmation:", {
        b2c_request_id: B2CRequestID,
        result_code: ResultCode,
        amount: TransactionAmount,
        recipient: RecipientAccountNumber,
      })

      // Find transaction by B2C request ID
      const { data: transaction, error: findError } = await this.supabase
        .from("payment_transactions")
        .select(`
          *,
          orders(*)
        `)
        .eq("external_transaction_id", B2CRequestID)
        .single()

      if (findError || !transaction) {
        console.error("Transaction not found for B2CRequestID:", B2CRequestID)
        return false
      }

      const isSuccessful = ResultCode === "0"
      const newStatus = isSuccessful ? "completed" : "failed"

      // Update transaction
      await this.supabase
        .from("payment_transactions")
        .update({
          status: newStatus,
          completed_at: isSuccessful ? new Date().toISOString() : null,
          metadata: {
            ...transaction.metadata,
            result_code: ResultCode,
            result_desc: ResultDesc,
            sasapay_transaction_code: SasaPayTransactionCode,
            recipient_name: RecipientName,
            recipient_account: RecipientAccountNumber,
            transaction_date: TransactionDate,
            confirmed_amount: TransactionAmount,
            merchant_account_balance: MerchantAccountBalance,
          },
          webhook_data: callbackData,
          updated_at: new Date().toISOString(),
        })
        .eq("id", transaction.id)

      if (isSuccessful) {
        // Payment successful - complete the buy order
        await this.completeSuccessfulB2CPayment(transaction)
      } else {
        // Payment failed - handle failure
        await this.handleFailedB2CPayment(transaction, ResultDesc)
      }

      return isSuccessful

    } catch (error) {
      console.error("Error processing B2C payment confirmation:", error)
      return false
    }
  }

  /**
   * Complete successful B2C payment and trigger order completion
   */
  private async completeSuccessfulB2CPayment(transaction: any): Promise<void> {
    const order = transaction.orders

    try {
      // Update order status to payment_confirmed
      await this.supabase
        .from("orders")
        .update({
          status: "payment_confirmed",
          confirmed_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq("id", order.id)

      // Log payment confirmation
      await this.supabase
        .from("order_logs")
        .insert({
          order_id: order.id,
          action: "b2c_payment_confirmed",
          details: {
            transaction_id: transaction.id,
            amount: transaction.amount,
            currency: transaction.currency,
            recipient_phone: transaction.recipient_phone,
            sasapay_transaction_code: transaction.metadata?.sasapay_transaction_code,
            confirmed_at: new Date().toISOString(),
          },
          created_at: new Date().toISOString(),
        })

      // Notify seller that payment has been sent
      await this.notifySellerPaymentSent(order, transaction)

      // Notify buyer that payment was sent successfully
      await this.notifyBuyerPaymentSent(order, transaction)

      // TODO: Trigger crypto release workflow from seller to buyer
      await this.triggerCryptoRelease(order, transaction)

      console.log(`B2C payment confirmed for P2P buy order ${order.id}`)

    } catch (error) {
      console.error(`Error completing successful B2C payment for order ${order.id}:`, error)
      throw error
    }
  }

  /**
   * Handle failed B2C payment
   */
  private async handleFailedB2CPayment(transaction: any, errorReason: string): Promise<void> {
    const order = transaction.orders

    try {
      // Return order to active status so it can be matched again
      await this.supabase
        .from("orders")
        .update({
          status: "active",
          buyer_id: null,
          seller_phone: null,
          error_message: `Payment sending failed: ${errorReason}`,
          updated_at: new Date().toISOString(),
        })
        .eq("id", order.id)

      // Log payment failure
      await this.supabase
        .from("order_logs")
        .insert({
          order_id: order.id,
          action: "b2c_payment_failed",
          details: {
            transaction_id: transaction.id,
            error_reason: errorReason,
            amount: transaction.amount,
            currency: transaction.currency,
            recipient_phone: transaction.recipient_phone,
            failed_at: new Date().toISOString(),
          },
          created_at: new Date().toISOString(),
        })

      // Notify buyer that payment failed
      await this.notifyBuyerPaymentFailed(order, transaction, errorReason)

      console.log(`B2C payment failed for P2P buy order ${order.id}: ${errorReason}`)

    } catch (error) {
      console.error(`Error handling failed B2C payment for order ${order.id}:`, error)
    }
  }

  /**
   * Notify seller about payment sent
   */
  private async notifySellerPaymentSent(order: any, transaction: any): Promise<void> {
    try {
      // Get seller information
      const { data: seller } = await this.supabase
        .from("users")
        .select("id, email, phone, notification_preferences")
        .eq("id", order.seller_id)
        .single()

      if (!seller) return

      // Create notification
      await this.supabase
        .from("notifications")
        .insert({
          user_id: seller.id,
          type: "payment_sent",
          title: "Payment Sent",
          message: `Payment of ${transaction.amount} ${transaction.currency} has been sent to your mobile money account`,
          data: {
            order_id: order.id,
            transaction_id: transaction.id,
            amount: transaction.amount,
            currency: transaction.currency,
            crypto_amount: order.amount_crypto,
            crypto_currency: order.crypto_currency,
            recipient_phone: transaction.recipient_phone,
          },
          created_at: new Date().toISOString(),
        })

      console.log(`Seller payment notification sent for order ${order.id}`)
    } catch (error) {
      console.error("Error notifying seller about payment sent:", error)
    }
  }

  /**
   * Notify buyer about payment sent successfully
   */
  private async notifyBuyerPaymentSent(order: any, transaction: any): Promise<void> {
    try {
      // Get buyer information
      const { data: buyer } = await this.supabase
        .from("users")
        .select("id, email, phone, notification_preferences")
        .eq("id", order.buyer_id)
        .single()

      if (!buyer) return

      // Create notification
      await this.supabase
        .from("notifications")
        .insert({
          user_id: buyer.id,
          type: "payment_sent_confirmation",
          title: "Payment Sent Successfully",
          message: `Your payment of ${transaction.amount} ${transaction.currency} has been sent to the seller. You will receive ${order.amount_crypto} ${order.crypto_currency} shortly.`,
          data: {
            order_id: order.id,
            transaction_id: transaction.id,
            amount: transaction.amount,
            currency: transaction.currency,
            crypto_amount: order.amount_crypto,
            crypto_currency: order.crypto_currency,
          },
          created_at: new Date().toISOString(),
        })

      console.log(`Buyer payment confirmation notification sent for order ${order.id}`)
    } catch (error) {
      console.error("Error notifying buyer about payment sent:", error)
    }
  }

  /**
   * Notify buyer about payment failure
   */
  private async notifyBuyerPaymentFailed(order: any, transaction: any, errorReason: string): Promise<void> {
    try {
      // Get buyer information
      const { data: buyer } = await this.supabase
        .from("users")
        .select("id, email, phone, notification_preferences")
        .eq("id", order.buyer_id)
        .single()

      if (!buyer) return

      // Create notification
      await this.supabase
        .from("notifications")
        .insert({
          user_id: buyer.id,
          type: "payment_failed",
          title: "Payment Failed",
          message: `Failed to send payment of ${transaction.amount} ${transaction.currency} to the seller. Reason: ${errorReason}`,
          data: {
            order_id: order.id,
            transaction_id: transaction.id,
            amount: transaction.amount,
            currency: transaction.currency,
            error_reason: errorReason,
          },
          created_at: new Date().toISOString(),
        })

      console.log(`Buyer payment failure notification sent for order ${order.id}`)
    } catch (error) {
      console.error("Error notifying buyer about payment failure:", error)
    }
  }

  /**
   * Handle seller confirming payment received (manual confirmation)
   * This is triggered when seller clicks "Payment Received" button
   */
  async handleSellerPaymentConfirmation(orderId: string, sellerId: string): Promise<{ success: boolean; message: string; matched_transaction?: any }> {
    try {
      // Get order details
      const { data: order, error: orderError } = await this.supabase
        .from("orders")
        .select("*")
        .eq("id", orderId)
        .eq("seller_id", sellerId) // Ensure seller owns this order
        .single()

      if (orderError || !order) {
        return { success: false, message: "Order not found or unauthorized" }
      }

      // Validate order can accept payment confirmation
      if (order.status !== 'payment_pending' && order.status !== 'matched') {
        return { 
          success: false, 
          message: `Order cannot be confirmed. Current status: ${order.status}` 
        }
      }

      // Get seller information for matching
      const { data: seller, error: sellerError } = await this.supabase
        .from("users")
        .select("full_name, first_name, last_name, phone, email")
        .eq("id", sellerId)
        .single()

      if (sellerError || !seller) {
        return { success: false, message: "Seller information not found" }
      }

      // Try to find matching SasaPay transaction
      const matchedTransaction = await this.findMatchingSasaPayTransaction(order, seller)

      if (matchedTransaction) {
        // Found matching transaction - complete the order
        await this.completeOrderWithMatchedTransaction(order, matchedTransaction)
        
        return {
          success: true,
          message: "Payment confirmed and transaction matched successfully",
          matched_transaction: matchedTransaction
        }
      } else {
        // No matching transaction found - mark as manually confirmed
        await this.handleManualPaymentConfirmation(order, seller)
        
        return {
          success: true,
          message: "Payment confirmed manually - no automatic transaction match found"
        }
      }

    } catch (error) {
      console.error(`Failed to confirm payment for order ${orderId}:`, error)
      return {
        success: false,
        message: error instanceof Error ? error.message : "Payment confirmation failed"
      }
    }
  }

  /**
   * Find matching SasaPay transaction based on seller details and amount
   */
  private async findMatchingSasaPayTransaction(order: any, seller: any): Promise<any> {
    try {
      const orderAmount = Number(order.amount_fiat)
      const tolerance = 0.01 // Allow 1 cent tolerance for amount matching
      
      // Build name variations for matching
      const nameVariations = this.buildNameVariations(seller)
      
      console.log(`Searching for SasaPay transaction matching:`, {
        amount: orderAmount,
        currency: order.fiat_currency || "KES",
        seller_names: nameVariations,
        order_id: order.id
      })

      // Search for unmatched SasaPay transactions within the last 24 hours
      const twentyFourHoursAgo = new Date()
      twentyFourHoursAgo.setHours(twentyFourHoursAgo.getHours() - 24)

      const { data: transactions, error } = await this.supabase
        .from("payment_transactions")
        .select("*")
        .eq("payment_method", "sasapay")
        .in("status", ["completed", "unmatched"])
        .gte("completed_at", twentyFourHoursAgo.toISOString())
        .is("order_id", null) // Only unmatched transactions
        .gte("amount", orderAmount - tolerance)
        .lte("amount", orderAmount + tolerance)

      if (error) {
        console.error("Error searching for matching transactions:", error)
        return null
      }

      if (!transactions || transactions.length === 0) {
        console.log("No transactions found matching amount criteria")
        return null
      }

      // Try to match by payer name
      for (const transaction of transactions) {
        if (this.isNameMatch(transaction, nameVariations)) {
          console.log("Found matching SasaPay transaction:", {
            transaction_id: transaction.id,
            external_id: transaction.external_transaction_id,
            amount: transaction.amount,
            payer_name: transaction.payer_name,
            completed_at: transaction.completed_at
          })
          return transaction
        }
      }

      // Try to match by phone number if available
      if (seller.phone) {
        const cleanSellerPhone = this.cleanPhoneNumber(seller.phone)
        for (const transaction of transactions) {
          if (transaction.payer_phone) {
            const cleanPayerPhone = this.cleanPhoneNumber(transaction.payer_phone)
            if (cleanSellerPhone === cleanPayerPhone) {
              console.log("Found matching SasaPay transaction by phone:", {
                transaction_id: transaction.id,
                seller_phone: cleanSellerPhone,
                payer_phone: cleanPayerPhone
              })
              return transaction
            }
          }
        }
      }

      console.log("No matching SasaPay transaction found")
      return null

    } catch (error) {
      console.error("Error finding matching SasaPay transaction:", error)
      return null
    }
  }

  /**
   * Build name variations for flexible matching
   */
  private buildNameVariations(seller: any): string[] {
    const variations = []
    
    if (seller.full_name) {
      variations.push(seller.full_name.toLowerCase().trim())
    }
    
    if (seller.first_name && seller.last_name) {
      variations.push(`${seller.first_name} ${seller.last_name}`.toLowerCase().trim())
      variations.push(`${seller.last_name} ${seller.first_name}`.toLowerCase().trim())
    }
    
    if (seller.first_name) {
      variations.push(seller.first_name.toLowerCase().trim())
    }
    
    if (seller.last_name) {
      variations.push(seller.last_name.toLowerCase().trim())
    }

    // Remove duplicates
    return [...new Set(variations)]
  }

  /**
   * Check if transaction payer name matches any seller name variation
   */
  private isNameMatch(transaction: any, nameVariations: string[]): boolean {
    if (!transaction.payer_name) return false
    
    const payerName = transaction.payer_name.toLowerCase().trim()
    
    // Direct match
    if (nameVariations.includes(payerName)) {
      return true
    }
    
    // Partial match - check if any name variation is contained in payer name
    for (const variation of nameVariations) {
      if (variation.length > 2 && payerName.includes(variation)) {
        return true
      }
      if (payerName.length > 2 && variation.includes(payerName)) {
        return true
      }
    }
    
    // Split names and check individual parts
    const payerNameParts = payerName.split(/\s+/)
    const sellerNameParts = nameVariations.join(' ').split(/\s+/)
    
    for (const payerPart of payerNameParts) {
      if (payerPart.length > 2) {
        for (const sellerPart of sellerNameParts) {
          if (sellerPart.length > 2 && 
              (payerPart.includes(sellerPart) || sellerPart.includes(payerPart))) {
            return true
          }
        }
      }
    }
    
    return false
  }

  /**
   * Clean phone number for comparison
   */
  private cleanPhoneNumber(phone: string): string {
    // Remove all non-digits and normalize to international format
    const digits = phone.replace(/\D/g, '')
    
    // Convert to international format
    if (digits.startsWith('0') && digits.length === 10) {
      return `254${digits.substring(1)}`
    }
    if (digits.startsWith('254')) {
      return digits
    }
    if (digits.length === 9) {
      return `254${digits}`
    }
    
    return digits
  }

  /**
   * Complete order with matched transaction
   */
  private async completeOrderWithMatchedTransaction(order: any, transaction: any): Promise<void> {
    try {
      // Link transaction to order
      await this.supabase
        .from("payment_transactions")
        .update({
          order_id: order.id,
          user_id: order.buyer_id,
          status: "completed",
          metadata: {
            ...transaction.metadata,
            matched_to_order: order.id,
            matched_at: new Date().toISOString(),
            match_method: "seller_confirmation"
          },
          updated_at: new Date().toISOString(),
        })
        .eq("id", transaction.id)

      // Update order status
      await this.supabase
        .from("orders")
        .update({
          status: "payment_confirmed",
          confirmed_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq("id", order.id)

      // Log the match
      await this.supabase
        .from("order_logs")
        .insert({
          order_id: order.id,
          action: "payment_matched",
          details: {
            transaction_id: transaction.id,
            external_transaction_id: transaction.external_transaction_id,
            amount: transaction.amount,
            payer_name: transaction.payer_name,
            match_method: "automatic",
            confirmed_at: new Date().toISOString(),
          },
          created_at: new Date().toISOString(),
        })

      // Notify and trigger completion workflow
      await this.notifySeller(order, transaction)
      await this.triggerCryptoRelease(order, transaction)

      console.log(`Order ${order.id} completed with matched transaction ${transaction.id}`)

    } catch (error) {
      console.error("Error completing order with matched transaction:", error)
      throw error
    }
  }

  /**
   * Handle manual payment confirmation when no transaction match found
   */
  private async handleManualPaymentConfirmation(order: any, seller: any): Promise<void> {
    try {
      // Create a manual transaction record
      const { data: manualTransaction, error: transactionError } = await this.supabase
        .from("payment_transactions")
        .insert({
          order_id: order.id,
          user_id: order.buyer_id,
          transaction_type: "manual_confirmation",
          amount: Number(order.amount_fiat),
          currency: order.fiat_currency || "KES",
          status: "completed",
          payment_method: "manual",
          reference_number: `MANUAL_${order.id}_${Date.now()}`,
          description: `Manual payment confirmation by seller`,
          metadata: {
            confirmed_by_seller: seller.id,
            confirmation_method: "manual",
            requires_verification: true,
          },
          completed_at: new Date().toISOString(),
          created_at: new Date().toISOString(),
        })
        .select()
        .single()

      if (transactionError) {
        throw new Error("Failed to create manual transaction record")
      }

      // Update order status to payment_confirmed
      await this.supabase
        .from("orders")
        .update({
          status: "payment_confirmed",
          confirmed_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq("id", order.id)

      // Log manual confirmation
      await this.supabase
        .from("order_logs")
        .insert({
          order_id: order.id,
          action: "manual_payment_confirmed",
          details: {
            transaction_id: manualTransaction.id,
            confirmed_by_seller: seller.id,
            amount: order.amount_fiat,
            currency: order.fiat_currency,
            requires_verification: true,
            confirmed_at: new Date().toISOString(),
          },
          created_at: new Date().toISOString(),
        })

      // Notify and trigger completion workflow
      await this.notifySeller(order, manualTransaction)
      await this.triggerCryptoRelease(order, manualTransaction)

      console.log(`Order ${order.id} completed with manual confirmation`)

    } catch (error) {
      console.error("Error handling manual payment confirmation:", error)
      throw error
    }
  }

  /**
   * Handle a matched sell order - request payment from buyer
   */
  async handleMatchedSellOrder(orderId: string, buyerPhone: string): Promise<PaymentRequestResult> {
    try {
      // Get order details
      const { data: order, error: orderError } = await this.supabase
        .from("orders")
        .select("*")
        .eq("id", orderId)
        .single()

      if (orderError || !order) {
        throw new Error(`Order not found: ${orderId}`)
      }

      // Validate order can accept payment
      if (order.status !== 'matched') {
        throw new Error(`Order ${orderId} is not in matched status. Current status: ${order.status}`)
      }

      // Calculate payment deadline
      const paymentDeadline = new Date()
      paymentDeadline.setMinutes(paymentDeadline.getMinutes() + (order.payment_window_minutes || 15))

      // Generate unique merchant reference
      const merchantReference = `P2P_${orderId}_${Date.now()}`

      // Create payment transaction record
      const { data: transaction, error: transactionError } = await this.supabase
        .from("payment_transactions")
        .insert({
          order_id: orderId,
          user_id: order.buyer_id,
          transaction_type: "sasapay_c2b",
          amount: Number(order.amount_fiat),
          currency: order.fiat_currency || "KES",
          status: "pending",
          payment_method: "sasapay",
          payer_phone: buyerPhone,
          reference_number: merchantReference,
          description: `P2P Order Payment - ${order.crypto_currency} Purchase`,
          metadata: {
            provider: "sasapay",
            merchant_reference: merchantReference,
            crypto_currency: order.crypto_currency,
            crypto_amount: order.amount_crypto,
            rate: order.rate,
            payment_deadline: paymentDeadline.toISOString(),
          },
          initiated_at: new Date().toISOString(),
          created_at: new Date().toISOString(),
        })
        .select()
        .single()

      if (transactionError) {
        console.error("Failed to create transaction record:", transactionError)
        throw new Error("Failed to create transaction record")
      }

      // Request payment from buyer via SasaPay
      const paymentResponse = await sasaPayService.requestPayment({
        amount: Number(order.amount_fiat),
        currency: order.fiat_currency || "KES",
        phone_number: buyerPhone,
        merchant_reference: merchantReference,
        description: `Pay ${order.amount_fiat} ${order.fiat_currency} for ${order.amount_crypto} ${order.crypto_currency}`,
      })

      // Update transaction with SasaPay response
      await this.supabase
        .from("payment_transactions")
        .update({
          external_transaction_id: paymentResponse.CheckoutRequestID,
          metadata: {
            ...transaction.metadata,
            sasapay_response: paymentResponse,
            merchant_request_id: paymentResponse.MerchantRequestID,
            checkout_request_id: paymentResponse.CheckoutRequestID,
          },
          updated_at: new Date().toISOString(),
        })
        .eq("id", transaction.id)

      // Update order status to payment_pending
      await this.supabase
        .from("orders")
        .update({
          status: "payment_pending",
          buyer_phone: buyerPhone,
          payment_deadline: paymentDeadline.toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq("id", orderId)

      // Log the payment request
      await this.supabase
        .from("order_logs")
        .insert({
          order_id: orderId,
          action: "payment_requested",
          details: {
            transaction_id: transaction.id,
            checkout_request_id: paymentResponse.CheckoutRequestID,
            amount: order.amount_fiat,
            currency: order.fiat_currency,
            buyer_phone: buyerPhone,
            payment_deadline: paymentDeadline.toISOString(),
          },
          created_at: new Date().toISOString(),
        })

      console.log(`Payment requested for P2P order ${orderId}:`, {
        transaction_id: transaction.id,
        checkout_request_id: paymentResponse.CheckoutRequestID,
        amount: order.amount_fiat,
        buyer_phone: buyerPhone,
      })

      return {
        success: true,
        transaction_id: transaction.id,
        checkout_request_id: paymentResponse.CheckoutRequestID,
        merchant_request_id: paymentResponse.MerchantRequestID,
        customer_message: paymentResponse.CustomerMessage,
      }

    } catch (error) {
      console.error(`Failed to request payment for order ${orderId}:`, error)
      
      // Update order status to error
      await this.supabase
        .from("orders")
        .update({
          status: "active", // Return to active so it can be matched again
          error_message: error instanceof Error ? error.message : "Payment request failed",
          updated_at: new Date().toISOString(),
        })
        .eq("id", orderId)

      return {
        success: false,
        error: error instanceof Error ? error.message : "Payment request failed",
      }
    }
  }

  /**
   * Process payment confirmation callback
   */
  async processPaymentConfirmation(callbackData: any): Promise<boolean> {
    try {
      const {
        CheckoutRequestID,
        MerchantRequestID,
        ResultCode,
        ResultDesc,
        TransAmount,
        BillRefNumber,
        TransactionDate,
        CustomerMobile,
        TransactionCode,
        ThirdPartyTransID,
      } = callbackData

      console.log("Processing SasaPay payment confirmation:", {
        checkout_request_id: CheckoutRequestID,
        result_code: ResultCode,
        amount: TransAmount,
        customer_mobile: CustomerMobile,
      })

      // Find transaction by checkout request ID
      const { data: transaction, error: findError } = await this.supabase
        .from("payment_transactions")
        .select(`
          *,
          orders(*)
        `)
        .eq("external_transaction_id", CheckoutRequestID)
        .single()

      if (findError || !transaction) {
        console.error("Transaction not found for CheckoutRequestID:", CheckoutRequestID)
        return false
      }

      const isSuccessful = ResultCode === "0"
      const newStatus = isSuccessful ? "completed" : "failed"

      // Update transaction
      await this.supabase
        .from("payment_transactions")
        .update({
          status: newStatus,
          completed_at: isSuccessful ? new Date().toISOString() : null,
          reference_number: BillRefNumber || transaction.reference_number,
          metadata: {
            ...transaction.metadata,
            result_code: ResultCode,
            result_desc: ResultDesc,
            transaction_code: TransactionCode,
            third_party_trans_id: ThirdPartyTransID,
            transaction_date: TransactionDate,
            confirmed_amount: TransAmount,
          },
          webhook_data: callbackData,
          updated_at: new Date().toISOString(),
        })
        .eq("id", transaction.id)

      if (isSuccessful) {
        // Payment successful - update order and trigger completion workflow
        await this.completeSuccessfulPayment(transaction)
      } else {
        // Payment failed - handle failure
        await this.handleFailedPayment(transaction, ResultDesc)
      }

      return isSuccessful

    } catch (error) {
      console.error("Error processing payment confirmation:", error)
      return false
    }
  }

  /**
   * Complete successful payment and trigger order completion
   */
  private async completeSuccessfulPayment(transaction: any): Promise<void> {
    const order = transaction.orders

    try {
      // Update order status to payment_confirmed
      await this.supabase
        .from("orders")
        .update({
          status: "payment_confirmed",
          confirmed_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq("id", order.id)

      // Log payment confirmation
      await this.supabase
        .from("order_logs")
        .insert({
          order_id: order.id,
          action: "payment_confirmed",
          details: {
            transaction_id: transaction.id,
            amount: transaction.amount,
            currency: transaction.currency,
            transaction_code: transaction.metadata?.transaction_code,
            confirmed_at: new Date().toISOString(),
          },
          created_at: new Date().toISOString(),
        })

      // Notify seller that payment has been received
      await this.notifySeller(order, transaction)

      // TODO: Trigger crypto release workflow
      // This should integrate with your exchange APIs to release the crypto
      await this.triggerCryptoRelease(order, transaction)

      console.log(`Payment confirmed for P2P order ${order.id}`)

    } catch (error) {
      console.error(`Error completing successful payment for order ${order.id}:`, error)
      throw error
    }
  }

  /**
   * Handle failed payment
   */
  private async handleFailedPayment(transaction: any, errorReason: string): Promise<void> {
    const order = transaction.orders

    try {
      // Return order to active status so it can be matched again
      await this.supabase
        .from("orders")
        .update({
          status: "active",
          buyer_id: null,
          buyer_phone: null,
          payment_deadline: null,
          error_message: `Payment failed: ${errorReason}`,
          updated_at: new Date().toISOString(),
        })
        .eq("id", order.id)

      // Log payment failure
      await this.supabase
        .from("order_logs")
        .insert({
          order_id: order.id,
          action: "payment_failed",
          details: {
            transaction_id: transaction.id,
            error_reason: errorReason,
            amount: transaction.amount,
            currency: transaction.currency,
            failed_at: new Date().toISOString(),
          },
          created_at: new Date().toISOString(),
        })

      console.log(`Payment failed for P2P order ${order.id}: ${errorReason}`)

    } catch (error) {
      console.error(`Error handling failed payment for order ${order.id}:`, error)
    }
  }

  /**
   * Notify seller about payment confirmation
   */
  private async notifySeller(order: any, transaction: any): Promise<void> {
    try {
      // Get seller information
      const { data: seller } = await this.supabase
        .from("users")
        .select("id, email, phone, notification_preferences")
        .eq("id", order.seller_id)
        .single()

      if (!seller) return

      // Create notification
      await this.supabase
        .from("notifications")
        .insert({
          user_id: seller.id,
          type: "payment_received",
          title: "Payment Received",
          message: `Payment of ${transaction.amount} ${transaction.currency} received for your ${order.crypto_currency} sale`,
          data: {
            order_id: order.id,
            transaction_id: transaction.id,
            amount: transaction.amount,
            currency: transaction.currency,
            crypto_amount: order.amount_crypto,
            crypto_currency: order.crypto_currency,
          },
          created_at: new Date().toISOString(),
        })

      console.log(`Seller notification sent for order ${order.id}`)
    } catch (error) {
      console.error("Error notifying seller:", error)
    }
  }

  /**
   * Trigger crypto release workflow
   */
  private async triggerCryptoRelease(order: any, transaction: any): Promise<void> {
    try {
      // This should integrate with your exchange APIs to release the held crypto
      // For now, we'll just log and update the order status

      console.log(`Triggering crypto release for order ${order.id}:`, {
        crypto_currency: order.crypto_currency,
        crypto_amount: order.amount_crypto,
        buyer_id: order.buyer_id,
        seller_id: order.seller_id,
      })

      // TODO: Implement actual crypto release logic here
      // Example:
      // 1. Call exchange API to transfer crypto from seller to buyer
      // 2. Update order status to completed
      // 3. Record the crypto transaction
      // 4. Send final notifications

      // For now, just update status to completed
      await this.supabase
        .from("orders")
        .update({
          status: "completed",
          completed_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq("id", order.id)

      // Log crypto release
      await this.supabase
        .from("order_logs")
        .insert({
          order_id: order.id,
          action: "crypto_released",
          details: {
            crypto_currency: order.crypto_currency,
            crypto_amount: order.amount_crypto,
            buyer_id: order.buyer_id,
            released_at: new Date().toISOString(),
          },
          created_at: new Date().toISOString(),
        })

    } catch (error) {
      console.error("Error triggering crypto release:", error)
      throw error
    }
  }

  /**
   * Check for expired payment requests and handle them
   */
  async handleExpiredPayments(): Promise<void> {
    try {
      const now = new Date().toISOString()

      // Find orders with expired payment deadlines
      const { data: expiredOrders, error } = await this.supabase
        .from("orders")
        .select("*")
        .eq("status", "payment_pending")
        .lt("payment_deadline", now)

      if (error) {
        console.error("Error finding expired payments:", error)
        return
      }

      for (const order of expiredOrders || []) {
        // Return order to active status
        await this.supabase
          .from("orders")
          .update({
            status: "active",
            buyer_id: null,
            buyer_phone: null,
            payment_deadline: null,
            error_message: "Payment window expired",
            updated_at: new Date().toISOString(),
          })
          .eq("id", order.id)

        // Update associated transaction
        await this.supabase
          .from("payment_transactions")
          .update({
            status: "expired",
            updated_at: new Date().toISOString(),
          })
          .eq("order_id", order.id)
          .eq("status", "pending")

        console.log(`Payment expired for order ${order.id}`)
      }

    } catch (error) {
      console.error("Error handling expired payments:", error)
    }
  }
}

// Export the class for instantiation within request handlers
// Don't export a singleton instance to avoid cookies context issues
