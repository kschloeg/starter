import { SNSClient, PublishCommand } from '@aws-sdk/client-sns';
import {
  DynamoDBClient,
  PutItemCommand,
  GetItemCommand,
} from '@aws-sdk/client-dynamodb';
import {
  SecretsManagerClient,
  GetSecretValueCommand,
} from '@aws-sdk/client-secrets-manager';
import * as crypto from 'crypto';

const sns = new SNSClient({});
const ddb = new DynamoDBClient({});

const OTP_TTL_SECONDS = 5 * 60; // 5 minutes
const OTP_LENGTH = 6;

const tableName = process.env.TABLE_NAME_OTPS;
const otpSecretArn = process.env.OTP_SECRET_ARN;
const secretsClient = new SecretsManagerClient({});
let cachedOtpSecret: string | undefined = process.env.OTP_SECRET;
const snsSenderId = process.env.SNS_SENDER_ID || 'Auth';

function generateOtp() {
  let otp = '';
  for (let i = 0; i < OTP_LENGTH; i++) {
    otp += Math.floor(Math.random() * 10).toString();
  }
  return otp;
}

function hashOtp(otp: string) {
  if (!cachedOtpSecret) throw new Error('Missing OTP_SECRET');
  return crypto.createHmac('sha256', cachedOtpSecret).update(otp).digest('hex');
}

function normalizePhone(phone: string) {
  // naive normalization: remove spaces and dots
  return phone.replace(/[^+0-9]/g, '');
}

export const handler = async (event: { body: string }) => {
  if (!tableName) throw new Error('Missing TABLE_NAME_OTPS');

  let body: { phone?: string } = {};
  try {
    body = JSON.parse(event.body);
  } catch (err) {
    return { statusCode: 400, body: 'Invalid JSON' };
  }

  if (!body.phone) {
    return { statusCode: 400, body: 'Missing phone' };
  }

  const phone = normalizePhone(body.phone);

  // rate limit: check if an OTP exists and is recent
  try {
    const get = await ddb.send(
      new GetItemCommand({
        TableName: tableName,
        Key: { PK: { S: `PHONE#${phone}` }, SK: { S: 'OTP' } },
      })
    );

    if (get.Item && get.Item.expiresAt && get.Item.createdAt) {
      const createdAt = parseInt(get.Item.createdAt.N || '0', 10);
      const now = Math.floor(Date.now() / 1000);
      if (now - createdAt < 60) {
        return { statusCode: 429, body: 'Too many requests' };
      }
    }
  } catch (err) {
    console.error('Error checking existing OTP', err);
  }

  const otp = generateOtp();
  // load secret if ARN provided and not cached
  if (otpSecretArn && !cachedOtpSecret) {
    try {
      const sec = await secretsClient.send(
        new GetSecretValueCommand({ SecretId: otpSecretArn })
      );
      if (sec.SecretString) {
        try {
          const parsed = JSON.parse(sec.SecretString);
          cachedOtpSecret = parsed.otp || sec.SecretString;
        } catch (e) {
          cachedOtpSecret = sec.SecretString;
        }
      }
    } catch (err) {
      console.error('Failed to load OTP secret', err);
    }
  }

  const otpHash = hashOtp(otp);
  const now = Math.floor(Date.now() / 1000);
  const expiresAt = now + OTP_TTL_SECONDS;

  try {
    await ddb.send(
      new PutItemCommand({
        TableName: tableName,
        Item: {
          PK: { S: `PHONE#${phone}` },
          SK: { S: 'OTP' },
          otpHash: { S: otpHash },
          attempts: { N: '0' },
          createdAt: { N: now.toString() },
          expiresAt: { N: expiresAt.toString() },
        },
      })
    );

    // send SMS
    const msg = `Your login code is: ${otp}`;
    try {
      const publishRes = await sns.send(
        new PublishCommand({
          PhoneNumber: phone,
          Message: msg,
          MessageAttributes: {
            'AWS.SNS.SMS.SenderID': {
              DataType: 'String',
              StringValue: snsSenderId,
            },
          },
        })
      );
      // mask OTP in logs
      const masked = otp.replace(/.(?=.{2})/g, '*');
      console.info('Sent OTP', {
        phone,
        otp: masked,
        messageId: publishRes.MessageId,
      });
    } catch (err) {
      console.error('SNS publish failed', err);
      throw err;
    }

    return {
      statusCode: 200,
      body: JSON.stringify({ status: 'ok' }),
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json',
      },
    };
  } catch (err) {
    console.error('Error creating OTP', err);
    return { statusCode: 500, body: 'Internal server error' };
  }
};
