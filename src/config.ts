import dotenv from 'dotenv';
import type { Config } from './types.js';

dotenv.config();

const parseCommaSeparated = (value: string | undefined): string[] => {
    if (!value || value.trim() === '') {
        return [];
    }

    return value.split(',').map(item => item.trim()).filter(item => item.length > 0);
};

export const config: Config = {
    GITHUB_TOKEN: process.env.GITHUB_TOKEN || '',
    INCLUDE_PATTERNS: parseCommaSeparated(process.env.INCLUDE_PATTERNS),
    EXCLUDE_PATTERNS: parseCommaSeparated(process.env.EXCLUDE_PATTERNS),
    OUTPUT_DIR: process.env.OUTPUT_DIR || './output',
    API_DELAY_MS: process.env.API_DELAY_MS ? parseInt(process.env.API_DELAY_MS, 10) : 100,
};
