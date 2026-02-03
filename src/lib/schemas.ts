import { z } from 'zod';

export const CurrencySchema = z
    .string({ invalid_type_error: 'Currency must be a string' })
    .regex(/^[A-Z]{3}$/, 'Currency must be a valid 3-letter ISO currency code (e.g., USD, AUD, SGD)');

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
