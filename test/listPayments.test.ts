import * as payments from '../src/lib/payments';
import { randomUUID } from 'crypto';
import { handler } from '../src/listPayments';
import { APIGatewayProxyEvent } from 'aws-lambda';

describe('When the user lists payments', () => {
    it('Returns all payments with default pagination when no filter is provided', async () => {
        const mockPayments = [
            { id: randomUUID(), amount: 1000, currency: 'USD' },
            { id: randomUUID(), amount: 2000, currency: 'AUD' },
        ];
        const listPaymentsMock = jest.spyOn(payments, 'listPayments').mockResolvedValueOnce({
            items: mockPayments,
            total: 2,
        });

        const result = await handler({
            queryStringParameters: null,
        } as unknown as APIGatewayProxyEvent);

        expect(result.statusCode).toBe(200);
        expect(JSON.parse(result.body)).toEqual({
            data: mockPayments,
            total: 2,
            limit: 20,
            skip: 0,
        });
        expect(listPaymentsMock).toHaveBeenCalledWith({ currency: undefined, limit: 20, skip: 0 });
    });

    it('Returns filtered payments when currency filter is provided', async () => {
        const mockPayments = [{ id: randomUUID(), amount: 1000, currency: 'USD' }];
        const listPaymentsMock = jest.spyOn(payments, 'listPayments').mockResolvedValueOnce({
            items: mockPayments,
            total: 1,
        });

        const result = await handler({
            queryStringParameters: { currency: 'USD' },
        } as unknown as APIGatewayProxyEvent);

        expect(result.statusCode).toBe(200);
        expect(JSON.parse(result.body)).toEqual({
            data: mockPayments,
            total: 1,
            limit: 20,
            skip: 0,
        });
        expect(listPaymentsMock).toHaveBeenCalledWith({ currency: 'USD', limit: 20, skip: 0 });
    });

    it('Returns empty array when no payments exist', async () => {
        jest.spyOn(payments, 'listPayments').mockResolvedValueOnce({
            items: [],
            total: 0,
        });

        const result = await handler({
            queryStringParameters: null,
        } as unknown as APIGatewayProxyEvent);

        expect(result.statusCode).toBe(200);
        expect(JSON.parse(result.body)).toEqual({
            data: [],
            total: 0,
            limit: 20,
            skip: 0,
        });
    });

    it('Respects custom limit parameter', async () => {
        const mockPayments = [{ id: randomUUID(), amount: 1000, currency: 'USD' }];
        const listPaymentsMock = jest.spyOn(payments, 'listPayments').mockResolvedValueOnce({
            items: mockPayments,
            total: 50,
        });

        const result = await handler({
            queryStringParameters: { limit: '10' },
        } as unknown as APIGatewayProxyEvent);

        expect(result.statusCode).toBe(200);
        expect(JSON.parse(result.body)).toEqual({
            data: mockPayments,
            total: 50,
            limit: 10,
            skip: 0,
        });
        expect(listPaymentsMock).toHaveBeenCalledWith({ currency: undefined, limit: 10, skip: 0 });
    });

    it('Respects custom skip parameter', async () => {
        const mockPayments = [{ id: randomUUID(), amount: 2000, currency: 'AUD' }];
        const listPaymentsMock = jest.spyOn(payments, 'listPayments').mockResolvedValueOnce({
            items: mockPayments,
            total: 50,
        });

        const result = await handler({
            queryStringParameters: { skip: '10' },
        } as unknown as APIGatewayProxyEvent);

        expect(result.statusCode).toBe(200);
        expect(JSON.parse(result.body)).toEqual({
            data: mockPayments,
            total: 50,
            limit: 20,
            skip: 10,
        });
        expect(listPaymentsMock).toHaveBeenCalledWith({ currency: undefined, limit: 20, skip: 10 });
    });

    it('Respects both limit and skip parameters', async () => {
        const mockPayments = [{ id: randomUUID(), amount: 3000, currency: 'SGD' }];
        const listPaymentsMock = jest.spyOn(payments, 'listPayments').mockResolvedValueOnce({
            items: mockPayments,
            total: 100,
        });

        const result = await handler({
            queryStringParameters: { limit: '5', skip: '20' },
        } as unknown as APIGatewayProxyEvent);

        expect(result.statusCode).toBe(200);
        expect(JSON.parse(result.body)).toEqual({
            data: mockPayments,
            total: 100,
            limit: 5,
            skip: 20,
        });
        expect(listPaymentsMock).toHaveBeenCalledWith({ currency: undefined, limit: 5, skip: 20 });
    });

    it('Returns 400 when limit is less than 1', async () => {
        const result = await handler({
            queryStringParameters: { limit: '0' },
        } as unknown as APIGatewayProxyEvent);

        expect(result.statusCode).toBe(400);
        const body = JSON.parse(result.body);
        expect(body.error).toBe('Bad Request');
        expect(body.message).toBe('Invalid query parameters');
    });

    it('Returns 400 when limit is greater than 100', async () => {
        const result = await handler({
            queryStringParameters: { limit: '101' },
        } as unknown as APIGatewayProxyEvent);

        expect(result.statusCode).toBe(400);
        const body = JSON.parse(result.body);
        expect(body.error).toBe('Bad Request');
        expect(body.message).toBe('Invalid query parameters');
    });

    it('Returns 400 when skip is negative', async () => {
        const result = await handler({
            queryStringParameters: { skip: '-1' },
        } as unknown as APIGatewayProxyEvent);

        expect(result.statusCode).toBe(400);
        const body = JSON.parse(result.body);
        expect(body.error).toBe('Bad Request');
        expect(body.message).toBe('Invalid query parameters');
    });

    it('Returns 400 when currency format is invalid', async () => {
        const result = await handler({
            queryStringParameters: { currency: 'invalid' },
        } as unknown as APIGatewayProxyEvent);

        expect(result.statusCode).toBe(400);
        const body = JSON.parse(result.body);
        expect(body.error).toBe('Bad Request');
        expect(body.message).toBe('Invalid query parameters');
        expect(body.details).toBeDefined();
    });

    it('Returns 400 when currency is lowercase', async () => {
        const result = await handler({
            queryStringParameters: { currency: 'usd' },
        } as unknown as APIGatewayProxyEvent);

        expect(result.statusCode).toBe(400);
        const body = JSON.parse(result.body);
        expect(body.error).toBe('Bad Request');
    });

    it('Returns 400 when currency is too short', async () => {
        const result = await handler({
            queryStringParameters: { currency: 'US' },
        } as unknown as APIGatewayProxyEvent);

        expect(result.statusCode).toBe(400);
        const body = JSON.parse(result.body);
        expect(body.error).toBe('Bad Request');
    });

    it('Returns 500 when an unexpected error occurs', async () => {
        jest.spyOn(payments, 'listPayments').mockRejectedValueOnce(new Error('Database connection failed'));

        const result = await handler({
            queryStringParameters: null,
        } as unknown as APIGatewayProxyEvent);

        expect(result.statusCode).toBe(500);
        const body = JSON.parse(result.body);
        expect(body.error).toBe('Internal Server Error');
        expect(body.message).toBe('An unexpected error occurred while listing payments');
    });

    it('Returns 200 with limit at minimum boundary (1)', async () => {
        const mockPayments = [{ id: randomUUID(), amount: 1000, currency: 'USD' }];
        const listPaymentsMock = jest.spyOn(payments, 'listPayments').mockResolvedValueOnce({
            items: mockPayments,
            total: 100,
        });

        const result = await handler({
            queryStringParameters: { limit: '1' },
        } as unknown as APIGatewayProxyEvent);

        expect(result.statusCode).toBe(200);
        expect(JSON.parse(result.body).limit).toBe(1);
        expect(listPaymentsMock).toHaveBeenCalledWith({ currency: undefined, limit: 1, skip: 0 });
    });

    it('Returns 200 with limit at maximum boundary (100)', async () => {
        const mockPayments = [{ id: randomUUID(), amount: 1000, currency: 'USD' }];
        const listPaymentsMock = jest.spyOn(payments, 'listPayments').mockResolvedValueOnce({
            items: mockPayments,
            total: 200,
        });

        const result = await handler({
            queryStringParameters: { limit: '100' },
        } as unknown as APIGatewayProxyEvent);

        expect(result.statusCode).toBe(200);
        expect(JSON.parse(result.body).limit).toBe(100);
        expect(listPaymentsMock).toHaveBeenCalledWith({ currency: undefined, limit: 100, skip: 0 });
    });

    it('Returns 400 when limit is non-numeric string', async () => {
        const result = await handler({
            queryStringParameters: { limit: 'abc' },
        } as unknown as APIGatewayProxyEvent);

        expect(result.statusCode).toBe(400);
        const body = JSON.parse(result.body);
        expect(body.error).toBe('Bad Request');
    });

    it('Returns 400 when skip is non-numeric string', async () => {
        const result = await handler({
            queryStringParameters: { skip: 'abc' },
        } as unknown as APIGatewayProxyEvent);

        expect(result.statusCode).toBe(400);
        const body = JSON.parse(result.body);
        expect(body.error).toBe('Bad Request');
    });

    it('Returns filtered payments with pagination combined', async () => {
        const mockPayments = [{ id: randomUUID(), amount: 1000, currency: 'EUR' }];
        const listPaymentsMock = jest.spyOn(payments, 'listPayments').mockResolvedValueOnce({
            items: mockPayments,
            total: 50,
        });

        const result = await handler({
            queryStringParameters: { currency: 'EUR', limit: '10', skip: '5' },
        } as unknown as APIGatewayProxyEvent);

        expect(result.statusCode).toBe(200);
        expect(JSON.parse(result.body)).toEqual({
            data: mockPayments,
            total: 50,
            limit: 10,
            skip: 5,
        });
        expect(listPaymentsMock).toHaveBeenCalledWith({ currency: 'EUR', limit: 10, skip: 5 });
    });

    it('Returns 400 when currency is too long', async () => {
        const result = await handler({
            queryStringParameters: { currency: 'USDD' },
        } as unknown as APIGatewayProxyEvent);

        expect(result.statusCode).toBe(400);
        const body = JSON.parse(result.body);
        expect(body.error).toBe('Bad Request');
    });

    it('Returns empty data when skip exceeds total', async () => {
        jest.spyOn(payments, 'listPayments').mockResolvedValueOnce({
            items: [],
            total: 10,
        });

        const result = await handler({
            queryStringParameters: { skip: '100' },
        } as unknown as APIGatewayProxyEvent);

        expect(result.statusCode).toBe(200);
        const body = JSON.parse(result.body);
        expect(body.data).toEqual([]);
        expect(body.total).toBe(10);
        expect(body.skip).toBe(100);
    });

    it('Returns 200 with skip explicitly set to 0', async () => {
        const mockPayments = [{ id: randomUUID(), amount: 1000, currency: 'USD' }];
        jest.spyOn(payments, 'listPayments').mockResolvedValueOnce({
            items: mockPayments,
            total: 1,
        });

        const result = await handler({
            queryStringParameters: { skip: '0' },
        } as unknown as APIGatewayProxyEvent);

        expect(result.statusCode).toBe(200);
        expect(JSON.parse(result.body).skip).toBe(0);
    });

    it('Handles queryStringParameters as empty object', async () => {
        const mockPayments = [{ id: randomUUID(), amount: 1000, currency: 'USD' }];
        jest.spyOn(payments, 'listPayments').mockResolvedValueOnce({
            items: mockPayments,
            total: 1,
        });

        const result = await handler({
            queryStringParameters: {},
        } as unknown as APIGatewayProxyEvent);

        expect(result.statusCode).toBe(200);
        expect(JSON.parse(result.body)).toEqual({
            data: mockPayments,
            total: 1,
            limit: 20,
            skip: 0,
        });
    });
});


afterEach(() => {
    jest.resetAllMocks();
});
