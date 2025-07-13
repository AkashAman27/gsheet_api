export default async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }
  
  if (req.method === 'GET') {
    res.status(200).json({
      success: true,
      message: 'Google Sheets API Server is running',
      timestamp: new Date().toISOString(),
      endpoints: [
        'GET /api/todos - Get all todos from sheet',
        'GET /api/health - This endpoint'
      ],
      deployed_on: 'Vercel',
      version: '1.0.0'
    });
  } else {
    res.status(405).json({
      success: false,
      message: 'Method not allowed'
    });
  }
}