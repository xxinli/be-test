import * as payments from '../src/lib/payments';
import { randomUUID } from 'crypto';
import { handler } from '../src/listPayments';
import { APIGatewayProxyEvent } from 'aws-lambda';

describe('When the user lists payments', () => {
    it('Returns all payments when no filter is provided', async () => {
        const mockPayments = [
            { id: randomUUID(), amount: 1000, currency: 'USD' },
            { id: randomUUID(), amount: 2000, currency: 'AUD' },
        ];
        const listPaymentsMock = jest.spyOn(payments, 'listPayments').mockResolvedValueOnce(mockPayments);

        const result = await handler({
            queryStringParameters: null,
        } as unknown as APIGatewayProxyEvent);

        expect(result.statusCode).toBe(200);
        expect(JSON.parse(result.body)).toEqual({ data: mockPayments });
        expect(listPaymentsMock).toHaveBeenCalledWith({ currency: undefined });
    });

    it('Returns filtered payments when currency filter is provided', async () => {
        const mockPayments = [
            { id: randomUUID(), amount: 1000, currency: 'USD' },
        ];
        const listPaymentsMock = jest.spyOn(payments, 'listPayments').mockResolvedValueOnce(mockPayments);

        const result = await handler({
            queryStringParameters: { currency: 'USD' },
        } as unknown as APIGatewayProxyEvent);

        expect(result.statusCode).toBe(200);
        expect(JSON.parse(result.body)).toEqual({ data: mockPayments });
        expect(listPaymentsMock).toHaveBeenCalledWith({ currency: 'USD' });
    });

    it('Returns empty array when no payments exist', async () => {
        jest.spyOn(payments, 'listPayments').mockResolvedValueOnce([]);

        const result = await handler({
            queryStringParameters: null,
        } as unknown as APIGatewayProxyEvent);

        expect(result.statusCode).toBe(200);
        expect(JSON.parse(result.body)).toEqual({ data: [] });
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
});

afterEach(() => {
    jest.resetAllMocks();
});
