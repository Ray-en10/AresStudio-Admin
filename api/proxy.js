const FORWARDED_HEADERS = ['accept', 'content-type', 'cookie', 'x-xsrf-token'];

module.exports = async function handler(request, response) {
  const backendUrl = process.env.BACKEND_URL?.replace(/\/+$/, '');
  if (!backendUrl) {
    return response.status(503).json({ message: 'BACKEND_URL is not configured.' });
  }

  const incomingUrl = new URL(request.url, `https://${request.headers.host}`);
  const path = incomingUrl.searchParams.get('path') ?? '';
    incomingUrl.searchParams.delete('path');
  const upstreamUrl = `${backendUrl}/api/${path}${incomingUrl.search}`;
  const headers = new Headers();
  for (const name of FORWARDED_HEADERS) {
    const value = request.headers[name];
    if (typeof value === 'string') headers.set(name, value);
  }

  let body;
  if (!['GET', 'HEAD'].includes(request.method || 'GET') && request.body !== undefined) {
    body = typeof request.body === 'string' ? request.body : JSON.stringify(request.body);
  }

  try {
    const upstream = await fetch(upstreamUrl, {
      method: request.method,
      headers,
      body,
      redirect: 'manual',
    });

    response.status(upstream.status);
    const contentType = upstream.headers.get('content-type');
    if (contentType) response.setHeader('Content-Type', contentType);

    const cookies = upstream.headers.getSetCookie?.();
    if (cookies?.length) response.setHeader('Set-Cookie', cookies);

    if (upstream.status === 204 || upstream.status === 304) return response.end();
    return response.send(Buffer.from(await upstream.arrayBuffer()));
  } catch {
    return response.status(502).json({ message: 'The backend service is unavailable.' });
  }
};
