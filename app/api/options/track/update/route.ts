import { NextRequest, NextResponse } from 'next/server';
import { updateTrackedOptions } from '@/lib/tracking';
import { publicClient } from '@/lib/public-api';
import { schwabClient } from '@/lib/schwab';

export async function GET(req: NextRequest) {
    try {
        await updateTrackedOptions(async (option) => {
            let premium = 0;
            let stockPrice = 0;

            const ticker = option.ticker.trim();
            const optionSymbol = option.id.replace(/\s+/g, '');

            // 1. Get Stock Price
            const quote = await publicClient.getQuote(ticker);
            if (quote) stockPrice = quote.price;

            // 2. Get Option Premium
            try {
                // Tier 1: Schwab Professional (Preferred for specific contract quotes)
                if (schwabClient.isConfigured()) {
                    const greeks = await schwabClient.getGreeks(option.id.trim());
                    if (greeks && greeks.lastPrice > 0) {
                        premium = greeks.lastPrice;
                    }
                }

                // Tier 2: Public.com Chain Fallback
                if (premium === 0) {
                    const chain = await publicClient.getOptionChain(ticker, option.expiry);
                    if (chain && chain.options[option.expiry]) {
                        const strikeData = chain.options[option.expiry][option.strike];
                        if (strikeData) {
                            const opt = option.type === 'CALL' ? strikeData.call : strikeData.put;
                            if (opt) {
                                premium = (opt.bid + opt.ask) / 2 || opt.last;
                            }
                        }
                    }
                }
            } catch (e) {
                console.error(`Error fetching latest premium for ${option.id}:`, e);
            }

            if (premium > 0 && stockPrice > 0) {
                return { premium, stockPrice };
            }
            return null;
        });

        return NextResponse.json({ success: true });
    } catch (e: any) {
        console.error('[API Update] Error:', e);
        return NextResponse.json({ error: e.message || 'Failed to update tracking' }, { status: 500 });
    }
}
