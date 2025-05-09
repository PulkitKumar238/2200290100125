import axios, { AxiosError } from 'axios';
import { StockData, StockCorrelation, StocksResponse, ApiError } from '../types';

const API_BASE_URL = 'http://localhost:3001';

// Create an axios instance with default configuration
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000, // Increase timeout to 15 seconds
  headers: {
    'Content-Type': 'application/json'
  }
});

// Error handler helper function
const handleApiError = (error: any): never => {
  if (axios.isAxiosError(error)) {
    const axiosError = error as AxiosError<ApiError>;
    const errorMessage = axiosError.response?.data?.message || axiosError.message;
    throw new Error(errorMessage);
  }
  throw error;
};

export const api = {
  async getStocks(): Promise<StocksResponse> {
    try {
      const response = await apiClient.get('/stocks');
      return response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  },

  async getStockData(ticker: string, minutes?: number): Promise<StockData> {
    try {
      // Validate input
      if (!ticker) {
        throw new Error('Stock ticker is required');
      }
      
      const response = await apiClient.get(`/stocks/${ticker}`, {
        params: { minutes }
      });
      return response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  },

  async getStockCorrelation(ticker1: string, ticker2: string, minutes?: number): Promise<StockCorrelation> {
    try {
      // Validate inputs
      if (!ticker1 || !ticker2) {
        throw new Error('Both stock tickers are required');
      }
      
      // Use an alternative approach to ensure the backend receives ticker parameters correctly
      // Instead of passing an array which might be serialized differently by axios
      const params: Record<string, string | number | undefined> = { 
        'ticker[0]': ticker1,
        'ticker[1]': ticker2
      };
      
      if (minutes !== undefined) {
        params.minutes = minutes;
      }
      
      const response = await apiClient.get('/stockcorrelation', { params });
      return response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  },
  
  // Health check for the backend
  async checkHealth(): Promise<boolean> {
    try {
      const response = await apiClient.get('/health');
      return response.status === 200;
    } catch (error) {
      console.error('Backend health check failed:', error);
      return false;
    }
  }
}; 