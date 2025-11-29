import {
  SecretsManagerClient,
  GetSecretValueCommand,
} from '@aws-sdk/client-secrets-manager';
import * as jwt from 'jsonwebtoken';

const secretsClient = new SecretsManagerClient({});
const jwtSecretArn = process.env.JWT_SECRET_ARN;
let cachedJwtSecret: string | undefined =
  process.env.JWT_SECRET || 'dev_jwt_secret';

async function loadJwtSecret() {
  if (
    jwtSecretArn &&
    (!cachedJwtSecret || cachedJwtSecret === 'dev_jwt_secret')
  ) {
    try {
      const sec = await secretsClient.send(
        new GetSecretValueCommand({ SecretId: jwtSecretArn })
      );
      if (sec.SecretString) {
        try {
          const parsed = JSON.parse(sec.SecretString);
          cachedJwtSecret = parsed.jwt || sec.SecretString;
        } catch (e) {
          cachedJwtSecret = sec.SecretString;
        }
      }
    } catch (err) {
      console.error('Failed to load JWT secret', err);
    }
  }
}

function parseCookies(cookieHeader?: string) {
  const out: Record<string, string> = {};
  if (!cookieHeader) return out;
  cookieHeader.split(';').forEach((c) => {
    const [k, ...v] = c.split('=');
    out[k.trim()] = decodeURIComponent((v || []).join('=').trim());
  });
  return out;
}

export const handler = async (event: { headers?: Record<string, string> }) => {
  await loadJwtSecret();

  const headers = event.headers || {};
  const cookies = parseCookies(headers.cookie || headers.Cookie);
  const token = cookies['auth_token'] || null;

  if (!token) {
    return {
      statusCode: 401,
      body: 'Missing auth_token',
      headers: {
        'Access-Control-Allow-Origin': process.env.FRONTEND_ORIGIN || '*',
        'Access-Control-Allow-Credentials': 'true',
      },
    };
  }

  try {
    const payload = jwt.verify(token, cachedJwtSecret as string) as any;
    return {
      statusCode: 200,
      body: JSON.stringify({ sub: payload.sub }),
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': process.env.FRONTEND_ORIGIN || '*',
        'Access-Control-Allow-Credentials': 'true',
      },
    };
  } catch (err) {
    console.error('Invalid token', err);
    return {
      statusCode: 401,
      body: 'Invalid token',
      headers: {
        'Access-Control-Allow-Origin': process.env.FRONTEND_ORIGIN || '*',
        'Access-Control-Allow-Credentials': 'true',
      },
    };
  }
};
