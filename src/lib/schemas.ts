import { z } from 'zod';

export const CurrencySchema = z
    .string({ invalid_type_error: 'Currency must be a string' })
    .regex(/^[A-Z]{3}$/, 'Currency must be a 3-letter ISO currency code (e.g., AUD)');

export const PaymentInputSchema = z.object({
    amount: z
        .number({ required_error: 'Amount is required', invalid_type_error: 'Amount must be a number' })
        .finite('Amount must be a finite number')
        .positive('Amount must be greater than zero'),
    currency: CurrencySchema.refine((val) => val !== undefined, { message: 'Currency is required' }),
});

export type PaymentInput = z.infer<typeof PaymentInputSchema>;

export const ListPaymentsQuerySchema = z.object({
    currency: CurrencySchema.optional(),
    limit: z
        .string()
        .optional()
        .transform((val) => (val ? parseInt(val, 10) : 20))
        .refine((val) => val >= 1 && val <= 100, {
            message: 'Limit must be between 1 and 100',
        }),
    skip: z
        .string()
        .optional()
        .transform((val) => (val ? parseInt(val, 10) : 0))
        .refine((val) => val >= 0, {
            message: 'Skip must be a number',
        }),
});

export type ListPaymentsQuery = z.infer<typeof ListPaymentsQuerySchema>;

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
