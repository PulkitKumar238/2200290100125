import React from "react";
import { Box, Grid, Tooltip, Typography } from "@mui/material";

interface CorrelationHeatmapProps {
  correlations: { [key: string]: { [key: string]: number } };
}

const getColor = (value: number): string => {
  if (value < 0) {
    const intensity = Math.abs(value);
    return `rgba(255, 0, 0, ${intensity})`;
  } else if (value > 0) {
    const intensity = value;
    return `rgba(0, 0, 255, ${intensity})`;
  } else {
    return "white";
  }
};

const CorrelationHeatmap: React.FC<CorrelationHeatmapProps> = ({
  correlations,
}) => {
  const tickers = Object.keys(correlations);

  return (
    <Box sx={{ width: "100%", overflowX: "auto" }}>
      <Typography variant="h6" gutterBottom>
        Correlation Heatmap
      </Typography>
      <Grid container direction="column">
        {/* Header row */}
        <Grid container wrap="nowrap">
          <Grid item sx={{ minWidth: "50px" }} />
          {tickers.map((ticker) => (
            <Grid
              item
              key={ticker}
              sx={{ minWidth: "50px", textAlign: "center" }}
            >
              {ticker}
            </Grid>
          ))}
        </Grid>
        {/* Data rows */}
        {tickers.map((rowTicker) => (
          <Grid container wrap="nowrap" key={rowTicker}>
            <Grid item sx={{ minWidth: "50px", textAlign: "right", pr: 1 }}>
              {rowTicker}
            </Grid>
            {tickers.map((colTicker) => (
              <Grid item key={colTicker} sx={{ minWidth: "50px" }}>
                <Tooltip title={correlations[rowTicker][colTicker].toFixed(2)}>
                  <Box
                    sx={{
                      width: "40px",
                      height: "40px",
                      backgroundColor: getColor(
                        correlations[rowTicker][colTicker]
                      ),
                      margin: "auto",
                    }}
                  />
                </Tooltip>
              </Grid>
            ))}
          </Grid>
        ))}
      </Grid>
      {/* Legend */}
      <Box sx={{ mt: 2 }}>
        <Box
          sx={{
            width: "100%",
            height: "20px",
            background: "linear-gradient(to right, red, white, blue)",
            position: "relative",
          }}
        >
          <Box sx={{ position: "absolute", left: 0, bottom: "-20px" }}>-1</Box>
          <Box
            sx={{
              position: "absolute",
              left: "50%",
              transform: "translateX(-50%)",
              bottom: "-20px",
            }}
          >
            0
          </Box>
          <Box sx={{ position: "absolute", right: 0, bottom: "-20px" }}>1</Box>
        </Box>
      </Box>
    </Box>
  );
};

export default CorrelationHeatmap;
