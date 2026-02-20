export type Database = {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          email: string
          password_hash: string | null
          full_name: string | null
          avatar_url: string | null
          provider: string
          provider_id: string | null
          email_verified: boolean
          user_type: 'merchant' | 'member'
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          email: string
          password_hash?: string | null
          full_name?: string | null
          avatar_url?: string | null
          provider?: string
          provider_id?: string | null
          email_verified?: boolean
          user_type?: 'merchant' | 'member'
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          password_hash?: string | null
          full_name?: string | null
          avatar_url?: string | null
          provider?: string
          provider_id?: string | null
          email_verified?: boolean
          user_type?: 'merchant' | 'member'
          created_at?: string
          updated_at?: string
        }
      }
      teams: {
        Row: {
          id: string
          name: string
          description: string | null
          owner_id: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          description?: string | null
          owner_id: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          description?: string | null
          owner_id?: string
          created_at?: string
          updated_at?: string
        }
      }
      team_members: {
        Row: {
          id: string
          team_id: string
          user_id: string
          role: string
          permissions: any
          invited_by: string | null
          joined_at: string
        }
        Insert: {
          id?: string
          team_id: string
          user_id: string
          role?: string
          permissions?: any
          invited_by?: string | null
          joined_at?: string
        }
        Update: {
          id?: string
          team_id?: string
          user_id?: string
          role?: string
          permissions?: any
          invited_by?: string | null
          joined_at?: string
        }
      }
      payment_providers: {
        Row: {
          id: string
          name: string
          type: string
          country_code: string
          currency: string
          is_active: boolean
          config: any
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          type: string
          country_code: string
          currency: string
          is_active?: boolean
          config?: any
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          type?: string
          country_code?: string
          currency?: string
          is_active?: boolean
          config?: any
          created_at?: string
          updated_at?: string
        }
      }
      team_payment_configs: {
        Row: {
          id: string
          team_id: string
          provider_id: string
          merchant_id: string | null
          api_key_encrypted: string | null
          secret_key_encrypted: string | null
          webhook_secret_encrypted: string | null
          is_active: boolean
          config: any
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          team_id: string
          provider_id: string
          merchant_id?: string | null
          api_key_encrypted?: string | null
          secret_key_encrypted?: string | null
          webhook_secret_encrypted?: string | null
          is_active?: boolean
          config?: any
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          team_id?: string
          provider_id?: string
          merchant_id?: string | null
          api_key_encrypted?: string | null
          secret_key_encrypted?: string | null
          webhook_secret_encrypted?: string | null
          is_active?: boolean
          config?: any
          created_at?: string
          updated_at?: string
        }
      }
      payment_transactions: {
        Row: {
          id: string
          order_id: string
          team_id: string
          provider_id: string
          external_transaction_id: string | null
          transaction_type: string
          amount: number
          currency: string
          status: string
          payment_method: string | null
          payer_phone: string | null
          payer_name: string | null
          payer_account: string | null
          reference_number: string | null
          description: string | null
          metadata: any
          webhook_data: any
          initiated_at: string
          completed_at: string | null
          expires_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          order_id: string
          team_id: string
          provider_id: string
          external_transaction_id?: string | null
          transaction_type: string
          amount: number
          currency: string
          status?: string
          payment_method?: string | null
          payer_phone?: string | null
          payer_name?: string | null
          payer_account?: string | null
          reference_number?: string | null
          description?: string | null
          metadata?: any
          webhook_data?: any
          initiated_at?: string
          completed_at?: string | null
          expires_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          order_id?: string
          team_id?: string
          provider_id?: string
          external_transaction_id?: string | null
          transaction_type?: string
          amount?: number
          currency?: string
          status?: string
          payment_method?: string | null
          payer_phone?: string | null
          payer_name?: string | null
          payer_account?: string | null
          reference_number?: string | null
          description?: string | null
          metadata?: any
          webhook_data?: any
          initiated_at?: string
          completed_at?: string | null
          expires_at?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      payment_proofs: {
        Row: {
          id: string
          transaction_id: string
          order_id: string
          uploaded_by: string
          file_type: string
          file_url: string
          cloudinary_public_id: string | null
          file_size: number | null
          mime_type: string | null
          verification_status: string
          verified_by: string | null
          verified_at: string | null
          rejection_reason: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          transaction_id: string
          order_id: string
          uploaded_by: string
          file_type: string
          file_url: string
          cloudinary_public_id?: string | null
          file_size?: number | null
          mime_type?: string | null
          verification_status?: string
          verified_by?: string | null
          verified_at?: string | null
          rejection_reason?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          transaction_id?: string
          order_id?: string
          uploaded_by?: string
          file_type?: string
          file_url?: string
          cloudinary_public_id?: string | null
          file_size?: number | null
          mime_type?: string | null
          verification_status?: string
          verified_by?: string | null
          verified_at?: string | null
          rejection_reason?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      webhook_logs: {
        Row: {
          id: string
          provider_id: string
          team_id: string | null
          transaction_id: string | null
          webhook_type: string | null
          payload: any
          headers: any
          response_status: number | null
          response_body: string | null
          processed_at: string | null
          error_message: string | null
          created_at: string
        }
        Insert: {
          id?: string
          provider_id: string
          team_id?: string | null
          transaction_id?: string | null
          webhook_type?: string | null
          payload: any
          headers?: any
          response_status?: number | null
          response_body?: string | null
          processed_at?: string | null
          error_message?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          provider_id?: string
          team_id?: string | null
          transaction_id?: string | null
          webhook_type?: string | null
          payload?: any
          headers?: any
          response_status?: number | null
          response_body?: string | null
          processed_at?: string | null
          error_message?: string | null
          created_at?: string
        }
      }
      ads: {
        Row: {
          id: string
          team_id: string
          exchange_name: string
          external_ad_id: string | null
          side: string
          crypto_currency: string
          fiat_currency: string
          crypto_amount: number | null
          unit_price: number | null
          min_order_limit: number | null
          max_order_limit: number | null
          price_type: string | null
          price_margin: number | null
          status: string
          is_hidden: boolean
          payment_methods: any
          target_group: string | null
          min_kyc_level: number | null
          min_completed_orders: number | null
          min_completion_rate: number | null
          remark: string | null
          automated_message: string | null
          created_by: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          team_id: string
          exchange_name: string
          external_ad_id?: string | null
          side: string
          crypto_currency: string
          fiat_currency: string
          crypto_amount?: number | null
          unit_price?: number | null
          min_order_limit?: number | null
          max_order_limit?: number | null
          price_type?: string | null
          price_margin?: number | null
          status?: string
          is_hidden?: boolean
          payment_methods?: any
          target_group?: string | null
          min_kyc_level?: number | null
          min_completed_orders?: number | null
          min_completion_rate?: number | null
          remark?: string | null
          automated_message?: string | null
          created_by?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          team_id?: string
          exchange_name?: string
          external_ad_id?: string | null
          side?: string
          crypto_currency?: string
          fiat_currency?: string
          crypto_amount?: number | null
          unit_price?: number | null
          min_order_limit?: number | null
          max_order_limit?: number | null
          price_type?: string | null
          price_margin?: number | null
          status?: string
          is_hidden?: boolean
          payment_methods?: any
          target_group?: string | null
          min_kyc_level?: number | null
          min_completed_orders?: number | null
          min_completion_rate?: number | null
          remark?: string | null
          automated_message?: string | null
          created_by?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      orders: {
        Row: {
          id: string
          team_id: string
          ad_id: string | null
          exchange_name: string
          external_order_id: string | null
          side: string
          crypto_currency: string
          fiat_currency: string
          crypto_amount: number | null
          fiat_amount: number | null
          unit_price: number | null
          order_status: string | null
          payment_status: string | null
          counterparty_info: any
          expires_at: string | null
          completed_at: string | null
          created_by: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          team_id: string
          ad_id?: string | null
          exchange_name: string
          external_order_id?: string | null
          side: string
          crypto_currency: string
          fiat_currency: string
          crypto_amount?: number | null
          fiat_amount?: number | null
          unit_price?: number | null
          order_status?: string | null
          payment_status?: string | null
          counterparty_info?: any
          expires_at?: string | null
          completed_at?: string | null
          created_by?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          team_id?: string
          ad_id?: string | null
          exchange_name?: string
          external_order_id?: string | null
          side?: string
          crypto_currency?: string
          fiat_currency?: string
          crypto_amount?: number | null
          fiat_amount?: number | null
          unit_price?: number | null
          order_status?: string | null
          payment_status?: string | null
          counterparty_info?: any
          expires_at?: string | null
          completed_at?: string | null
          created_by?: string | null
          created_at?: string
          updated_at?: string
        }
      }
    }
  }
}
