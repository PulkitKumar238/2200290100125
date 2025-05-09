import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import StockService from './services/stockService';

dotenv.config();

const app = express();
const port = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// Check if environment variables are set
const requiredEnvVars = [
  'CLIENT_ID', 
  'CLIENT_SECRET', 
  'EMAIL', 
  'NAME', 
  'ROLL_NO', 
  'ACCESS_CODE'
];

const missingEnvVars = requiredEnvVars.filter(varName => !process.env[varName]);
if (missingEnvVars.length > 0) {
  console.error(`Missing required environment variables: ${missingEnvVars.join(', ')}`);
  console.error('Please add these variables to your .env file');
}

const stockService = new StockService(
  process.env.CLIENT_ID || '',
  process.env.CLIENT_SECRET || '',
  process.env.EMAIL || '',
  process.env.NAME || '',
  process.env.ROLL_NO || '',
  process.env.ACCESS_CODE || ''
);

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok' });
});

app.get('/stocks/:ticker', async (req, res) => {
  try {
    const { ticker } = req.params;
    
    if (!ticker) {
      return res.status(400).json({ error: 'Ticker is required' });
    }
    
    const minutes = req.query.minutes ? parseInt(req.query.minutes as string) : undefined;
    
    // Validate minutes parameter if present
    if (minutes !== undefined && (isNaN(minutes) || minutes <= 0)) {
      return res.status(400).json({ error: 'Minutes parameter must be a positive number' });
    }
    
    const prices = await stockService.getStockPrices(ticker, minutes);
    
    if (!prices || prices.length === 0) {
      return res.status(404).json({ error: `No price data found for ticker: ${ticker}` });
    }
    
    const averagePrice = stockService.calculateAveragePrice(prices);

    res.json({
      averageStockPrice: averagePrice,
      priceHistory: prices
    });
  } catch (error: any) {
    console.error('Error fetching stock prices:', error);
    const statusCode = error.response?.status || 500;
    res.status(statusCode).json({ 
      error: 'Failed to fetch stock prices',
      message: error.message || 'Unknown error'
    });
  }
});

app.get('/stockcorrelation', async (req, res) => {
  try {
    // Handle various ways ticker parameters might be passed
    let tickerList: string[] = [];
    
    // Check if ticker is an array already
    if (Array.isArray(req.query.ticker)) {
      tickerList = req.query.ticker as string[];
    } 
    // Check if ticker params are passed as indexed properties (ticker[0], ticker[1])
    else if (req.query['ticker[0]'] && req.query['ticker[1]']) {
      tickerList = [req.query['ticker[0]'] as string, req.query['ticker[1]'] as string];
    }
    // Check if single ticker parameter is passed
    else if (req.query.ticker) {
      tickerList = [req.query.ticker as string];
    }
    
    console.log('Received ticker parameters:', req.query);
    console.log('Processed ticker list:', tickerList);
    
    if (tickerList.length !== 2) {
      return res.status(400).json({ 
        error: 'Exactly 2 tickers are required',
        received: tickerList,
        queryParams: req.query
      });
    }

    const minutes = req.query.minutes ? parseInt(req.query.minutes as string) : undefined;
    
    // Validate minutes parameter if present
    if (minutes !== undefined && (isNaN(minutes) || minutes <= 0)) {
      return res.status(400).json({ error: 'Minutes parameter must be a positive number' });
    }
    
    try {
      const [prices1, prices2] = await Promise.all([
        stockService.getStockPrices(tickerList[0], minutes),
        stockService.getStockPrices(tickerList[1], minutes)
      ]);

      if (!prices1.length || !prices2.length) {
        return res.status(404).json({ 
          error: 'Price data not found',
          message: `Could not retrieve price data for one or both tickers: ${tickerList.join(', ')}`
        });
      }

      const correlation = stockService.calculateCorrelation(prices1, prices2);

      res.json({
        correlation,
        stocks: {
          [tickerList[0]]: {
            averagePrice: stockService.calculateAveragePrice(prices1),
            priceHistory: prices1
          },
          [tickerList[1]]: {
            averagePrice: stockService.calculateAveragePrice(prices2),
            priceHistory: prices2
          }
        }
      });
    } catch (error: any) {
      console.error(`Error fetching prices for ${tickerList.join(', ')}:`, error);
      throw error;
    }
  } catch (error: any) {
    console.error('Error calculating correlation:', error);
    const statusCode = error.response?.status || 500;
    res.status(statusCode).json({ 
      error: 'Failed to calculate correlation',
      message: error.message || 'Unknown error'
    });
  }
});

app.get('/stocks', async (req, res) => {
  try {
    const stocks = await stockService.getAllStocks();
    if (!stocks || !stocks.stocks || Object.keys(stocks.stocks).length === 0) {
      return res.status(404).json({ error: 'No stocks found' });
    }
    res.json(stocks);
  } catch (error: any) {
    console.error('Error fetching stocks:', error);
    const statusCode = error.response?.status || 500;
    res.status(statusCode).json({ 
      error: 'Failed to fetch stocks',
      message: error.message || 'Unknown error'
    });
  }
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
  console.log(`Health check available at http://localhost:${port}/health`);
}); 