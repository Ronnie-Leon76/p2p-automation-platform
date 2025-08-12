/**
 * SasaPay API Integration Service
 * Handles authentication and payment requests to SasaPay sandbox environment
 */

interface SasaPayAuthResponse {
  access_token: string
  token_type: string
  expires_in: number
}

interface SasaPayPaymentRequest {
  amount: number
  currency: string
  phone_number: string
  merchant_reference: string
  description?: string
  callback_url?: string
  merchant_code?: string
  network_code?: string
}

interface SasaPayB2CRequest {
  MerchantCode: string
  MerchantTransactionReference: string
  Amount: string
  Currency: string
  ReceiverNumber: string
  Channel: string
  Reason: string
  CallBackURL: string
}

interface SasaPayB2CResponse {
  status: boolean
  detail: string
  B2CRequestID: string
  ConversationID: string
  OriginatorConversationID: string
  ResponseCode: string
  TransactionCharges: string
  ResponseDescription: string
}

interface SasaPayC2BRequest {
  MerchantCode: string
  NetworkCode: string
  PhoneNumber: string
  TransactionDesc: string
  AccountReference: string
  Currency: string
  Amount: string
  "Transaction Fee": string
  CallBackURL: string
}

interface SasaPayC2BResponse {
  status: boolean
  detail: string
  PaymentGateway: string
  MerchantRequestID: string
  CheckoutRequestID: string
  TransactionReference?: string
  ResponseCode: string
  ResponseDescription: string
  CustomerMessage: string
}

interface SasaPayPaymentResponse {
  transaction_id: string
  status: string
  message: string
  reference_number?: string
}

export class SasaPayService {
  private baseUrl: string
  private clientId: string
  private clientSecret: string
  private callbackUrl: string
  private accessToken?: string
  private tokenExpiry?: number

  constructor() {
    this.baseUrl = process.env.SASAPAY_ENVIRONMENT === 'production' 
      ? 'https://api.sasapay.app' 
      : 'https://sandbox.sasapay.app'
    this.clientId = process.env.SASAPAY_CLIENT_ID!
    this.clientSecret = process.env.SASAPAY_CLIENT_SECRET!
    this.callbackUrl = process.env.SASAPAY_CALLBACK_URL!
  }

  /**
   * Public method to test authentication (for testing purposes)
   */
  async testAuthentication(): Promise<string> {
    return await this.authenticate()
  }

  /**
   * Public method to test phone number normalization (for testing purposes)
   */
  public testPhoneNormalization(phoneNumber: string): string {
    return this.normalizePhoneNumber(phoneNumber)
  }

  /**
   * Authenticate with SasaPay and get access token
   * Uses Basic Authentication with client credentials as per SasaPay documentation
   */
  private async authenticate(): Promise<string> {
    // Check if we have a valid token
    if (this.accessToken && this.tokenExpiry && Date.now() < this.tokenExpiry) {
      return this.accessToken
    }

    try {
      // Create base64 encoded credentials for Basic auth
      const credentials = Buffer.from(`${this.clientId}:${this.clientSecret}`).toString('base64')
      
      const tokenUrl = `${this.baseUrl}/api/v1/auth/token/?grant_type=client_credentials`

      const response = await fetch(tokenUrl, {
        method: 'GET',
        headers: {
          'Authorization': `Basic ${credentials}`,
          'Accept': 'application/json',
        },
      })

      if (!response.ok) {
        const errorText = await response.text()
        console.error('SasaPay authentication failed:', response.status, errorText)
        throw new Error(`SasaPay authentication failed: ${response.status} - ${errorText}`)
      }

      const data: SasaPayAuthResponse = await response.json()
      
      console.log('SasaPay authentication successful:', {
        token_type: data.token_type,
        expires_in: data.expires_in,
      })
      
      this.accessToken = data.access_token
      this.tokenExpiry = Date.now() + (data.expires_in * 1000) - 60000 // Refresh 1 minute before expiry

      return this.accessToken
    } catch (error) {
      console.error('SasaPay authentication error:', error)
      throw new Error('Failed to authenticate with SasaPay')
    }
  }

  /**
   * Send money to customer (B2C) - Used for P2P buy orders
   * This sends money from merchant account to customer's mobile money
   */
  async sendMoney(paymentData: {
    amount: number
    currency: string
    receiver_phone: string
    merchant_reference: string
    reason?: string
    callback_url?: string
  }): Promise<SasaPayB2CResponse> {
    try {
      const accessToken = await this.authenticate()

      // Normalize phone number to correct format
      const normalizedPhone = this.normalizePhoneNumber(paymentData.receiver_phone)
      
      const requestBody: SasaPayB2CRequest = {
        MerchantCode: process.env.SASAPAY_MERCHANT_CODE || "600000",
        MerchantTransactionReference: paymentData.merchant_reference,
        Amount: paymentData.amount.toString(),
        Currency: paymentData.currency,
        ReceiverNumber: normalizedPhone,
        Channel: "0", // SasaPay channel
        Reason: paymentData.reason || "P2P Platform Payment",
        CallBackURL: paymentData.callback_url || this.callbackUrl,
      }

      console.log('Initiating SasaPay B2C payment:', {
        merchant_reference: paymentData.merchant_reference,
        amount: paymentData.amount,
        receiver_phone: normalizedPhone,
        original_phone: paymentData.receiver_phone,
      })

      const response = await fetch(`${this.baseUrl}/api/v1/payments/b2c/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'Authorization': `Bearer ${accessToken}`,
        },
        body: JSON.stringify(requestBody),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: response.statusText }))
        console.error('SasaPay B2C request failed:', errorData)
        throw new Error(`SasaPay B2C request failed: ${errorData.detail || errorData.message || response.statusText}`)
      }

      const data: SasaPayB2CResponse = await response.json()
      
      console.log('SasaPay B2C payment initiated successfully:', {
        b2c_request_id: data.B2CRequestID,
        conversation_id: data.ConversationID,
        response_code: data.ResponseCode,
        status: data.status,
      })

      return data
    } catch (error) {
      console.error('SasaPay B2C payment error:', error)
      throw error
    }
  }

  /**
   * Normalize phone number to international format for Kenya
   * Handles various input formats: 07xxxxxxxx, 01xxxxxxxx, 254xxxxxxx, +254xxxxxxx
   */
  private normalizePhoneNumber(phoneNumber: string): string {
    // Remove all non-digit characters
    let cleanNumber = phoneNumber.replace(/\D/g, '')
    
    console.log('Normalizing phone number:', { original: phoneNumber, cleaned: cleanNumber })

    // Handle different formats
    if (cleanNumber.startsWith('254')) {
      // Already in international format
      if (cleanNumber.length === 12) {
        return cleanNumber
      } else {
        throw new Error(`Invalid phone number format: ${phoneNumber}. Expected 12 digits for 254 format.`)
      }
    } else if (cleanNumber.startsWith('0')) {
      // Local format (07xxxxxxxx or 01xxxxxxxx)
      if (cleanNumber.length === 10) {
        return `254${cleanNumber.substring(1)}`
      } else {
        throw new Error(`Invalid phone number format: ${phoneNumber}. Expected 10 digits for local format.`)
      }
    } else if (cleanNumber.length === 9) {
      // Missing leading zero (7xxxxxxxx or 1xxxxxxxx)
      return `254${cleanNumber}`
    } else {
      throw new Error(`Invalid phone number format: ${phoneNumber}. Unable to normalize.`)
    }
  }

  /**
   * Validate Kenyan phone number format
   */
  private validateKenyanPhoneNumber(phoneNumber: string): boolean {
    const normalizedNumber = this.normalizePhoneNumber(phoneNumber)
    
    // Check if it's a valid Kenyan mobile number
    // Valid prefixes for Kenya: 254700-254799 (Safaricom), 254701-254709 (Airtel), etc.
    const kenyanMobileRegex = /^254[71][0-9]{8}$/
    
    return kenyanMobileRegex.test(normalizedNumber)
  }

  /**
   * Get channel code for different mobile money providers
   */
  private getChannelCode(phoneNumber: string): string {
    const normalizedNumber = this.normalizePhoneNumber(phoneNumber)
    
    // For now, default to SasaPay channel (0)
    // In future, you can add logic to determine specific providers
    // 0 -> SasaPay (handles M-Pesa, Airtel, etc.)
    return "0"
  }

  /**
   * Request payment from customer (C2B) - Used for P2P sell orders
   * This initiates an STK push to the customer's phone
   */
  async requestPayment(paymentData: SasaPayPaymentRequest): Promise<SasaPayC2BResponse> {
    try {
      const accessToken = await this.authenticate()

      // Determine network code based on phone number prefix
      const networkCode = this.getNetworkCode(paymentData.phone_number)
      
      const requestBody: SasaPayC2BRequest = {
        MerchantCode: process.env.SASAPAY_MERCHANT_CODE || "600000", // Default merchant code
        NetworkCode: paymentData.network_code || networkCode,
        PhoneNumber: paymentData.phone_number,
        TransactionDesc: paymentData.description || "P2P Platform Payment",
        AccountReference: paymentData.merchant_reference,
        Currency: paymentData.currency,
        Amount: paymentData.amount.toString(),
        "Transaction Fee": "0",
        CallBackURL: paymentData.callback_url || this.callbackUrl,
      }

      console.log('Initiating SasaPay C2B payment request:', {
        merchant_reference: paymentData.merchant_reference,
        amount: paymentData.amount,
        phone_number: paymentData.phone_number,
        network_code: requestBody.NetworkCode,
      })

      const response = await fetch(`${this.baseUrl}/api/v1/payments/request-payment/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'Authorization': `Bearer ${accessToken}`,
        },
        body: JSON.stringify(requestBody),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: response.statusText }))
        console.error('SasaPay C2B request failed:', errorData)
        throw new Error(`SasaPay C2B request failed: ${errorData.detail || errorData.message || response.statusText}`)
      }

      const data: SasaPayC2BResponse = await response.json()
      
      console.log('SasaPay C2B payment request successful:', {
        checkout_request_id: data.CheckoutRequestID,
        merchant_request_id: data.MerchantRequestID,
        response_code: data.ResponseCode,
        status: data.status,
      })

      return data
    } catch (error) {
      console.error('SasaPay C2B payment request error:', error)
      throw error
    }
  }

  /**
   * Get network code based on phone number prefix
   */
  private getNetworkCode(phoneNumber: string): string {
    const cleanNumber = phoneNumber.replace(/[^0-9]/g, '')
    
    // M-Pesa (Safaricom) - Kenya
    if (cleanNumber.match(/^(254)?7[0-9]/)) {
      return "63902" // M-Pesa network code
    }
    
    // Airtel Money - Kenya  
    if (cleanNumber.match(/^(254)?7[3-8]/)) {
      return "63903" // Airtel Money network code
    }
    
    // T-Kash (Telkom) - Kenya
    if (cleanNumber.match(/^(254)?77/)) {
      return "63907" // T-Kash network code
    }
    
    // Default to M-Pesa if unsure
    return "63902"
  }

  /**
   * Initiate a payment request (legacy method - keeping for backward compatibility)
   */
  async initiatePayment(paymentData: SasaPayPaymentRequest): Promise<SasaPayPaymentResponse> {
    try {
      const accessToken = await this.authenticate()

      const requestBody = {
        ...paymentData,
        callback_url: paymentData.callback_url || this.callbackUrl,
      }

      const response = await fetch(`${this.baseUrl}/api/v1/payments/mobile-money`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'Authorization': `Bearer ${accessToken}`,
        },
        body: JSON.stringify(requestBody),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: response.statusText }))
        throw new Error(`SasaPay payment failed: ${errorData.message || response.statusText}`)
      }

      const data: SasaPayPaymentResponse = await response.json()
      
      console.log('SasaPay payment initiated:', {
        transaction_id: data.transaction_id,
        status: data.status,
        merchant_reference: paymentData.merchant_reference,
      })

      return data
    } catch (error) {
      console.error('SasaPay payment error:', error)
      throw error
    }
  }

  /**
   * Query payment status
   */
  async getPaymentStatus(transactionId: string): Promise<any> {
    try {
      const accessToken = await this.authenticate()

      const response = await fetch(`${this.baseUrl}/api/v1/payments/${transactionId}`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Authorization': `Bearer ${accessToken}`,
        },
      })

      if (!response.ok) {
        throw new Error(`SasaPay status query failed: ${response.statusText}`)
      }

      return await response.json()
    } catch (error) {
      console.error('SasaPay status query error:', error)
      throw error
    }
  }

  /**
   * Get account balance (if supported)
   */
  async getBalance(): Promise<any> {
    try {
      const accessToken = await this.authenticate()

      const response = await fetch(`${this.baseUrl}/api/v1/account/balance`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Authorization': `Bearer ${accessToken}`,
        },
      })

      if (!response.ok) {
        throw new Error(`SasaPay balance query failed: ${response.statusText}`)
      }

      return await response.json()
    } catch (error) {
      console.error('SasaPay balance query error:', error)
      throw error
    }
  }
}

// Export a singleton instance
export const sasaPayService = new SasaPayService()
