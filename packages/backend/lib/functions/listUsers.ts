import { DynamoDBClient, QueryCommand } from '@aws-sdk/client-dynamodb';

const client = new DynamoDBClient({});

export const handler = async (event?: {
  headers?: Record<string, string>;
}): Promise<{
  statusCode: number;
  body: string;
  headers: Record<string, string>;
}> => {
  const tableName = process.env.TABLE_NAME;

  if (!tableName) {
    throw new Error('Missing TABLE_NAME');
  }

  const requestOrigin =
    (event && (event.headers?.Origin || event.headers?.origin)) ||
    process.env.FRONTEND_ORIGIN ||
    '*';

  function corsHeaders(contentType = 'application/json') {
    return {
      'Content-Type': contentType,
      'Access-Control-Allow-Origin': requestOrigin,
      'Access-Control-Allow-Credentials': 'true',
    } as Record<string, string>;
  }

  const { Items } = await client.send(
    new QueryCommand({
      TableName: tableName,
      KeyConditions: {
        PK: {
          ComparisonOperator: 'EQ',
          AttributeValueList: [{ S: 'USER' }],
        },
      },
    })
  );

  const results = (Items || []).map((item) => ({
    email: item.SK?.S ?? '',
    firstName: item.firstName?.S ?? '',
    lastName: item.lastName?.S ?? '',
    phone: item.phone?.S ?? '',
  }));

  return {
    statusCode: 200,
    body: JSON.stringify(results),
    headers: corsHeaders('application/json'),
  };
};
