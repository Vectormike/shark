/**
 * Utility functions for sanitizing and formatting data
 */

/**
 * Parse decimal fields from database strings to numbers
 * PostgreSQL returns DECIMAL values as strings to preserve precision
 */
export function parseDecimalFields(obj: any): any {
	const decimalFields = [
		'amount',
		'interest_rate',
		'monthly_payment',
		'total_amount',
		'total_interest',
		'monthly_interest',
		'outstanding_balance',
		'total_interest_earned',
		'total_principal_paid',
		'collateral_value',
		'principal_amount',
		'interest_amount'
	];

	const parsed = { ...obj };

	for (const field of decimalFields) {
		if (parsed[field] !== undefined && parsed[field] !== null) {
			parsed[field] = parseFloat(parsed[field]);
		}
	}

	return parsed;
}

/**
 * Parse decimal fields for loan objects specifically
 */
export function parseLoanFields(loan: any): any {
	return parseDecimalFields(loan);
}

/**
 * Parse decimal fields for repayment objects specifically
 */
export function parseRepaymentFields(repayment: any): any {
	return parseDecimalFields(repayment);
}

/**
 * Parse decimal fields for borrower objects specifically
 */
export function parseBorrowerFields(borrower: any): any {
	// Borrowers don't have decimal fields, but keeping for consistency
	return borrower;
}

/**
 * Parse decimal fields for array of objects
 */
export function parseDecimalFieldsArray(items: any[]): any[] {
	return items.map(item => parseDecimalFields(item));
}

/**
 * Format currency for display
 */
export function formatCurrency(amount: number, currency: string = 'NGN'): string {
	return new Intl.NumberFormat('en-NG', {
		style: 'currency',
		currency,
	}).format(amount);
}

/**
 * Format percentage for display
 */
export function formatPercentage(rate: number): string {
	return `${rate.toFixed(2)}%`;
}

/**
 * Sanitize loan data for API response
 */
export function sanitizeLoanResponse(loan: any): any {
	const parsed = parseLoanFields(loan);

	// Add formatted fields for display
	return {
		...parsed,
		formatted_amount: formatCurrency(parsed.amount),
		formatted_interest_rate: formatPercentage(parsed.interest_rate),
		formatted_monthly_payment: formatCurrency(parsed.monthly_payment),
		formatted_total_amount: formatCurrency(parsed.total_amount)
	};
}

/**
 * Sanitize repayment data for API response
 */
export function sanitizeRepaymentResponse(repayment: any): any {
	const parsed = parseRepaymentFields(repayment);

	return {
		...parsed,
		formatted_amount: formatCurrency(parsed.amount),
		formatted_principal: formatCurrency(parsed.principal_amount),
		formatted_interest: formatCurrency(parsed.interest_amount)
	};
}
