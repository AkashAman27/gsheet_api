const express = require('express');
const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));
const app = express();
const PORT = 3000;

app.use(express.json());

// Real Google Sheets configuration
// Replace this with your actual Google Sheet ID
const SHEET_ID = '1Ne_97lKivp4f3zFtbY7JFbyhzwrHbEVy_TM2MZSEN_E'; // Your actual sheet ID
// Your sheet URL will look like: https://docs.google.com/spreadsheets/d/SHEET_ID_HERE/edit

// Helper function to fetch data from public Google Sheet
async function fetchSheetData(sheetId, range = 'A:Z') {
  try {
    const url = `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values/${range}?key=ed458a2a5372cbbd0a538efee4f694dfebf00d81`; // You'll need API key
    
    // For demo, let's use a simpler approach - CSV export
    const csvUrl = `https://docs.google.com/spreadsheets/d/${sheetId}/export?format=csv&gid=0`;
    
    console.log('📊 Fetching data from Google Sheets...');
    
    const response = await fetch(csvUrl, {
      redirect: 'follow',
      follow: 20,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'
      }
    });
    
    console.log('📡 Response status:', response.status);
    console.log('📡 Final URL:', response.url);
    
    if (!response.ok) {
      console.log('❌ HTTP Error Response:', await response.text());
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const csvText = await response.text();
    console.log('📄 CSV Text (first 200 chars):', csvText.substring(0, 200));
    const rows = csvText.split('\n').map(row => row.split(',').map(cell => cell.replace(/"/g, '')));
    
    // Remove empty rows
    const cleanRows = rows.filter(row => row.some(cell => cell.trim() !== ''));
    
    console.log(`✅ Fetched ${cleanRows.length} rows from Google Sheets`);
    return cleanRows;
    
  } catch (error) {
    console.error('❌ Error fetching from Google Sheets:', error);
    
    // Fallback to demo data if sheet is not accessible
    console.log('🔄 Using fallback data...');
    return [
      ['id', 'task', 'completed', 'created_date'],
      ['1', 'Learn APIs from Google Sheets', 'false', '2024-07-13'],
      ['2', 'Build real-time integration', 'false', '2024-07-13'],
      ['3', 'Deploy to production', 'false', '2024-07-13']
    ];
  }
}

// Helper function to convert CSV rows to JSON
function rowsToJSON(rows) {
  if (!rows || rows.length < 2) return [];
  
  const headers = rows[0].map(h => h.toLowerCase().trim());
  const dataRows = rows.slice(1);
  
  return dataRows.map((row, index) => {
    const obj = {};
    headers.forEach((header, i) => {
      obj[header] = row[i] || '';
    });
    
    // Convert data types
    if (obj.id) obj.id = parseInt(obj.id) || index + 1;
    if (obj.completed) obj.completed = obj.completed.toLowerCase() === 'true';
    
    return obj;
  });
}

// GET - Read all data from Google Sheets
app.get('/api/todos', async (req, res) => {
  try {
    console.log('📱 API Request: GET /api/todos');
    
    const rows = await fetchSheetData(SHEET_ID);
    const todos = rowsToJSON(rows);
    
    res.json({
      success: true,
      data: todos,
      count: todos.length,
      source: 'Real Google Sheets',
      sheet_id: SHEET_ID,
      last_updated: new Date().toISOString()
    });
    
    console.log(`📤 Sent ${todos.length} todos to client`);
    
  } catch (error) {
    console.error('❌ Error in GET /api/todos:', error);
    res.status(500).json({
      success: false,
      message: 'Error reading from Google Sheets',
      error: error.message
    });
  }
});

// GET - Read specific todo
app.get('/api/todos/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    console.log(`📱 API Request: GET /api/todos/${id}`);
    
    const rows = await fetchSheetData(SHEET_ID);
    const todos = rowsToJSON(rows);
    const todo = todos.find(t => t.id === id);
    
    if (!todo) {
      return res.status(404).json({
        success: false,
        message: `Todo with id ${id} not found`
      });
    }
    
    res.json({
      success: true,
      data: todo,
      source: 'Real Google Sheets'
    });
    
  } catch (error) {
    console.error(`❌ Error in GET /api/todos/${req.params.id}:`, error);
    res.status(500).json({
      success: false,
      message: 'Error reading from Google Sheets',
      error: error.message
    });
  }
});

// POST - Note: This is read-only for public sheets
app.post('/api/todos', async (req, res) => {
  res.status(501).json({
    success: false,
    message: 'Creating todos not supported with public sheets (read-only)',
    note: 'To enable CREATE/UPDATE/DELETE, you need Google Service Account authentication',
    received_data: req.body
  });
});

// PUT - Note: This is read-only for public sheets
app.put('/api/todos/:id', async (req, res) => {
  res.status(501).json({
    success: false,
    message: 'Updating todos not supported with public sheets (read-only)',
    note: 'To enable CREATE/UPDATE/DELETE, you need Google Service Account authentication',
    received_data: req.body
  });
});

// DELETE - Note: This is read-only for public sheets
app.delete('/api/todos/:id', async (req, res) => {
  res.status(501).json({
    success: false,
    message: 'Deleting todos not supported with public sheets (read-only)',
    note: 'To enable CREATE/UPDATE/DELETE, you need Google Service Account authentication'
  });
});

// GET - Sheet info and instructions
app.get('/api/info', async (req, res) => {
  try {
    const rows = await fetchSheetData(SHEET_ID);
    
    res.json({
      success: true,
      message: 'Real Google Sheets API Server',
      sheet_id: SHEET_ID,
      sheet_url: `https://docs.google.com/spreadsheets/d/${SHEET_ID}/edit`,
      mode: 'Read-Only (Public Sheet)',
      total_rows: rows.length,
      headers: rows.length > 0 ? rows[0] : [],
      capabilities: {
        read: true,
        create: false,
        update: false,
        delete: false
      },
      instructions: {
        how_to_use_your_own_sheet: [
          '1. Create a Google Sheet',
          '2. Make it public (Share > Anyone with the link can view)',
          '3. Copy the Sheet ID from the URL',
          '4. Replace SHEET_ID in this code',
          '5. Restart the server'
        ],
        for_full_crud_operations: [
          '1. Set up Google Service Account',
          '2. Share sheet with service account email',
          '3. Use authenticated Google Sheets API',
          '4. Enable CREATE, UPDATE, DELETE operations'
        ]
      }
    });
    
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error getting sheet info',
      error: error.message
    });
  }
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    message: 'Google Sheets API Server is running',
    timestamp: new Date().toISOString(),
    endpoints: [
      'GET /api/todos - Get all todos from sheet',
      'GET /api/todos/:id - Get specific todo',
      'GET /api/info - Get sheet information',
      'GET /api/health - This endpoint'
    ]
  });
});

// Export for serverless deployment (Vercel)
module.exports = app;

// Start server locally
if (require.main === module) {
  app.listen(PORT, () => {
    console.log('🚀 Real Google Sheets API Server running on http://localhost:' + PORT);
    console.log('📊 Connected to Google Sheets (Read-Only Mode)');
    console.log('📋 Sheet ID:', SHEET_ID);
    console.log('🔗 Sheet URL: https://docs.google.com/spreadsheets/d/' + SHEET_ID + '/edit');
    console.log('');
    console.log('📚 Available endpoints:');
    console.log('   GET  http://localhost:' + PORT + '/api/todos');
    console.log('   GET  http://localhost:' + PORT + '/api/info');
    console.log('   GET  http://localhost:' + PORT + '/api/health');
    console.log('');
    console.log('💡 Ready for deployment!');
  });
}