export default function Loading() {
    return (
        <div className="min-h-screen bg-gray-950 p-6 animate-pulse">
            {/* Header */}
            <div className="flex items-center justify-between mb-8">
                <div className="space-y-2">
                    <div className="h-8 w-48 bg-gray-800 rounded-lg" />
                    <div className="h-4 w-64 bg-gray-800/60 rounded" />
                </div>
            </div>

            {/* Sentiment bar */}
            <div className="h-14 w-full bg-gray-900/80 border border-gray-800/50 rounded-2xl mb-6" />

            {/* Post/mention feed skeletons */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {Array.from({ length: 6 }).map((_, i) => (
                    <div key={i} className="bg-gray-900/80 border border-gray-800/50 rounded-xl p-4 space-y-3">
                        <div className="flex items-center gap-3">
                            <div className="h-9 w-9 bg-gray-800 rounded-full flex-shrink-0" />
                            <div className="space-y-1.5 flex-1">
                                <div className="h-3 w-28 bg-gray-800/70 rounded" />
                                <div className="h-3 w-20 bg-gray-800/40 rounded" />
                            </div>
                            <div className="h-6 w-16 bg-gray-800/50 rounded-full" />
                        </div>
                        <div className="space-y-1.5">
                            <div className="h-3 w-full bg-gray-800/40 rounded" />
                            <div className="h-3 w-4/5 bg-gray-800/30 rounded" />
                            <div className="h-3 w-2/3 bg-gray-800/20 rounded" />
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
