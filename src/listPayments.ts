import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { buildResponse } from './lib/apigateway';
import { listPayments } from './lib/payments';
import { ListPaymentsQuerySchema, formatZodErrors } from './lib/schemas';

export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
    try {
        const queryParams = event.queryStringParameters || {};

        const result = ListPaymentsQuerySchema.safeParse(queryParams);

        if (!result.success) {
            const validationErrors = formatZodErrors(result.error);
            console.warn('List payments query validation failed:', validationErrors);
            return buildResponse(400, {
                error: 'Bad Request',
                message: 'Invalid query parameters',
                details: validationErrors,
            });
        }

        const { currency, limit, skip } = result.data;

        const { items, total } = await listPayments({ currency, limit, skip });

        return buildResponse(200, { data: items, total, limit, skip });
    } catch (error) {
        console.error('Error listing payments:', error);
        return buildResponse(500, {
            error: 'Internal Server Error',
            message: 'An unexpected error occurred while listing payments',
        });
    }
};
