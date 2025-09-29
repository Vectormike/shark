export interface User {
  id: string;
  email: string;
  phone?: string;
  first_name: string;
  last_name: string;
  password: string;
  role: UserRole;
  is_active: boolean;

  // Profile information
  date_of_birth?: Date;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  occupation?: string;
  monthly_income?: number;

  // Verification
  is_email_verified: boolean;
  is_phone_verified: boolean;
  kyc_status: KycStatus;

  // 2FA fields
  two_factor_secret?: string;
  two_factor_enabled: boolean;
  two_factor_backup_codes?: string[];
  two_factor_verified_at?: Date;

  // Timestamps
  created_at: Date;
  updated_at: Date;
}

export interface Borrower {
  id: string;
  first_name: string;
  last_name: string;
  phone: string;
  nin?: string;
  emergency_contact_name?: string;
  emergency_contact_phone?: string;
  address?: string;
  notes?: string;
  created_by: string;
  created_at: Date;
  updated_at: Date;
}

export interface Loan {
  id: string;
  user_id: string;
  amount: number;
  interest_rate: number;
  term_in_months: number;
  purpose?: string;
  status: LoanStatus;

  // Calculated fields
  monthly_payment: number;
  total_amount: number;
  remaining_balance: number;

  // Important dates
  applied_at: Date;
  approved_at?: Date;
  disbursed_at?: Date;
  due_date?: Date;

  created_at: Date;
  updated_at: Date;
}

export interface Repayment {
  id: string;
  loan_id: string;
  user_id: string;
  amount: number;
  principal_amount: number;
  interest_amount: number;
  status: RepaymentStatus;
  method: PaymentMethod;

  // Payment gateway details
  transaction_reference?: string;
  gateway_response?: any;

  // Timestamps
  due_date: Date;
  paid_at?: Date;
  created_at: Date;
  updated_at: Date;
}

export interface Notification {
  id: string;
  user_id: string;
  title: string;
  message: string;
  type: NotificationType;
  is_read: boolean;
  created_at: Date;
}

// Enums
export enum UserRole {
  BORROWER = 'BORROWER',
  ADMIN = 'ADMIN',
  SUPER_ADMIN = 'SUPER_ADMIN'
}

export enum KycStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
  REQUIRES_UPDATE = 'REQUIRES_UPDATE'
}

export enum LoanStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
  DISBURSED = 'DISBURSED',
  ACTIVE = 'ACTIVE',
  COMPLETED = 'COMPLETED',
  DEFAULTED = 'DEFAULTED',
  CANCELLED = 'CANCELLED'
}

export enum RepaymentStatus {
  PENDING = 'PENDING',
  PROCESSING = 'PROCESSING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
  OVERDUE = 'OVERDUE'
}

export enum PaymentMethod {
  BANK_TRANSFER = 'BANK_TRANSFER',
  CARD = 'CARD',
  PAYSTACK = 'PAYSTACK',
  FLUTTERWAVE = 'FLUTTERWAVE',
  CASH = 'CASH'
}

export enum NotificationType {
  INFO = 'INFO',
  WARNING = 'WARNING',
  SUCCESS = 'SUCCESS',
  ERROR = 'ERROR',
  REMINDER = 'REMINDER'
}

// Input types for creating/updating records
export interface CreateUserInput {
  email: string;
  phone?: string;
  first_name: string;
  last_name: string;
  password: string;
  role?: UserRole;
}

export interface CreateLoanInput {
  borrower_id: string;
  amount: number;
  interest_rate: number;
  term_in_months: number;
  purpose?: string;
}

export interface CreateRepaymentInput {
  loan_id: string;
  user_id: string;
  amount: number;
  method?: PaymentMethod;
  due_date: Date;
}
