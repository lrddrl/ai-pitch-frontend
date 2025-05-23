import getRawBody from 'raw-body';

export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Only POST method is allowed' });
  }

  const isDev = process.env.NODE_ENV === 'development';
  const targetBaseUrl = isDev
    ? 'http://192.168.1.234:8000'
    : 'http://3.21.31.199:8000';

  const fetch = (await import('node-fetch')).default;

  try {
    const bodyBuffer = await getRawBody(req);

    const response = await fetch(`${targetBaseUrl}/score`, {
      method: 'POST',
      headers: {
        'Content-Type': req.headers['content-type'],
        // Add other headers if necessary, for example authorization
      },
      body: bodyBuffer,
    });

    const data = await response.text();

    res.status(response.status).send(data);
  } catch (error) {
    console.error('[Proxy Error]', error);
    res.status(500).json({ error: 'Proxy failed to connect to backend.' });
  }
}
