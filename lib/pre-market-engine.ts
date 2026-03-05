import { DiscoveredStock } from '@/types/stock';
import { scanUnusualVolume, scanTopGainers, scanSocialBuzz, scanBreakingNews } from './smart-scanner';

// ─── Enriched Types ─────────────────────────────────────────────────────────

export type CatalystType = 'earnings' | 'fda' | 'upgrade' | 'macro' | 'options' | 'social' | 'momentum' | 'unknown';

export interface PreMarketMover extends DiscoveredStock {
    catalystScore: number;
    catalystType: CatalystType;
    catalystReason: string;        // Human-readable one-liner
    factors: {
        volume: boolean;
        price: boolean;
        social: boolean;
        news: boolean;
    };
    // Real price data
    preMarketPrice: number | null;
    regularMarketPrice: number | null;
    gapPercent: number | null;     // % change from prior close
    rvol: number | null;           // Relative Volume: preMarketVol / 10d avg
    preMarketVolume: number | null;
    avgVolume: number | null;
    marketCap: number | null;
}

// ─── Yahoo Finance Quote Enrichment ─────────────────────────────────────────

async function enrichWithYahooQuote(symbol: string): Promise<Partial<PreMarketMover>> {
    try {
        const url = `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?interval=1m&range=1d&includePrePost=true`;
        const res = await fetch(url, {
            headers: { 'User-Agent': 'Mozilla/5.0' },
            next: { revalidate: 60 }
        });
        if (!res.ok) return {};

        const data = await res.json();
        const meta = data?.chart?.result?.[0]?.meta;
        if (!meta) return {};

        const preMarketPrice = meta.preMarketPrice ?? null;
        const regularMarketPrice = meta.regularMarketPrice ?? meta.chartPreviousClose ?? null;
        // Gap = (preMarketPrice - prevClose) / prevClose
        const prevClose = meta.chartPreviousClose ?? meta.regularMarketPreviousClose ?? null;
        const gapPercent = (preMarketPrice && prevClose && prevClose !== 0)
            ? parseFloat((((preMarketPrice - prevClose) / prevClose) * 100).toFixed(2))
            : null;

        return { preMarketPrice, regularMarketPrice, gapPercent };
    } catch {
        return {};
    }
}

// ─── Screener-based batch enrichment (faster than per-symbol calls) ──────────

async function fetchScreenerQuoteMap(): Promise<Map<string, any>> {
    const map = new Map<string, any>();
    const screenerIds = ['most_actives', 'day_gainers', 'day_losers'];

    try {
        const results = await Promise.allSettled(
            screenerIds.map(id =>
                fetch(`https://query1.finance.yahoo.com/v1/finance/screener/predefined/saved?scrIds=${id}&count=30`, {
                    headers: { 'User-Agent': 'Mozilla/5.0' },
                    cache: 'no-store'
                }).then(r => r.json())
            )
        );

        for (const result of results) {
            if (result.status !== 'fulfilled') continue;
            const quotes = result.value?.finance?.result?.[0]?.quotes || [];
            for (const q of quotes) {
                if (q.symbol && !q.symbol.includes('.') && !q.symbol.includes('-')) {
                    map.set(q.symbol, q);
                }
            }
        }
    } catch (e) {
        console.error('[PreMarketEngine] Screener fetch error:', e);
    }

    return map;
}

// ─── Catalyst Type Detection ──────────────────────────────────────────────────

function detectCatalystType(signal: string): CatalystType {
    const s = signal.toLowerCase();
    if (s.includes('earn') || s.includes('eps') || s.includes('beat') || s.includes('miss')) return 'earnings';
    if (s.includes('fda') || s.includes('trial') || s.includes('approval') || s.includes('pdufa')) return 'fda';
    if (s.includes('upgrade') || s.includes('target') || s.includes('analyst') || s.includes('price target')) return 'upgrade';
    if (s.includes('fed') || s.includes('cpi') || s.includes('gdp') || s.includes('macro') || s.includes('rate')) return 'macro';
    if (s.includes('options') || s.includes('unusual options')) return 'options';
    if (s.includes('reddit') || s.includes('social') || s.includes('twitter') || s.includes('buzz')) return 'social';
    if (s.includes('volume') || s.includes('momentum') || s.includes('%')) return 'momentum';
    return 'unknown';
}

function buildCatalystReason(mover: Partial<PreMarketMover>, quoteData: any): string {
    const parts: string[] = [];

    if (mover.gapPercent !== null && mover.gapPercent !== undefined) {
        const dir = mover.gapPercent >= 0 ? '▲' : '▼';
        parts.push(`${dir}${Math.abs(mover.gapPercent).toFixed(1)}% gap`);
    }

    if (mover.rvol !== null && mover.rvol !== undefined && mover.rvol > 1.5) {
        parts.push(`${mover.rvol.toFixed(1)}x RVOL`);
    }

    // Detect catalyst from signal string
    const catalystType = mover.catalystType || 'unknown';
    if (catalystType === 'earnings') parts.push('Earnings catalyst');
    else if (catalystType === 'fda') parts.push('FDA event');
    else if (catalystType === 'upgrade') parts.push('Analyst upgrade');
    else if (catalystType === 'options') parts.push('Unusual options');
    else if (catalystType === 'social') parts.push('Social momentum');

    if (quoteData?.averageAnalystRating) parts.push(quoteData.averageAnalystRating);

    return parts.length > 0 ? parts.join(' · ') : (mover.signal || 'Market mover');
}

// ─── Gap Quality Assessment ───────────────────────────────────────────────────

export type GapQuality = 'high' | 'speculative' | 'dangerous';

export function assessGapQuality(mover: PreMarketMover): GapQuality {
    const gapAbs = Math.abs(mover.gapPercent ?? 0);
    const rvol = mover.rvol ?? 0;
    const mcap = mover.marketCap ?? 0;

    // Large cap with catalyst + volume = high quality
    if (mcap > 10_000_000_000 && gapAbs >= 3 && rvol > 2) return 'high';
    if (mcap > 2_000_000_000 && gapAbs >= 5 && rvol > 1.5) return 'high';

    // Small cap high gap with news = speculative
    if (gapAbs >= 15 || (mcap < 500_000_000 && gapAbs > 10)) return 'dangerous';

    return 'speculative';
}

// ─── Main Engine ──────────────────────────────────────────────────────────────

export async function runPreMarketEngine(): Promise<PreMarketMover[]> {
    console.log('[PreMarketEngine] Starting multi-factor scan...');
    const startTime = Date.now();

    // Run all scans + screener batch fetch in parallel
    const [volumeStocks, gainerStocks, socialStocks, newsStocks, quoteMap] = await Promise.all([
        scanUnusualVolume(),
        scanTopGainers(),
        scanSocialBuzz(),
        scanBreakingNews(),
        fetchScreenerQuoteMap()
    ]);

    const symbolMap = new Map<string, PreMarketMover>();

    const addToMap = (stock: DiscoveredStock, factor: keyof PreMarketMover['factors']) => {
        let existing = symbolMap.get(stock.symbol);
        if (!existing) {
            const q = quoteMap.get(stock.symbol);
            const preMarketPrice = q?.preMarketPrice ?? null;
            const prevClose = q?.regularMarketPreviousClose ?? q?.regularMarketOpen ?? null;
            const gapPercent = (preMarketPrice && prevClose && prevClose !== 0)
                ? parseFloat((((preMarketPrice - prevClose) / prevClose) * 100).toFixed(2))
                : (q?.preMarketChangePercent ? parseFloat(q.preMarketChangePercent.toFixed(2)) : null);

            const preMarketVolume = q?.preMarketVolume ?? null;
            const avgVolume = q?.averageDailyVolume10Day ?? null;
            const rvol = (preMarketVolume && avgVolume && avgVolume > 0)
                ? parseFloat((preMarketVolume / avgVolume).toFixed(2))
                : null;

            existing = {
                symbol: stock.symbol,
                name: stock.name || q?.shortName || q?.longName || stock.symbol,
                source: stock.source,
                signal: stock.signal,
                strength: stock.strength,
                timestamp: stock.timestamp,
                catalystScore: 0,
                catalystType: detectCatalystType(stock.signal),
                catalystReason: '',
                factors: { volume: false, price: false, social: false, news: false },
                preMarketPrice,
                regularMarketPrice: q?.regularMarketPrice ?? null,
                gapPercent,
                rvol,
                preMarketVolume,
                avgVolume,
                marketCap: q?.marketCap ?? null,
            };
            symbolMap.set(stock.symbol, existing);
        } else {
            if (!existing.signal.includes(stock.signal)) {
                existing.signal = `${existing.signal} | ${stock.signal}`;
                // Re-detect catalyst type from updated signal
                existing.catalystType = detectCatalystType(existing.signal);
            }
        }

        existing.factors[factor] = true;
    };

    volumeStocks.forEach(s => addToMap(s, 'volume'));
    gainerStocks.forEach(s => addToMap(s, 'price'));
    socialStocks.forEach(s => addToMap(s, 'social'));
    newsStocks.forEach(s => addToMap(s, 'news'));

    // ─── Calculate Composite Catalyst Score ───────────────────────────────────
    for (const mover of symbolMap.values()) {
        let score = 0;
        const q = quoteMap.get(mover.symbol);

        // Factor presence (base)
        if (mover.factors.volume) score += 25;
        if (mover.factors.price) score += 20;
        if (mover.factors.news) score += 20;
        if (mover.factors.social) score += 10;

        // RVOL bonus (up to +15)
        if (mover.rvol) {
            score += Math.min(15, Math.round((mover.rvol - 1) * 5));
        }

        // Gap magnitude bonus (up to +10)
        const gapAbs = Math.abs(mover.gapPercent ?? 0);
        if (gapAbs > 2) score += Math.min(10, Math.round(gapAbs * 0.5));

        // Catalyst quality bonus
        if (mover.catalystType === 'earnings') score += 10;
        if (mover.catalystType === 'upgrade') score += 8;
        if (mover.catalystType === 'fda') score += 12;
        if (mover.catalystType === 'options') score += 6;

        // Strength variance bonus (up to +5)
        score += Math.round((mover.strength / 100) * 5);

        mover.catalystScore = Math.min(100, Math.round(score));

        // Build human-readable reason
        mover.catalystReason = buildCatalystReason(mover, q);
    }

    // Sort by Catalyst Score descending
    const sorted = Array.from(symbolMap.values())
        .sort((a, b) => b.catalystScore - a.catalystScore);

    const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
    console.log(`[PreMarketEngine] Scan complete in ${elapsed}s. Found ${sorted.length} stocks.`);

    return sorted.slice(0, 25);
}
