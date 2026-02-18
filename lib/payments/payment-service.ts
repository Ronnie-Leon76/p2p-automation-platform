import { getBrowserDbClient } from "@/lib/composition/browser-db-composer";
import { MPesaProvider } from "./mpesa"
import { IMBankProvider } from "./im-bank"
import type { PaymentProvider, PaymentTransaction, InitiatePaymentRequest, PaymentStatusResponse } from "./types"

export class PaymentService {
  private supabase = getBrowserDbClient()

  async getTeamPaymentProviders(teamId: string): Promise<PaymentProvider[]> {
    const { data, error } = await this.supabase
      .from("payment_providers")
      .select(`
        *,
        team_payment_configs!inner(
          team_id,
          is_active
        )
      `)
      .eq("team_payment_configs.team_id", teamId)
      .eq("team_payment_configs.is_active", true)
      .eq("is_active", true)

    if (error) throw error
    return data || []
  }

  async initiatePayment(
    teamId: string,
    providerId: string,
    request: InitiatePaymentRequest,
  ): Promise<PaymentTransaction> {
    // Get provider configuration
    const { data: config, error: configError } = await this.supabase
      .from("team_payment_configs")
      .select(`
        *,
        payment_providers(*)
      `)
      .eq("team_id", teamId)
      .eq("provider_id", providerId)
      .eq("is_active", true)
      .single()

    if (configError || !config) {
      throw new Error("Payment provider not configured for this team")
    }

    // Create transaction record
    const { data: transaction, error: transactionError } = await this.supabase
      .from("payment_transactions")
      .insert({
        order_id: request.order_id,
        team_id: teamId,
        provider_id: providerId,
        transaction_type: "payment",
        amount: request.amount,
        currency: request.currency,
        status: "pending",
        payer_phone: request.payer_phone,
        payer_name: request.payer_name,
        description: request.description,
        expires_at: new Date(Date.now() + 15 * 60 * 1000).toISOString(), // 15 minutes
      })
      .select()
      .single()

    if (transactionError) throw transactionError

    try {
      let externalResponse: any

      // Initialize payment based on provider type
      if (config.payment_providers.name.includes("M-Pesa")) {
        const mpesa = new MPesaProvider(
          config.api_key_encrypted, // In production, decrypt these
          config.secret_key_encrypted,
          config.config.environment || "sandbox",
        )

        externalResponse = await mpesa.initiateSTKPush({
          businessShortCode: config.merchant_id,
          passkey: config.config.passkey,
          amount: request.amount,
          phoneNumber: request.payer_phone,
          callbackUrl: `${process.env.NEXT_PUBLIC_APP_URL}/api/webhooks/mpesa`,
          accountReference: transaction.id,
          transactionDesc: request.description || "P2P Payment",
        })
      } else if (config.payment_providers.name.includes("I&M Bank")) {
        const imBank = new IMBankProvider(
          config.api_key_encrypted,
          config.secret_key_encrypted,
          config.merchant_id,
          config.config.environment || "sandbox",
        )

        externalResponse = await imBank.initiateC2BPayment({
          amount: request.amount,
          currency: request.currency,
          phoneNumber: request.payer_phone,
          accountNumber: request.payer_account || "",
          description: request.description || "P2P Payment",
          callbackUrl: `${process.env.NEXT_PUBLIC_APP_URL}/api/webhooks/im-bank`,
        })
      }

      // Update transaction with external response
      const { data: updatedTransaction, error: updateError } = await this.supabase
        .from("payment_transactions")
        .update({
          external_transaction_id: externalResponse.CheckoutRequestID || externalResponse.transaction_id,
          status: "processing",
          metadata: externalResponse,
        })
        .eq("id", transaction.id)
        .select()
        .single()

      if (updateError) throw updateError

      return updatedTransaction
    } catch (error) {
      // Update transaction status to failed
      await this.supabase
        .from("payment_transactions")
        .update({
          status: "failed",
          metadata: { error: error instanceof Error ? error.message : "Unknown error" },
        })
        .eq("id", transaction.id)

      throw error
    }
  }

  async checkPaymentStatus(transactionId: string): Promise<PaymentStatusResponse> {
    const { data: transaction, error } = await this.supabase
      .from("payment_transactions")
      .select(`
        *,
        team_payment_configs(
          *,
          payment_providers(*)
        )
      `)
      .eq("id", transactionId)
      .single()

    if (error || !transaction) {
      throw new Error("Transaction not found")
    }

    const config = transaction.team_payment_configs

    try {
      let statusResponse: any

      if (config.payment_providers.name.includes("M-Pesa")) {
        const mpesa = new MPesaProvider(
          config.api_key_encrypted,
          config.secret_key_encrypted,
          config.config.environment || "sandbox",
        )

        statusResponse = await mpesa.queryTransactionStatus({
          businessShortCode: config.merchant_id,
          passkey: config.config.passkey,
          checkoutRequestId: transaction.external_transaction_id,
        })
      } else if (config.payment_providers.name.includes("I&M Bank")) {
        const imBank = new IMBankProvider(
          config.api_key_encrypted,
          config.secret_key_encrypted,
          config.merchant_id,
          config.config.environment || "sandbox",
        )

        statusResponse = await imBank.queryTransactionStatus(transaction.external_transaction_id)
      }

      // Update transaction status based on response
      let newStatus = transaction.status
      let completedAt = transaction.completed_at

      if (statusResponse.ResultCode === "0" || statusResponse.status === "completed") {
        newStatus = "completed"
        completedAt = new Date().toISOString()
      } else if (statusResponse.ResultCode !== "0" || statusResponse.status === "failed") {
        newStatus = "failed"
      }

      if (newStatus !== transaction.status) {
        await this.supabase
          .from("payment_transactions")
          .update({
            status: newStatus,
            completed_at: completedAt,
            webhook_data: statusResponse,
          })
          .eq("id", transactionId)
      }

      return {
        transaction_id: transactionId,
        status: newStatus,
        amount: transaction.amount,
        currency: transaction.currency,
        reference_number: statusResponse.MpesaReceiptNumber || statusResponse.reference_number,
        completed_at: completedAt,
        error_message: statusResponse.ResultDesc || statusResponse.error_message,
      }
    } catch (error) {
      return {
        transaction_id: transactionId,
        status: transaction.status,
        amount: transaction.amount,
        currency: transaction.currency,
        error_message: error instanceof Error ? error.message : "Failed to check status",
      }
    }
  }

  async uploadPaymentProof(transactionId: string, orderId: string, file: File, uploadedBy: string): Promise<string> {
    // Upload to Cloudinary
    const formData = new FormData()
    formData.append("file", file)
    formData.append("upload_preset", process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET || "p2p_automation")
    formData.append("folder", "payment_proofs")

    const cloudinaryResponse = await fetch(
      `https://api.cloudinary.com/v1_1/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME}/upload`,
      {
        method: "POST",
        body: formData,
      },
    )

    if (!cloudinaryResponse.ok) {
      throw new Error("Failed to upload file to Cloudinary")
    }

    const cloudinaryData = await cloudinaryResponse.json()

    // Save to database
    const { data, error } = await this.supabase
      .from("payment_proofs")
      .insert({
        transaction_id: transactionId,
        order_id: orderId,
        uploaded_by: uploadedBy,
        file_type: file.type.startsWith("image/") ? "image" : "document",
        file_url: cloudinaryData.secure_url,
        cloudinary_public_id: cloudinaryData.public_id,
        file_size: file.size,
        mime_type: file.type,
      })
      .select()
      .single()

    if (error) throw error

    return cloudinaryData.secure_url
  }
}

