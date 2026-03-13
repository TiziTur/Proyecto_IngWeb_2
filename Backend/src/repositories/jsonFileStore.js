import { promises as fs } from 'fs';
import path from 'path';

const ensureFile = async (filePath, fallback) => {
    try {
        await fs.access(filePath);
    } catch {
        await fs.mkdir(path.dirname(filePath), { recursive: true });
        await fs.writeFile(filePath, JSON.stringify(fallback, null, 2), 'utf-8');
    }
};

export const readJsonFile = async (filePath, fallback = []) => {
    await ensureFile(filePath, fallback);
    const file = await fs.readFile(filePath, 'utf-8');
    return JSON.parse(file);
};

export const writeJsonFile = async (filePath, data) => {
    await fs.mkdir(path.dirname(filePath), { recursive: true });
    await fs.writeFile(filePath, JSON.stringify(data, null, 2), 'utf-8');
};
