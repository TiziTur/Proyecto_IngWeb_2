import { buildInsights } from '../services/insightService.js';
import { getExchangeRateSnapshot } from '../services/externalFinanceService.js';

const parseUserId = (value) => Number(value || 1);

export const getInsightsController = async (req, res) => {
    const userId = parseUserId(req.query.userId);
    const insights = await buildInsights(userId);
    return res.json(insights);
};

export const getExternalRatesController = async (_req, res) => {
    try {
        const rates = await getExchangeRateSnapshot();
        return res.json(rates);
    } catch (error) {
        return res.status(502).json({ message: error.message });
    }
};
