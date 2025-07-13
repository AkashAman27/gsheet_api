export default async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }
  
  res.status(200).json({
    success: true,
    message: 'Welcome to Google Sheets API',
    description: 'A REST API that connects to Google Sheets and provides real-time data access',
    endpoints: {
      health: '/api/health',
      todos: '/api/todos'
    },
    documentation: 'https://github.com/AkashAman27/gsheet_api',
    version: '1.0.0',
    deployed_on: 'Vercel'
  });
}