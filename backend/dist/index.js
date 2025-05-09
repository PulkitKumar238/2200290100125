"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const dotenv_1 = __importDefault(require("dotenv"));
const stockService_1 = __importDefault(require("./services/stockService"));
dotenv_1.default.config();
const app = (0, express_1.default)();
const port = process.env.PORT || 3001;
app.use((0, cors_1.default)());
app.use(express_1.default.json());
const stockService = new stockService_1.default(process.env.CLIENT_ID || '', process.env.CLIENT_SECRET || '', process.env.EMAIL || '', process.env.NAME || '', process.env.ROLL_NO || '', process.env.ACCESS_CODE || '');
app.get('/stocks/:ticker', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { ticker } = req.params;
        const minutes = req.query.minutes ? parseInt(req.query.minutes) : undefined;
        const prices = yield stockService.getStockPrices(ticker, minutes);
        const averagePrice = stockService.calculateAveragePrice(prices);
        res.json({
            averageStockPrice: averagePrice,
            priceHistory: prices
        });
    }
    catch (error) {
        console.error('Error fetching stock prices:', error);
        res.status(500).json({ error: 'Failed to fetch stock prices' });
    }
}));
app.get('/stockcorrelation', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const tickers = req.query.ticker;
        if (!Array.isArray(tickers) || tickers.length !== 2) {
            return res.status(400).json({ error: 'Exactly 2 tickers are required' });
        }
        const minutes = req.query.minutes ? parseInt(req.query.minutes) : undefined;
        const [prices1, prices2] = yield Promise.all([
            stockService.getStockPrices(tickers[0], minutes),
            stockService.getStockPrices(tickers[1], minutes)
        ]);
        const correlation = stockService.calculateCorrelation(prices1, prices2);
        res.json({
            correlation,
            stocks: {
                [tickers[0]]: {
                    averagePrice: stockService.calculateAveragePrice(prices1),
                    priceHistory: prices1
                },
                [tickers[1]]: {
                    averagePrice: stockService.calculateAveragePrice(prices2),
                    priceHistory: prices2
                }
            }
        });
    }
    catch (error) {
        console.error('Error calculating correlation:', error);
        res.status(500).json({ error: 'Failed to calculate correlation' });
    }
}));
app.get('/stocks', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const stocks = yield stockService.getAllStocks();
        res.json(stocks);
    }
    catch (error) {
        console.error('Error fetching stocks:', error);
        res.status(500).json({ error: 'Failed to fetch stocks' });
    }
}));
app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});
