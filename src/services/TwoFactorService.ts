import speakeasy from 'speakeasy';
import QRCode from 'qrcode';
import crypto from 'crypto';

export class TwoFactorService {
	private static readonly ISSUER = 'Loan Shark App';
	private static readonly ALGORITHM = 'sha1';
	private static readonly DIGITS = 6;
	private static readonly PERIOD = 30;

	/**
	 * Generate a new 2FA secret for a user
	 */
	static generateSecret(userEmail: string): {
		secret: string;
		qrCodeUrl: string;
		manualEntryKey: string;
	} {
		const secret = speakeasy.generateSecret({
			name: userEmail,
			issuer: this.ISSUER,
			length: 32
		});

		return {
			secret: secret.base32,
			qrCodeUrl: secret.otpauth_url!,
			manualEntryKey: secret.base32
		};
	}

	/**
	 * Generate QR code data URL for the secret
	 */
	static async generateQRCode(secret: string, userEmail: string): Promise<string> {
		const otpauthUrl = speakeasy.otpauthURL({
			secret: secret,
			label: userEmail,
			issuer: this.ISSUER,
			algorithm: this.ALGORITHM,
			digits: this.DIGITS,
			period: this.PERIOD
		});

		try {
			const qrCodeDataUrl = await QRCode.toDataURL(otpauthUrl);
			return qrCodeDataUrl;
		} catch (error) {
			throw new Error('Failed to generate QR code');
		}
	}

	/**
	 * Verify a TOTP code against a secret
	 */
	static verifyToken(secret: string, token: string, window: number = 1): boolean {
		return speakeasy.totp.verify({
			secret: secret,
			encoding: 'base32',
			token: token,
			window: window,
			algorithm: this.ALGORITHM,
			digits: this.DIGITS
		});
	}

	/**
	 * Generate backup codes for account recovery
	 */
	static generateBackupCodes(count: number = 10): string[] {
		const codes: string[] = [];

		for (let i = 0; i < count; i++) {
			// Generate 8-character alphanumeric codes
			const code = crypto.randomBytes(4).toString('hex').toUpperCase();
			codes.push(code);
		}

		return codes;
	}

	/**
	 * Hash backup codes for secure storage
	 */
	static hashBackupCodes(codes: string[]): string[] {
		return codes.map(code => {
			const hash = crypto.createHash('sha256');
			hash.update(code);
			return hash.digest('hex');
		});
	}

	/**
	 * Verify a backup code against hashed codes
	 */
	static verifyBackupCode(providedCode: string, hashedCodes: string[]): boolean {
		const hash = crypto.createHash('sha256');
		hash.update(providedCode);
		const hashedCode = hash.digest('hex');

		return hashedCodes.includes(hashedCode);
	}

	/**
	 * Generate a recovery code for 2FA reset
	 */
	static generateRecoveryCode(): string {
		return crypto.randomBytes(16).toString('hex').toUpperCase();
	}

	/**
	 * Validate TOTP token format
	 */
	static isValidTokenFormat(token: string): boolean {
		return /^\d{6}$/.test(token);
	}

	/**
	 * Get time remaining for current TOTP window
	 */
	static getTimeRemaining(): number {
		const epoch = Math.round(new Date().getTime() / 1000.0);
		return this.PERIOD - (epoch % this.PERIOD);
	}
}
