# Utils

This folder contains utility functions for the Loan Shark App.

## Sanitizer

The `sanitizer.ts` file contains utilities for cleaning and formatting data from the database.

### Why We Need This

PostgreSQL returns DECIMAL values as strings to preserve precision. This is correct behavior, but for API responses, we want numbers.

### Usage Examples

```typescript
import { parseLoanFields, formatCurrency } from '../utils/sanitizer';

// Parse loan data from database
const loan = await loanRepository.findById(id);
const sanitizedLoan = parseLoanFields(loan);

// Result:
// Before: { amount: "1000.00", interest_rate: "10.00" }
// After:  { amount: 1000.00, interest_rate: 10.00 }

// Format currency for display
const formatted = formatCurrency(1000.50);
// Result: "₦1,000.50"
```

### Available Functions

- `parseDecimalFields(obj)` - Parse decimal fields to numbers
- `parseLoanFields(loan)` - Parse loan-specific decimal fields
- `parseRepaymentFields(repayment)` - Parse repayment-specific decimal fields
- `parseDecimalFieldsArray(items)` - Parse array of objects
- `formatCurrency(amount, currency)` - Format currency for display
- `formatPercentage(rate)` - Format percentage for display
- `sanitizeLoanResponse(loan)` - Complete loan sanitization with formatting
- `sanitizeRepaymentResponse(repayment)` - Complete repayment sanitization

### Benefits

1. **Consistent Data Types** - All decimal fields are numbers in API responses
2. **Reusable** - Can be used across all services
3. **Maintainable** - Centralized logic for data sanitization
4. **Type Safe** - Proper TypeScript support
5. **Formatted Display** - Ready-to-display currency and percentage values
