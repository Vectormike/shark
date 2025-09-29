import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { UserRepository } from '../repositories/UserRepository';
import { User } from '../types/database';
import { CacheService, CacheKeys } from '../config/redis';

export class AuthService {
	private userRepository: UserRepository;

	constructor() {
		this.userRepository = new UserRepository();
	}

	// Generate JWT tokens
	public generateTokens(userId: string) {
		const accessToken = jwt.sign(
			{ userId },
			process.env.JWT_SECRET!,
			{ expiresIn: process.env.JWT_EXPIRE || '24h' } as jwt.SignOptions
		);

		const refreshToken = jwt.sign(
			{ userId },
			process.env.JWT_REFRESH_SECRET!,
			{ expiresIn: process.env.JWT_REFRESH_EXPIRE || '7d' } as jwt.SignOptions
		);

		return { accessToken, refreshToken };
	}

	// Login user
	async login(email: string, password: string): Promise<{
		user: Omit<User, 'password'>;
		tokens: { accessToken: string; refreshToken: string };
	}> {
		// Find user by email
		const user = await this.userRepository.findByEmail(email);

		if (!user || !user.is_active) {
			throw new Error('Invalid credentials');
		}

		// Verify password
		const isValidPassword = await bcrypt.compare(password, user.password);
		if (!isValidPassword) {
			throw new Error('Invalid credentials');
		}

		// Generate tokens
		const { accessToken, refreshToken } = this.generateTokens(user.id);

		// Cache user session
		await CacheService.set(
			CacheKeys.USER_SESSION(user.id),
			{ userId: user.id, email: user.email },
			24 * 60 * 60 // 24 hours
		);

		// Remove password from user object
		const { password: _, ...userWithoutPassword } = user;

		return {
			user: userWithoutPassword,
			tokens: { accessToken, refreshToken }
		};
	}

	// Refresh token
	async refreshToken(refreshToken: string): Promise<{
		tokens: { accessToken: string; refreshToken: string };
	}> {
		// Verify refresh token
		const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET!) as { userId: string };

		// Check if user exists and is active
		const user = await this.userRepository.findById(decoded.userId);
		if (!user || !user.is_active) {
			throw new Error('Invalid refresh token');
		}

		// Generate new tokens
		const { accessToken, refreshToken: newRefreshToken } = this.generateTokens(user.id);

		return {
			tokens: { accessToken, refreshToken: newRefreshToken }
		};
	}

	// Verify token
	async verifyToken(token: string): Promise<{ userId: string }> {
		const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { userId: string };
		return decoded;
	}

	// Get user from token
	async getUserFromToken(token: string): Promise<User | null> {
		try {
			const { userId } = await this.verifyToken(token);
			return await this.userRepository.findById(userId);
		} catch (error) {
			return null;
		}
	}

	// Verify credentials without generating tokens
	async verifyCredentials(email: string, password: string): Promise<User> {
		const user = await this.userRepository.findByEmail(email);

		if (!user || !user.is_active) {
			throw new Error('Invalid credentials');
		}

		const isValidPassword = await bcrypt.compare(password, user.password);
		if (!isValidPassword) {
			throw new Error('Invalid credentials');
		}

		return user;
	}

	// Generate tokens for user
	async generateTokensForUser(user: User): Promise<{
		user: Omit<User, 'password'>;
		tokens: { accessToken: string; refreshToken: string };
	}> {
		const { accessToken, refreshToken } = this.generateTokens(user.id);

		// Cache user session
		await CacheService.set(
			CacheKeys.USER_SESSION(user.id),
			{ userId: user.id, email: user.email },
			24 * 60 * 60 // 24 hours
		);

		// Remove password from user object
		const { password: _, ...userWithoutPassword } = user;

		return {
			user: userWithoutPassword,
			tokens: { accessToken, refreshToken }
		};
	}

	// Verify password
	async verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
		return await bcrypt.compare(password, hashedPassword);
	}

	// Logout (clear session cache)
	async logout(userId: string): Promise<void> {
		await CacheService.delete(CacheKeys.USER_SESSION(userId));
	}
}
