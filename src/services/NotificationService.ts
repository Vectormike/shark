import axios from "axios";

export interface NotificationOptions {
  to: string; // Phone number
  message: string;
  type: "sms" | "whatsapp";
  media?: {
    url: string;
    caption: string;
  };
}

export interface NotificationResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

export class NotificationService {
  private smsApiKey: string;
  private smsApiUrl: string;
  private whatsappApiKey: string;
  private whatsappApiUrl: string;

  constructor() {
    this.smsApiKey = process.env.SMS_API_KEY || "";
    this.smsApiUrl = this.getSmsApiUrl();
    this.whatsappApiKey = process.env.WHATSAPP_API_KEY || "";
    this.whatsappApiUrl =
      process.env.WHATSAPP_API_URL || "https://graph.facebook.com/v18.0";
  }

  /**
   * Get SMS API URL based on provider
   */
  private getSmsApiUrl(): string {
    const provider = process.env.SMS_PROVIDER || "termii";

    switch (provider.toLowerCase()) {
      case "sendchamp":
        return (
          process.env.SMS_API_URL || "https://api.sendchamp.com/v1/sms/send"
        );
      case "termii":
      default:
        return process.env.SMS_API_URL || "https://api.termii.com/api/sms/send";
    }
  }

  /**
   * Build SMS payload based on provider
   */
  private buildSmsPayload(
    provider: string,
    to: string,
    message: string,
    media?: { url: string; caption?: string },
  ): any {
    const basePayload = {
      to: this.formatPhoneNumber(to),
      from: process.env.SMS_SENDER_ID || "SHARKLOAN",
      api_key: this.smsApiKey,
      channel: "generic",
    };

    switch (provider.toLowerCase()) {
      case "sendchamp":
        // SendChamp uses "message" instead of "sms"
        const sendchampPayload: any = {
          ...basePayload,
          message: message,
          type: "text",
        };

        // Add media if provided
        if (media) {
          sendchampPayload.media = {
            url: media.url,
            caption: media.caption || "",
          };
        }

        return sendchampPayload;

      case "termii":
      default:
        // Termii uses "sms" field
        const termiiPayload: any = {
          ...basePayload,
          sms: message,
          type: "plain",
        };

        // Add media if provided
        if (media) {
          termiiPayload.media = {
            url: media.url,
            caption: media.caption || "",
          };
        }

        return termiiPayload;
    }
  }

  /**
   * Send SMS notification
   */
  async sendSMS(
    to: string,
    message: string,
    media?: { url: string; caption?: string },
  ): Promise<NotificationResult> {
    try {
      const provider = process.env.SMS_PROVIDER || "";
      const data = this.buildSmsPayload(provider, to, message, media);

      const response = await axios.post(this.smsApiUrl, data, {
        headers: {
          "Content-Type": "application/json",
        },
      });

      console.log("📱 SMS sent successfully:", response.data);
      return {
        success: true,
        messageId: response.data.message_id || response.data.id,
      };
    } catch (error: any) {
      console.error(
        "❌ SMS sending failed:",
        error.response?.data || error.message,
      );

      // Check for provider-specific errors
      const errorData = error.response?.data;
      const provider = process.env.SMS_PROVIDER || "termii";

      if (
        provider === "termii" &&
        errorData?.message?.includes("ApplicationSenderId not found")
      ) {
        console.log("💡 Termii Sender ID not registered");
        console.log("📝 To fix this:");
        console.log("1. Run: node register-sender-id.js");
        console.log("2. Wait for Termii approval");
        console.log("3. Or switch to SendChamp: SMS_PROVIDER=sendchamp");
      } else if (
        provider === "sendchamp" &&
        errorData?.message?.includes("Invalid API key")
      ) {
        console.log("💡 SendChamp API key invalid");
        console.log("📝 To fix this:");
        console.log("1. Check SMS_API_KEY in .env file");
        console.log("2. Verify SendChamp account is active");
      }

      return {
        success: false,
        error: error.response?.data?.message || error.message,
      };
    }
  }

  /**
   * Send WhatsApp notification
   */
  async sendWhatsApp(to: string, message: string): Promise<NotificationResult> {
    try {
      const data = {
        to: this.formatPhoneNumber(to),
        from: process.env.SMS_SENDER_ID || "SHARKLOAN",
        sms: message,
        type: "plain",
        api_key: this.smsApiKey,
        channel: "generic",
        media: {
          url: "",
          caption: "",
        },
      };

      const response = await axios.post(this.smsApiUrl, data, {
        headers: {
          "Content-Type": "application/json",
        },
      });

      console.log("💬 WhatsApp sent successfully:", response.data);
      return {
        success: true,
        messageId: response.data.messages?.[0]?.id,
      };
    } catch (error: any) {
      console.error(
        "❌ WhatsApp sending failed:",
        error.response?.data || error.message,
      );
      return {
        success: false,
        error: error.response?.data?.error?.message || error.message,
      };
    }
  }

  /**
   * Send notification via preferred method
   */
  async sendNotification(
    options: NotificationOptions,
  ): Promise<NotificationResult> {
    const { to, message, type, media } = options;

    if (media) {
      console.log(`📎 With media: ${media.url}`);
    }

    switch (type) {
      case "sms":
        return await this.sendSMS(to, message, media);
      case "whatsapp":
        return await this.sendWhatsApp(to, message);
      default:
        return { success: false, error: "Invalid notification type" };
    }
  }

  /**
   * Send both SMS and WhatsApp
   */
  async sendBoth(
    to: string,
    message: string,
  ): Promise<{
    sms: NotificationResult;
    whatsapp: NotificationResult;
  }> {
    const [smsResult, whatsappResult] = await Promise.all([
      this.sendSMS(to, message),
      this.sendWhatsApp(to, message),
    ]);

    return { sms: smsResult, whatsapp: whatsappResult };
  }

  /**
   * Format phone number for international use
   */
  private formatPhoneNumber(phone: string): string {
    // Remove all non-digit characters
    const digits = phone.replace(/\D/g, "");

    // If it starts with 0, replace with country code
    if (digits.startsWith("0")) {
      return "234" + digits.substring(1);
    }

    // If it starts with +, remove it
    if (digits.startsWith("234")) {
      return digits;
    }

    // If it's a Nigerian number without country code, add it
    if (digits.length === 10) {
      return "234" + digits;
    }

    return digits;
  }

  /**
   * Generate loan creation message
   */
  generateLoanCreationMessage(
    borrowerName: string,
    amount: number,
    loanId: string,
  ): string {
    const formattedAmount = new Intl.NumberFormat("en-NG", {
      style: "currency",
      currency: "NGN",
    }).format(amount);

    return `🎉 New Loan Created!

👤 Borrower: ${borrowerName}
💰 Amount: ${formattedAmount}
🆔 Loan ID: ${loanId}
📅 Date: ${new Date().toLocaleDateString("en-NG")}

The loan has been approved and is ready for disbursement.`;
  }

  /**
   * Generate loan disbursement message
   */
  generateLoanDisbursementMessage(
    borrowerName: string,
    amount: number,
    loanId: string,
  ): string {
    const formattedAmount = new Intl.NumberFormat("en-NG", {
      style: "currency",
      currency: "NGN",
    }).format(amount);

    return `✅ Loan Disbursed Successfully!

👤 Borrower: ${borrowerName}
💰 Amount: ${formattedAmount}
🆔 Loan ID: ${loanId}
📅 Date: ${new Date().toLocaleDateString("en-NG")}

The loan has been disbursed to the borrower's account.`;
  }

  /**
   * Generate payment received message
   */
  generatePaymentReceivedMessage(
    borrowerName: string,
    amount: number,
    loanId: string,
  ): string {
    const formattedAmount = new Intl.NumberFormat("en-NG", {
      style: "currency",
      currency: "NGN",
    }).format(amount);

    return `💰 Payment Received!

👤 Borrower: ${borrowerName}
💰 Amount: ${formattedAmount}
🆔 Loan ID: ${loanId}
📅 Date: ${new Date().toLocaleDateString("en-NG")}

Payment has been successfully processed.`;
  }
}

// Singleton instance
let _notificationService: NotificationService | null = null;

export const getNotificationService = (): NotificationService => {
  if (!_notificationService) {
    _notificationService = new NotificationService();
  }
  return _notificationService;
};
