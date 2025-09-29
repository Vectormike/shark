import { Request, Response } from 'express';
import { TwoFactorService } from '../services/TwoFactorService';
import { UserRepository } from '../repositories/UserRepository';
import { AuthService } from '../services/AuthService';

const userRepository = new UserRepository();
const authService = new AuthService();

// Setup 2FA for a user
export const setupTwoFactor = async (req: Request, res: Response) => {
	try {
		const userId = req.user?.userId;
		if (!userId) {
			return res.status(401).json({
				success: false,
				message: 'User not authenticated'
			});
		}

		// Get user details
		const user = await userRepository.findById(userId);
		if (!user) {
			return res.status(404).json({
				success: false,
				message: 'User not found'
			});
		}

		// Check if 2FA is already enabled
		if (user.two_factor_enabled) {
			return res.status(400).json({
				success: false,
				message: '2FA is already enabled for this account'
			});
		}

		// Generate new 2FA secret
		const { secret, qrCodeUrl, manualEntryKey } = TwoFactorService.generateSecret(user.email);

		// Generate QR code
		const qrCodeDataUrl = await TwoFactorService.generateQRCode(secret, user.email);

		// Generate backup codes
		const backupCodes = TwoFactorService.generateBackupCodes();
		const hashedBackupCodes = TwoFactorService.hashBackupCodes(backupCodes);

		// Store secret and backup codes (but don't enable 2FA yet)
		await userRepository.update(userId, {
			two_factor_secret: secret,
			two_factor_backup_codes: hashedBackupCodes
		});

		res.json({
			success: true,
			message: '2FA setup initiated',
			data: {
				qrCode: qrCodeDataUrl,
				manualEntryKey,
				backupCodes, // Show backup codes only once
				timeRemaining: TwoFactorService.getTimeRemaining()
			}
		});

	} catch (error) {
		console.error('Setup 2FA error:', error);
		res.status(500).json({
			success: false,
			message: 'Failed to setup 2FA'
		});
	}
};

// Verify 2FA setup with a test code
export const verifyTwoFactorSetup = async (req: Request, res: Response) => {
	try {
		const userId = req.user?.userId;
		const { token } = req.body;

		if (!userId) {
			return res.status(401).json({
				success: false,
				message: 'User not authenticated'
			});
		}

		if (!token || !TwoFactorService.isValidTokenFormat(token)) {
			return res.status(400).json({
				success: false,
				message: 'Invalid token format'
			});
		}

		// Get user with 2FA secret
		const user = await userRepository.findById(userId);
		if (!user || !user.two_factor_secret) {
			return res.status(400).json({
				success: false,
				message: '2FA setup not initiated'
			});
		}

		// Verify the token
		const isValid = TwoFactorService.verifyToken(user.two_factor_secret, token);

		if (!isValid) {
			return res.status(400).json({
				success: false,
				message: 'Invalid verification code'
			});
		}

		// Enable 2FA
		await userRepository.update(userId, {
			two_factor_enabled: true,
			two_factor_verified_at: new Date()
		});

		res.json({
			success: true,
			message: '2FA enabled successfully',
			data: {
				enabled: true,
				verifiedAt: new Date()
			}
		});

	} catch (error) {
		console.error('Verify 2FA setup error:', error);
		res.status(500).json({
			success: false,
			message: 'Failed to verify 2FA setup'
		});
	}
};

// Disable 2FA
export const disableTwoFactor = async (req: Request, res: Response) => {
	try {
		const userId = req.user?.userId;
		const { password, token } = req.body;

		if (!userId) {
			return res.status(401).json({
				success: false,
				message: 'User not authenticated'
			});
		}

		// Verify password first
		const user = await userRepository.findById(userId);
		if (!user) {
			return res.status(404).json({
				success: false,
				message: 'User not found'
			});
		}

		const isPasswordValid = await authService.verifyPassword(password, user.password);
		if (!isPasswordValid) {
			return res.status(400).json({
				success: false,
				message: 'Invalid password'
			});
		}

		// If 2FA is enabled, require 2FA token
		if (user.two_factor_enabled && user.two_factor_secret) {
			if (!token || !TwoFactorService.verifyToken(user.two_factor_secret, token)) {
				return res.status(400).json({
					success: false,
					message: 'Invalid 2FA code'
				});
			}
		}

		// Disable 2FA
		await userRepository.update(userId, {
			two_factor_enabled: false,
			two_factor_secret: undefined,
			two_factor_backup_codes: undefined,
			two_factor_verified_at: undefined
		});

		res.json({
			success: true,
			message: '2FA disabled successfully'
		});

	} catch (error) {
		console.error('Disable 2FA error:', error);
		res.status(500).json({
			success: false,
			message: 'Failed to disable 2FA'
		});
	}
};

// Get 2FA status
export const getTwoFactorStatus = async (req: Request, res: Response) => {
	try {
		const userId = req.user?.userId;

		if (!userId) {
			return res.status(401).json({
				success: false,
				message: 'User not authenticated'
			});
		}

		const user = await userRepository.findById(userId);
		if (!user) {
			return res.status(404).json({
				success: false,
				message: 'User not found'
			});
		}

		res.json({
			success: true,
			data: {
				enabled: user.two_factor_enabled,
				verifiedAt: user.two_factor_verified_at,
				hasBackupCodes: user.two_factor_backup_codes && user.two_factor_backup_codes.length > 0
			}
		});

	} catch (error) {
		console.error('Get 2FA status error:', error);
		res.status(500).json({
			success: false,
			message: 'Failed to get 2FA status'
		});
	}
};
