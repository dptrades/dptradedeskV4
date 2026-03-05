/**
 * Application Logger
 *
 * Automatic no-op in production to:
 *  - Keep Vercel logs clean
 *  - Avoid leaking ticker/signal data in production traces
 *
 * Usage (drop-in replacement for console.log):
 *   import { logger } from '../lib/logger';
 *   logger.log('[Conviction] Score computed', score);
 *   logger.warn('[Options] Cache miss for', symbol);
 *   logger.error('[API] Fetch failed', error);
 */

const IS_DEV = process.env.NODE_ENV !== 'production';

export const logger = {
    log: (...args: unknown[]) => {
        if (IS_DEV) console.log(...args);
    },
    info: (...args: unknown[]) => {
        if (IS_DEV) console.info(...args);
    },
    warn: (...args: unknown[]) => {
        // Warnings always surface — they may indicate misconfigurations
        console.warn(...args);
    },
    error: (...args: unknown[]) => {
        // Errors always surface — needed for production debugging
        console.error(...args);
    },
    /** Tagged log — prepends [tag] automatically */
    tag: (tag: string, ...args: unknown[]) => {
        if (IS_DEV) console.log(`[${tag}]`, ...args);
    },
    /** Group (dev-only) */
    group: (label: string) => {
        if (IS_DEV) console.group(label);
    },
    groupEnd: () => {
        if (IS_DEV) console.groupEnd();
    },
};

export default logger;
