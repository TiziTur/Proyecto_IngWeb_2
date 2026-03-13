import { getExpensesByUserId } from '../repositories/expenseRepository.js';

export const buildInsights = async (userId) => {
    const expenses = await getExpensesByUserId(userId);
    if (!expenses.length) {
        return {
            message: 'Aun no hay gastos para analizar.',
            topCategory: null,
            averageExpense: 0
        };
    }

    const totals = {};
    let amountSum = 0;

    expenses.forEach((item) => {
        const category = item.category || 'Sin categoria';
        totals[category] = (totals[category] || 0) + Number(item.amount || 0);
        amountSum += Number(item.amount || 0);
    });

    const topCategory = Object.entries(totals).sort((a, b) => b[1] - a[1])[0][0];

    return {
        message: `Tu mayor concentracion de gasto esta en ${topCategory}.`,
        topCategory,
        averageExpense: Number((amountSum / expenses.length).toFixed(2))
    };
};
