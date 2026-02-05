import * as payments from '../src/lib/payments';
import * as cache from '../src/lib/cache';
import { randomUUID } from 'crypto';
import { handler } from '../src/getPayment';
import { APIGatewayProxyEvent } from 'aws-lambda';

describe('When the user requests the records for a specific payment', () => {
    it('Returns the payment matching their input parameter.', async () => {
        const paymentId = randomUUID();
        const mockPayment = {
            id: paymentId,
            currency: 'AUD',
            amount: 2000,
        };
        const getPaymentMock = jest.spyOn(payments, 'getPayment').mockResolvedValueOnce(mockPayment);

        const result = await handler({
            pathParameters: {
                id: paymentId,
            },
        } as unknown as APIGatewayProxyEvent);

        expect(result.statusCode).toBe(200);
        expect(JSON.parse(result.body)).toEqual(mockPayment);

        expect(getPaymentMock).toHaveBeenCalledWith(paymentId);
    });

    it('Returns 400 when payment ID is missing', async () => {
        const result = await handler({
            pathParameters: {},
        } as unknown as APIGatewayProxyEvent);

        expect(result.statusCode).toBe(400);
        expect(JSON.parse(result.body)).toEqual({
            error: 'Bad Request',
            message: 'Payment ID is required',
        });
    });

    it('Returns 400 when payment ID is not a valid UUID', async () => {
        const result = await handler({
            pathParameters: {
                id: 'invalid-uuid',
            },
        } as unknown as APIGatewayProxyEvent);

        expect(result.statusCode).toBe(400);
        expect(JSON.parse(result.body)).toEqual({
            error: 'Bad Request',
            message: 'Payment ID must be a valid UUID format',
        });
    });

    it('Returns 404 when payment is not found', async () => {
        const paymentId = randomUUID();
        jest.spyOn(payments, 'getPayment').mockResolvedValueOnce(null);

        const result = await handler({
            pathParameters: {
                id: paymentId,
            },
        } as unknown as APIGatewayProxyEvent);

        expect(result.statusCode).toBe(404);
        expect(JSON.parse(result.body)).toEqual({
            error: 'Not Found',
            message: `Payment with ID '${paymentId}' not found`,
        });
    });

    it('Returns 500 when an unexpected error occurs', async () => {
        const paymentId = randomUUID();
        jest.spyOn(payments, 'getPayment').mockRejectedValueOnce(new Error('Database connection failed'));

        const result = await handler({
            pathParameters: {
                id: paymentId,
            },
        } as unknown as APIGatewayProxyEvent);

        expect(result.statusCode).toBe(500);
        expect(JSON.parse(result.body)).toEqual({
            error: 'Internal Server Error',
            message: 'An unexpected error occurred while retrieving the payment',
        });
    });

    it('Returns 400 when pathParameters is null', async () => {
        const result = await handler({
            pathParameters: null,
        } as unknown as APIGatewayProxyEvent);

        expect(result.statusCode).toBe(400);
        expect(JSON.parse(result.body)).toEqual({
            error: 'Bad Request',
            message: 'Payment ID is required',
        });
    });

    it('Returns payment from cache on cache hit', async () => {
        const paymentId = randomUUID();
        const mockPayment = {
            id: paymentId,
            currency: 'USD',
            amount: 5000,
        };

        const getCacheMock = jest.spyOn(cache, 'getCache').mockReturnValueOnce(mockPayment);
        const getPaymentMock = jest.spyOn(payments, 'getPayment').mockResolvedValueOnce(mockPayment);

        const result = await handler({
            pathParameters: {
                id: paymentId,
            },
        } as unknown as APIGatewayProxyEvent);

        expect(result.statusCode).toBe(200);
        expect(JSON.parse(result.body)).toEqual(mockPayment);
        expect(getCacheMock).toHaveBeenCalledWith(`${paymentId}`);
        expect(getPaymentMock).not.toHaveBeenCalled();
    });

    it('Stores payment in cache on cache miss', async () => {
        const paymentId = randomUUID();
        const mockPayment = {
            id: paymentId,
            currency: 'GBP',
            amount: 3000,
        };

        jest.spyOn(cache, 'getCache').mockReturnValueOnce(undefined);
        jest.spyOn(payments, 'getPayment').mockResolvedValueOnce(mockPayment);
        const setCacheMock = jest.spyOn(cache, 'setCache');

        const result = await handler({
            pathParameters: {
                id: paymentId,
            },
        } as unknown as APIGatewayProxyEvent);

        expect(result.statusCode).toBe(200);
        expect(setCacheMock).toHaveBeenCalledWith(`${paymentId}`, mockPayment);
    });

    it('Returns 404 and caches null when payment not found', async () => {
        const paymentId = randomUUID();
        jest.spyOn(cache, 'getCache').mockReturnValueOnce(undefined);
        jest.spyOn(payments, 'getPayment').mockResolvedValueOnce(null);
        const setCacheMock = jest.spyOn(cache, 'setCache');

        const result = await handler({
            pathParameters: {
                id: paymentId,
            },
        } as unknown as APIGatewayProxyEvent);

        expect(result.statusCode).toBe(404);
        expect(setCacheMock).toHaveBeenCalledWith(`${paymentId}`, null);
    });

    it('Returns 400 for empty string payment ID', async () => {
        const result = await handler({
            pathParameters: {
                id: '',
            },
        } as unknown as APIGatewayProxyEvent);

        expect(result.statusCode).toBe(400);
        expect(JSON.parse(result.body)).toEqual({
            error: 'Bad Request',
            message: 'Payment ID is required',
        });
    });

    it('Returns 400 for whitespace-only payment ID', async () => {
        const result = await handler({
            pathParameters: {
                id: '   ',
            },
        } as unknown as APIGatewayProxyEvent);

        expect(result.statusCode).toBe(400);
        expect(JSON.parse(result.body)).toEqual({
            error: 'Bad Request',
            message: 'Payment ID must be a valid UUID format',
        });
    });
});

afterEach(() => {
    jest.resetAllMocks();
    cache.clearCache();
});
