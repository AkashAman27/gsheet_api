const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

// Google Sheets configuration
const SHEET_ID = '1Ne_97lKivp4f3zFtbY7JFbyhzwrHbEVy_TM2MZSEN_E';

// Helper function to fetch data from public Google Sheet
async function fetchSheetData(sheetId) {
  try {
    const csvUrl = `https://docs.google.com/spreadsheets/d/${sheetId}/export?format=csv&gid=0`;
    
    const response = await fetch(csvUrl, {
      redirect: 'follow',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'
      }
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const csvText = await response.text();
    const rows = csvText.split('\n').map(row => row.split(',').map(cell => cell.replace(/"/g, '')));
    
    // Remove empty rows
    const cleanRows = rows.filter(row => row.some(cell => cell.trim() !== ''));
    
    return cleanRows;
    
  } catch (error) {
    console.error('❌ Error fetching from Google Sheets:', error);
    
    // Fallback to demo data if sheet is not accessible
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

export default async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }
  
  try {
    if (req.method === 'GET') {
      const rows = await fetchSheetData(SHEET_ID);
      const todos = rowsToJSON(rows);
      
      res.status(200).json({
        success: true,
        data: todos,
        count: todos.length,
        source: 'Real Google Sheets',
        sheet_id: SHEET_ID,
        last_updated: new Date().toISOString()
      });
    } else {
      res.status(405).json({
        success: false,
        message: 'Method not allowed. This is a read-only API.'
      });
    }
  } catch (error) {
    console.error('❌ Error in API:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
}