import { addExpense, getCategorySummary, listExpenses } from '../services/expenseService.js';

const parseUserId = (value) => Number(value || 1);

export const getExpensesController = async (req, res) => {
    const userId = parseUserId(req.query.userId);
    const expenses = await listExpenses(userId);
    return res.json(expenses);
};

export const createExpenseController = async (req, res) => {
    const { userId = 1, date, concept, category, amount, receiptUrl } = req.body || {};

    if (!date || !concept || !amount) {
        return res.status(400).json({ message: 'date, concept y amount son obligatorios.' });
    }

    const expense = await addExpense({ userId: Number(userId), date, concept, category, amount, receiptUrl });
    return res.status(201).json(expense);
};

export const getSummaryController = async (req, res) => {
    const userId = parseUserId(req.query.userId);
    const summary = await getCategorySummary(userId);
    return res.json(summary);
};
