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
});


afterEach(() => {
    jest.resetAllMocks();
});
