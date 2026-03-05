import { NextResponse } from 'next/server';
import YahooFinance from 'yahoo-finance2';

// Force dynamic so Next.js doesn't statically cache this at build time
export const dynamic = 'force-dynamic';

// ── In-memory cache ────────────────────────────────────────────────────────
// Market indices don't need sub-minute freshness. 5 min saves ~120 Yahoo calls/hr.
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes
let cache: { data: any; timestamp: number } | null = null;

const yahooFinance = new YahooFinance();

// Market internals symbols
const INTERNALS = ['^VIX', '^GSPC', '^IXIC', '^NDX', '^DJI', '^RUT'];

export async function GET() {
    // Serve from cache if fresh
    if (cache && Date.now() - cache.timestamp < CACHE_TTL) {
        return NextResponse.json(cache.data, {
            headers: { 'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=60' }
        });
    }

    try {
        const results = await Promise.all(
            INTERNALS.map(async (symbol) => {
                try {
                    const quote: any = await yahooFinance.quote(symbol);
                    return {
                        symbol,
                        name: quote.shortName || quote.longName || symbol,
                        price: quote.regularMarketPrice || 0,
                        change: quote.regularMarketChange || 0,
                        changePercent: quote.regularMarketChangePercent || 0,
                        previousClose: quote.regularMarketPreviousClose || 0,
                    };
                } catch (e) {
                    console.error(`Failed to fetch ${symbol}:`, e);
                    return { symbol, name: symbol, price: 0, change: 0, changePercent: 0, previousClose: 0 };
                }
            })
        );

        const payload = {
            vix: results.find(r => r.symbol === '^VIX'),
            sp500: results.find(r => r.symbol === '^GSPC'),
            nasdaq: results.find(r => r.symbol === '^IXIC'),
            ndx: results.find(r => r.symbol === '^NDX'),
            dow: results.find(r => r.symbol === '^DJI'),
            russell: results.find(r => r.symbol === '^RUT'),
            timestamp: new Date().toISOString()
        };

        // Store in cache
        cache = { data: payload, timestamp: Date.now() };

        return NextResponse.json(payload, {
            headers: { 'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=60' }
        });
    } catch (error) {
        console.error('[Market Internals API] Error:', error);
        // On error, serve stale cache if available rather than 500
        if (cache) {
            console.warn('[Market Internals API] Serving stale cache due to error');
            return NextResponse.json(cache.data);
        }
        return NextResponse.json({ error: 'Failed to fetch market internals' }, { status: 500 });
    }
}
