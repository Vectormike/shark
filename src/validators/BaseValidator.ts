import { Request, Response, NextFunction } from 'express';

export interface ValidationError {
    field: string;
    message: string;
    value?: any;
}

export interface ValidationResult {
    isValid: boolean;
    errors: ValidationError[];
    data?: any;
}

export abstract class BaseValidator {
    protected validateField(
        value: any,
        fieldName: string,
        rules: {
            required?: boolean;
            type?: string;
            minLength?: number;
            maxLength?: number;
            min?: number;
            max?: number;
            pattern?: RegExp;
            custom?: (value: any) => string | null;
        }
    ): string | null {
        // Required check
        if (rules.required && (value === undefined || value === null || value === '')) {
            return `${fieldName} is required`;
        }

        // Skip other validations if value is empty and not required
        if (!rules.required && (value === undefined || value === null || value === '')) {
            return null;
        }

        // Type check
        if (rules.type && typeof value !== rules.type) {
            return `${fieldName} must be a ${rules.type}`;
        }

        // String length checks
        if (typeof value === 'string') {
            if (rules.minLength && value.length < rules.minLength) {
                return `${fieldName} must be at least ${rules.minLength} characters long`;
            }
            if (rules.maxLength && value.length > rules.maxLength) {
                return `${fieldName} must be no more than ${rules.maxLength} characters long`;
            }
        }

        // Number range checks
        if (typeof value === 'number') {
            if (rules.min !== undefined && value < rules.min) {
                return `${fieldName} must be at least ${rules.min}`;
            }
            if (rules.max !== undefined && value > rules.max) {
                return `${fieldName} must be no more than ${rules.max}`;
            }
        }

        // Pattern check
        if (rules.pattern && typeof value === 'string' && !rules.pattern.test(value)) {
            return `${fieldName} format is invalid`;
        }

        // Custom validation
        if (rules.custom) {
            const customError = rules.custom(value);
            if (customError) {
                return customError;
            }
        }

        return null;
    }

    protected validateObject(
        data: any,
        schema: Record<string, any>
    ): ValidationResult {
        const errors: ValidationError[] = [];

        for (const [fieldName, rules] of Object.entries(schema)) {
            const value = data[fieldName];
            const error = this.validateField(value, fieldName, rules);

            if (error) {
                errors.push({
                    field: fieldName,
                    message: error,
                    value: value
                });
            }
        }

        return {
            isValid: errors.length === 0,
            errors,
            data: errors.length === 0 ? data : undefined
        };
    }

    protected createValidationMiddleware(validationFn: (data: any) => ValidationResult) {
        return (req: Request, res: Response, next: NextFunction) => {
            const result = validationFn(req.body);

            if (!result.isValid) {
                return res.status(400).json({
                    success: false,
                    message: 'Validation failed',
                    errors: result.errors
                });
            }

            // Attach validated data to request
            req.body = result.data;
            next();
        };
    }

    // Common validation patterns
    protected emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    protected phonePattern = /^\+?[1-9]\d{1,14}$/;
    protected nigerianPhonePattern = /^\+234[0-9]{10}$/;
    protected ninPattern = /^[0-9]{11}$/;
    protected uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
}
