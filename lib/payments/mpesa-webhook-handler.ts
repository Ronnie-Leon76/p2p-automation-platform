export class MPesaWebhookHandler {
  private warn(method: string): void {
    console.warn(`[MPesaWebhookHandler] ${method} is running in fallback mode.`);
  }

  async processSTKCallback(_callbackData: unknown): Promise<{ success: boolean; reason: string }> {
    this.warn("processSTKCallback");
    return { success: false, reason: "Not implemented in Prisma yet." };
  }

  async processC2BConfirmation(
    confirmationData: Record<string, unknown>,
  ): Promise<{ success: boolean; transactionId?: string; unmatched?: boolean }> {
    this.warn("processC2BConfirmation");
    const transId = confirmationData.TransID;
    const transactionId = typeof transId === "string" ? transId : undefined;
    return { success: true, transactionId, unmatched: true };
  }

  async validateC2BPayment(_validationData: unknown): Promise<{ isValid: boolean; reason?: string }> {
    this.warn("validateC2BPayment");
    return { isValid: true };
  }
}
