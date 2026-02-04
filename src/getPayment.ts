import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { buildResponse } from './lib/apigateway';
import { getCache, setCache } from './lib/cache';
import { getPayment, Payment } from './lib/payments';
import { isValidUUID } from './lib/validation';

const CACHE_KEY_PREFIX = 'payment:';

const getCachedPayment = async (paymentId: string): Promise<Payment | null> => {
    const cacheKey = `${CACHE_KEY_PREFIX}${paymentId}`;
    const cached = getCache<Payment | null>(cacheKey);

    if (cached !== undefined) {
        console.info(`Cache hit for payment: ${paymentId}`);
        return cached;
    }

    console.info(`Cache miss for payment: ${paymentId}`);
    const payment = await getPayment(paymentId);

    setCache(cacheKey, payment);

    return payment;
};

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

        const payment = await getCachedPayment(paymentId);

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
