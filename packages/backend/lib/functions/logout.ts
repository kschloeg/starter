export const handler = async (event: {
  headers?: Record<string, string>;
  body?: string;
}) => {
  // Clear the auth_token cookie by setting an expired cookie
  const cookie = `auth_token=; Max-Age=0; Path=/; HttpOnly; Secure; SameSite=None`;
  const requestOrigin =
    (event.headers && (event.headers.Origin || event.headers.origin)) ||
    process.env.FRONTEND_ORIGIN ||
    '*';

  return {
    statusCode: 200,
    headers: {
      'Set-Cookie': cookie,
      'Access-Control-Allow-Origin': requestOrigin,
      'Access-Control-Allow-Credentials': 'true',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ message: 'signed out' }),
  };
};
