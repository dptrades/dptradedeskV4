/**
 * Shared metric/table cell sub-components extracted from DeepDiveContent.tsx
 * to reduce the main file size and enable reuse across the app.
 */
import { ReactNode } from "react";

// ── MetricCard ────────────────────────────────────────────────────────────────

export function MetricCard({
    label,
    value,
    subValue,
    icon,
    className,
}: {
    label: string;
    value: string | number;
    subValue: string;
    icon: ReactNode;
    className?: string;
}) {
    return (
        <div className={`p-3 rounded-lg border ${className || 'bg-gray-800/40 border-gray-700/50'}`}>
            <div className="flex items-center gap-2 mb-1 text-gray-100 text-xs uppercase tracking-wider">
                {icon} {label}
            </div>
            <div className="text-xl font-bold text-white">{value}</div>
            <div className="text-xs text-gray-200">{subValue}</div>
        </div>
    );
}

// ── EmaCell ───────────────────────────────────────────────────────────────────

export function EmaCell({
    price,
    ema,
}: {
    price: number;
    ema: number | null;
    label: string;
}) {
    if (!ema) return <td className="p-3 text-gray-100">-</td>;

    const diff = Math.abs((price - ema) / ema) * 100;
    const isNear = diff < 0.5;
    const isAbove = price > ema;

    const bgColor = isNear ? 'bg-yellow-500/20' : isAbove ? 'bg-green-500/10' : 'bg-red-500/10';
    const textColor = isNear ? 'text-yellow-200 font-bold' : isAbove ? 'text-green-400' : 'text-red-400';

    return (
        <td className={`p-3 font-mono text-xs ${bgColor} ${textColor} border-l border-gray-800/30`}>
            <div className="flex flex-col">
                <span>{ema.toFixed(2)}</span>
                {isNear && <span className="text-[10px] opacity-70">NEAR</span>}
            </div>
        </td>
    );
}

// ── CompactMetric ─────────────────────────────────────────────────────────────

type Sentiment = 'positive' | 'negative' | 'neutral' | 'warning';

const bgColors: Record<Sentiment, string> = {
    positive: 'bg-green-500/10 border-green-500/30',
    negative: 'bg-red-500/10 border-red-500/30',
    neutral: 'bg-gray-800/40 border-gray-700/50',
    warning: 'bg-orange-500/10 border-orange-500/30',
};

const textColors: Record<Sentiment, string> = {
    positive: 'text-green-400',
    negative: 'text-red-400',
    neutral: 'text-gray-200',
    warning: 'text-orange-400',
};

export function CompactMetric({
    label,
    value,
    subValue,
    icon,
    sentiment = 'neutral',
    isAlert = false,
    centered = false,
    isStacked = false,
}: {
    label: string;
    value: ReactNode;
    subValue?: ReactNode;
    icon: ReactNode;
    sentiment?: Sentiment;
    isAlert?: boolean;
    centered?: boolean;
    isStacked?: boolean;
}) {
    return (
        <div
            className={`flex-1 min-w-[120px] p-2 rounded-lg border flex flex-col justify-center
                ${bgColors[sentiment]}
                ${isAlert ? 'animate-pulse ring-1 ring-orange-500/50' : ''}
                ${centered ? 'items-center text-center' : ''}`}
        >
            <div className="flex items-center gap-1.5 mb-0.5 text-[10px] uppercase tracking-wider text-gray-200 font-medium">
                {icon} {label}
            </div>
            <div className={`${isStacked ? 'text-[10px]' : 'text-xs'} font-bold truncate ${textColors[sentiment]}`}>
                {value}
            </div>
            {subValue && (
                <div className={`${isStacked ? `text-[10px] font-bold ${textColors[sentiment]}` : 'text-[9px] text-gray-300'} truncate mt-0.5`}>
                    {subValue}
                </div>
            )}
        </div>
    );
}
