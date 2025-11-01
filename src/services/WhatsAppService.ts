import axios from 'axios';

export interface WhatsAppResult {
	success: boolean;
	messageId?: string;
	error?: string;
}

export class WhatsAppService {
	private accessToken: string;
	private phoneNumberId: string;
	private baseUrl: string;

	constructor() {
		this.accessToken = process.env.WHATSAPP_ACCESS_TOKEN || '';
		this.phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID || '';
		this.baseUrl = 'https://graph.facebook.com/v18.0';
	}

	/**
	 * Check if a phone number is on WhatsApp
	 */
	async isOnWhatsApp(phoneNumber: string): Promise<boolean> {
		if (!this.accessToken || !this.phoneNumberId) {
			console.warn('⚠️ WhatsApp credentials not configured');
			return false;
		}

		try {
			const formattedNumber = this.formatPhoneNumber(phoneNumber);
			console.log('💬 Formatted number:', formattedNumber);

			const response = await axios.get(
				`${this.baseUrl}/${formattedNumber}`,
				{
					params: {
						fields: 'verified_name',
						access_token: this.accessToken
					}
				}
			);

			console.log('💬 WhatsApp response:', response.data);

			return response.data.verified_name !== undefined;
		} catch (error: any) {
			console.log(`📱 Phone number ${phoneNumber} is not on WhatsApp or not accessible`);
			return false;
		}
	}

	/**
	 * Send WhatsApp message
	 */
	async sendMessage(to: string, message: string): Promise<WhatsAppResult> {
		if (!this.accessToken || !this.phoneNumberId) {
			console.warn('⚠️ WhatsApp credentials not configured');
			return { success: false, error: 'WhatsApp credentials not configured' };
		}

		try {
			const response = await axios.post(
				`${this.baseUrl}/${this.phoneNumberId}/messages`,
				{
					messaging_product: 'whatsapp',
					to: this.formatPhoneNumber(to),
					type: 'text',
					text: { body: message }
				},
				{
					headers: {
						'Authorization': `Bearer ${this.accessToken}`,
						'Content-Type': 'application/json'
					}
				}
			);

			console.log('💬 WhatsApp message sent successfully:', response.data);
			return {
				success: true,
				messageId: response.data.messages?.[0]?.id
			};
		} catch (error: any) {
			console.error('❌ WhatsApp message failed:', error.response?.data || error.message);
			return {
				success: false,
				error: error.response?.data?.error?.message || error.message
			};
		}
	}

	/**
	 * Send loan creation notification
	 */
	async sendLoanCreationNotification(
		borrowerName: string,
		borrowerPhone: string,
		amount: number,
		loanId: string
	): Promise<WhatsAppResult> {
		// First check if the number is on WhatsApp
		const isOnWhatsApp = await this.isOnWhatsApp(borrowerPhone);

		if (!isOnWhatsApp) {
			console.log(`📱 ${borrowerPhone} is not on WhatsApp, skipping notification`);
			return { success: false, error: 'Phone number not on WhatsApp' };
		}

		const message = this.generateLoanCreationMessage(borrowerName, amount, loanId);
		return await this.sendMessage(borrowerPhone, message);
	}

	/**
	 * Send admin notification about loan creation
	 */
	async sendAdminLoanNotification(
		adminPhone: string,
		borrowerName: string,
		amount: number,
		loanId: string
	): Promise<WhatsAppResult> {
		const message = this.generateAdminLoanMessage(borrowerName, amount, loanId);
		return await this.sendMessage(adminPhone, message);
	}

	/**
	 * Generate loan creation message for borrower
	 */
	private generateLoanCreationMessage(borrowerName: string, amount: number, loanId: string): string {
		const formattedAmount = new Intl.NumberFormat('en-NG', {
			style: 'currency',
			currency: 'NGN'
		}).format(amount);

		return `🎉 *Loan Approved!*

Hello ${borrowerName},

Your loan application has been *approved* and is ready for disbursement.

💰 *Loan Amount:* ${formattedAmount}
🆔 *Loan ID:* ${loanId}
📅 *Date:* ${new Date().toLocaleDateString('en-NG')}

The loan will be disbursed to your account shortly. You will receive another notification once the money has been sent.

Thank you for choosing our services! 🙏`;
	}

	/**
	 * Generate admin notification message
	 */
	private generateAdminLoanMessage(borrowerName: string, amount: number, loanId: string): string {
		const formattedAmount = new Intl.NumberFormat('en-NG', {
			style: 'currency',
			currency: 'NGN'
		}).format(amount);

		return `📋 *New Loan Created*

👤 *Borrower:* ${borrowerName}
💰 *Amount:* ${formattedAmount}
🆔 *Loan ID:* ${loanId}
📅 *Date:* ${new Date().toLocaleDateString('en-NG')}

The loan has been approved and is ready for disbursement.`;
	}

	/**
	 * Format phone number for WhatsApp
	 */
	private formatPhoneNumber(phone: string): string {
		// Remove all non-digit characters
		const digits = phone.replace(/\D/g, '');

		// If it starts with 0, replace with country code
		if (digits.startsWith('0')) {
			return '234' + digits.substring(1);
		}

		// If it starts with +, remove it
		if (digits.startsWith('234')) {
			return digits;
		}

		// If it's a Nigerian number without country code, add it
		if (digits.length === 10) {
			return '234' + digits;
		}

		return digits;
	}
}

// Singleton instance
let _whatsappService: WhatsAppService | null = null;

export const getWhatsAppService = (): WhatsAppService => {
	if (!_whatsappService) {
		_whatsappService = new WhatsAppService();
	}
	return _whatsappService;
};
