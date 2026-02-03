import { DocumentClient } from './dynamodb';
import { GetCommand, PutCommand, ScanCommand } from '@aws-sdk/lib-dynamodb';

export const getPayment = async (paymentId: string): Promise<Payment | null> => {
    const result = await DocumentClient.send(
        new GetCommand({
            TableName: 'Payments',
            Key: { paymentId },
        })
    );

    return (result.Item as Payment) || null;
};

export interface ListPaymentsOptions {
    currency?: string;
}

export const listPayments = async (options: ListPaymentsOptions = {}): Promise<Payment[]> => {
    const { currency } = options;

    const scanParams: {
        TableName: string;
        FilterExpression?: string;
        ExpressionAttributeValues?: Record<string, string>;
    } = {
        TableName: 'Payments',
    };

    if (currency) {
        scanParams.FilterExpression = 'currency = :currency';
        scanParams.ExpressionAttributeValues = { ':currency': currency };
    }

    const result = await DocumentClient.send(new ScanCommand(scanParams));

    return (result.Items as Payment[]) || [];
};

export const createPayment = async (payment: Payment) => {
    await DocumentClient.send(
        new PutCommand({
            TableName: 'Payments',
            Item: payment,
        })
    );
};

export type Payment = {
    id: string;
    amount: number;
    currency: string;
};
