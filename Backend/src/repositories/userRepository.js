import path from 'path';
import { fileURLToPath } from 'url';
import { readJsonFile } from './jsonFileStore.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const usersFile = path.resolve(__dirname, '../data/users.json');

export const findUserByEmail = async (email) => {
    const users = await readJsonFile(usersFile, []);
    return users.find((u) => u.email.toLowerCase() === email.toLowerCase()) || null;
};
