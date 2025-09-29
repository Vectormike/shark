# Validators

This folder contains all validation logic for the Loan Shark App API endpoints.

## Structure

```text
src/validators/
├── BaseValidator.ts        # Abstract base validator class
├── BorrowerValidator.ts    # Borrower validation logic
├── LoanValidator.ts        # Loan validation logic
├── AuthValidator.ts        # Authentication validation logic
├── PaymentValidator.ts     # Payment validation logic
├── index.ts               # Exports and validator instances
└── README.md              # This file
```

## Features

### ✅ **Comprehensive Validation**

- **Input sanitization** - Clean and validate all inputs
- **Type checking** - Ensure correct data types
- **Format validation** - Validate emails, phones, UUIDs, etc.
- **Business rules** - Enforce business logic constraints
- **Security checks** - Prevent malicious inputs

### ✅ **Consistent Error Handling**

- **Standardized errors** - Uniform error response format
- **Detailed messages** - Clear validation error descriptions
- **Field-specific errors** - Pinpoint exact validation issues
- **HTTP status codes** - Proper status code responses

### ✅ **Reusable Components**

- **Base validator** - Common validation utilities
- **Modular design** - Each entity has its own validator
- **Middleware pattern** - Easy integration with Express routes
- **Type safety** - Full TypeScript support

## Usage Examples

### **Borrower Validation**

```typescript
import { borrowerValidator } from '../validators';

// In your route
router.post('/borrowers',
  borrowerValidator.validateCreateBorrower,
  createBorrower
);
```

### **Loan Validation**

```typescript
import { loanValidator } from '../validators';

// In your route
router.post('/loans',
  loanValidator.validateCreateLoan,
  createLoan
);
```

### **Authentication Validation**

```typescript
import { authValidator } from '../validators';

// In your route
router.post('/auth/login',
  authValidator.validateLogin,
  login
);
```

## Validation Rules

### **Borrower Validation**

- **Name**: 2-50 characters, letters only
- **Phone**: Nigerian format (+234XXXXXXXXXX)
- **NIN**: 11 digits exactly
- **Address**: Max 500 characters
- **Notes**: Max 1000 characters

### **Loan Validation**

- **Amount**: 1,000 - 10,000,000 NGN (whole numbers)
- **Interest Rate**: 0-100%
- **Term**: 1-60 months
- **Categories**: PERSONAL, BUSINESS, EMERGENCY
- **Risk Levels**: LOW, MEDIUM, HIGH

### **Authentication Validation**

- **Email**: Valid email format
- **Password**: 6-128 characters
- **2FA Token**: Exactly 6 digits
- **Strong Passwords**: Uppercase, lowercase, numbers, special chars

### **Payment Validation**

- **Amount**: 100 - 10,000,000 NGN
- **Reference**: 10-50 characters, alphanumeric + underscore
- **Email**: Valid email format
- **Callback URL**: Valid HTTP/HTTPS URL
- **Channels**: Valid payment channels

## Error Response Format

```json
{
  "success": false,
  "message": "Validation failed",
  "errors": [
    {
      "field": "email",
      "message": "Email format is invalid",
      "value": "invalid-email"
    },
    {
      "field": "amount",
      "message": "Amount must be between 1000 and 10000000",
      "value": 500
    }
  ]
}
```

## Adding New Validators

1. **Create validator class** extending `BaseValidator`
2. **Define validation schemas** for each operation
3. **Implement validation methods** as middleware
4. **Export from index.ts** and create instance
5. **Use in routes** as middleware

### **Example New Validator**

```typescript
export class NotificationValidator extends BaseValidator {
  private createNotificationSchema = {
    title: {
      required: true,
      type: 'string',
      minLength: 5,
      maxLength: 100
    },
    message: {
      required: true,
      type: 'string',
      maxLength: 1000
    }
  };

  validateCreateNotification = (req: Request, res: Response, next: NextFunction) => {
    const result = this.validateObject(req.body, this.createNotificationSchema);

    if (!result.isValid) {
      return res.status(400).json({
        success: false,
        message: 'Notification validation failed',
        errors: result.errors
      });
    }

    req.body = result.data;
    next();
  };
}
```

## Best Practices

1. **Always validate inputs** - Never trust client data
2. **Use specific error messages** - Help developers debug
3. **Validate early** - Fail fast with clear errors
4. **Keep validators focused** - One validator per entity
5. **Test validators** - Ensure they catch all edge cases
6. **Document validation rules** - Keep this README updated
