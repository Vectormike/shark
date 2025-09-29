import { Request, Response, NextFunction } from 'express';
import { BaseValidator, ValidationResult } from './BaseValidator';

export class AuthValidator extends BaseValidator {
	// Login validation schema
	private loginSchema = {
		email: {
			required: true,
			type: 'string',
			pattern: this.emailPattern,
			custom: (value: string) => {
				if (!value || value.length < 5) {
					return 'Email must be at least 5 characters long';
				}
				return null;
			}
		},
		password: {
			required: true,
			type: 'string',
			minLength: 6,
			maxLength: 128
		},
		twoFactorToken: {
			required: false,
			type: 'string',
			pattern: /^[0-9]{6}$/,
			custom: (value: string) => {
				if (value && !/^[0-9]{6}$/.test(value)) {
					return '2FA token must be exactly 6 digits';
				}
				return null;
			}
		}
	};

	// Refresh token validation schema
	private refreshTokenSchema = {
		refreshToken: {
			required: true,
			type: 'string',
			minLength: 10
		}
	};

	// Password change validation schema
	private changePasswordSchema = {
		currentPassword: {
			required: true,
			type: 'string',
			minLength: 6
		},
		newPassword: {
			required: true,
			type: 'string',
			minLength: 12,
			maxLength: 128,
			custom: (value: string) => {
				// Strong password requirements
				const hasUpperCase = /[A-Z]/.test(value);
				const hasLowerCase = /[a-z]/.test(value);
				const hasNumbers = /\d/.test(value);
				const hasSpecialChar = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(value);

				if (!hasUpperCase) {
					return 'Password must contain at least one uppercase letter';
				}
				if (!hasLowerCase) {
					return 'Password must contain at least one lowercase letter';
				}
				if (!hasNumbers) {
					return 'Password must contain at least one number';
				}
				if (!hasSpecialChar) {
					return 'Password must contain at least one special character';
				}
				return null;
			}
		},
		confirmPassword: {
			required: true,
			type: 'string',
			custom: (value: string, allData: any) => {
				if (value !== allData.newPassword) {
					return 'Passwords do not match';
				}
				return null;
			}
		}
	};

	// Validate login request
	validateLogin = (req: Request, res: Response, next: NextFunction) => {
		const result = this.validateObject(req.body, this.loginSchema);

		if (!result.isValid) {
			return res.status(400).json({
				success: false,
				message: 'Login validation failed',
				errors: result.errors
			});
		}

		req.body = result.data;
		next();
	};

	// Validate refresh token request
	validateRefreshToken = (req: Request, res: Response, next: NextFunction) => {
		const result = this.validateObject(req.body, this.refreshTokenSchema);

		if (!result.isValid) {
			return res.status(400).json({
				success: false,
				message: 'Refresh token validation failed',
				errors: result.errors
			});
		}

		req.body = result.data;
		next();
	};

	// Validate change password request
	validateChangePassword = (req: Request, res: Response, next: NextFunction) => {
		const result = this.validateObject(req.body, this.changePasswordSchema);

		if (!result.isValid) {
			return res.status(400).json({
				success: false,
				message: 'Password change validation failed',
				errors: result.errors
			});
		}

		req.body = result.data;
		next();
	};

	// Validate 2FA setup request
	validateTwoFactorSetup = (req: Request, res: Response, next: NextFunction) => {
		// 2FA setup doesn't require additional validation
		// The middleware will check if user is authenticated
		next();
	};

	// Validate 2FA verification request
	validateTwoFactorVerification = (req: Request, res: Response, next: NextFunction) => {
		const { token } = req.body;

		if (!token || typeof token !== 'string') {
			return res.status(400).json({
				success: false,
				message: '2FA token is required'
			});
		}

		if (!/^[0-9]{6}$/.test(token)) {
			return res.status(400).json({
				success: false,
				message: '2FA token must be exactly 6 digits'
			});
		}

		next();
	};

	// Validate 2FA disable request
	validateTwoFactorDisable = (req: Request, res: Response, next: NextFunction) => {
		const { password, token } = req.body;

		if (!password || typeof password !== 'string') {
			return res.status(400).json({
				success: false,
				message: 'Password is required to disable 2FA'
			});
		}

		if (password.length < 6) {
			return res.status(400).json({
				success: false,
				message: 'Password must be at least 6 characters long'
			});
		}

		// Token is optional if 2FA is not enabled
		if (token && !/^[0-9]{6}$/.test(token)) {
			return res.status(400).json({
				success: false,
				message: '2FA token must be exactly 6 digits'
			});
		}

		next();
	};

	// Validate JWT token format
	validateTokenFormat = (req: Request, res: Response, next: NextFunction) => {
		const authHeader = req.headers.authorization;

		if (!authHeader) {
			return res.status(401).json({
				success: false,
				message: 'Authorization header is required'
			});
		}

		if (!authHeader.startsWith('Bearer ')) {
			return res.status(401).json({
				success: false,
				message: 'Authorization header must start with Bearer'
			});
		}

		const token = authHeader.substring(7);
		if (!token || token.length < 10) {
			return res.status(401).json({
				success: false,
				message: 'Invalid token format'
			});
		}

		next();
	};
}
