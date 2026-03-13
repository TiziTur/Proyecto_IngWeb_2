import { Router } from 'express';
import { getExternalRatesController, getInsightsController } from '../controllers/insightController.js';

const router = Router();

router.get('/', getInsightsController);
router.get('/external-rates', getExternalRatesController);

export default router;
