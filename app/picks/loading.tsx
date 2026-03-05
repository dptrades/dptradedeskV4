export default function Loading() {
    return (
        <div className="min-h-screen bg-gray-950 p-6 animate-pulse">
            {/* Header skeleton */}
            <div className="flex items-center justify-between mb-8">
                <div className="space-y-2">
                    <div className="h-8 w-48 bg-gray-800 rounded-lg" />
                    <div className="h-4 w-72 bg-gray-800/60 rounded" />
                </div>
                <div className="h-10 w-32 bg-gray-800 rounded-lg" />
            </div>

            {/* Grid of stock card skeletons */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {Array.from({ length: 6 }).map((_, i) => (
                    <div key={i} className="bg-gray-900/80 border border-gray-800/50 rounded-2xl p-5 space-y-4">
                        {/* Ticker + score */}
                        <div className="flex items-center justify-between">
                            <div className="h-7 w-20 bg-gray-800 rounded-lg" />
                            <div className="h-7 w-16 bg-gray-800/60 rounded-full" />
                        </div>
                        {/* Company name */}
                        <div className="h-4 w-40 bg-gray-800/50 rounded" />
                        {/* Stat bars */}
                        <div className="space-y-2">
                            <div className="h-3 w-full bg-gray-800/40 rounded" />
                            <div className="h-3 w-4/5 bg-gray-800/30 rounded" />
                            <div className="h-3 w-3/5 bg-gray-800/20 rounded" />
                        </div>
                        {/* Option badge */}
                        <div className="h-8 w-full bg-blue-900/20 border border-blue-800/20 rounded-lg" />
                    </div>
                ))}
            </div>
        </div>
    );
}
