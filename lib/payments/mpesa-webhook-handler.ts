import { createServerClient } from "@/lib/supabase/server"

export class MPesaWebhookHandler {
  private supabase: any | null = null

  private async getSupabase() {
    if (!this.supabase) {
      this.supabase = await createServerClient()
    }
    return this.supabase
  }

  async processSTKCallback(callbackData: any) {
    const supabase = await this.getSupabase()
    const { stkCallback } = callbackData.Body
    const { CheckoutRequestID, ResultCode, ResultDesc } = stkCallback

    // Find the transaction
    const { data: transaction } = await supabase
      .from("payment_transactions")
      .select("*")
      .eq("external_transaction_id", CheckoutRequestID)
      .single()

    if (!transaction) {
      throw new Error(`Transaction not found for CheckoutRequestID: ${CheckoutRequestID}`)
    }

    if (ResultCode === 0) {
      // Payment successful
      return await this.handleSuccessfulPayment(transaction, stkCallback)
    } else {
      // Payment failed
      return await this.handleFailedPayment(transaction, ResultDesc, ResultCode)
    }
  }

  async processC2BConfirmation(confirmationData: any) {
    const supabase = await this.getSupabase()
    const { TransID, BillRefNumber, TransAmount, MSISDN } = confirmationData

    // Try to find transaction by bill reference
    const { data: transaction } = await supabase
      .from("payment_transactions")
      .select("*")
      .eq("id", BillRefNumber)
      .single()

    if (transaction) {
      return await this.updateExistingTransaction(transaction, confirmationData)
    } else {
      return await this.createUnmatchedTransaction(confirmationData)
    }
  }

  async validateC2BPayment(validationData: any): Promise<{ isValid: boolean; reason?: string }> {
    const supabase = await this.getSupabase()
    const { BillRefNumber, TransAmount, MSISDN } = validationData

    // Check if transaction exists
    if (BillRefNumber) {
      const { data: transaction } = await supabase
        .from("payment_transactions")
        .select("amount, status")
        .eq("id", BillRefNumber)
        .single()

      if (transaction) {
        // Validate amount
        const expectedAmount = transaction.amount
        const receivedAmount = Number.parseFloat(TransAmount)

        if (Math.abs(expectedAmount - receivedAmount) > 1) {
          return { isValid: false, reason: "Amount mismatch" }
        }

        // Check transaction status
        if (!["pending", "processing"].includes(transaction.status)) {
          return { isValid: false, reason: "Transaction already processed" }
        }
      }
    }

    // Validate amount range
    const amount = Number.parseFloat(TransAmount)
    if (amount < 10) {
      return { isValid: false, reason: "Amount too small" }
    }

    if (amount > 1000000) {
      return { isValid: false, reason: "Amount exceeds limit" }
    }

    // Validate phone number
    if (!MSISDN || MSISDN.length < 10) {
      return { isValid: false, reason: "Invalid phone number" }
    }

    return { isValid: true }
  }

  private async handleSuccessfulPayment(transaction: any, stkCallback: any) {
    const supabase = await this.getSupabase()
    const metadata: any = { ...transaction.metadata }

    // Extract callback metadata
    if (stkCallback.CallbackMetadata?.Item) {
      stkCallback.CallbackMetadata.Item.forEach((item: any) => {
        switch (item.Name) {
          case "Amount":
            metadata.amount_paid = Number.parseFloat(item.Value.toString())
            break
          case "MpesaReceiptNumber":
            metadata.receipt_number = item.Value.toString()
            break
          case "TransactionDate":
            metadata.transaction_date = item.Value.toString()
            break
          case "PhoneNumber":
            metadata.phone_number = item.Value.toString()
            break
        }
      })
    }

    // Update transaction
    await supabase
      .from("payment_transactions")
      .update({
        status: "completed",
        completed_at: new Date().toISOString(),
        reference_number: metadata.receipt_number,
        metadata,
        updated_at: new Date().toISOString(),
      })
      .eq("id", transaction.id)

    // Update order
    if (transaction.order_id) {
      await supabase
        .from("orders")
        .update({
          payment_status: "confirmed",
          updated_at: new Date().toISOString(),
        })
        .eq("id", transaction.order_id)
    }

    return { success: true, receiptNumber: metadata.receipt_number }
  }

  private async handleFailedPayment(transaction: any, resultDesc: string, resultCode: number) {
    const supabase = await this.getSupabase()
    const metadata = {
      ...transaction.metadata,
      failure_reason: resultDesc,
      result_code: resultCode,
    }

    await supabase
      .from("payment_transactions")
      .update({
        status: "failed",
        metadata,
        updated_at: new Date().toISOString(),
      })
      .eq("id", transaction.id)

    return { success: false, reason: resultDesc }
  }

  private async updateExistingTransaction(transaction: any, confirmationData: any) {
    const supabase = await this.getSupabase()
    const { TransID, TransAmount, MSISDN, FirstName, LastName } = confirmationData

    await supabase
      .from("payment_transactions")
      .update({
        status: "completed",
        completed_at: new Date().toISOString(),
        reference_number: TransID,
        payer_phone: MSISDN,
        payer_name: `${FirstName} ${LastName}`.trim(),
        metadata: {
          ...transaction.metadata,
          confirmed_amount: Number.parseFloat(TransAmount),
        },
        updated_at: new Date().toISOString(),
      })
      .eq("id", transaction.id)

    return { success: true, transactionId: transaction.id }
  }

  private async createUnmatchedTransaction(confirmationData: any) {
    const supabase = await this.getSupabase()
    const { TransID, TransAmount, MSISDN, FirstName, LastName } = confirmationData

    const { data: newTransaction } = await supabase
      .from("payment_transactions")
      .insert({
        external_transaction_id: TransID,
        transaction_type: "c2b_payment",
        amount: Number.parseFloat(TransAmount),
        currency: "KES",
        status: "completed",
        payment_method: "mpesa",
        payer_phone: MSISDN,
        payer_name: `${FirstName} ${LastName}`.trim(),
        reference_number: TransID,
        description: "Unmatched C2B payment",
        metadata: confirmationData,
        initiated_at: new Date().toISOString(),
        completed_at: new Date().toISOString(),
      })
      .select()
      .single()

    return { success: true, transactionId: newTransaction?.id, unmatched: true }
  }
}
