import axios from 'axios';
import NodeCache from 'node-cache';
import { AuthResponse, StockPrice, StocksResponse } from '../types';

const BASE_URL = 'http://20.244.56.144/evaluation-service';
const cache = new NodeCache({ stdTTL: 300 }); // 5 minutes cache

class StockService {
  private token: string | null = null;
  private tokenExpiry: number = 0;

  constructor(
    private readonly clientId: string,
    private readonly clientSecret: string,
    private readonly email: string,
    private readonly name: string,
    private readonly rollNo: string,
    private readonly accessCode: string
  ) {}

  private async getAuthToken(): Promise<string> {
    try {
      // Check if we have a valid token
      if (this.token && Date.now() < this.tokenExpiry) {
        return this.token;
      }

      // Validate inputs
      if (!this.clientId || !this.clientSecret || !this.email || !this.name || !this.rollNo || !this.accessCode) {
        throw new Error('Missing authentication credentials. Check your environment variables.');
      }

      const response = await axios.post<AuthResponse>(`${BASE_URL}/auth`, {
        email: this.email,
        name: this.name,
        rollNo: this.rollNo,
        accessCode: this.accessCode,
        clientID: this.clientId,
        clientSecret: this.clientSecret,
      });

      this.token = response.data.access_token;
      this.tokenExpiry = Date.now() + (response.data.expires_in * 1000);
      return this.token;
    } catch (error) {
      console.error('Authentication error:', error);
      throw new Error('Failed to authenticate with the stock service. Check your credentials.');
    }
  }

  private async makeAuthorizedRequest<T>(url: string): Promise<T> {
    try {
      const token = await this.getAuthToken();
      const response = await axios.get<T>(url, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      return response.data;
    } catch (error) {
      console.error(`Error making request to ${url}:`, error);
      throw error;
    }
  }

  async getAllStocks(): Promise<StocksResponse> {
    try {
      const cacheKey = 'all_stocks';
      const cached = cache.get<StocksResponse>(cacheKey);
      if (cached) return cached;

      const stocks = await this.makeAuthorizedRequest<StocksResponse>(`${BASE_URL}/stocks`);
      cache.set(cacheKey, stocks);
      return stocks;
    } catch (error) {
      console.error('Error fetching all stocks:', error);
      throw error;
    }
  }

  async getStockPrices(ticker: string, minutes?: number): Promise<StockPrice[]> {
    try {
      if (!ticker) {
        throw new Error('Stock ticker is required');
      }
      
      const url = `${BASE_URL}/stocks/${ticker}${minutes ? `?minutes=${minutes}` : ''}`;
      const response = await this.makeAuthorizedRequest<StockPrice[] | { stock: StockPrice }>(url);
      
      if (Array.isArray(response)) {
        return response;
      } else if (response && response.stock) {
        return [response.stock];
      } else {
        throw new Error(`Invalid response format for ticker ${ticker}`);
      }
    } catch (error) {
      console.error(`Error fetching stock prices for ${ticker}:`, error);
      throw error;
    }
  }

  calculateCorrelation(prices1: StockPrice[], prices2: StockPrice[]): number {
    if (!prices1.length || !prices2.length) {
      return 0;
    }
    
    // Ensure we have equal length arrays
    const minLength = Math.min(prices1.length, prices2.length);
    const values1 = prices1.slice(0, minLength).map(p => p.price);
    const values2 = prices2.slice(0, minLength).map(p => p.price);
    
    if (minLength <= 1) {
      return 0; // Cannot calculate correlation with 1 or 0 data points
    }
    
    const mean1 = values1.reduce((a, b) => a + b, 0) / values1.length;
    const mean2 = values2.reduce((a, b) => a + b, 0) / values2.length;
    
    const variance1 = values1.reduce((a, b) => a + Math.pow(b - mean1, 2), 0) / (values1.length - 1) || 1; // Avoid division by zero
    const variance2 = values2.reduce((a, b) => a + Math.pow(b - mean2, 2), 0) / (values2.length - 1) || 1;
    
    const covariance = values1.map((_, i) => (values1[i] - mean1) * (values2[i] - mean2))
      .reduce((a, b) => a + b, 0) / (values1.length - 1);
    
    return covariance / Math.sqrt(variance1 * variance2);
  }

  calculateAveragePrice(prices: StockPrice[]): number {
    if (!prices.length) return 0;
    return prices.reduce((sum, p) => sum + p.price, 0) / prices.length;
  }
}

export default StockService; 