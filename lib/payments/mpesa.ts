export class MPesaProvider {
  private consumerKey: string
  private consumerSecret: string
  private environment: "sandbox" | "production"
  private baseUrl: string

  constructor(consumerKey: string, consumerSecret: string, environment: "sandbox" | "production" = "sandbox") {
    this.consumerKey = consumerKey
    this.consumerSecret = consumerSecret
    this.environment = environment
    this.baseUrl = environment === "production" ? "https://api.safaricom.co.ke" : "https://sandbox.safaricom.co.ke"
  }

  private async getAccessToken(): Promise<string> {
    const auth = Buffer.from(`${this.consumerKey}:${this.consumerSecret}`).toString("base64")

    const response = await fetch(`${this.baseUrl}/oauth/v1/generate?grant_type=client_credentials`, {
      method: "GET",
      headers: {
        Authorization: `Basic ${auth}`,
      },
    })

    if (!response.ok) {
      throw new Error("Failed to get M-Pesa access token")
    }

    const data = await response.json()
    return data.access_token
  }

  private generatePassword(businessShortCode: string, passkey: string, timestamp: string): string {
    return Buffer.from(businessShortCode + passkey + timestamp).toString("base64")
  }

  async initiateSTKPush(params: {
    businessShortCode: string
    passkey: string
    amount: number
    phoneNumber: string
    callbackUrl: string
    accountReference: string
    transactionDesc: string
  }): Promise<any> {
    const accessToken = await this.getAccessToken()
    const timestamp = new Date()
      .toISOString()
      .replace(/[^0-9]/g, "")
      .slice(0, -3)
    const password = this.generatePassword(params.businessShortCode, params.passkey, timestamp)

    const requestBody = {
      BusinessShortCode: params.businessShortCode,
      Password: password,
      Timestamp: timestamp,
      TransactionType: "CustomerPayBillOnline",
      Amount: params.amount,
      PartyA: params.phoneNumber,
      PartyB: params.businessShortCode,
      PhoneNumber: params.phoneNumber,
      CallBackURL: params.callbackUrl,
      AccountReference: params.accountReference,
      TransactionDesc: params.transactionDesc,
    }

    const response = await fetch(`${this.baseUrl}/mpesa/stkpush/v1/processrequest`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(requestBody),
    })

    if (!response.ok) {
      throw new Error("Failed to initiate M-Pesa STK Push")
    }

    return response.json()
  }

  async queryTransactionStatus(params: {
    businessShortCode: string
    passkey: string
    checkoutRequestId: string
  }): Promise<any> {
    const accessToken = await this.getAccessToken()
    const timestamp = new Date()
      .toISOString()
      .replace(/[^0-9]/g, "")
      .slice(0, -3)
    const password = this.generatePassword(params.businessShortCode, params.passkey, timestamp)

    const requestBody = {
      BusinessShortCode: params.businessShortCode,
      Password: password,
      Timestamp: timestamp,
      CheckoutRequestID: params.checkoutRequestId,
    }

    const response = await fetch(`${this.baseUrl}/mpesa/stkpushquery/v1/query`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(requestBody),
    })

    if (!response.ok) {
      throw new Error("Failed to query M-Pesa transaction status")
    }

    return response.json()
  }

  async registerC2BUrls(params: {
    shortCode: string
    confirmationUrl: string
    validationUrl: string
  }): Promise<any> {
    const accessToken = await this.getAccessToken()

    const requestBody = {
      ShortCode: params.shortCode,
      ResponseType: "Completed",
      ConfirmationURL: params.confirmationUrl,
      ValidationURL: params.validationUrl,
    }

    const response = await fetch(`${this.baseUrl}/mpesa/c2b/v1/registerurl`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(requestBody),
    })

    if (!response.ok) {
      throw new Error("Failed to register M-Pesa C2B URLs")
    }

    return response.json()
  }
}
