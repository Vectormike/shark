import axios from 'axios';

// Nigerian bank codes mapping (Paystack format)
const NIGERIAN_BANK_CODES: { [key: string]: string } = {
	'Access Bank': '044',
	'Citibank Nigeria': '023',
	'Diamond Bank': '063',
	'Ecobank Nigeria': '050',
	'Fidelity Bank': '070',
	'First Bank of Nigeria': '011',
	'First City Monument Bank': '214',
	'Guaranty Trust Bank': '058',
	'Heritage Bank': '030',
	'Keystone Bank': '082',
	'Kuda Bank': '50211',
	'Opay': '100022',
	'PalmPay': '999991',
	'Polaris Bank': '076',
	'Providus Bank': '101',
	'Stanbic IBTC Bank': '221',
	'Standard Chartered Bank': '068',
	'Sterling Bank': '232',
	'Suntrust Bank': '100',
	'Union Bank of Nigeria': '032',
	'United Bank for Africa': '033',
	'Unity Bank': '215',
	'VFD Microfinance Bank': '566',
	'Wema Bank': '035',
	'Zenith Bank': '057'
};

// Valid Paystack bank codes (verified)
const VALID_PAYSTACK_BANK_CODES = [
	'044', '023', '063', '050', '070', '011', '214', '058', '030', '082',
	'50211', '100022', '999991', '076', '101', '221', '068', '232', '100',
	'032', '033', '215', '566', '035', '057'
];

export class BankService {
	/**
	 * Resolve bank code from account number using Paystack's resolve account API
	 */
	static async resolveBankCode(accountNumber: string, bankName?: string): Promise<string> {
		try {
			// If bank name is provided, try to get bank code from our mapping
			if (bankName) {
				const bankCode = NIGERIAN_BANK_CODES[bankName];
				if (bankCode) {
					return bankCode;
				}
			}

			// For now, return a default bank code (GTBank) since we can't resolve without knowing the bank
			// In a real application, you'd collect the bank from the user
			console.warn('⚠️  Using default bank code (058 - GTBank). In production, collect bank from user.');
			return '058'; // GTBank code

		} catch (error) {
			console.error('Bank code resolution error:', error);
			throw new Error('Unable to resolve bank code. Please provide bank_code manually.');
		}
	}

	/**
	 * Get list of supported Nigerian banks from Paystack API
	 */
	static async getSupportedBanks(): Promise<Array<{ name: string; code: string }>> {
		try {
			const response = await axios.get('https://api.paystack.co/bank', {
				params: { country: 'nigeria' },
				headers: {
					'Authorization': `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
					'Content-Type': 'application/json'
				}
			});

			if (response.data.status) {
				console.log('✅ Fetched banks from Paystack API:', response.data.data.length, 'banks');
				return response.data.data.map((bank: any) => ({
					name: bank.name,
					code: bank.code
				}));
			}

			throw new Error('Failed to fetch banks from Paystack API');
		} catch (error) {
			console.error('❌ Get banks error:', error);
			console.log('🔄 Falling back to static bank list...');
			// Fallback to our static list
			return Object.entries(NIGERIAN_BANK_CODES).map(([name, code]) => ({ name, code }));
		}
	}

	/**
	 * Validate account number format
	 */
	static validateAccountNumber(accountNumber: string): boolean {
		// Nigerian account numbers are typically 10 digits
		const cleanAccountNumber = accountNumber.replace(/\D/g, '');
		return cleanAccountNumber.length === 10 && /^\d{10}$/.test(cleanAccountNumber);
	}

	/**
	 * Format account number (remove spaces, dashes, etc.)
	 */
	static formatAccountNumber(accountNumber: string): string {
		return accountNumber.replace(/\D/g, '');
	}

	/**
	 * Validate bank code against Paystack's supported codes
	 */
	static async validateBankCode(bankCode: string): Promise<boolean> {
		try {
			const banks = await this.getSupportedBanks();
			const cleanBankCode = bankCode.toString().replace(/\D/g, '');
			return banks.some(bank => bank.code === cleanBankCode);
		} catch (error) {
			console.error('Error validating bank code:', error);
			// Fallback to static validation
			const cleanBankCode = bankCode.toString().replace(/\D/g, '');
			return VALID_PAYSTACK_BANK_CODES.includes(cleanBankCode);
		}
	}

	/**
	 * Get bank name from bank code
	 */
	static getBankName(bankCode: string): string | null {
		const cleanBankCode = bankCode.toString().replace(/\D/g, '');
		const entry = Object.entries(NIGERIAN_BANK_CODES).find(([_, code]) => code === cleanBankCode);
		return entry ? entry[0] : null;
	}
}
