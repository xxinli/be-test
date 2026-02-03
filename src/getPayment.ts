import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { buildResponse } from './lib/apigateway';
import { getPayment } from './lib/payments';

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const isValidUUID = (id: string): boolean => UUID_REGEX.test(id);

export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
    try {
        const paymentId = event.pathParameters?.id;

        if (!paymentId) {
            console.error('Missing payment ID in path parameters');
            return buildResponse(400, {
                error: 'Bad Request',
                message: 'Payment ID is required'
            });
        }

        if (!isValidUUID(paymentId)) {
            console.warn(`Invalid payment ID format: ${paymentId}`);
            return buildResponse(400, {
                error: 'Bad Request',
                message: 'Payment ID must be a valid UUID format'
            });
        }

        const payment = await getPayment(paymentId);

        if (!payment) {
            console.warn(`Payment not found: ${paymentId}`);
            return buildResponse(404, {
                error: 'Not Found',
                message: `Payment with ID '${paymentId}' not found`
            });
        }

        return buildResponse(200, payment);
    } catch (error) {
        console.error('Error retrieving payment:', error);
        return buildResponse(500, {
            error: 'Internal Server Error',
            message: 'An unexpected error occurred while retrieving the payment'
        });
    }
};
