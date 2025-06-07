import crypto from "crypto"

export class IMBankProvider {
  private apiKey: string
  private secretKey: string
  private merchantId: string
  private environment: "sandbox" | "production"
  private baseUrl: string

  constructor(
    apiKey: string,
    secretKey: string,
    merchantId: string,
    environment: "sandbox" | "production" = "sandbox",
  ) {
    this.apiKey = apiKey
    this.secretKey = secretKey
    this.merchantId = merchantId
    this.environment = environment
    this.baseUrl = environment === "production" ? "https://api.imbank.co.ke" : "https://sandbox-api.imbank.co.ke"
  }

  private generateSignature(payload: string, timestamp: string): string {
    const stringToSign = `${payload}${timestamp}${this.secretKey}`
    return crypto.createHash("sha256").update(stringToSign).digest("hex")
  }

  private generateHeaders(payload: string): Record<string, string> {
    const timestamp = Date.now().toString()
    const signature = this.generateSignature(payload, timestamp)

    return {
      "Content-Type": "application/json",
      "X-API-Key": this.apiKey,
      "X-Timestamp": timestamp,
      "X-Signature": signature,
    }
  }

  async initiateC2BPayment(params: {
    amount: number
    currency: string
    phoneNumber: string
    accountNumber: string
    description: string
    callbackUrl: string
  }): Promise<any> {
    const requestBody = {
      merchant_id: this.merchantId,
      amount: params.amount,
      currency: params.currency,
      phone_number: params.phoneNumber,
      account_number: params.accountNumber,
      description: params.description,
      callback_url: params.callbackUrl,
      transaction_type: "C2B",
    }

    const payload = JSON.stringify(requestBody)
    const headers = this.generateHeaders(payload)

    const response = await fetch(`${this.baseUrl}/v2/payments/initiate`, {
      method: "POST",
      headers,
      body: payload,
    })

    if (!response.ok) {
      throw new Error("Failed to initiate I&M Bank C2B payment")
    }

    return response.json()
  }

  async queryTransactionStatus(transactionId: string): Promise<any> {
    const requestBody = {
      merchant_id: this.merchantId,
      transaction_id: transactionId,
    }

    const payload = JSON.stringify(requestBody)
    const headers = this.generateHeaders(payload)

    const response = await fetch(`${this.baseUrl}/v2/payments/status`, {
      method: "POST",
      headers,
      body: payload,
    })

    if (!response.ok) {
      throw new Error("Failed to query I&M Bank transaction status")
    }

    return response.json()
  }

  async validateAccount(accountNumber: string): Promise<any> {
    const requestBody = {
      merchant_id: this.merchantId,
      account_number: accountNumber,
    }

    const payload = JSON.stringify(requestBody)
    const headers = this.generateHeaders(payload)

    const response = await fetch(`${this.baseUrl}/v2/accounts/validate`, {
      method: "POST",
      headers,
      body: payload,
    })

    if (!response.ok) {
      throw new Error("Failed to validate I&M Bank account")
    }

    return response.json()
  }
}
