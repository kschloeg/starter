import { DynamoDBClient, UpdateItemCommand } from '@aws-sdk/client-dynamodb';
import { getSubjectFromHeaders } from './auth';

const client = new DynamoDBClient({});

export const handler = async (event: {
  body: string;
  headers?: Record<string, string>;
}) => {
  const tableName = process.env.TABLE_NAME;
  if (!tableName) throw new Error('Missing TABLE_NAME');

  let payload: {
    email?: string;
    firstName?: string;
    lastName?: string;
    phone?: string;
  } = {};
  try {
    payload = JSON.parse(event.body);
  } catch (err) {
    return { statusCode: 400, body: 'Invalid JSON' };
  }

  if (!payload.email) return { statusCode: 400, body: 'Missing email' };

  const subject = await getSubjectFromHeaders(event.headers);
  if (!subject) return { statusCode: 401, body: 'Unauthorized' };

  if (subject !== payload.email) return { statusCode: 403, body: 'Forbidden' };

  // perform update
  const attrs: any = {};
  const expr: string[] = [];
  const values: any = {};
  if (payload.firstName) {
    expr.push('firstName = :fn');
    values[':fn'] = { S: payload.firstName };
  }
  if (payload.lastName) {
    expr.push('lastName = :ln');
    values[':ln'] = { S: payload.lastName };
  }
  if (payload.phone) {
    expr.push('phone = :ph');
    values[':ph'] = { S: payload.phone };
  }

  if (expr.length === 0)
    return { statusCode: 400, body: 'No updates provided' };

  const updateExpr = 'SET ' + expr.join(', ');

  try {
    await client.send(
      new UpdateItemCommand({
        TableName: tableName,
        Key: { PK: { S: 'USER' }, SK: { S: payload.email } },
        UpdateExpression: updateExpr,
        ExpressionAttributeValues: values,
      })
    );
    return {
      statusCode: 200,
      body: 'Updated',
      headers: {
        'Access-Control-Allow-Origin': process.env.FRONTEND_ORIGIN || '*',
        'Access-Control-Allow-Credentials': 'true',
      },
    };
  } catch (err) {
    console.error('updateUser error', err);
    return { statusCode: 500, body: 'Internal server error' };
  }
};
