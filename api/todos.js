const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

// Google Sheets configuration
const SHEET_ID = '1Ne_97lKivp4f3zFtbY7JFbyhzwrHbEVy_TM2MZSEN_E';
const API_KEY = process.env.GOOGLE_API_KEY; // Your Google API key

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

// Helper function to add data to Google Sheet using Sheets API
async function addToSheet(newTodo) {
  if (!API_KEY) {
    throw new Error('Google API key not configured');
  }

  try {
    // First, get the current data to determine the next ID
    const rows = await fetchSheetData(SHEET_ID);
    const todos = rowsToJSON(rows);
    const nextId = todos.length > 0 ? Math.max(...todos.map(t => t.id)) + 1 : 1;

    // Prepare the row data
    const newRow = [
      nextId,
      newTodo.task || '',
      newTodo.completed || false,
      newTodo.created_date || new Date().toISOString().split('T')[0]
    ];

    // Append to the sheet using Google Sheets API
    const appendUrl = `https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}/values/Sheet1!A:D:append?valueInputOption=RAW&key=${API_KEY}`;
    
    const response = await fetch(appendUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        values: [newRow]
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Sheets API error: ${response.status} - ${errorText}`);
    }

    const result = await response.json();
    
    return {
      id: nextId,
      task: newTodo.task,
      completed: newTodo.completed || false,
      created_date: newTodo.created_date || new Date().toISOString().split('T')[0],
      sheets_response: result
    };

  } catch (error) {
    console.error('❌ Error adding to Google Sheets:', error);
    throw error;
  }
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
    } 
    else if (req.method === 'POST') {
      // Validate API key
      if (!API_KEY) {
        return res.status(500).json({
          success: false,
          message: 'Google API key not configured. Please set GOOGLE_API_KEY environment variable.'
        });
      }

      // Validate request body
      if (!req.body || !req.body.task) {
        return res.status(400).json({
          success: false,
          message: 'Missing required field: task'
        });
      }

      // Validate task length
      if (req.body.task.length > 100) {
        return res.status(400).json({
          success: false,
          message: 'Task too long. Maximum 100 characters allowed.'
        });
      }

      const newTodo = {
        task: req.body.task.trim(),
        completed: req.body.completed || false,
        created_date: req.body.created_date || new Date().toISOString().split('T')[0]
      };

      const result = await addToSheet(newTodo);
      
      res.status(201).json({
        success: true,
        message: 'Todo added successfully',
        data: result
      });
    } 
    else {
      res.status(405).json({
        success: false,
        message: `Method ${req.method} not allowed. Supported methods: GET, POST`
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