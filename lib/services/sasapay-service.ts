/**
 * SASAPAY API Integration Service
 * 
 * SASAPAY Payment Flow:
 * - C2B (Customer to Business): Users pay via M-Pesa Paybill (from exchange payment methods)
 * - B2C (Business to Customer): You pay users via SASAPAY's payment methods (M-Pesa, Airtel, Bank)
 */

// C2B Interfaces (Users paying you via M-Pesa Paybill)
export interface SasapayC2BRequest {
  amount: number;
  currency: string; // Usually 'KES'
  phone_number: string;
  account_reference: string; // Account number for the paybill
  description: string;
  callback_url: string;
}

export interface SasapayC2BResponse {
  success: boolean;
  transaction_id: string;
  checkout_request_id: string;
  response_code: string;
  response_description: string;
  customer_message: string;
}

// B2C Interfaces (You paying users via SASAPAY)
export interface SasapayB2CRequest {
  recipient_phone: string;
  amount: number;
  currency: string;
  payment_method: 'mpesa' | 'airtel' | 'bank_transfer';
  recipient_name?: string;
  reference: string;
  description: string;
  // For bank transfers
  bank_details?: {
    account_number: string;
    bank_code: string;
    account_name: string;
  };
}

export interface SasapayB2CResponse {
  success: boolean;
  transaction_id: string;
  status: string;
  reference: string;
  response_description: string;
}

// Available SASAPAY B2C payment methods
export interface SasapayPaymentMethods {
  mpesa: {
    enabled: boolean;
    max_amount: number;
    min_amount: number;
    fees: number;
  };
  airtel: {
    enabled: boolean;
    max_amount: number;
    min_amount: number;
    fees: number;
  };
  bank_transfer: {
    enabled: boolean;
    max_amount: number;
    min_amount: number;
    fees: number;
    supported_banks: string[];
  };
}

export interface SasapayCallbackData {
  transaction_id: string;
  checkout_request_id: string;
  result_code: string;
  result_desc: string;
  amount: number;
  mpesa_receipt_number?: string;
  phone_number: string;
  transaction_date: string;
}

export class SasapayService {
  private baseUrl: string;
  private apiKey: string;
  private businessNumber: string; // Your M-Pesa paybill number

  constructor() {
    this.baseUrl = process.env.SASAPAY_API_URL || 'https://api.sasapay.app';
    this.apiKey = process.env.SASAPAY_API_KEY || '';
    this.businessNumber = process.env.SASAPAY_BUSINESS_NUMBER || '';
  }

  /**
   * Get available B2C payment methods from SASAPAY
   */
  async getAvailablePaymentMethods(): Promise<SasapayPaymentMethods> {
    try {
      const response = await fetch(`${this.baseUrl}/api/v1/payments/methods`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch payment methods: ${response.status}`);
      }

      const data = await response.json();
      return data.payment_methods || {
        mpesa: { enabled: true, max_amount: 150000, min_amount: 10, fees: 0 },
        airtel: { enabled: true, max_amount: 100000, min_amount: 10, fees: 0 },
        bank_transfer: { 
          enabled: true, 
          max_amount: 1000000, 
          min_amount: 100, 
          fees: 0,
          supported_banks: ['KCB', 'Equity', 'NCBA', 'Coop Bank']
        }
      };
    } catch (error) {
      console.error('Failed to fetch SASAPAY payment methods:', error);
      // Return default methods if API fails
      return {
        mpesa: { enabled: true, max_amount: 150000, min_amount: 10, fees: 0 },
        airtel: { enabled: true, max_amount: 100000, min_amount: 10, fees: 0 },
        bank_transfer: { 
          enabled: true, 
          max_amount: 1000000, 
          min_amount: 100, 
          fees: 0,
          supported_banks: ['KCB', 'Equity', 'NCBA', 'Coop Bank']
        }
      };
    }
  }

  /**
   * C2B: Initiate payment request from user to you via M-Pesa Paybill
   */
  async initiateC2BPayment(request: SasapayC2BRequest): Promise<SasapayC2BResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/api/v1/payments/c2b/paybill`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          ...request,
          business_number: this.businessNumber,
        }),
      });

      if (!response.ok) {
        throw new Error(`SASAPAY C2B error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('SASAPAY C2B payment initiation failed:', error);
      throw error;
    }
  }

  // Backward-compatible alias used by existing API routes
  async initiatePayment(request: SasapayC2BRequest): Promise<SasapayC2BResponse> {
    return this.initiateC2BPayment(request);
  }

  /**
   * B2C: Send payment to user via SASAPAY (M-Pesa, Airtel, or Bank Transfer)
   */
  async initiateB2CPayment(request: SasapayB2CRequest): Promise<SasapayB2CResponse> {
    try {
      const endpoint = this.getB2CEndpoint(request.payment_method);
      const payload = this.prepareB2CPayload(request);

      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error(`SASAPAY B2C error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('SASAPAY B2C payment failed:', error);
      throw error;
    }
  }

  /**
   * Get the correct API endpoint for B2C payment method
   */
  private getB2CEndpoint(paymentMethod: string): string {
    switch (paymentMethod) {
      case 'mpesa':
        return '/api/v1/payments/b2c/mpesa';
      case 'airtel':
        return '/api/v1/payments/b2c/airtel';
      case 'bank_transfer':
        return '/api/v1/payments/b2c/bank';
      default:
        throw new Error(`Unsupported payment method: ${paymentMethod}`);
    }
  }

  /**
   * Prepare B2C payload based on payment method
   */
  private prepareB2CPayload(request: SasapayB2CRequest): any {
    const basePayload = {
      amount: request.amount,
      currency: request.currency,
      reference: request.reference,
      description: request.description,
    };

    switch (request.payment_method) {
      case 'mpesa':
      case 'airtel':
        return {
          ...basePayload,
          recipient_phone: request.recipient_phone,
          recipient_name: request.recipient_name,
        };
      
      case 'bank_transfer':
        return {
          ...basePayload,
          bank_details: request.bank_details,
          recipient_name: request.recipient_name,
        };
      
      default:
        return basePayload;
    }
  }

  /**
   * Query payment status for both C2B and B2C transactions
   */
  async queryPaymentStatus(transactionId: string): Promise<any> {
    try {
      const response = await fetch(`${this.baseUrl}/api/v1/payments/status/${transactionId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
        },
      });

      if (!response.ok) {
        throw new Error(`SASAPAY query error: ${response.status} ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('SASAPAY status query failed:', error);
      throw error;
    }
  }

  /**
   * Validate payment callback data
   */
  validateCallback(callbackData: any): SasapayCallbackData | null {
    try {
      if (!callbackData.transaction_id) {
        console.error('Invalid SASAPAY callback: missing transaction_id');
        return null;
      }

      return {
        transaction_id: callbackData.transaction_id,
        checkout_request_id: callbackData.checkout_request_id || '',
        result_code: callbackData.result_code || '1',
        result_desc: callbackData.result_desc || 'Unknown',
        amount: parseFloat(callbackData.amount) || 0,
        mpesa_receipt_number: callbackData.mpesa_receipt_number,
        phone_number: callbackData.phone_number || '',
        transaction_date: callbackData.transaction_date || new Date().toISOString(),
      };
    } catch (error) {
      console.error('Error validating SASAPAY callback:', error);
      return null;
    }
  }

  // Backward-compatible callback processor used by existing API routes
  async processPaymentCallback(callbackData: any): Promise<{
    success: boolean;
    transaction_id?: string;
    error?: string;
  }> {
    const parsed = this.validateCallback(callbackData);
    if (!parsed) {
      return { success: false, error: "Invalid callback payload" };
    }

    const success = parsed.result_code === "0";
    return {
      success,
      transaction_id: parsed.transaction_id,
      error: success ? undefined : parsed.result_desc || "Payment failed",
    };
  }

  /**
   * Generate account reference for C2B payments
   */
  generateAccountReference(userId: string, orderId?: string): string {
    const prefix = 'P2P';
    const userPart = userId.slice(-6).toUpperCase();
    const orderPart = orderId ? orderId.slice(-4) : Date.now().toString().slice(-4);
    return `${prefix}${userPart}${orderPart}`;
  }

  /**
   * Generate reference for B2C payments
   */
  generateB2CReference(orderId: string, paymentMethod: string): string {
    const methodPrefix = paymentMethod.toUpperCase().slice(0, 3);
    const timestamp = Date.now().toString().slice(-6);
    return `${methodPrefix}${orderId.slice(-4)}${timestamp}`;
  }

  /**
   * Determine best payment method for B2C based on amount and recipient
   */
  async getBestPaymentMethod(amount: number, recipientPhone?: string): Promise<{
    method: 'mpesa' | 'airtel' | 'bank_transfer';
    reason: string;
  }> {
    const methods = await this.getAvailablePaymentMethods();

    // If phone number starts with Airtel prefix and amount is within limits
    if (recipientPhone?.startsWith('+25473') || recipientPhone?.startsWith('073') || recipientPhone?.startsWith('073')) {
      if (methods.airtel.enabled && amount >= methods.airtel.min_amount && amount <= methods.airtel.max_amount) {
        return { method: 'airtel', reason: 'Airtel number detected and amount within limits' };
      }
    }

    // For large amounts, suggest bank transfer
    if (amount > 100000 && methods.bank_transfer.enabled) {
      return { method: 'bank_transfer', reason: 'Large amount - bank transfer recommended' };
    }

    // Default to M-Pesa if available
    if (methods.mpesa.enabled && amount >= methods.mpesa.min_amount && amount <= methods.mpesa.max_amount) {
      return { method: 'mpesa', reason: 'Default M-Pesa payment' };
    }

    // Fallback to any available method
    if (methods.airtel.enabled) {
      return { method: 'airtel', reason: 'Fallback to Airtel Money' };
    }

    if (methods.bank_transfer.enabled) {
      return { method: 'bank_transfer', reason: 'Fallback to bank transfer' };
    }

    throw new Error('No payment methods available');
  }
}

// Export singleton instance
export const sasapayService = new SasapayService();
