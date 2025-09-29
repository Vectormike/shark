import { Request, Response } from 'express';
import { AuthService } from '../services/AuthService';
import { TwoFactorService } from '../services/TwoFactorService';

const authService = new AuthService();

export const login = async (req: Request, res: Response) => {
	try {
		const { email, password, twoFactorToken } = req.body;

		// First, verify email and password
		const user = await authService.verifyCredentials(email, password);

		// Check if user has 2FA enabled
		if (user.two_factor_enabled) {
			// If 2FA is enabled but no token provided, return 2FA required
			if (!twoFactorToken) {
				return res.status(200).json({
					success: true,
					message: '2FA required',
					data: {
						requiresTwoFactor: true,
						userId: user.id,
						timeRemaining: TwoFactorService.getTimeRemaining()
					}
				});
			}

			// Verify 2FA token
			if (!user.two_factor_secret || !TwoFactorService.verifyToken(user.two_factor_secret, twoFactorToken)) {
				return res.status(401).json({
					success: false,
					message: 'Invalid 2FA code'
				});
			}
		}

		// Generate JWT tokens
		const result = await authService.generateTokensForUser(user);

		res.json({
			success: true,
			message: 'Login successful',
			data: result
		});
	} catch (error) {
		console.error('Login error:', error);
		res.status(401).json({
			success: false,
			message: error instanceof Error ? error.message : 'Invalid credentials'
		});
	}
};

export const refreshToken = async (req: Request, res: Response) => {
	try {
		const { refreshToken: token } = req.body;

		if (!token) {
			return res.status(400).json({
				success: false,
				message: 'Refresh token is required'
			});
		}

		const result = await authService.refreshToken(token);

		res.json({
			success: true,
			message: 'Token refreshed successfully',
			data: result
		});
	} catch (error) {
		console.error('Refresh token error:', error);
		res.status(401).json({
			success: false,
			message: error instanceof Error ? error.message : 'Invalid refresh token'
		});
	}
};
