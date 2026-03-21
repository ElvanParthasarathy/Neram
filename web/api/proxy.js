const https = require('https');

export default function handler(req, res) {
  const { url } = req.query;

  if (!url) {
    return res.status(400).send('URL parameter is required');
  }

  // Set CORS headers
  res.setHeader('Access-Control-Allow-Credentials', true)
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT')
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  )

  if (req.method === 'OPTIONS') {
    res.status(200).end()
    return
  }

  // Use HTTPS module directly with rejectUnauthorized: false to completely ignore SSL chain validation failures
  https.get(decodeURIComponent(url), { rejectUnauthorized: false }, (response) => {
    let data = '';
    
    response.on('data', (chunk) => {
      data += chunk;
    });
    
    response.on('end', () => {
      res.status(200).send(data);
    });
  }).on('error', (e) => {
    res.status(500).send(e.message);
  });
}
