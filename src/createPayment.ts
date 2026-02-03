import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { randomUUID } from 'crypto';
import { buildResponse, parseInput } from './lib/apigateway';
import { createPayment, Payment } from './lib/payments';

export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
    try {
        const input = parseInput(event.body || '{}') as Omit<Payment, 'id'>;

        const paymentId = randomUUID();

        const payment: Payment = {
            ...input,
            id: paymentId,
        };

        await createPayment(payment);

        console.info(`Payment created successfully: ${paymentId}`);
        return buildResponse(201, { id: paymentId });
    } catch (error) {
        console.error('Error creating payment:', error);
        return buildResponse(500, {
            error: 'Internal Server Error',
            message: 'An unexpected error occurred while creating the payment'
        });
    }
};
