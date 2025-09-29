import { db } from '../config/database';
import bcrypt from 'bcryptjs';
import { UserRole } from '../types/database';
import * as crypto from 'crypto';

// Generate a secure random password
const generateSecurePassword = (length: number = 16): string => {
	const charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
	let password = '';
	for (let i = 0; i < length; i++) {
		password += charset.charAt(Math.floor(Math.random() * charset.length));
	}
	return password;
};

// Validate password strength
const validatePasswordStrength = (password: string): { isValid: boolean; errors: string[] } => {
	const errors: string[] = [];

	if (password.length < 12) {
		errors.push('Password must be at least 12 characters long');
	}
	if (!/[A-Z]/.test(password)) {
		errors.push('Password must contain at least one uppercase letter');
	}
	if (!/[a-z]/.test(password)) {
		errors.push('Password must contain at least one lowercase letter');
	}
	if (!/[0-9]/.test(password)) {
		errors.push('Password must contain at least one number');
	}
	if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
		errors.push('Password must contain at least one special character');
	}

	return {
		isValid: errors.length === 0,
		errors
	};
};

// Create admin user for personal lending
export const createAdminUser = async (options?: {
	email?: string;
	password?: string;
	firstName?: string;
	lastName?: string;
	generatePassword?: boolean;
}) => {
	try {
		// Get admin credentials from environment or options
		const adminEmail = options?.email || process.env.ADMIN_EMAIL || 'admin@loanshark.local';
		const adminFirstName = options?.firstName || process.env.ADMIN_FIRST_NAME || 'Admin';
		const adminLastName = options?.lastName || process.env.ADMIN_LAST_NAME || 'User';

		// Check if admin already exists (since this is a personal lending app, we'll check by email)
		const existingAdmin = await db('users')
			.where('email', adminEmail)
			.first();

		if (existingAdmin) {
			console.log('✅ Admin user already exists');
			console.log('📧 Email:', existingAdmin.email);
			return existingAdmin;
		}

		let adminPassword: string;
		let isGeneratedPassword = false;

		if (options?.generatePassword || process.env.ADMIN_GENERATE_PASSWORD === 'true') {
			// Generate a secure random password
			adminPassword = generateSecurePassword(16);
			isGeneratedPassword = true;
		} else if (options?.password) {
			// Use provided password
			adminPassword = options.password;
		} else if (process.env.ADMIN_PASSWORD) {
			// Use password from environment
			adminPassword = process.env.ADMIN_PASSWORD;
		} else {
			// Generate a secure random password as fallback
			adminPassword = generateSecurePassword(16);
			isGeneratedPassword = true;
		}

		// Validate password strength
		const passwordValidation = validatePasswordStrength(adminPassword);
		if (!passwordValidation.isValid) {
			throw new Error(`Password validation failed: ${passwordValidation.errors.join(', ')}`);
		}

		// Hash the password with a high salt rounds for better security
		const hashedPassword = await bcrypt.hash(adminPassword, 12);

		const [admin] = await db('users')
			.insert({
				email: adminEmail,
				first_name: adminFirstName,
				last_name: adminLastName,
				password: hashedPassword,
				is_active: true
			})
			.returning('*');

		console.log('✅ Admin user created successfully');
		console.log('📧 Email:', adminEmail);

		if (isGeneratedPassword) {
			console.log('🔑 Generated Password:', adminPassword);
			console.log('⚠️  IMPORTANT: Save this password securely! It will not be shown again.');
		} else {
			console.log('🔑 Password: [PROVIDED]');
		}

		console.log('🛡️  Security recommendations:');
		console.log('   - Change password after first login');
		console.log('   - Enable 2FA if available');
		console.log('   - Use a strong, unique password');
		console.log('   - Never share admin credentials');

		return admin;
	} catch (error) {
		console.error('❌ Error creating admin user:', error);
		throw error;
	}
};

// Run setup if called directly
if (require.main === module) {
	createAdminUser()
		.then(() => {
			console.log('🎉 Setup complete!');
			process.exit(0);
		})
		.catch((error) => {
			console.error('❌ Setup failed:', error);
			process.exit(1);
		});
}
