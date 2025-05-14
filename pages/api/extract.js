export const config = {
    api: {
      bodyParser: false, // Disable default body parsing to support file uploads (e.g., multipart/form-data)
    },
  };
  
  export default async function handler(req, res) {
    if (req.method !== 'POST') {
      // Only allow POST requests
      return res.status(405).json({ error: 'Only POST method is allowed' });
    }
  
    // Determine whether we are in development or production
    const isDev = process.env.NODE_ENV === 'development';
  
    // Set the backend API base URL depending on environment
    const targetBaseUrl = isDev
    ? 'http://192.168.1.234:8000' // Your real LAN IP
    : 'http://3.145.47.251:8000';

    console.log('[Forwarding request to]:', `${targetBaseUrl}/extract`);
  
    // Dynamically import node-fetch for server-side HTTP request
    const fetch = (await import('node-fetch')).default;
  
    try {
      // Forward the request to your backend API
      const response = await fetch(`${targetBaseUrl}/extract`, {
        method: 'POST',
        headers: {
          'Content-Type': req.headers['content-type'],
        },
        body: req, // Stream the request body directly (works for file uploads)
      });
  
      const data = await response.text();
      res.status(response.status).send(data);
    } catch (err) {
      console.error('[Proxy Error]', err);
      res.status(500).json({ error: 'Proxy failed to connect to backend.' });
    }
  }
  