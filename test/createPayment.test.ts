import * as payments from '../src/lib/payments';
import { handler } from '../src/createPayment';
import { APIGatewayProxyEvent } from 'aws-lambda';

describe('When the user creates a payment', () => {
    it('Returns 201 with payment ID for valid input', async () => {
        const createPaymentMock = jest.spyOn(payments, 'createPayment').mockResolvedValueOnce(undefined);

        const result = await handler({
            body: JSON.stringify({
                amount: 1000,
                currency: 'USD',
            }),
        } as unknown as APIGatewayProxyEvent);

        expect(result.statusCode).toBe(201);
        const body = JSON.parse(result.body);
        expect(body.id).toBeDefined();
        expect(typeof body.id).toBe('string');

        expect(createPaymentMock).toHaveBeenCalledWith(
            expect.objectContaining({
                amount: 1000,
                currency: 'USD',
            })
        );
    });

    it('Returns 422 when amount is missing', async () => {
        const result = await handler({
            body: JSON.stringify({
                currency: 'USD',
            }),
        } as unknown as APIGatewayProxyEvent);

        expect(result.statusCode).toBe(422);
        const body = JSON.parse(result.body);
        expect(body.error).toBe('Unprocessable Entity');
        expect(body.message).toBe('Validation failed');
        expect(body.details).toBeDefined();
    });

    it('Returns 422 when currency is missing', async () => {
        const result = await handler({
            body: JSON.stringify({
                amount: 1000,
            }),
        } as unknown as APIGatewayProxyEvent);

        expect(result.statusCode).toBe(422);
        const body = JSON.parse(result.body);
        expect(body.error).toBe('Unprocessable Entity');
        expect(body.message).toBe('Validation failed');
    });

    it('Returns 422 when currency is not a valid 3-letter code', async () => {
        const result = await handler({
            body: JSON.stringify({
                amount: 1000,
                currency: 'US',
            }),
        } as unknown as APIGatewayProxyEvent);

        expect(result.statusCode).toBe(422);
        const body = JSON.parse(result.body);
        expect(body.error).toBe('Unprocessable Entity');
    });

    it('Returns 422 when currency is lowercase', async () => {
        const result = await handler({
            body: JSON.stringify({
                amount: 1000,
                currency: 'usd',
            }),
        } as unknown as APIGatewayProxyEvent);

        expect(result.statusCode).toBe(422);
        const body = JSON.parse(result.body);
        expect(body.error).toBe('Unprocessable Entity');
    });

    it('Returns 422 when amount is negative', async () => {
        const result = await handler({
            body: JSON.stringify({
                amount: -100,
                currency: 'USD',
            }),
        } as unknown as APIGatewayProxyEvent);

        expect(result.statusCode).toBe(422);
        const body = JSON.parse(result.body);
        expect(body.error).toBe('Unprocessable Entity');
    });

    it('Returns 422 when amount is not a number', async () => {
        const result = await handler({
            body: JSON.stringify({
                amount: 'invalid',
                currency: 'USD',
            }),
        } as unknown as APIGatewayProxyEvent);

        expect(result.statusCode).toBe(422);
        const body = JSON.parse(result.body);
        expect(body.error).toBe('Unprocessable Entity');
    });

    it('Returns 422 when body is empty', async () => {
        const result = await handler({
            body: '{}',
        } as unknown as APIGatewayProxyEvent);

        expect(result.statusCode).toBe(422);
        const body = JSON.parse(result.body);
        expect(body.error).toBe('Unprocessable Entity');
    });

    it('Returns 500 when an unexpected error occurs', async () => {
        jest.spyOn(payments, 'createPayment').mockRejectedValueOnce(new Error('Database connection failed'));

        const result = await handler({
            body: JSON.stringify({
                amount: 1000,
                currency: 'USD',
            }),
        } as unknown as APIGatewayProxyEvent);

        expect(result.statusCode).toBe(500);
        const body = JSON.parse(result.body);
        expect(body.error).toBe('Internal Server Error');
        expect(body.message).toBe('An unexpected error occurred while creating the payment');
    });
});

afterEach(() => {
    jest.resetAllMocks();
});
