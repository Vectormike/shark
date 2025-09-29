import { Request, Response, NextFunction } from 'express';
import { BaseValidator, ValidationResult } from './BaseValidator';

export class BorrowerValidator extends BaseValidator {
	// Create borrower validation schema
	private createBorrowerSchema = {
		first_name: {
			required: true,
			type: 'string',
			minLength: 2,
			maxLength: 50,
			pattern: /^[a-zA-Z\s'-]+$/
		},
		last_name: {
			required: true,
			type: 'string',
			minLength: 2,
			maxLength: 50,
			pattern: /^[a-zA-Z\s'-]+$/
		},
		phone: {
			required: true,
			type: 'string',
			pattern: this.nigerianPhonePattern,
			custom: (value: string) => {
				// Additional phone validation
				if (!value.startsWith('+234')) {
					return 'Phone number must be a valid Nigerian number starting with +234';
				}
				return null;
			}
		},
		nin: {
			required: false,
			type: 'string',
			pattern: this.ninPattern,
			custom: (value: string) => {
				if (value && !/^[0-9]{11}$/.test(value)) {
					return 'NIN must be exactly 11 digits';
				}
				return null;
			}
		},
		emergency_contact_name: {
			required: false,
			type: 'string',
			minLength: 2,
			maxLength: 50,
			pattern: /^[a-zA-Z\s'-]+$/
		},
		emergency_contact_phone: {
			required: false,
			type: 'string',
			pattern: this.nigerianPhonePattern
		},
		address: {
			required: false,
			type: 'string',
			maxLength: 500
		},
		notes: {
			required: false,
			type: 'string',
			maxLength: 1000
		}
	};

	// Update borrower validation schema
	private updateBorrowerSchema = {
		first_name: {
			required: false,
			type: 'string',
			minLength: 2,
			maxLength: 50,
			pattern: /^[a-zA-Z\s'-]+$/
		},
		last_name: {
			required: false,
			type: 'string',
			minLength: 2,
			maxLength: 50,
			pattern: /^[a-zA-Z\s'-]+$/
		},
		phone: {
			required: false,
			type: 'string',
			pattern: this.nigerianPhonePattern
		},
		nin: {
			required: false,
			type: 'string',
			pattern: this.ninPattern
		},
		emergency_contact_name: {
			required: false,
			type: 'string',
			minLength: 2,
			maxLength: 50,
			pattern: /^[a-zA-Z\s'-]+$/
		},
		emergency_contact_phone: {
			required: false,
			type: 'string',
			pattern: this.nigerianPhonePattern
		},
		address: {
			required: false,
			type: 'string',
			maxLength: 500
		},
		notes: {
			required: false,
			type: 'string',
			maxLength: 1000
		}
	};

	// Validate create borrower request
	validateCreateBorrower = (req: Request, res: Response, next: NextFunction) => {
		const result = this.validateObject(req.body, this.createBorrowerSchema);

		if (!result.isValid) {
			return res.status(400).json({
				success: false,
				message: 'Borrower validation failed',
				errors: result.errors
			});
		}

		req.body = result.data;
		next();
	};

	// Validate update borrower request
	validateUpdateBorrower = (req: Request, res: Response, next: NextFunction) => {
		const result = this.validateObject(req.body, this.updateBorrowerSchema);

		if (!result.isValid) {
			return res.status(400).json({
				success: false,
				message: 'Borrower update validation failed',
				errors: result.errors
			});
		}

		req.body = result.data;
		next();
	};

	// Validate borrower ID parameter
	validateBorrowerId = (req: Request, res: Response, next: NextFunction) => {
		const { id } = req.params;

		if (!this.uuidPattern.test(id)) {
			return res.status(400).json({
				success: false,
				message: 'Invalid borrower ID format'
			});
		}

		next();
	};

	// Validate search query parameters
	validateSearchBorrowers = (req: Request, res: Response, next: NextFunction) => {
		const { page, limit, search } = req.query;

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

		// Validate search
		if (search && typeof search !== 'string') {
			return res.status(400).json({
				success: false,
				message: 'Search must be a string'
			});
		}

		next();
	};

	// Validate deactivate borrower request
	validateDeactivateBorrower = (req: Request, res: Response, next: NextFunction) => {
		const { reason } = req.body;

		if (reason && typeof reason !== 'string') {
			return res.status(400).json({
				success: false,
				message: 'Reason must be a string'
			});
		}

		if (reason && reason.length > 500) {
			return res.status(400).json({
				success: false,
				message: 'Reason must be no more than 500 characters'
			});
		}

		next();
	};
}
