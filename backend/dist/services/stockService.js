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
const axios_1 = __importDefault(require("axios"));
const node_cache_1 = __importDefault(require("node-cache"));
const BASE_URL = 'http://20.244.56.144/evaluation-service';
const cache = new node_cache_1.default({ stdTTL: 300 }); // 5 minutes cache
class StockService {
    constructor(clientId, clientSecret, email, name, rollNo, accessCode) {
        this.clientId = clientId;
        this.clientSecret = clientSecret;
        this.email = email;
        this.name = name;
        this.rollNo = rollNo;
        this.accessCode = accessCode;
        this.token = null;
        this.tokenExpiry = 0;
    }
    getAuthToken() {
        return __awaiter(this, void 0, void 0, function* () {
            if (this.token && Date.now() < this.tokenExpiry) {
                return this.token;
            }
            const response = yield axios_1.default.post(`${BASE_URL}/auth`, {
                email: this.email,
                name: this.name,
                rollNo: this.rollNo,
                accessCode: this.accessCode,
                clientID: this.clientId,
                clientSecret: this.clientSecret,
            });
            this.token = response.data.access_token;
            this.tokenExpiry = response.data.expires_in * 1000;
            return this.token;
        });
    }
    makeAuthorizedRequest(url) {
        return __awaiter(this, void 0, void 0, function* () {
            const token = yield this.getAuthToken();
            const response = yield axios_1.default.get(url, {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });
            return response.data;
        });
    }
    getAllStocks() {
        return __awaiter(this, void 0, void 0, function* () {
            const cacheKey = 'all_stocks';
            const cached = cache.get(cacheKey);
            if (cached)
                return cached;
            const stocks = yield this.makeAuthorizedRequest(`${BASE_URL}/stocks`);
            cache.set(cacheKey, stocks);
            return stocks;
        });
    }
    getStockPrices(ticker, minutes) {
        return __awaiter(this, void 0, void 0, function* () {
            const url = `${BASE_URL}/stocks/${ticker}${minutes ? `?minutes=${minutes}` : ''}`;
            const response = yield this.makeAuthorizedRequest(url);
            if (Array.isArray(response)) {
                return response;
            }
            else {
                return [response.stock];
            }
        });
    }
    calculateCorrelation(prices1, prices2) {
        const values1 = prices1.map(p => p.price);
        const values2 = prices2.map(p => p.price);
        const mean1 = values1.reduce((a, b) => a + b, 0) / values1.length;
        const mean2 = values2.reduce((a, b) => a + b, 0) / values2.length;
        const variance1 = values1.reduce((a, b) => a + Math.pow(b - mean1, 2), 0) / (values1.length - 1);
        const variance2 = values2.reduce((a, b) => a + Math.pow(b - mean2, 2), 0) / (values2.length - 1);
        const covariance = values1.map((_, i) => (values1[i] - mean1) * (values2[i] - mean2))
            .reduce((a, b) => a + b, 0) / (values1.length - 1);
        return covariance / Math.sqrt(variance1 * variance2);
    }
    calculateAveragePrice(prices) {
        return prices.reduce((sum, p) => sum + p.price, 0) / prices.length;
    }
}
exports.default = StockService;
