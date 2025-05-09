# Stock Price Analytics System

A full-stack application for real-time stock price analysis and correlation visualization.

## Features

- Real-time stock price tracking with interactive charts
- Stock price correlation analysis with heatmap visualization
- Responsive design for both desktop and mobile views
- Material UI components for modern UI/UX
- Efficient caching and API request optimization

## Project Structure

```
.
├── backend/
│   ├── src/
│   │   ├── index.ts
│   │   ├── services/
│   │   │   └── stockService.ts
│   │   └── types/
│   │       └── index.ts
│   ├── package.json
│   └── tsconfig.json
└── frontend/
    ├── src/
    │   ├── components/
    │   │   ├── StockChart.tsx
    │   │   └── CorrelationHeatmap.tsx
    │   ├── services/
    │   │   └── api.ts
    │   ├── types/
    │   │   └── index.ts
    │   └── App.tsx
    ├── package.json
    └── tsconfig.json
```

## Setup Instructions

1. Clone the repository
2. Set up the backend:

   ```bash
   cd backend
   npm install
   # Create a .env file with your credentials:
   # PORT=3001
   # CLIENT_ID=your_client_id
   # CLIENT_SECRET=your_client_secret
   # EMAIL=your_email
   # NAME=your_name
   # ROLL_NO=your_roll_no
   # ACCESS_CODE=your_access_code
   npm run dev
   ```

3. Set up the frontend:

   ```bash
   cd frontend
   npm install
   npm start
   ```

4. Access the application:
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:3001

## API Endpoints

### Backend API

1. Get Stock Price and Average

   - GET `/stocks/:ticker?minutes=m`
   - Returns stock price history and average price

2. Get Stock Correlation

   - GET `/stockcorrelation?minutes=m&ticker=STOCK1&ticker=STOCK2`
   - Returns correlation between two stocks and their statistics

3. Get All Stocks
   - GET `/stocks`
   - Returns list of available stocks

## Technologies Used

- Backend:

  - Node.js with Express
  - TypeScript
  - Axios for API requests
  - Node-Cache for caching

- Frontend:
  - React with TypeScript
  - Material UI for components
  - Recharts for data visualization
  - Axios for API requests

## Best Practices Implemented

1. Code Organization:

   - Clear folder structure
   - Separation of concerns
   - Type definitions
   - Reusable components

2. Performance:

   - API response caching
   - Efficient data structures
   - Optimized API calls
   - Responsive design

3. Error Handling:

   - Proper error messages
   - Fallback UI states
   - API error handling

4. Security:
   - Environment variables for sensitive data
   - CORS configuration
   - Input validation
  
# Screenshots

![image](https://github.com/user-attachments/assets/6cc3044d-4ae6-4709-8ed7-852831177e1d)
![image](https://github.com/user-attachments/assets/291d7e7c-87df-49bd-8dc7-547f720fa7d8)
![Screenshot 2025-05-09 194904](https://github.com/user-attachments/assets/23b421eb-b6a7-4bf4-b798-14820da1426e)


## Notes

- The application requires valid API credentials from the test server
- All API calls are made through the backend to optimize requests and implement caching
- The frontend is designed to be responsive and work on both desktop and mobile devices
