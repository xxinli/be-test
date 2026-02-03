import { z } from 'zod';

export const PaymentInputSchema = z.object({
    amount: z
        .number({ required_error: 'Amount is required', invalid_type_error: 'Amount must be a number' })
        .finite('Amount must be a finite number')
        .positive('Amount must be greater than zero'),
    currency: z
        .string({ required_error: 'Currency is required', invalid_type_error: 'Currency must be a string' })
        .regex(/^[A-Z]{3}$/, 'Currency must be a valid 3-letter ISO currency code (e.g., USD, AUD, SGD)'),
});

export type PaymentInput = z.infer<typeof PaymentInputSchema>;

export interface ValidationError {
    field: string;
    message: string;
}

export const formatZodErrors = (error: z.ZodError): ValidationError[] => {
    return error.errors.map((err) => ({
        field: err.path.join('.'),
        message: err.message,
    }));
};
