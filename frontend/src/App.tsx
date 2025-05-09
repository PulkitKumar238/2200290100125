import React, { useEffect, useState, useCallback } from "react";
import {
  Container,
  Box,
  Tab,
  Tabs,
  TextField,
  MenuItem,
  Typography,
  useMediaQuery,
  useTheme,
  CircularProgress,
  Alert,
} from "@mui/material";
import StockChart from "./components/StockChart.tsx";
import CorrelationHeatmap from "./components/CorrelationHeatmap.tsx";
import { api } from "./services/api.ts";
import { StockData, StocksResponse } from "./types";

function App() {
  const [tab, setTab] = useState(0);
  const [stocks, setStocks] = useState<StocksResponse["stocks"]>({});
  const [selectedStock, setSelectedStock] = useState<string>("");
  const [timeRange, setTimeRange] = useState<number>(30);
  const [stockData, setStockData] = useState<StockData | null>(null);
  const [correlations, setCorrelations] = useState<{
    [key: string]: { [key: string]: number };
  }>({});
  const [stockStats, setStockStats] = useState<{
    [key: string]: { average: number; stdDev: number };
  }>({});
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [correlationWarning, setCorrelationWarning] = useState<string | null>(
    null
  );

  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

  // Helper function to calculate standard deviation
  const calculateStdDev = (prices: number[], average: number): number => {
    if (prices.length <= 1) return 0;
    return Math.sqrt(
      prices.reduce((sum, price) => sum + Math.pow(price - average, 2), 0) /
        (prices.length - 1)
    );
  };

  // Fetch stocks once on component mount
  useEffect(() => {
    const fetchStocks = async () => {
      try {
        setLoading(true);
        const response = await api.getStocks();
        setStocks(response.stocks);
        if (Object.keys(response.stocks).length > 0) {
          setSelectedStock(Object.values(response.stocks)[0]);
        }
        setError(null);
      } catch (error) {
        console.error("Error fetching stocks:", error);
        setError("Failed to fetch stocks. Please try again later.");
      } finally {
        setLoading(false);
      }
    };
    fetchStocks();
  }, []);

  // Fetch stock data when selected stock or time range changes
  useEffect(() => {
    const fetchStockData = async () => {
      if (!selectedStock) return;
      try {
        setLoading(true);
        const data = await api.getStockData(selectedStock, timeRange);
        setStockData(data);

        // Also update the stats for this stock
        if (data && data.priceHistory.length > 0) {
          const prices = data.priceHistory.map((p) => p.price);
          const average = data.averageStockPrice;
          const stdDev = calculateStdDev(prices, average);

          setStockStats((prev) => ({
            ...prev,
            [selectedStock]: { average, stdDev },
          }));
        }

        setError(null);
      } catch (error) {
        console.error("Error fetching stock data:", error);
        setError("Failed to fetch stock data. Please try again later.");
      } finally {
        setLoading(false);
      }
    };
    fetchStockData();
  }, [selectedStock, timeRange]);

  // Memoized fetchCorrelations function using useCallback
  const fetchCorrelations = useCallback(async () => {
    if (Object.keys(stocks).length < 2 || tab !== 1) return;

    try {
      setLoading(true);
      setCorrelationWarning(null);

      const stockList = Object.values(stocks);
      const correlationData: { [key: string]: { [key: string]: number } } = {};
      const stats: { [key: string]: { average: number; stdDev: number } } = {
        ...stockStats,
      };

      // Initialize correlation matrix
      stockList.forEach((stock1) => {
        correlationData[stock1] = {};
        stockList.forEach((stock2) => {
          correlationData[stock1][stock2] = stock1 === stock2 ? 1 : 0;
        });
      });

      // Check backend health
      try {
        const isHealthy = await api.checkHealth();
        if (!isHealthy) {
          setError(
            "Backend server is not available. Please ensure it’s running."
          );
          return;
        }
      } catch (err) {
        setError(
          "Cannot connect to backend server. Please check if it’s running."
        );
        return;
      }

      const maxStocksToCompare = Math.min(5, stockList.length);
      const targetStocks = stockList.slice(0, maxStocksToCompare);
      let failedRequests = 0;
      const maxCorrelations = 5;
      let correlationCount = 0;

      // Delay function to space out requests
      const delay = (ms: number) =>
        new Promise((resolve) => setTimeout(resolve, ms));

      // Fetch correlations with delays
      for (
        let i = 0;
        i < targetStocks.length && correlationCount < maxCorrelations;
        i++
      ) {
        for (
          let j = i + 1;
          j < targetStocks.length && correlationCount < maxCorrelations;
          j++
        ) {
          const stock1 = targetStocks[i];
          const stock2 = targetStocks[j];

          try {
            const data = await api.getStockCorrelation(
              stock1,
              stock2,
              timeRange
            );
            correlationData[stock1][stock2] = data.correlation;
            correlationData[stock2][stock1] = data.correlation;

            // Update stats if available
            if (
              data.stocks[stock1] &&
              data.stocks[stock1].priceHistory.length > 0
            ) {
              const prices = data.stocks[stock1].priceHistory.map(
                (p) => p.price
              );
              stats[stock1] = {
                average: data.stocks[stock1].averagePrice,
                stdDev: calculateStdDev(
                  prices,
                  data.stocks[stock1].averagePrice
                ),
              };
            }
            if (
              data.stocks[stock2] &&
              data.stocks[stock2].priceHistory.length > 0
            ) {
              const prices = data.stocks[stock2].priceHistory.map(
                (p) => p.price
              );
              stats[stock2] = {
                average: data.stocks[stock2].averagePrice,
                stdDev: calculateStdDev(
                  prices,
                  data.stocks[stock2].averagePrice
                ),
              };
            }
          } catch (error) {
            console.error(
              `Error fetching correlation for ${stock1}-${stock2}:`,
              error
            );
            failedRequests++;
          }

          correlationCount++;
          await delay(1000); // 1-second delay between requests
        }
      }

      setCorrelations(correlationData);
      setStockStats(stats);

      if (failedRequests > 0) {
        setCorrelationWarning(
          `Some correlation data could not be loaded (${failedRequests} failed requests).`
        );
      } else {
        setCorrelationWarning(null);
      }

      setError(null);
    } catch (error) {
      console.error("Error in correlation calculations:", error);
      setError("Failed to calculate correlations. Please try again later.");
    } finally {
      setLoading(false);
    }
  }, [stocks, timeRange, tab, stockStats]);

  // Call fetchCorrelations when tab, stocks or timeRange changes
  useEffect(() => {
      fetchCorrelations();
  }, [tab, timeRange]);

  // Simplified condition: only check if correlations has enough stocks
  const hasCorrelationData = Object.keys(correlations).length >= 2;

  return (
    <Container maxWidth="lg">
      <Box sx={{ width: "100%", mt: 4 }}>
        <Typography variant="h4" gutterBottom>
          Stock Price Analytics
        </Typography>
        <Box sx={{ borderBottom: 1, borderColor: "divider", mb: 2 }}>
          <Tabs value={tab} onChange={(_, newValue) => setTab(newValue)}>
            <Tab label="Stock Chart" />
            <Tab label="Correlation Heatmap" />
          </Tabs>
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {correlationWarning && tab === 1 && (
          <Alert severity="warning" sx={{ mb: 2 }}>
            {correlationWarning}
          </Alert>
        )}

        <Box
          sx={{
            mb: 2,
            display: "flex",
            gap: 2,
            flexDirection: isMobile ? "column" : "row",
          }}
        >
          <TextField
            select
            label="Time Range (minutes)"
            value={timeRange}
            onChange={(e) => setTimeRange(Number(e.target.value))}
            sx={{ width: isMobile ? "100%" : 200 }}
            disabled={loading}
          >
            {[15, 30, 60, 120].map((value) => (
              <MenuItem key={value} value={value}>
                {value} minutes
              </MenuItem>
            ))}
          </TextField>

          {tab === 0 && (
            <TextField
              select
              label="Select Stock"
              value={selectedStock}
              onChange={(e) => setSelectedStock(e.target.value)}
              sx={{ width: isMobile ? "100%" : 200 }}
              disabled={loading || Object.keys(stocks).length === 0}
            >
              {Object.entries(stocks).map(([name, symbol]) => (
                <MenuItem key={symbol} value={symbol}>
                  {name} ({symbol})
                </MenuItem>
              ))}
            </TextField>
          )}
        </Box>

        {loading && (
          <Box sx={{ display: "flex", justifyContent: "center", my: 4 }}>
            <CircularProgress />
          </Box>
        )}

        {!loading && tab === 0 && stockData && (
          <StockChart
            data={stockData.priceHistory}
            averagePrice={stockData.averageStockPrice}
            ticker={selectedStock}
          />
        )}

        {!loading && tab === 1 && hasCorrelationData && (
          <CorrelationHeatmap correlations={correlations} />
        )}

        {!loading && tab === 1 && !hasCorrelationData && (
          <Box sx={{ p: 4, textAlign: "center" }}>
            <Typography variant="h6" color="text.secondary">
              No correlation data available.
            </Typography>
            <Typography color="text.secondary">
              Please wait for data to load or try a different time range.
            </Typography>
          </Box>
        )}
      </Box>
    </Container>
  );
}

export default App;
