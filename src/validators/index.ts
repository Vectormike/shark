// Validator exports
export { BaseValidator, ValidationError, ValidationResult } from './BaseValidator';
export { BorrowerValidator } from './BorrowerValidator';
export { LoanValidator } from './LoanValidator';
export { AuthValidator } from './AuthValidator';
export { PaymentValidator } from './PaymentValidator';

// Import validator classes
import { BorrowerValidator } from './BorrowerValidator';
import { LoanValidator } from './LoanValidator';
import { AuthValidator } from './AuthValidator';
import { PaymentValidator } from './PaymentValidator';

// Create validator instances
export const borrowerValidator = new BorrowerValidator();
export const loanValidator = new LoanValidator();
export const authValidator = new AuthValidator();
export const paymentValidator = new PaymentValidator();
