import { createExpense, getExpensesByUserId } from '../repositories/expenseRepository.js';

export const listExpenses = async (userId) => {
    return getExpensesByUserId(userId);
};

export const addExpense = async ({ userId, date, concept, category, amount, receiptUrl }) => {
    const expense = {
        id: `exp-${Date.now()}`,
        userId,
        date,
        concept,
        category,
        amount: Number(amount),
        receiptUrl: receiptUrl || null
    };

    return createExpense(expense);
};

export const getCategorySummary = async (userId) => {
    const expenses = await getExpensesByUserId(userId);
    const summary = expenses.reduce((acc, item) => {
        const key = item.category || 'Sin categoria';
        acc[key] = (acc[key] || 0) + Number(item.amount || 0);
        return acc;
    }, {});

    return Object.entries(summary).map(([category, total]) => ({ category, total }));
};
