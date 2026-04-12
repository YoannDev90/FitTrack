import { API_TIMEOUT_MS } from '../../constants/values';

type CacheEntry<T> = {
    value: T;
    expiresAt: number;
};

const RETRYABLE_STATUS_CODES = new Set([408, 425, 429, 500, 502, 503, 504]);
const responseCache = new Map<string, CacheEntry<unknown>>();

export interface FetchRetryOptions {
    timeoutMs?: number;
    retries?: number;
    retryDelayMs?: number;
    retryableStatusCodes?: number[];
}

function sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

async function fetchWithTimeout(
    input: RequestInfo | URL,
    init: RequestInit,
    timeoutMs: number
): Promise<Response> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    try {
        return await fetch(input, {
            ...init,
            signal: controller.signal,
        });
    } finally {
        clearTimeout(timeoutId);
    }
}

export async function fetchWithRetry(
    input: RequestInfo | URL,
    init: RequestInit = {},
    options: FetchRetryOptions = {}
): Promise<Response> {
    const timeoutMs = options.timeoutMs ?? API_TIMEOUT_MS;
    const retries = options.retries ?? 2;
    const retryDelayMs = options.retryDelayMs ?? 400;
    const retryableStatusCodes = new Set(options.retryableStatusCodes || Array.from(RETRYABLE_STATUS_CODES));

    let lastError: unknown;

    for (let attempt = 0; attempt <= retries; attempt += 1) {
        try {
            const response = await fetchWithTimeout(input, init, timeoutMs);

            if (!retryableStatusCodes.has(response.status) || attempt === retries) {
                return response;
            }
        } catch (error) {
            lastError = error;
            if (attempt === retries) {
                throw error;
            }
        }

        const backoffMs = retryDelayMs * Math.pow(2, attempt);
        await sleep(backoffMs);
    }

    if (lastError) {
        throw lastError;
    }

    throw new Error('Request failed without explicit error');
}

export async function getOrSetMemoryCache<T>(
    key: string,
    ttlMs: number,
    loader: () => Promise<T>
): Promise<T> {
    const now = Date.now();
    const existing = responseCache.get(key) as CacheEntry<T> | undefined;

    if (existing && existing.expiresAt > now) {
        return existing.value;
    }

    const value = await loader();

    responseCache.set(key, {
        value,
        expiresAt: now + Math.max(0, ttlMs),
    });

    return value;
}

export function invalidateMemoryCache(prefix?: string): void {
    if (!prefix) {
        responseCache.clear();
        return;
    }

    const keys = Array.from(responseCache.keys());
    keys.forEach((key) => {
        if (key.startsWith(prefix)) {
            responseCache.delete(key);
        }
    });
}
