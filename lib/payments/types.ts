export interface PaymentProvider {
  id: string
  name: string
  type: "mobile_money" | "bank" | "crypto"
  country_code: string
  currency: string
  is_active: boolean
  config: Record<string, any>
}

export interface PaymentTransaction {
  id: string
  order_id: string
  team_id: string
  provider_id: string
  external_transaction_id?: string
  transaction_type: "payment" | "refund" | "chargeback"
  amount: number
  currency: string
  status: "pending" | "processing" | "completed" | "failed" | "cancelled"
  payment_method?: string
  payer_phone?: string
  payer_name?: string
  payer_account?: string
  reference_number?: string
  description?: string
  metadata: Record<string, any>
  webhook_data: Record<string, any>
  initiated_at: string
  completed_at?: string
  expires_at?: string
  created_at: string
  updated_at: string
}

export interface PaymentProof {
  id: string
  transaction_id: string
  order_id: string
  uploaded_by: string
  file_type: "image" | "pdf" | "document"
  file_url: string
  cloudinary_public_id?: string
  file_size?: number
  mime_type?: string
  verification_status: "pending" | "verified" | "rejected"
  verified_by?: string
  verified_at?: string
  rejection_reason?: string
  created_at: string
  updated_at: string
}

export interface InitiatePaymentRequest {
  order_id: string
  amount: number
  currency: string
  payer_phone: string
  payer_name?: string
  payer_account?: string
  description?: string
  callback_url?: string
}

export interface PaymentStatusResponse {
  transaction_id: string
  status: string
  amount: number
  currency: string
  reference_number?: string
  completed_at?: string
  error_message?: string
}
