export interface StockPrice {
  price: number;
  lastUpdatedAt: string;
}

export interface Stock {
  averagePrice: number;
  priceHistory: StockPrice[];
}

export interface StockCorrelation {
  correlation: number;
  stocks: {
    [key: string]: Stock;
  };
}

export interface StockData {
  averageStockPrice: number;
  priceHistory: StockPrice[];
}

export interface StocksResponse {
  stocks: {
    [key: string]: string;
  };
}

export interface ApiError {
  error: string;
  message?: string | any;
} 