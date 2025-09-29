import { Request, Response, NextFunction } from 'express';
import { BaseValidator, ValidationResult } from './BaseValidator';

export class LoanValidator extends BaseValidator {
    // Create loan validation schema
    private createLoanSchema = {
        borrower_id: {
            required: true,
            type: 'string',
            pattern: this.uuidPattern
        },
        amount: {
            required: true,
            type: 'number',
            min: 1000,
            max: 10000000, // 10 million NGN max
            custom: (value: number) => {
                if (value % 1 !== 0) {
                    return 'Amount must be a whole number (no decimals)';
                }
                return null;
            }
        },
        interest_rate: {
            required: true,
            type: 'number',
            min: 0,
            max: 100, // 100% max interest rate
            custom: (value: number) => {
                if (value < 0 || value > 100) {
                    return 'Interest rate must be between 0 and 100 percent';
                }
                return null;
            }
        },
        term_in_months: {
            required: true,
            type: 'number',
            min: 1,
            max: 60, // 5 years max
            custom: (value: number) => {
                if (value % 1 !== 0) {
                    return 'Term must be a whole number of months';
                }
                return null;
            }
        },
        purpose: {
            required: false,
            type: 'string',
            maxLength: 500
        },
        loan_category: {
            required: false,
            type: 'string',
            custom: (value: string) => {
                const validCategories = ['PERSONAL', 'BUSINESS', 'EMERGENCY'];
                if (value && !validCategories.includes(value)) {
                    return 'Loan category must be one of: PERSONAL, BUSINESS, EMERGENCY';
                }
                return null;
            }
        },
        risk_level: {
            required: false,
            type: 'string',
            custom: (value: string) => {
                const validLevels = ['LOW', 'MEDIUM', 'HIGH'];
                if (value && !validLevels.includes(value)) {
                    return 'Risk level must be one of: LOW, MEDIUM, HIGH';
                }
                return null;
            }
        },
        collateral_value: {
            required: false,
            type: 'number',
            min: 0,
            max: 50000000 // 50 million NGN max
        },
        guarantor_id: {
            required: false,
            type: 'string',
            pattern: this.uuidPattern
        }
    };

    // Update loan validation schema
    private updateLoanSchema = {
        amount: {
            required: false,
            type: 'number',
            min: 1000,
            max: 10000000
        },
        interest_rate: {
            required: false,
            type: 'number',
            min: 0,
            max: 100
        },
        term_in_months: {
            required: false,
            type: 'number',
            min: 1,
            max: 60
        },
        purpose: {
            required: false,
            type: 'string',
            maxLength: 500
        },
        loan_category: {
            required: false,
            type: 'string',
            custom: (value: string) => {
                const validCategories = ['PERSONAL', 'BUSINESS', 'EMERGENCY'];
                if (value && !validCategories.includes(value)) {
                    return 'Loan category must be one of: PERSONAL, BUSINESS, EMERGENCY';
                }
                return null;
            }
        },
        risk_level: {
            required: false,
            type: 'string',
            custom: (value: string) => {
                const validLevels = ['LOW', 'MEDIUM', 'HIGH'];
                if (value && !validLevels.includes(value)) {
                    return 'Risk level must be one of: LOW, MEDIUM, HIGH';
                }
                return null;
            }
        },
        collateral_value: {
            required: false,
            type: 'number',
            min: 0,
            max: 50000000
        },
        guarantor_id: {
            required: false,
            type: 'string',
            pattern: this.uuidPattern
        }
    };

    // Validate create loan request
    validateCreateLoan = (req: Request, res: Response, next: NextFunction) => {
        const result = this.validateObject(req.body, this.createLoanSchema);

        if (!result.isValid) {
            return res.status(400).json({
                success: false,
                message: 'Loan validation failed',
                errors: result.errors
            });
        }

        req.body = result.data;
        next();
    };

    // Validate update loan request
    validateUpdateLoan = (req: Request, res: Response, next: NextFunction) => {
        const result = this.validateObject(req.body, this.updateLoanSchema);

        if (!result.isValid) {
            return res.status(400).json({
                success: false,
                message: 'Loan update validation failed',
                errors: result.errors
            });
        }

        req.body = result.data;
        next();
    };

    // Validate loan ID parameter
    validateLoanId = (req: Request, res: Response, next: NextFunction) => {
        const { id } = req.params;

        if (!this.uuidPattern.test(id)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid loan ID format'
            });
        }

        next();
    };

    // Validate loan query parameters
    validateLoanQuery = (req: Request, res: Response, next: NextFunction) => {
        const { page, limit, status, borrower_id } = req.query;

        // Validate page
        if (page && (isNaN(Number(page)) || Number(page) < 1)) {
            return res.status(400).json({
                success: false,
                message: 'Page must be a positive number'
            });
        }

        // Validate limit
        if (limit && (isNaN(Number(limit)) || Number(limit) < 1 || Number(limit) > 100)) {
            return res.status(400).json({
                success: false,
                message: 'Limit must be between 1 and 100'
            });
        }

        // Validate status
        if (status) {
            const validStatuses = ['PENDING', 'APPROVED', 'REJECTED', 'DISBURSED', 'ACTIVE', 'COMPLETED', 'DEFAULTED', 'CANCELLED'];
            if (!validStatuses.includes(status as string)) {
                return res.status(400).json({
                    success: false,
                    message: 'Invalid loan status'
                });
            }
        }

        // Validate borrower_id
        if (borrower_id && !this.uuidPattern.test(borrower_id as string)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid borrower ID format'
            });
        }

        next();
    };

    // Validate repayment request
    validateRepayment = (req: Request, res: Response, next: NextFunction) => {
        const { amount, method } = req.body;

        // Validate amount
        if (!amount || typeof amount !== 'number' || amount <= 0) {
            return res.status(400).json({
                success: false,
                message: 'Amount must be a positive number'
            });
        }

        if (amount < 100) {
            return res.status(400).json({
                success: false,
                message: 'Minimum repayment amount is 100 NGN'
            });
        }

        // Validate payment method
        if (method) {
            const validMethods = ['BANK_TRANSFER', 'CARD', 'PAYSTACK', 'FLUTTERWAVE', 'CASH'];
            if (!validMethods.includes(method)) {
                return res.status(400).json({
                    success: false,
                    message: 'Invalid payment method'
                });
            }
        }

        next();
    };
}
