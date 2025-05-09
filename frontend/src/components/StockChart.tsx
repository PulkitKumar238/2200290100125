import React from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { StockPrice } from "../types";
import { Box, Typography } from "@mui/material";

interface StockChartProps {
  data: StockPrice[];
  averagePrice: number;
  ticker: string;
}

const StockChart: React.FC<StockChartProps> = ({
  data,
  averagePrice,
  ticker,
}) => {
  const chartData = data.map((item) => ({
    ...item,
    time: new Date(item.lastUpdatedAt).toLocaleTimeString(),
  }));

  return (
    <Box sx={{ width: "100%", height: 400, p: 2 }}>
      <Typography variant="h6" gutterBottom>
        {ticker} Stock Price Chart - Average: ${averagePrice.toFixed(2)}
      </Typography>
      <ResponsiveContainer>
        <LineChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="time" />
          <YAxis />
          <Tooltip />
          <Legend />
          <Line
            type="monotone"
            dataKey="price"
            stroke="#8884d8"
            name="Stock Price"
          />
          <Line
            type="monotone"
            dataKey={() => averagePrice}
            stroke="#82ca9d"
            strokeDasharray="5 5"
            name="Average Price"
          />
        </LineChart>
      </ResponsiveContainer>
    </Box>
  );
};

export default StockChart;
