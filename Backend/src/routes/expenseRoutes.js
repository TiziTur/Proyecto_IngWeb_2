import { Router } from 'express';
import { createExpenseController, getExpensesController, getSummaryController } from '../controllers/expenseController.js';

const router = Router();

router.get('/', getExpensesController);
router.post('/', createExpenseController);
router.get('/summary', getSummaryController);

export default router;
