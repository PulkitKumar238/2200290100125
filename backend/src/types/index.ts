export interface StockPrice {
  price: number;
  lastUpdatedAt: string;
}

export interface StockResponse {
  stock: StockPrice;
}

export interface StocksResponse {
  stocks: {
    [key: string]: string;
  };
}

export interface AuthRequest {
  email: string;
  name: string;
  rollNo: string;
  accessCode: string;
  clientID: string;
  clientSecret: string;
}

export interface AuthResponse {
  token_type: string;
  access_token: string;
  expires_in: number;
}

export interface AverageStockPriceResponse {
  averageStockPrice: number;
  priceHistory: StockPrice[];
}

export interface StockCorrelationResponse {
  correlation: number;
  stocks: {
    [key: string]: {
      averagePrice: number;
      priceHistory: StockPrice[];
    };
  };
}

export interface ApiError {
  error: string;
  message?: string | any;
} 