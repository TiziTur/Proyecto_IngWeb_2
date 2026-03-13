import { Router } from 'express';
import authRoutes from './authRoutes.js';
import expenseRoutes from './expenseRoutes.js';
import insightRoutes from './insightRoutes.js';
import healthRoutes from './healthRoutes.js';

const router = Router();

router.use('/health', healthRoutes);
router.use('/auth', authRoutes);
router.use('/expenses', expenseRoutes);
router.use('/insights', insightRoutes);

export default router;
