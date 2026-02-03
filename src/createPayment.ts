import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { randomUUID } from 'crypto';
import { buildResponse, parseInput } from './lib/apigateway';
import { createPayment } from './lib/payments';
import { PaymentInputSchema, PaymentInput, formatZodErrors } from './lib/schemas';

export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
    try {
        const input = parseInput(event.body || '{}');

        const result = PaymentInputSchema.safeParse(input);

        if (!result.success) {
            const validationErrors = formatZodErrors(result.error);
            console.warn('Payment validation failed:', validationErrors);
            return buildResponse(422, {
                error: 'Unprocessable Entity',
                message: 'Validation failed',
                details: validationErrors,
            });
        }

        const validatedInput: PaymentInput = result.data;
        const paymentId = randomUUID();

        const payment = {
            id: paymentId,
            amount: validatedInput.amount,
            currency: validatedInput.currency,
        };

        await createPayment(payment);

        console.info(`Payment created successfully: ${paymentId}`);
        return buildResponse(201, { id: paymentId });
    } catch (error) {
        console.error('Error creating payment:', error);
        return buildResponse(500, {
            error: 'Internal Server Error',
            message: 'An unexpected error occurred while creating the payment',
        });
    }
};
