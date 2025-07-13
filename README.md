# Google Sheets API Server

A REST API that connects to Google Sheets and provides CRUD operations.

## Features

- ✅ Read data from Google Sheets in real-time
- ✅ RESTful API endpoints
- ✅ JSON responses with error handling
- ✅ Serverless deployment ready

## API Endpoints

- `GET /api/todos` - Get all records from Google Sheet
- `GET /api/todos/:id` - Get specific record by ID
- `GET /api/info` - Get sheet information and API details
- `GET /api/health` - Health check endpoint

## Live Demo

The API is deployed and accessible at: [Your Vercel URL will be here]

## Example Response

```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "task": "Learn APIs",
      "completed": false,
      "created_date": "2024-07-13"
    }
  ],
  "count": 1,
  "source": "Real Google Sheets",
  "last_updated": "2025-07-13T15:36:32.882Z"
}
```

## How to Use

1. Call any endpoint: `curl https://your-api-url.vercel.app/api/todos`
2. Get real-time data from the connected Google Sheet
3. Integrate with your applications, automation tools, or workflows

Built with Node.js, Express, and deployed on Vercel.