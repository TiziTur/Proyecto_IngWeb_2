import path from 'path';
import { fileURLToPath } from 'url';
import { readJsonFile, writeJsonFile } from './jsonFileStore.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const expensesFile = path.resolve(__dirname, '../data/expenses.json');

export const getExpensesByUserId = async (userId) => {
    const expenses = await readJsonFile(expensesFile, []);
    return expenses.filter((e) => e.userId === userId);
};

export const createExpense = async (expense) => {
    const expenses = await readJsonFile(expensesFile, []);
    expenses.push(expense);
    await writeJsonFile(expensesFile, expenses);
    return expense;
};
